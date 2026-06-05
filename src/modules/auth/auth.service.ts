import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { Client, ClientAccount } from '@prisma/client';
import { LoginDto } from './dto/login.dto';
import { SystemLoginDto } from './dto/system-login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { getTranslatedError } from '../../shared/i18n/error-messages';

export interface SystemTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: Date;
  user: {
    id: number;
    userName: string;
    nsoEmployeeId: string | null;
    statusId: string;
    roles: string[];
  };
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: Date;
  username: string;
  clients: {
    id: string;
    bankbookNumber: string | null;
    firstName: string | null;
    lastName: string | null;
    nickName: string;
    vbCode: string;
  }[];
}

export interface RefreshTokenDto {
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
  private readonly REFRESH_TOKEN_EXPIRY_DAYS = 7; // 7 days

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<TokenResponse> {
    // 1. Find clientAccount by username
    const clientAccount = await this.prisma.clientAccount.findUnique({
      where: { username: loginDto.username },
    });

    if (!clientAccount) {
      throw new UnauthorizedException('Username is incorrect');
    }

    // 2. Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      clientAccount.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Password is incorrect');
    }

    // 3. Find all clients sharing this bankbookNumber
    const clients = await this.prisma.client.findMany({
      where: { bankbookNumber: clientAccount.bankbookNumber, vbCode: clientAccount.vbCode },
      select: {
        id: true,
        bankbookNumber: true,
        firstName: true,
        lastName: true,
        nickName: true,
        vbCode: true,
      },
    });

    // 4. Revoke all existing refresh tokens for this bankbookNumber+vbCode
    await this.revokeAllUserRefreshTokens(clientAccount.bankbookNumber, clientAccount.vbCode);

    // 5. Generate 1 token bound to bankbookNumber
    return this.generateTokens(clientAccount.bankbookNumber, clientAccount.vbCode, clientAccount.username, clients, ipAddress, userAgent);
  }

  /**
   * Login for an internal SYSTEM user (table `system_user`).
   * Returns a JWT access token + the matched user (so the app knows WHICH user logged in).
   * Supports both bcrypt-hashed and legacy plaintext passwords.
   */
  async loginSystemUser(dto: SystemLoginDto): Promise<SystemTokenResponse> {
    // 1. Find the system user by user_name
    const user = await this.prisma.systemUser.findFirst({
      where: { userName: dto.userName },
      include: {
        roles: { include: { systemRole: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Username is incorrect');
    }

    if (!user.password) {
      throw new UnauthorizedException('This account has no password set');
    }

    // 2. Verify password — accept bcrypt hash, fall back to plaintext (legacy data)
    const looksHashed = /^\$2[aby]\$/.test(user.password);
    const isPasswordValid = looksHashed
      ? await bcrypt.compare(dto.password, user.password)
      : dto.password === user.password;

    if (!isPasswordValid) {
      throw new UnauthorizedException('Password is incorrect');
    }

    // 3. Issue an access token. sub = `sys:<id>` so it can't collide with client tokens.
    const payload = {
      sub: `sys:${user.id}`,
      userName: user.userName,
      role: 'system',
      type: 'access',
    };

    const expiresIn = 30 * 60; // 30 minutes — short-lived for security
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: `${expiresIn}s`,
    });
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn,
      expiresAt,
      user: {
        id: user.id,
        userName: user.userName,
        nsoEmployeeId: user.nsoEmployeeId,
        statusId: user.statusId,
        roles: user.roles.map((r) => r.systemRole.nameEng),
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    const { bankbookNumber, password, confirmPassword, vbCode, username, phoneNumber } = registerDto;

    // 1. Check password match
    if (password !== confirmPassword) {
      throw new BadRequestException('Password and confirm password do not match');
    }

    // 2. Check if any Client exists with vbCode + bankbookNumber
    const client = await this.prisma.client.findFirst({
      where: {
        vbCode: vbCode,
        bankbookNumber: bankbookNumber,
      },
      select: {
        id: true,
        vbCode: true,
        bankbookNumber: true,
      },
    });
    console.log("client", client);
    if (!client) {
      throw new BadRequestException('Invalid village code or bankbook number');
    }

    // 3. Check if username is already taken
    const existingUsername = await this.prisma.clientAccount.findUnique({
      where: { username: username },
    });

    if (existingUsername) {
      throw new ConflictException('Username is already taken. Please choose another.');
    }

    // 4. Check if ClientAccount already exists with bankbookNumber + vbCode
    const existingClientAccount = await this.prisma.clientAccount.findUnique({
      where: {
        bankbookNumber_vbCode: {
          bankbookNumber: bankbookNumber,
          vbCode: vbCode,
        },
      },
    });

    if (existingClientAccount) {
      throw new ConflictException('You already have an account. Please login.');
    }

    // 5. Hash password and create ClientAccount
    const hashedPassword = await bcrypt.hash(password, 10);

    await this.prisma.clientAccount.create({
      data: {
        bankbookNumber: bankbookNumber,
        vbCode: vbCode,
        username: username,
        phoneNumber: phoneNumber,
        password: hashedPassword,
      },
    });

    return {
      message: 'Registration successful. You can now login.',
    };
  }

  async resetPassword(phoneNumber: string, newPassword: string): Promise<{ message: string }> {
    // 1. Find ClientAccount by phoneNumber
    const clientAccount = await this.prisma.clientAccount.findFirst({
      where: { phoneNumber: phoneNumber },
    });

    if (!clientAccount) {
      throw new BadRequestException('No account found for this phone number');
    }

    // 2. Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.clientAccount.update({
      where: {
        bankbookNumber_vbCode: {
          bankbookNumber: clientAccount.bankbookNumber,
          vbCode: clientAccount.vbCode,
        },
      },
      data: {
        password: hashedPassword,
      },
    });

    return {
      message: 'Password reset successful. You can now login with your new password.',
    };
  }
//   ✅ Response Success (200)
// json
// {
//   "message": "Password reset successful. You can now login with your new password."
// }
// ❌ Error Cases
// Error	Status	Message
// ไม่มีเบอร์โทรศัพท์นี้	400	"Phone number not found"
// ไม่มี account สำหรับเบอร์นี้	400	"Account not found for this phone number"

  async refresh(refreshTokenDto: RefreshTokenDto, ipAddress?: string, userAgent?: string): Promise<TokenResponse> {
    const { refreshToken } = refreshTokenDto;

    // 1. Find the refresh token in database
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        clientAccount: true,
      },
    });

    // 2. Validate token
    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.isRevoked) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (new Date() > storedToken.expiresAt) {
      await this.revokeRefreshToken(storedToken.id);
      throw new UnauthorizedException('Refresh token has expired');
    }

    // 3. Revoke the old refresh token (token rotation for security)
    await this.revokeRefreshToken(storedToken.id);

    // 4. Find all clients for this bankbookNumber
    const clients = await this.prisma.client.findMany({
      where: { bankbookNumber: storedToken.bankbookNumber },
      select: {
        id: true,
        bankbookNumber: true,
        firstName: true,
        lastName: true,
        nickName: true,
        vbCode: true,
      },
    });

    // 5. Generate new tokens
    return this.generateTokens(storedToken.bankbookNumber, storedToken.vbCode, storedToken.clientAccount.username, clients, ipAddress, userAgent);
  }

  async logout(refreshToken: string): Promise<void> {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (storedToken && !storedToken.isRevoked) {
      await this.revokeRefreshToken(storedToken.id);
    }
  }

  async logoutAll(bankbookNumber: string, vbCode: string): Promise<void> {
    await this.revokeAllUserRefreshTokens(bankbookNumber, vbCode);
  }

  private async generateTokens(
    bankbookNumber: string,
    vbCode: string,
    username: string,
    clients: any[],
    ipAddress?: string,
    userAgent?: string
  ): Promise<TokenResponse> {
    // 1. Generate access token payload (sub = bankbookNumber)
    const payload = {
      sub: bankbookNumber,
      vbCode: vbCode,
      type: 'access',
    };

    // 2. Sign access token with short expiry
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
    });

    // 3. Calculate expiry time
    const expiresIn = 15 * 60; // 15 minutes in seconds
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // 4. Generate refresh token (random string)
    const refreshToken = this.generateRefreshTokenString();
    const refreshTokenExpiresAt = new Date();
    refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + this.REFRESH_TOKEN_EXPIRY_DAYS);

    // 5. Store refresh token in database
    await this.prisma.refreshToken.create({
      data: {
        bankbookNumber,
        vbCode,
        token: refreshToken,
        expiresAt: refreshTokenExpiresAt,
        ipAddress,
        userAgent,
      },
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn,
      expiresAt,
      username,
      clients: clients.map((c) => ({
        id: c.id,
        bankbookNumber: c.bankbookNumber,
        firstName: c.firstName,
        lastName: c.lastName,
        nickName: c.nickName,
        vbCode: c.vbCode,
      })),
    };
  }

  private generateRefreshTokenString(): string {
    return crypto.randomBytes(40).toString('hex');
  }

  private async revokeRefreshToken(tokenId: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id: tokenId },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });
  }

  private async revokeAllUserRefreshTokens(bankbookNumber: string, vbCode: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        bankbookNumber,
        vbCode,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });
  }

  // Cleanup expired tokens (can be called by a scheduled job)
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  }

  async checkUsernameAvailability(username: string): Promise<{ available: boolean; message?: string }> {
    if (!username || username.trim().length === 0) {
      return { available: false, message: 'Username is required' };
    }

    if (username.length < 3) {
      return { available: false, message: 'Username must be at least 3 characters long' };
    }

    // Check if username already exists
    const existingAccount = await this.prisma.clientAccount.findUnique({
      where: { username: username.trim() },
    });

    if (existingAccount) {
      return { available: false, message: 'Username is already taken' };
    }

    return { available: true };
  }
}

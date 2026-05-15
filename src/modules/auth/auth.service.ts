import { Injectable, UnauthorizedException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';

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
}

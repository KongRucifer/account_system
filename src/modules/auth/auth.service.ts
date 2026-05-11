import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: Date;
  client: {
    id: string;
    bankbookNumber: string | null;
    firstName: string | null;
    lastName: string | null;
    nickName: string;
    vbCode: string;
  };
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
    // 1. Find client by bankbookNumber
    const client = await this.prisma.client.findFirst({
      where: { bankbookNumber: loginDto.bankbookNumber },
      select: {
        id: true,
        bankbookNumber: true,
        firstName: true,
        lastName: true,
        nickName: true,
        vbCode: true,
        clientAccount: {
          select: { 
            id: true,
            password: true,
            clientId: true,
          },
        },
      },
    });

    if (!client || !client.clientAccount) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. Verify password against client_account
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      client.clientAccount.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. Revoke all existing refresh tokens for this client (optional - for single session)
    await this.revokeAllUserRefreshTokens(client.clientAccount.clientId);

    // 4. Generate tokens
    return this.generateTokens(client, client.clientAccount.clientId, ipAddress, userAgent);
  }

  async refresh(refreshTokenDto: RefreshTokenDto, ipAddress?: string, userAgent?: string): Promise<TokenResponse> {
    const { refreshToken } = refreshTokenDto;

    // 1. Find the refresh token in database
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        clientAccount: {
          include: {
            client: {
              select: {
                id: true,
                bankbookNumber: true,
                firstName: true,
                lastName: true,
                nickName: true,
                vbCode: true,
              },
            },
          },
        },
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
      // Token expired - revoke it
      await this.revokeRefreshToken(storedToken.id);
      throw new UnauthorizedException('Refresh token has expired');
    }

    // 3. Revoke the old refresh token (token rotation for security)
    await this.revokeRefreshToken(storedToken.id);

    // 4. Generate new tokens
    const client = storedToken.clientAccount.client;
    return this.generateTokens(client, storedToken.clientId, ipAddress, userAgent);
  }

  async logout(refreshToken: string): Promise<void> {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (storedToken && !storedToken.isRevoked) {
      await this.revokeRefreshToken(storedToken.id);
    }
  }

  async logoutAll(clientId: string): Promise<void> {
    await this.revokeAllUserRefreshTokens(clientId);
  }

  private async generateTokens(
    client: any, 
    clientId: string, 
    ipAddress?: string, 
    userAgent?: string
  ): Promise<TokenResponse> {
    // 1. Generate access token payload
    const payload = {
      sub: client.id,
      bankbookNumber: client.bankbookNumber,
      vbCode: client.vbCode,
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
        clientId,
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
      client: {
        id: client.id,
        bankbookNumber: client.bankbookNumber,
        firstName: client.firstName,
        lastName: client.lastName,
        nickName: client.nickName,
        vbCode: client.vbCode,
      },
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

  private async revokeAllUserRefreshTokens(clientId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        clientId,
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

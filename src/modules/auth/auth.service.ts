import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
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
          select: { password: true },
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

    // 3. Sign JWT with clientId + bankbookNumber + vbCode
    const payload = {
      sub: client.id,
      bankbookNumber: client.bankbookNumber,
      vbCode: client.vbCode,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: '24h',
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
}

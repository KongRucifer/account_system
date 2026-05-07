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
    const user = await this.prisma.systemUser.findUnique({
      where: { username: loginDto.username },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new UnauthorizedException('Account is inactive');

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, username: user.username, roleId: user.roleId };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: '24h',
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        isActive: user.isActive,
        role: {
          id: user.role.id,
          name: user.role.name,
          description: user.role.description,
          permissions: user.role.rolePermissions.map((rp) => ({
            id: rp.permission.id,
            name: rp.permission.name,
            code: rp.permission.code,
          })),
        },
      },
    };
  }
}

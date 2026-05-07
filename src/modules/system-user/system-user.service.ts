import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SystemUserService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.systemUser.findMany({
      select: {
        id: true,
        username: true,
        fullName: true,
        isActive: true,
        createdAt: true,
        role: {
          select: { id: true, name: true, description: true },
        },
        _count: { select: { accounts: true } },
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.systemUser.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        fullName: true,
        isActive: true,
        createdAt: true,
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
        accounts: {
          include: { branch: true },
        },
      },
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }
}

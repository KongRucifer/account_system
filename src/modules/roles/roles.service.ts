import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.role.findMany({
      include: {
        rolePermissions: {
          include: { permission: true },
        },
        _count: { select: { systemUsers: true } },
      },
    });
  }

  async findOne(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
        systemUsers: {
          select: { id: true, username: true, fullName: true, isActive: true },
        },
      },
    });
    if (!role) throw new NotFoundException(`Role ${id} not found`);
    return role;
  }
}

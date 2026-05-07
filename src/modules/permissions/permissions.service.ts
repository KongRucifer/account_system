import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.permission.findMany({
      include: {
        _count: { select: { rolePermissions: true } },
      },
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            role: { select: { id: true, name: true, description: true } },
          },
        },
      },
    });
    if (!permission) throw new NotFoundException(`Permission ${id} not found`);
    return permission;
  }
}

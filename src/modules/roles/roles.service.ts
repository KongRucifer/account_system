import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.systemRole.findMany({
      include: {
        users: {
          include: {
            systemUser: {
              select: { id: true, userName: true },
            },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.systemRole.findUnique({
      where: { id },
      include: {
        users: {
          include: {
            systemUser: {
              select: { id: true, userName: true },
            },
          },
        },
      },
    });
    if (!role) throw new NotFoundException(`Role ${id} not found`);
    return role;
  }
}

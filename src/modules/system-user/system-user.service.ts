import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SystemUserService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.systemUser.findMany({
      select: {
        id: true,
        userName: true,
        roles: {
          select: {
            systemRole: {
              select: { id: true, nameEng: true, nameLao: true },
            },
          },
        },
        nsoEmployee: true,
      },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.systemUser.findUnique({
      where: { id },
      select: {
        id: true,
        userName: true,
        roles: {
          include: {
            systemRole: true,
          },
        },
        nsoEmployee: {
          include: {
            nso: true,
            nsoOffice: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }
}

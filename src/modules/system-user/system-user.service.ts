import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SystemUserService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.client.findMany({
      select: {
        id: true,
        bankbookNumber: true,
        firstName: true,
        lastName: true,
        nickName: true,
        phoneNumber: true,
        vbCode: true,
        statusId: true,
        clientAccount: {
          select: { id: true, vbCode: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      select: {
        id: true,
        bankbookNumber: true,
        firstName: true,
        lastName: true,
        nickName: true,
        phoneNumber: true,
        vbCode: true,
        statusId: true,
        clientAccount: {
          select: { id: true, vbCode: true },
        },
        accountOwners: {
          include: { account: true },
        },
      },
    });
    if (!client) throw new NotFoundException(`Client ${id} not found`);
    return client;
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VbcodeService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.vbcode.findMany({
      include: {
        _count: { select: { accounts: true, cnyLakRates: true } },
      },
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const branch = await this.prisma.vbcode.findUnique({
      where: { id },
      include: {
        accounts: {
          select: {
            id: true,
            accNumber: true,
            accNameLao: true,
            accNameEng: true,
            balance: true,
            currency: true,
            status: true,
          },
        },
        cnyLakRates: {
          orderBy: { date: 'desc' },
          take: 10,
        },
      },
    });
    if (!branch) throw new NotFoundException(`Branch ${id} not found`);
    return branch;
  }
}

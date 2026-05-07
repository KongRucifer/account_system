import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CnyLakRateService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.cnyLakRate.findMany({
      include: {
        branch: { select: { id: true, branchName: true, branchCode: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: number) {
    const rate = await this.prisma.cnyLakRate.findUnique({
      where: { id },
      include: { branch: true },
    });
    if (!rate) throw new NotFoundException(`Exchange rate ${id} not found`);
    return rate;
  }

  findByBranch(vbcodeId: number) {
    return this.prisma.cnyLakRate.findMany({
      where: { vbcodeId },
      include: {
        branch: { select: { id: true, branchName: true, branchCode: true } },
      },
      orderBy: { date: 'desc' },
    });
  }
}

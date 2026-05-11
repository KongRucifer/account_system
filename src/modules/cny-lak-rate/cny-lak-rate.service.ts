import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CnyLakRateService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.cnyLakRate.findMany({
      include: {
        vb: { select: { id: true, nameEng: true, nameLao: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(date: Date, vbCode: string) {
    const rate = await this.prisma.cnyLakRate.findUnique({
      where: { date_vbCode: { date, vbCode } },
      include: { vb: true },
    });
    if (!rate) throw new NotFoundException(`Exchange rate not found`);
    return rate;
  }

  findByBranch(vbCode: string) {
    return this.prisma.cnyLakRate.findMany({
      where: { vbCode },
      include: {
        vb: { select: { id: true, nameEng: true, nameLao: true } },
      },
      orderBy: { date: 'desc' },
    });
  }
}

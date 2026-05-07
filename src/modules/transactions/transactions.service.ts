import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.transaction.findMany({
      include: {
        account: {
          select: {
            id: true,
            accNumber: true,
            accNameLao: true,
            accNameEng: true,
            currency: true,
            branch: { select: { id: true, branchName: true, branchCode: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        account: {
          include: {
            user: { select: { id: true, username: true, fullName: true } },
            branch: true,
          },
        },
      },
    });
    if (!tx) throw new NotFoundException(`Transaction ${id} not found`);
    return tx;
  }

  findByAccount(accountId: string) {
    return this.prisma.transaction.findMany({
      where: { accountId },
      include: {
        account: { select: { id: true, accNumber: true, accNameLao: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findByYear(year: number) {
    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year + 1}-01-01T00:00:00.000Z`);
    return this.prisma.transaction.findMany({
      where: { createdAt: { gte: startDate, lt: endDate } },
      include: {
        account: {
          select: {
            id: true,
            accNumber: true,
            accNameLao: true,
            branch: { select: { branchName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

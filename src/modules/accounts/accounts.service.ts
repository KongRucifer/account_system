import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.account.findMany({
      include: {
        user: { select: { id: true, username: true, fullName: true } },
        branch: true,
        _count: { select: { transactions: true } },
      },
    });
  }

  async findOne(id: string) {
    const account = await this.prisma.account.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, fullName: true } },
        branch: true,
        transactions: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!account) throw new NotFoundException(`Account ${id} not found`);
    return account;
  }

  findByUser(userId: string) {
    return this.prisma.account.findMany({
      where: { userId },
      include: {
        branch: true,
        _count: { select: { transactions: true } },
      },
    });
  }

  // BCEL One-style yearly summary
  // Step 1: Load user + accounts + branch details
  // Step 2: GROUP BY transaction_type → SUM(amount) filtered by year
  async getYearlySummary(userId: string, year: number) {
    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year + 1}-01-01T00:00:00.000Z`);

    const user = await this.prisma.systemUser.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            rolePermissions: { include: { permission: true } },
          },
        },
        accounts: { include: { branch: true } },
      },
    });

    if (!user) throw new NotFoundException(`User ${userId} not found`);

    const accountIds = user.accounts.map((a) => a.id);

    // Use groupBy to SUM at DB level — equivalent to GROUP BY transaction_type
    const summary = await this.prisma.transaction.groupBy({
      by: ['transactionType'],
      where: {
        accountId: { in: accountIds },
        createdAt: { gte: startDate, lt: endDate },
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    const depositEntry = summary.find((t) => t.transactionType === 'DEPOSIT');
    const loanEntry = summary.find((t) => t.transactionType === 'LOAN');

    const totalDeposit = Number(depositEntry?._sum.amount ?? 0);
    const totalLoan = Number(loanEntry?._sum.amount ?? 0);

    return {
      userProfile: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        isActive: user.isActive,
        role: {
          id: user.role.id,
          name: user.role.name,
          permissions: user.role.rolePermissions.map((rp) => ({
            id: rp.permission.id,
            name: rp.permission.name,
            code: rp.permission.code,
          })),
        },
      },
      accounts: user.accounts.map((acc) => ({
        id: acc.id,
        accNumber: acc.accNumber,
        accNameLao: acc.accNameLao,
        accNameEng: acc.accNameEng,
        balance: Number(acc.balance),
        currency: acc.currency,
        status: acc.status,
        branch: {
          id: acc.branch.id,
          branchName: acc.branch.branchName,
          branchCode: acc.branch.branchCode,
          location: acc.branch.location,
        },
      })),
      yearlySummary: {
        year,
        totalDeposit,
        totalLoan,
        netBalance: totalDeposit - totalLoan,
        depositCount: depositEntry?._count.id ?? 0,
        loanCount: loanEntry?._count.id ?? 0,
      },
    };
  }
}

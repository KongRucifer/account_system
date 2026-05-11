import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AccountDashboardSummary {
  account: {
    accNumber: string;
    accNameLao: string | null;
    accNameEng: string | null;
    currentBalance: number;
    accountType: string | null;
    vbCode: string;
    vbName: string | null;
    openingDate: Date | null;
    status: string;
  };
  loan: {
    id: number;
    totalLoanAmount: number;
    loanOutstanding: number;
    interestDue: number;
    principalDue: number;
    principalPaid: number;
    startDate: Date;
    endDate: Date | null;
    loanPeriodMonths: number;
    interestRate: number;
    repaymentType: string | null;
    status: string;
  } | null;
  savings: {
    id: number;
    currentBalance: number;
    savingAmount: number | null;
    withdrawalAmount: number | null;
    interestNumerator: number;
    date: Date;
  } | null;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getAccountDashboard(accNumber: string): Promise<AccountDashboardSummary> {
    // 1. Get account info
    const account = await this.prisma.accounts.findUnique({
      where: { accNumber },
      include: {
        vb: true,
        accountType: true,
      },
    });

    if (!account) {
      throw new NotFoundException(`Account ${accNumber} not found`);
    }

    // 2. Get loan arrangement for this account
    const loan = await this.prisma.clientLoanArrangement.findFirst({
      where: { accNumber },
      include: {
        clientLoanRepaymentType: true,
        status: true,
      },
      orderBy: { date: 'desc' },
    });

    // 3. Get savings arrangement for this account
    const savings = await this.prisma.clientSavingArrangement.findFirst({
      where: { accNumber },
      orderBy: { date: 'desc' },
    });

    // 4. Calculate financial summary
    const currentBalance = Number(account.currentBalance);
    const totalLoanAmount = loan ? Number(loan.totalLoanAmount) : 0;
    const loanOutstanding = loan ? Number(loan.loanOutstanding) : 0;
    const savingsBalance = savings ? Number(savings.currentBalance) : 0;

    return {
      account: {
        accNumber: account.accNumber,
        accNameLao: account.accNameLao,
        accNameEng: account.accNameEng,
        currentBalance,
        accountType: account.accountType?.nameLao || account.accountType?.nameEng || null,
        vbCode: account.vbCode,
        vbName: account.vb?.nameLao || account.vb?.nameEng || null,
        openingDate: account.openingDate,
        status: account.statusId,
      },
      loan: loan
        ? {
            id: Number(loan.id),
            totalLoanAmount: Number(loan.totalLoanAmount),
            loanOutstanding,
            interestDue: Number(loan.interestDue),
            principalDue: Number(loan.principalDue),
            principalPaid: Number(loan.principalPaid),
            startDate: loan.startDate,
            endDate: loan.endDate,
            loanPeriodMonths: loan.loanPeriodMonths,
            interestRate: loan.clientLoanIntRate ? Number(loan.clientLoanIntRate) : 0,
            repaymentType: loan.clientLoanRepaymentType?.nameLao || loan.clientLoanRepaymentType?.nameEng || null,
            status: loan.status?.nameLao || loan.status?.nameEng || loan.statusId,
          }
        : null,
      savings: savings
        ? {
            id: Number(savings.id),
            currentBalance: savingsBalance,
            savingAmount: savings.savingAmount ? Number(savings.savingAmount) : null,
            withdrawalAmount: savings.withdrawalAmount ? Number(savings.withdrawalAmount) : null,
            interestNumerator: Number(savings.interestNumerator),
            date: savings.date,
          }
        : null,
      // financialSummary: {
      //   currentBalance,
      //   totalLoanAmount,
      //   loanOutstanding,
      //   savingsBalance,
      //   netPosition: currentBalance + savingsBalance - loanOutstanding,
      // },
    };
  }
}

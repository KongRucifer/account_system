import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, PaginatedResult, createPaginatedResponse, calculatePagination } from '../../common/dto/pagination.dto';
import { getPrismaPagination } from '../../common/utils/prisma-pagination.util';

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
  // financialSummary: {
  //   currentBalance: number;
  //   totalLoanAmount: number;
  //   loanOutstanding: number;
  //   savingsBalance: number;
  //   netPosition: number;
  // };
}

export interface AccountYearlySummary {
  year: number;
  accNumber: string;
  summary: {
    totalDeposits: number;
    totalWithdrawals: number;
    totalLoanPayments: number;
    totalInterestPaid: number;
    netCashFlow: number;
    transactionCount: number;
  };
  monthlyBreakdown: Array<{
    month: number;
    monthName: string;
    deposits: number;
    withdrawals: number;
    loanPayments: number;
    transactionCount: number;
  }>;
  transactions: PaginatedResult<any>;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get complete account dashboard summary
   * - Account info
   * - Loan details (if any)
   * - Savings details (if any)
   * - Financial summary
   */
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

  /**
   * Get yearly transaction summary for a specific account
   */
  async getAccountYearlySummary(
    accNumber: string,
    year: number,
    paginationDto: PaginationDto,
  ): Promise<AccountYearlySummary> {
    // Verify account exists
    const account = await this.prisma.accounts.findUnique({
      where: { accNumber },
      select: { accNumber: true },
    });

    if (!account) {
      throw new NotFoundException(`Account ${accNumber} not found`);
    }

    // Date range for the year
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year + 1}-01-01`);

    // Get transactions for this account in the year
    const { skip, take, page, limit } = getPrismaPagination(paginationDto.page, paginationDto.limit);

    const [transactions, total] = await Promise.all([
      this.prisma.transactions.findMany({
        where: {
          debitAccNumber: accNumber,
          date: { gte: startDate, lt: endDate },
        },
        skip,
        take,
        include: {
          transactionCode: true,
        },
        orderBy: { date: paginationDto.sort || 'desc' },
      }),
      this.prisma.transactions.count({
        where: {
          debitAccNumber: accNumber,
          date: { gte: startDate, lt: endDate },
        },
      }),
    ]);

    // Get all transactions for summary calculations (without pagination)
    const allYearTransactions = await this.prisma.transactions.findMany({
      where: {
        debitAccNumber: accNumber,
        date: { gte: startDate, lt: endDate },
      },
      include: {
        transactionCode: true,
      },
    });

    // Calculate yearly totals
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    let totalLoanPayments = 0;
    let totalInterestPaid = 0;

    // Monthly aggregation
    const monthlyData: Record<number, { deposits: number; withdrawals: number; loanPayments: number; count: number }> = {};

    for (let i = 1; i <= 12; i++) {
      monthlyData[i] = { deposits: 0, withdrawals: 0, loanPayments: 0, count: 0 };
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (const tx of allYearTransactions) {
      const amount = Number(tx.amount);
      const month = tx.date.getMonth() + 1;
      const txCode = tx.transactionCode?.transactionCode || '';
      const txName = (tx.transactionCode?.nameEng || '').toLowerCase();

      // Classify transaction based on code/name patterns
      if (txCode.startsWith('D') || txName.includes('deposit') || txName.includes('saving')) {
        totalDeposits += amount;
        monthlyData[month].deposits += amount;
      } else if (txCode.startsWith('W') || txName.includes('withdraw')) {
        totalWithdrawals += amount;
        monthlyData[month].withdrawals += amount;
      } else if (txName.includes('loan') && (txName.includes('payment') || txName.includes('repay'))) {
        totalLoanPayments += amount;
        monthlyData[month].loanPayments += amount;
      } else if (txName.includes('interest')) {
        totalInterestPaid += amount;
      }

      monthlyData[month].count++;
    }

    // Format monthly breakdown
    const monthlyBreakdown = Object.entries(monthlyData).map(([month, data]) => ({
      month: parseInt(month),
      monthName: monthNames[parseInt(month) - 1],
      deposits: data.deposits,
      withdrawals: data.withdrawals,
      loanPayments: data.loanPayments,
      transactionCount: data.count,
    }));

    const pagination = calculatePagination(total, page, limit);

    return {
      year,
      accNumber,
      summary: {
        totalDeposits,
        totalWithdrawals,
        totalLoanPayments,
        totalInterestPaid,
        netCashFlow: totalDeposits - totalWithdrawals - totalLoanPayments,
        transactionCount: allYearTransactions.length,
      },
      monthlyBreakdown,
      transactions: createPaginatedResponse(transactions, pagination, 'Yearly transactions fetched successfully'),
    };
  }

  /**
   * Get quick summary for account header
   */
  async getAccountQuickSummary(accNumber: string) {
    const [account, savings, loan, recentTransactions] = await Promise.all([
      // Get account basic info
      this.prisma.accounts.findUnique({
        where: { accNumber },
        select: { accNumber: true, accNameLao: true, currentBalance: true },
      }),
      // Get savings arrangement
      this.prisma.clientSavingArrangement.findFirst({
        where: { accNumber },
        select: { currentBalance: true },
      }),
      // Get loan arrangement
      this.prisma.clientLoanArrangement.findFirst({
        where: { accNumber },
        select: { loanOutstanding: true, totalLoanAmount: true },
      }),
      // Recent 5 transactions
      this.prisma.transactions.findMany({
        where: { debitAccNumber: accNumber },
        orderBy: { date: 'desc' },
        take: 5,
        include: {
          transactionCode: true,
        },
      }),
    ]);

    if (!account) {
      throw new NotFoundException(`Account ${accNumber} not found`);
    }

    return {
      accNumber: account.accNumber,
      accName: account.accNameLao,
      currentBalance: Number(account.currentBalance),
      savingsBalance: Number(savings?.currentBalance || 0),
      loanOutstanding: Number(loan?.loanOutstanding || 0),
      totalLoanAmount: Number(loan?.totalLoanAmount || 0),
      recentTransactions: recentTransactions.map((tx) => ({
        id: tx.id,
        date: tx.date,
        amount: Number(tx.amount),
        description: tx.description,
        transactionCode: tx.transactionCode?.nameLao || tx.transactionCode?.nameEng,
      })),
    };
  }
}

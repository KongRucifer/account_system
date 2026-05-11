import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, PaginatedResult, createPaginatedResponse, calculatePagination } from '../../common/dto/pagination.dto';
import { getPrismaPagination } from '../../common/utils/prisma-pagination.util';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResult<any>> {
    const { skip, take, page, limit } = getPrismaPagination(paginationDto.page, paginationDto.limit);

    const [accounts, total] = await Promise.all([
      this.prisma.accounts.findMany({
        skip,
        take,
        include: {
          vb: {
            select: { id: true, nameEng: true, nameLao: true },
          },
          accountOwners: {
            take: 5,
            select: { clientId: true, bankbookNumber: true },
          },
        },
        orderBy: { accNumber: paginationDto.sort || 'asc' },
      }),
      this.prisma.accounts.count(),
    ]);

    const pagination = calculatePagination(total, page, limit);
    return createPaginatedResponse(accounts, pagination, 'Accounts fetched successfully');
  }

  async findOne(accNumber: string) {
    const account = await this.prisma.accounts.findUnique({
      where: { accNumber },
      include: {
        vb: true,
        accountOwners: {
          include: {
            client: true,
          },
        },
        transactions: {
          orderBy: { date: 'desc' },
          take: 50, // Limit to 50 recent transactions
        },
      },
    });
    if (!account) throw new NotFoundException(`Account ${accNumber} not found`);
    return account;
  }

  /**
   * Get detailed account info with loan, savings, and year-filtered transactions
   */
  async getAccountDetail(
    accNumber: string,
    year?: number,
    paginationDto?: PaginationDto,
  ): Promise<{
    account: any;
    loan: any | null;
    savings: any | null;
    transactions: PaginatedResult<any>;
  }> {
    // 1. Get basic account info
    const account = await this.prisma.accounts.findUnique({
      where: { accNumber },
      include: {
        vb: true,
        accountType: true,
        accountOwners: {
          include: {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                nickName: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
    });

    if (!account) throw new NotFoundException(`Account ${accNumber} not found`);

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

    // 4. Get transactions (with year filter if provided)
    let transactionsWhere: any = { debitAccNumber: accNumber };
    if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year + 1}-01-01`);
      transactionsWhere.date = { gte: startDate, lt: endDate };
    }

    let transactions: PaginatedResult<any>;
    if (paginationDto) {
      const { skip, take, page, limit } = getPrismaPagination(paginationDto.page, paginationDto.limit);
      const [txData, total] = await Promise.all([
        this.prisma.transactions.findMany({
          where: transactionsWhere,
          skip,
          take,
          include: {
            transactionCode: true,
          },
          orderBy: { date: paginationDto.sort || 'desc' },
        }),
        this.prisma.transactions.count({ where: transactionsWhere }),
      ]);
      const pagination = calculatePagination(total, page, limit);
      transactions = createPaginatedResponse(txData, pagination, 'Transactions fetched successfully');
    } else {
      // Default: get last 50 transactions without pagination metadata
      const txData = await this.prisma.transactions.findMany({
        where: transactionsWhere,
        take: 50,
        include: {
          transactionCode: true,
        },
        orderBy: { date: 'desc' },
      });
      transactions = createPaginatedResponse(
        txData,
        { total: txData.length, page: 1, limit: 50, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
        'Transactions fetched successfully',
      );
    }

    return {
      account: {
        accNumber: account.accNumber,
        accNameLao: account.accNameLao,
        accNameEng: account.accNameEng,
        currentBalance: Number(account.currentBalance),
        accountType: account.accountType?.nameLao || account.accountType?.nameEng || null,
        vbCode: account.vbCode,
        vbName: account.vb?.nameLao || account.vb?.nameEng || null,
        openingDate: account.openingDate,
        status: account.statusId,
        owners: account.accountOwners.map((ao) => ({
          clientId: ao.clientId,
          clientName: ao.client?.nickName || `${ao.client?.firstName || ''} ${ao.client?.lastName || ''}`.trim(),
          bankbookNumber: ao.bankbookNumber,
        })),
      },
      loan: loan
        ? {
            id: Number(loan.id),
            totalLoanAmount: Number(loan.totalLoanAmount), // ເງີນກູ້ທັງໝົດ
            loanOutstanding: Number(loan.loanOutstanding), // ເງີນກູ້ຄົງເຫຼືອ
            interestDue: Number(loan.interestDue),
            interestPaid: Number(loan.interestPaid),
            principalDue: Number(loan.principalDue),
            principalPaid: Number(loan.principalPaid),
            startDate: loan.startDate,
            endDate: loan.endDate,
            loanPeriodMonths: loan.loanPeriodMonths,
            interestRate: loan.clientLoanIntRate,
            repaymentType: loan.clientLoanRepaymentType?.nameLao || loan.clientLoanRepaymentType?.nameEng || null,
            status: loan.status?.nameLao || loan.status?.nameEng || loan.statusId,
          }
        : null,
      savings: savings
        ? {
            id: Number(savings.id),
            currentBalance: Number(savings.currentBalance), // ເງີນຝາກຄົງເຫຼືອ
            savingAmount: savings.savingAmount ? Number(savings.savingAmount) : null,
            withdrawalAmount: savings.withdrawalAmount ? Number(savings.withdrawalAmount) : null,
            interestNumerator: Number(savings.interestNumerator),
            date: savings.date,
          }
        : null,
      transactions,
    };
  }

  findByUser(clientId: string) {
    return this.prisma.accounts.findMany({
      where: {
        accountOwners: {
          some: { clientId },
        },
      },
      include: {
        vb: true,
        accountOwners: {
          include: { client: true },
        },
      },
    });
  }

  async getYearlySummary(clientId: string, year: number) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        bankbookNumber: true,
        firstName: true,
        lastName: true,
        nickName: true,
        vbCode: true,
      },
    });

    if (!client) throw new NotFoundException(`Client ${clientId} not found`);

    const accounts = await this.prisma.accounts.findMany({
      where: {
        accountOwners: { some: { clientId } },
      },
      select: { accNumber: true, accNameEng: true, accTypeId: true, currentBalance: true },
    });

    const accNumbers = accounts.map((a) => a.accNumber);

    const transactions = await this.prisma.transactions.findMany({
      where: {
        debitAccNumber: { in: accNumbers },
        date: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`),
        },
      },
      select: {
        transactionCodeId: true,
        amount: true,
        date: true,
        debitAccNumber: true,
      },
    });

    const totalDeposit = transactions
      .filter((t) => ['2201', '2101'].includes(t.transactionCodeId ?? ''))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalLoanRepayment = transactions
      .filter((t) => t.transactionCodeId === '1010')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      clientProfile: {
        id: client.id,
        bankbookNumber: client.bankbookNumber,
        firstName: client.firstName,
        lastName: client.lastName,
        nickName: client.nickName,
        vbCode: client.vbCode,
      },
      accounts,
      yearlySummary: {
        year,
        totalDeposit,
        totalLoanRepayment,
        transactionCount: transactions.length,
      },
    };
  }
}

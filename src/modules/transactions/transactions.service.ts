import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, PaginatedResult, createPaginatedResponse, calculatePagination } from '../../common/dto/pagination.dto';
import { getPrismaPagination } from '../../common/utils/prisma-pagination.util';

const ALLOWED_TX_CODES = ['1006', '3101', '6410', '1010', '1001', '1201'];

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByAccount(accountId: string, paginationDto: PaginationDto, txCode?: string): Promise<PaginatedResult<any>> {
    const { skip, take, page, limit } = getPrismaPagination(paginationDto.page, paginationDto.limit);
    const where: any = {
      debitAccNumber: accountId,
      transactionCodeId: txCode ? txCode : { in: ALLOWED_TX_CODES },
    };

    const [transactions, total] = await Promise.all([
      this.prisma.transactions.findMany({
        where,
        skip,
        take,
        include: {
          debitAccount: { select: { accNumber: true, accNameLao: true } },
          transactionCode: true,
        },
        orderBy: { date: paginationDto.sort || 'desc' },
      }),
      this.prisma.transactions.count({ where }),
    ]);

    const pagination = calculatePagination(total, page, limit);
    return createPaginatedResponse(transactions, pagination, 'Account transactions fetched successfully');
  }

  async findByAccountAndYear(
    accountId: string,
    year: number,
    paginationDto: PaginationDto,
    txCode?: string,
  ): Promise<PaginatedResult<any>> {
    const { skip, take, page, limit } = getPrismaPagination(paginationDto.page, paginationDto.limit);
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year + 1}-01-01`);
    const where: any = {
      debitAccNumber: accountId,
      date: { gte: startDate, lt: endDate },
      transactionCodeId: txCode ? txCode : { in: ALLOWED_TX_CODES },
    };

    const [transactions, total] = await Promise.all([
      this.prisma.transactions.findMany({
        where,
        skip,
        take,
        include: {
          debitAccount: {
            select: {
              accNumber: true,
              accNameLao: true,
              vb: { select: { nameEng: true, nameLao: true } },
            },
          },
          transactionCode: true,
        },
        orderBy: { date: paginationDto.sort || 'desc' },
      }),
      this.prisma.transactions.count({ where }),
    ]);

    const pagination = calculatePagination(total, page, limit);
    return createPaginatedResponse(transactions, pagination, 'Account year transactions fetched successfully');
  }
}

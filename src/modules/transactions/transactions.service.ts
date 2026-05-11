import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, PaginatedResult, createPaginatedResponse, calculatePagination } from '../../common/dto/pagination.dto';
import { getPrismaPagination } from '../../common/utils/prisma-pagination.util';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResult<any>> {
    const { skip, take, page, limit } = getPrismaPagination(paginationDto.page, paginationDto.limit);

    const [transactions, total] = await Promise.all([
      this.prisma.transactions.findMany({
        skip,
        take,
        include: {
          debitAccount: {
            select: {
              accNumber: true,
              accNameLao: true,
              accNameEng: true,
              vb: { select: { id: true, nameEng: true, nameLao: true } },
            },
          },
          transactionCode: true,
        },
        orderBy: { date: paginationDto.sort || 'desc' },
      }),
      this.prisma.transactions.count(),
    ]);

    const pagination = calculatePagination(total, page, limit);
    return createPaginatedResponse(transactions, pagination, 'Transactions fetched successfully');
  }

  async findOne(id: string) {
    const tx = await this.prisma.transactions.findUnique({
      where: { id },
      include: {
        debitAccount: {
          include: {
            vb: true,
          },
        },
        transactionCode: true,
      },
    });
    if (!tx) throw new NotFoundException(`Transaction ${id} not found`);
    return tx;
  }

  async findByAccount(accountId: string, paginationDto: PaginationDto, txCode?: string): Promise<PaginatedResult<any>> {
    const { skip, take, page, limit } = getPrismaPagination(paginationDto.page, paginationDto.limit);
    const where: any = { debitAccNumber: accountId };
    if (txCode) where.transactionCodeId = txCode;

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

  async findByYear(year: number, paginationDto: PaginationDto): Promise<PaginatedResult<any>> {
    const { skip, take, page, limit } = getPrismaPagination(paginationDto.page, paginationDto.limit);
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year + 1}-01-01`);

    const [transactions, total] = await Promise.all([
      this.prisma.transactions.findMany({
        where: { date: { gte: startDate, lt: endDate } },
        skip,
        take,
        include: {
          debitAccount: {
            select: {
              accNumber: true,
              accNameLao: true,
              vb: { select: { nameEng: true } },
            },
          },
          transactionCode: true,
        },
        orderBy: { date: paginationDto.sort || 'desc' },
      }),
      this.prisma.transactions.count({ where: { date: { gte: startDate, lt: endDate } } }),
    ]);

    const pagination = calculatePagination(total, page, limit);
    return createPaginatedResponse(transactions, pagination, 'Year transactions fetched successfully');
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
    };
    if (txCode) where.transactionCodeId = txCode;

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

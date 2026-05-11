import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, PaginatedResult, createPaginatedResponse, calculatePagination } from '../../common/dto/pagination.dto';
import { getPrismaPagination } from '../../common/utils/prisma-pagination.util';

@Injectable()
export class VbcodeService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResult<any>> {
    const { skip, take, page, limit } = getPrismaPagination(paginationDto.page, paginationDto.limit);

    const [branches, total] = await Promise.all([
      this.prisma.vbCode.findMany({
        skip,
        take,
        include: {
          accounts: {
            take: 20, // Limit to 20 accounts per branch
            select: { accNumber: true, accNameLao: true, statusId: true },
          },
          cnyLakRates: {
            take: 5, // Limit to 5 recent rates per branch
            orderBy: { date: 'desc' },
          },
        },
        orderBy: { id: paginationDto.sort || 'asc' },
      }),
      this.prisma.vbCode.count(),
    ]);

    const pagination = calculatePagination(total, page, limit);
    return createPaginatedResponse(branches, pagination, 'Branches fetched successfully');
  }

  async findOne(id: string) {
    const branch = await this.prisma.vbCode.findUnique({
      where: { id },
      include: {
        accounts: {
          select: {
            accNumber: true,
            accNameLao: true,
            accNameEng: true,
            currentBalance: true,
            statusId: true,
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

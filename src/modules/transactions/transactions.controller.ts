import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('8. Transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all transactions with account and branch details (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated list of transactions with metadata' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.transactionsService.findAll(paginationDto);
  }

  // Static routes first to avoid collision with :id
  @Get('by-year')
  @ApiOperation({ summary: 'Get all transactions filtered by year (paginated)' })
  @ApiQuery({ name: 'year', description: 'Year e.g. 2025', type: Number, required: true })
  @ApiResponse({ status: 200, description: 'Paginated transactions for the given year' })
  findByYear(@Query('year') year: string, @Query() paginationDto: PaginationDto) {
    return this.transactionsService.findByYear(parseInt(year, 10), paginationDto);
  }

  @Get('account/:accountId')
  @ApiOperation({ summary: 'Get all transactions for a specific account (paginated)' })
  @ApiParam({ name: 'accountId', description: 'Account UUID' })
  @ApiResponse({ status: 200, description: 'Paginated transactions for the specified account' })
  findByAccount(@Param('accountId') accountId: string, @Query() paginationDto: PaginationDto) {
    return this.transactionsService.findByAccount(accountId, paginationDto);
  }

  @Get('account/:accountId/year/:year')
  @ApiOperation({ summary: 'Get account transactions filtered by year (paginated)' })
  @ApiParam({ name: 'accountId', description: 'Account Number (e.g., 12345)' })
  @ApiParam({ name: 'year', description: 'Year e.g. 2025', type: Number })
  @ApiResponse({ status: 200, description: 'Paginated transactions for account in specified year' })
  findByAccountAndYear(
    @Param('accountId') accountId: string,
    @Param('year') year: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.transactionsService.findByAccountAndYear(accountId, parseInt(year, 10), paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID — full detail including user and branch' })
  @ApiParam({ name: 'id', description: 'Transaction UUID' })
  @ApiResponse({ status: 200, description: 'Transaction detail' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }
}

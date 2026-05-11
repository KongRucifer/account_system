import { Controller, Get, Param, Query } from '@nestjs/common';
import {
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

  @Get('account/:accountId')
  @ApiOperation({ summary: 'Get all transactions for a specific account (paginated)' })
  @ApiParam({ name: 'accountId', description: 'Account UUID' })
  @ApiQuery({ name: 'txCode', description: 'Filter by transaction code e.g. 2201,2202', required: false })
  @ApiResponse({ status: 200, description: 'Paginated transactions for the specified account' })
  findByAccount(
    @Param('accountId') accountId: string,
    @Query() paginationDto: PaginationDto,
    @Query('txCode') txCode?: string,
  ) {
    return this.transactionsService.findByAccount(accountId, paginationDto, txCode);
  }

  @Get('account/:accountId/year/:year')
  @ApiOperation({ summary: 'Get account transactions filtered by year (paginated)' })
  @ApiParam({ name: 'accountId', description: 'Account Number (e.g., 12345)' })
  @ApiParam({ name: 'year', description: 'Year e.g. 2025', type: Number })
  @ApiQuery({ name: 'txCode', description: 'Filter by transaction code e.g. 2201,2202', required: false })
  @ApiResponse({ status: 200, description: 'Paginated transactions for account in specified year' })
  findByAccountAndYear(
    @Param('accountId') accountId: string,
    @Param('year') year: string,
    @Query() paginationDto: PaginationDto,
    @Query('txCode') txCode?: string,
  ) {
    return this.transactionsService.findByAccountAndYear(accountId, parseInt(year, 10), paginationDto, txCode);
  }
}

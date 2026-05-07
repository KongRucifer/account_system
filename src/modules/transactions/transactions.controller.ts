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

@ApiTags('8. Transactions')
@ApiBearerAuth('JWT-auth')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all transactions with account and branch details' })
  @ApiResponse({ status: 200, description: 'List of transactions (newest first)' })
  findAll() {
    return this.transactionsService.findAll();
  }

  // Static routes first to avoid collision with :id
  @Get('by-year')
  @ApiOperation({ summary: 'Get all transactions filtered by year' })
  @ApiQuery({ name: 'year', description: 'Year e.g. 2025', type: Number, required: true })
  @ApiResponse({ status: 200, description: 'Transactions for the given year' })
  findByYear(@Query('year') year: string) {
    return this.transactionsService.findByYear(parseInt(year, 10));
  }

  @Get('account/:accountId')
  @ApiOperation({ summary: 'Get all transactions for a specific account' })
  @ApiParam({ name: 'accountId', description: 'Account UUID' })
  @ApiResponse({ status: 200, description: 'Transactions for the specified account' })
  findByAccount(@Param('accountId') accountId: string) {
    return this.transactionsService.findByAccount(accountId);
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

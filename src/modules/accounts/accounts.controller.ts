import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AccountsService } from './accounts.service';

@ApiTags('5. Accounts')
@ApiBearerAuth('JWT-auth')
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all accounts with user and branch details' })
  @ApiResponse({ status: 200, description: 'List of accounts' })
  findAll() {
    return this.accountsService.findAll();
  }

  // NOTE: static routes must come before :id to avoid wrong matching
  @Get('yearly-summary')
  @ApiOperation({
    summary: 'BCEL One-style yearly summary — total DEPOSIT vs LOAN grouped by year',
    description:
      'Joins system_user → accounts → transactions + vbcode. ' +
      'Filters by userId and year, then uses GROUP BY transaction_type to SUM amounts.',
  })
  @ApiQuery({ name: 'userId', description: 'User UUID', required: true })
  @ApiQuery({ name: 'year', description: 'Year e.g. 2025', type: Number, required: true })
  @ApiResponse({
    status: 200,
    description: 'Returns userProfile, accounts with branch, and yearlySummary totals',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  getYearlySummary(@Query('userId') userId: string, @Query('year') year: string) {
    return this.accountsService.getYearlySummary(userId, parseInt(year, 10));
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all accounts belonging to a user' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User accounts with branch details' })
  findByUser(@Param('userId') userId: string) {
    return this.accountsService.findByUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get account by ID — includes full transaction history' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiResponse({ status: 200, description: 'Account details with transactions' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  findOne(@Param('id') id: string) {
    return this.accountsService.findOne(id);
  }
}

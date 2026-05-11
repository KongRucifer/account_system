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
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('5. Accounts')
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all accounts with user and branch details (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated list of accounts with metadata' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.accountsService.findAll(paginationDto);
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
    return this.accountsService.getYearlySummary(parseInt(userId, 10), parseInt(year, 10));
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all accounts belonging to a user' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User accounts with branch details' })
  findByUser(@Param('userId') userId: string) {
    return this.accountsService.findByUser(parseInt(userId, 10));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get account by ID — includes full transaction history' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiResponse({ status: 200, description: 'Account details with transactions' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  findOne(@Param('id') id: string) {
    return this.accountsService.findOne(id);
  }

  @Get(':accNumber/detail')
  @ApiOperation({
    summary: 'Get detailed account info — includes loan (ເງີນກູ້), savings (ເງີນຝາກ), and transactions',
    description:
      'Returns comprehensive account details including:\n' +
      '- Account basic info\n' +
      '- Loan details (ເງີນກູ້): total amount, outstanding, interest, principal\n' +
      '- Savings details (ເງີນຝາກ): current balance, interest\n' +
      '- Transaction history (with optional year filter and pagination)',
  })
  @ApiParam({ name: 'accNumber', description: 'Account Number (e.g., 12345)', type: String })
  @ApiQuery({ name: 'year', description: 'Filter transactions by year (optional, e.g., 2025)', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'Detailed account info with loan, savings, and transactions' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  getAccountDetail(
    @Param('accNumber') accNumber: string,
    @Query('year') year: string,
    @Query() paginationDto: PaginationDto,
  ) {
    const yearNum = year ? parseInt(year, 10) : undefined;
    return this.accountsService.getAccountDetail(accNumber, yearNum, paginationDto);
  }
}

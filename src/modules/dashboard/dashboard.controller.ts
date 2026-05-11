import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Dashboard - Account Based')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Get account dashboard with loan, savings, and summary
   */
  @Get('account/:accNumber')
  @ApiOperation({
    summary: 'Get account dashboard - loan, savings, and summary',
    description:
      'Returns account dashboard including:\n' +
      '- Account info\n' +
      '- Loan details (ເງີນກູ້)\n' +
      '- Savings details (ເງີນຝາກ)\n' +
      '- Financial summary',
  })
  @ApiParam({ name: 'accNumber', description: 'Account Number', type: String })
  @ApiResponse({ status: 200, description: 'Account dashboard retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  getAccountDashboard(@Param('accNumber') accNumber: string) {
    return this.dashboardService.getAccountDashboard(accNumber);
  }

  /**
   * Get yearly transaction summary for account
   */
  @Get('account/:accNumber/yearly-summary')
  @ApiOperation({
    summary: 'Get yearly transaction summary by account',
    description:
      'Yearly summary showing:\n' +
      '- Total deposits vs withdrawals\n' +
      '- Loan payments made\n' +
      '- Monthly breakdown\n' +
      '- Paginated transaction list',
  })
  @ApiParam({ name: 'accNumber', description: 'Account Number', type: String })
  @ApiQuery({ name: 'year', description: 'Year e.g. 2025', type: Number, required: true })
  @ApiResponse({ status: 200, description: 'Yearly summary retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  getAccountYearlySummary(
    @Param('accNumber') accNumber: string,
    @Query('year', ParseIntPipe) year: number,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.dashboardService.getAccountYearlySummary(accNumber, year, paginationDto);
  }

  /**
   * Get quick summary for account header
   */
  @Get('account/:accNumber/quick-summary')
  @ApiOperation({
    summary: 'Get quick summary for account header',
    description:
      'Lightweight endpoint for account header showing:\n' +
      '- Current balance\n' +
      '- Loan outstanding\n' +
      '- Savings balance\n' +
      '- 5 most recent transactions',
  })
  @ApiParam({ name: 'accNumber', description: 'Account Number', type: String })
  @ApiResponse({ status: 200, description: 'Quick summary retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  getAccountQuickSummary(@Param('accNumber') accNumber: string) {
    return this.dashboardService.getAccountQuickSummary(accNumber);
  }
}

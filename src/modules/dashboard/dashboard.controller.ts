import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard - Account Based')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

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
}

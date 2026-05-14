import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AccountsService } from './accounts.service';

@ApiTags('5. Accounts')
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get('user/:bankbookNumber/:vbCode')
  @ApiOperation({ summary: 'Get all accounts belonging to a bankbook number and village bank code' })
  @ApiParam({ name: 'bankbookNumber', description: 'Client bankbook number' })
  @ApiParam({ name: 'vbCode', description: 'Village bank code' })
  @ApiResponse({ status: 200, description: 'Accounts with owners for this bankbookNumber + vbCode' })
  findByUser(
    @Param('bankbookNumber') bankbookNumber: string,
    @Param('vbCode') vbCode: string,
  ) {
    return this.accountsService.findByUser(bankbookNumber, vbCode);
  }
}

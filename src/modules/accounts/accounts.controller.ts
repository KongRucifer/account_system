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

  @Get('user/:clientId')
  @ApiOperation({ summary: 'Get all accounts belonging to a client' })
  @ApiParam({ name: 'clientId', description: 'Client UUID' })
  @ApiResponse({ status: 200, description: 'Client accounts with branch details' })
  findByUser(@Param('clientId') clientId: string) {
    return this.accountsService.findByUser(clientId);
  }
}

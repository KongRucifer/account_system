import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VillageDataService } from './village-data.service';
import { VbCodeQueryDto, AccountOwnerQueryDto } from './dto/vbcode-query.dto';
import { UpdateSavingsDto } from './dto/update-savings.dto';

@ApiTags('Village Data (offline app)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('village-data')
export class VillageDataController {
  constructor(private readonly villageDataService: VillageDataService) {}

  @Get('vbcodes')
  @ApiOperation({ summary: 'List village banks (vbcode) — paginated, searchable by code or name' })
  @ApiResponse({ status: 200, description: 'VbCodes fetched successfully' })
  listVbCodes(@Query() query: VbCodeQueryDto) {
    return this.villageDataService.listVbCodes(query);
  }

  @Get('vbcodes/:vbCode')
  @ApiOperation({ summary: 'Get a single village bank (vbcode) detail' })
  @ApiParam({ name: 'vbCode', description: 'Village bank code', example: '0101001' })
  @ApiResponse({ status: 200, description: 'VbCode detail' })
  @ApiResponse({ status: 404, description: 'VbCode not found' })
  getVbCode(@Param('vbCode') vbCode: string) {
    return this.villageDataService.getVbCode(vbCode);
  }

  @Get('account-owners')
  @ApiOperation({
    summary: 'List account owners — filter by vbCode (+ optional bankbookNumber). Shows client name, not id.',
  })
  @ApiResponse({ status: 200, description: 'Account owners fetched successfully' })
  listAccountOwners(@Query() query: AccountOwnerQueryDto) {
    return this.villageDataService.listAccountOwners(query);
  }

  @Patch('accounts/:accNumber/savings')
  @ApiOperation({
    summary: 'Edit the savings (deposit) balance of an account',
    description:
      'Write path used by the offline app: the app queues edits locally while offline and ' +
      'pushes them here once it is back online.',
  })
  @ApiParam({ name: 'accNumber', description: 'Account number', example: '010100100000001' })
  @ApiResponse({ status: 200, description: 'Savings balance updated' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  updateSavings(@Param('accNumber') accNumber: string, @Body() dto: UpdateSavingsDto) {
    return this.villageDataService.updateSavings(accNumber, dto);
  }

  @Get('sync')
  @ApiOperation({
    summary: 'Sync snapshot — full dataset (vbcodes + account owners) for offline SQLite caching',
    description:
      'Pull this when the device is online to mirror data into SQLite. Pass `since` (ISO timestamp ' +
      'from a previous sync) to fetch only rows changed after that time.',
  })
  @ApiQuery({ name: 'since', required: false, description: 'ISO timestamp of the last successful sync' })
  @ApiResponse({ status: 200, description: 'Sync snapshot' })
  getSync(@Query('since') since?: string) {
    return this.villageDataService.getSyncSnapshot(since);
  }
}

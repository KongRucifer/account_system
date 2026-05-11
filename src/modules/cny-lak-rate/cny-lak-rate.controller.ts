import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CnyLakRateService } from './cny-lak-rate.service';

@ApiTags('7. CNY/LAK Exchange Rates')
@Controller('cny-lak-rate')
export class CnyLakRateController {
  constructor(private readonly cnyLakRateService: CnyLakRateService) {}

  @Get()
  @ApiOperation({ summary: 'Get all CNY/LAK exchange rates sorted by date (newest first)' })
  @ApiResponse({ status: 200, description: 'List of exchange rates with branch info' })
  findAll() {
    return this.cnyLakRateService.findAll();
  }

  @Get('branch/:vbCode')
  @ApiOperation({ summary: 'Get exchange rates by branch code' })
  @ApiParam({ name: 'vbCode', type: String, description: 'Branch (Vbcode) Code' })
  @ApiResponse({ status: 200, description: 'Exchange rates for the specified branch' })
  findByBranch(@Param('vbCode') vbCode: string) {
    return this.cnyLakRateService.findByBranch(vbCode);
  }
}

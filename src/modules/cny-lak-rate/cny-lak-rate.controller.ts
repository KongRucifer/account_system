import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CnyLakRateService } from './cny-lak-rate.service';

@ApiTags('7. CNY/LAK Exchange Rates')
@ApiBearerAuth('JWT-auth')
@Controller('cny-lak-rate')
export class CnyLakRateController {
  constructor(private readonly cnyLakRateService: CnyLakRateService) {}

  @Get()
  @ApiOperation({ summary: 'Get all CNY/LAK exchange rates sorted by date (newest first)' })
  @ApiResponse({ status: 200, description: 'List of exchange rates with branch info' })
  findAll() {
    return this.cnyLakRateService.findAll();
  }

  @Get('branch/:vbcodeId')
  @ApiOperation({ summary: 'Get exchange rates by branch ID' })
  @ApiParam({ name: 'vbcodeId', type: Number, description: 'Branch (Vbcode) ID' })
  @ApiResponse({ status: 200, description: 'Exchange rates for the specified branch' })
  findByBranch(@Param('vbcodeId', ParseIntPipe) vbcodeId: number) {
    return this.cnyLakRateService.findByBranch(vbcodeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific exchange rate record by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Rate ID' })
  @ApiResponse({ status: 200, description: 'Exchange rate detail' })
  @ApiResponse({ status: 404, description: 'Rate not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.cnyLakRateService.findOne(id);
  }
}

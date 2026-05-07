import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VbcodeService } from './vbcode.service';

@ApiTags('6. Vbcode (Branches)')
@ApiBearerAuth('JWT-auth')
@Controller('vbcode')
export class VbcodeController {
  constructor(private readonly vbcodeService: VbcodeService) {}

  @Get()
  @ApiOperation({ summary: 'Get all branches with account and exchange rate counts' })
  @ApiResponse({ status: 200, description: 'List of branches' })
  findAll() {
    return this.vbcodeService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get branch by ID — includes accounts and 10 most recent exchange rates' })
  @ApiParam({ name: 'id', type: Number, description: 'Branch ID' })
  @ApiResponse({ status: 200, description: 'Branch detail with accounts and rates' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vbcodeService.findOne(id);
  }
}

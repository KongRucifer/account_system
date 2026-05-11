import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VbcodeService } from './vbcode.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('6. Vbcode (Branches)')
@Controller('vbcode')
export class VbcodeController {
  constructor(private readonly vbcodeService: VbcodeService) {}

  @Get()
  @ApiOperation({ summary: 'Get all branches with accounts and exchange rates (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated list of branches with metadata' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.vbcodeService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get branch by ID — includes accounts and 10 most recent exchange rates' })
  @ApiParam({ name: 'id', type: String, description: 'Branch Code (VB Code)' })
  @ApiResponse({ status: 200, description: 'Branch detail with accounts and rates' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  findOne(@Param('id') id: string) {
    return this.vbcodeService.findOne(id);
  }
}

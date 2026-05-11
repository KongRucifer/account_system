import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SystemUserService } from './system-user.service';

@ApiTags('2. Clients')
@Controller('clients')
export class SystemUserController {
  constructor(private readonly systemUserService: SystemUserService) {}

  @Get()
  @ApiOperation({ summary: 'Get all clients' })
  @ApiResponse({ status: 200, description: 'List of clients' })
  findAll() {
    return this.systemUserService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client by ID — includes linked accounts' })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  @ApiResponse({ status: 200, description: 'Full client detail with accounts' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  findOne(@Param('id') id: string) {
    return this.systemUserService.findOne(id);
  }
}

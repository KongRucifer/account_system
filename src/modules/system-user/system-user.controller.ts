import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SystemUserService } from './system-user.service';

@ApiTags('2. System Users')
@Controller('system-user')
export class SystemUserController {
  constructor(private readonly systemUserService: SystemUserService) {}

  @Get()
  @ApiOperation({ summary: 'Get all system users with their roles' })
  @ApiResponse({ status: 200, description: 'List of users with role info' })
  findAll() {
    return this.systemUserService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID — includes role, permissions, and linked accounts' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'Full user detail with role and accounts' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.systemUserService.findOne(parseInt(id, 10));
  }
}

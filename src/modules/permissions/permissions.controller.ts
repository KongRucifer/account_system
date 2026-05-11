import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';

@ApiTags('4. Permissions')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all permissions with role assignment counts' })
  @ApiResponse({ status: 200, description: 'List of permissions' })
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get permission by ID — shows all roles that have this permission' })
  @ApiParam({ name: 'id', type: Number, description: 'Permission ID' })
  @ApiResponse({ status: 200, description: 'Permission details with assigned roles' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.findOne(id);
  }
}

import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesService } from './roles.service';

@ApiTags('3. Roles')
@ApiBearerAuth('JWT-auth')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all roles with their permissions' })
  @ApiResponse({ status: 200, description: 'List of roles' })
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get role by ID — includes permissions and assigned users' })
  @ApiParam({ name: 'id', type: Number, description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'Role details with permissions and users' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findOne(id);
  }
}

import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@aurora/shared';

import { Authorize } from '../../common/decorators/authorize.decorator';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@ApiTags('Roles')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Authorize(PERMISSIONS.ROLES_VIEW)
  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  @Authorize(PERMISSIONS.ROLES_VIEW)
  @Get('permissions')
  findPermissions() {
    return this.rolesService.listPermissions();
  }

  @Authorize(PERMISSIONS.ROLES_MANAGE)
  @Post()
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Authorize(PERMISSIONS.ROLES_MANAGE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto);
  }

  @Authorize(PERMISSIONS.ROLES_MANAGE)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}

import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service.js';
import { CreateRoleDto, AssignRoleDto } from './dto/role.dto.js';
import { RequirePermissions } from '../../common/decorators/permissions.decorator.js';
import { Permission } from '../../common/types/permissions.types.js';
import { LogAudit } from '../../common/decorators/audit.decorator.js';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions(Permission.ADMINS_VIEW)
  async getAllRoles() {
    return this.rolesService.findAll();
  }

  @Post('create')
  @LogAudit({ action: 'role.create', resource: 'roles' })
  @RequirePermissions(Permission.ROLES_MANAGE)
  async create(@Body() dto: CreateRoleDto) {
    return this.rolesService.createRole(dto);
  }

  @Post('assign')
  @LogAudit({ action: 'role.assign', resource: 'roles' })
  @RequirePermissions(Permission.ADMINS_MANAGE)
  async assign(@Body() dto: AssignRoleDto) {
    return this.rolesService.assignRoleToAdmin(dto.adminId, dto.roleValue);
  }
}

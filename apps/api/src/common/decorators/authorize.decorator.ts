import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import type { PermissionCode } from '@aurora/shared';

import { RequirePermissions } from './permissions.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';

export function Authorize(...permissions: PermissionCode[]) {
  return applyDecorators(ApiBearerAuth(), UseGuards(JwtAuthGuard, PermissionsGuard), RequirePermissions(...permissions));
}

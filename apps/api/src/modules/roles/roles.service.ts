import type { PermissionCode, PermissionDefinition, RoleSummary } from '@aurora/shared';
import { BadRequestException, ConflictException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';

import { ALL_PERMISSION_CODES, PERMISSION_DEFINITIONS, SYSTEM_ROLE_TEMPLATES } from '../../common/auth/permissions';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureSystemRoles();
  }

  async ensurePermissionCatalog() {
    for (const permission of PERMISSION_DEFINITIONS) {
      await this.prisma.permission.upsert({
        where: { code: permission.code },
        update: {
          name: permission.name,
          description: permission.description,
          group: permission.group,
        },
        create: permission,
      });
    }
  }

  async ensureSystemRoles() {
    await this.ensurePermissionCatalog();

    for (const template of SYSTEM_ROLE_TEMPLATES) {
      let role = await this.prisma.role.findUnique({
        where: { code: template.code },
        select: { id: true, name: true, description: true, isSystem: true },
      });

      if (!role) {
        role = await this.prisma.role.create({
          data: {
            code: template.code,
            name: template.name,
            description: template.description,
            isSystem: template.isSystem,
          },
          select: { id: true, name: true, description: true, isSystem: true },
        });
      } else if (
        role.name !== template.name ||
        role.description !== template.description ||
        role.isSystem !== template.isSystem
      ) {
        role = await this.prisma.role.update({
          where: { id: role.id },
          data: {
            name: template.name,
            description: template.description,
            isSystem: template.isSystem,
          },
          select: { id: true, name: true, description: true, isSystem: true },
        });
      }

      const permissions = await this.prisma.permission.findMany({
        where: { code: { in: template.permissions } },
        select: { id: true },
      });

      await this.prisma.rolePermission.deleteMany({ where: { roleId: role.id } });

      if (permissions.length > 0) {
        await this.prisma.rolePermission.createMany({
          data: permissions.map((permission) => ({
            roleId: role.id,
            permissionId: permission.id,
          })),
          skipDuplicates: true,
        });
      }
    }
  }

  listPermissions(): PermissionDefinition[] {
    return PERMISSION_DEFINITIONS;
  }

  private serializeRole(role: {
    id: string;
    code: string;
    name: string;
    description: string;
    isSystem: boolean;
    createdAt: Date;
    updatedAt: Date;
    permissions: Array<{
      permission: {
        code: string;
        name: string;
        description: string;
        group: string;
      };
    }>;
    _count?: {
      users: number;
    };
  }): RoleSummary {
    return {
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
      userCount: role._count?.users,
      permissions: role.permissions
        .map((item) => ({
          code: item.permission.code as PermissionCode,
          name: item.permission.name,
          description: item.permission.description,
          group: item.permission.group as PermissionDefinition['group'],
        }))
        .sort((left, right) => left.code.localeCompare(right.code)),
    };
  }

  async findAll() {
    const roles = await this.prisma.role.findMany({
      orderBy: [{ isSystem: 'desc' }, { createdAt: 'asc' }],
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    return roles.map((role) => this.serializeRole(role));
  }

  async findRoleEntityByCode(code: string) {
    const role = await this.prisma.role.findUnique({ where: { code } });
    if (!role) {
      throw new NotFoundException('角色不存在');
    }
    return role;
  }

  async findRoleEntityById(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException('角色不存在');
    }
    return role;
  }

  async getRolesByIds(ids: string[]) {
    if (ids.length === 0) {
      return [];
    }

    const roles = await this.prisma.role.findMany({
      where: { id: { in: ids } },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (roles.length !== ids.length) {
      throw new BadRequestException('存在无效的角色');
    }

    return roles;
  }

  private async syncRolePermissions(roleId: string, permissionCodes: PermissionCode[]) {
    const codes = [...new Set(permissionCodes)];
    const invalid = codes.filter((code) => !ALL_PERMISSION_CODES.includes(code));
    if (invalid.length > 0) {
      throw new BadRequestException(`存在无效权限: ${invalid.join(', ')}`);
    }

    const permissions = await this.prisma.permission.findMany({
      where: { code: { in: codes } },
      select: { id: true },
    });

    await this.prisma.rolePermission.deleteMany({ where: { roleId } });
    if (permissions.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: permissions.map((permission) => ({
          roleId,
          permissionId: permission.id,
        })),
        skipDuplicates: true,
      });
    }
  }

  private async loadSerializedRole(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    return this.serializeRole(role);
  }

  async create(dto: CreateRoleDto) {
    const code = dto.code.trim().toLowerCase();
    const exists = await this.prisma.role.findUnique({ where: { code } });
    if (exists) {
      throw new ConflictException('角色编码已存在');
    }

    const role = await this.prisma.role.create({
      data: {
        code,
        name: dto.name.trim(),
        description: dto.description?.trim() ?? '',
      },
    });

    await this.syncRolePermissions(role.id, dto.permissions ?? []);
    return this.loadSerializedRole(role.id);
  }

  async update(id: string, dto: UpdateRoleDto) {
    const current = await this.findRoleEntityById(id);

    if (dto.code) {
      const nextCode = dto.code.trim().toLowerCase();
      const exists = await this.prisma.role.findUnique({ where: { code: nextCode } });
      if (exists && exists.id !== id) {
        throw new ConflictException('角色编码已存在');
      }
    }

    if (current.code === 'super-admin' && dto.permissions) {
      await this.prisma.role.update({
        where: { id },
        data: {
          name: dto.name?.trim() ?? current.name,
          description: dto.description?.trim() ?? current.description,
        },
      });

      await this.syncRolePermissions(id, [...ALL_PERMISSION_CODES]);
      return this.loadSerializedRole(id);
    }

    await this.prisma.role.update({
      where: { id },
      data: {
        code: dto.code ? dto.code.trim().toLowerCase() : undefined,
        name: dto.name?.trim(),
        description: dto.description?.trim(),
      },
    });

    if (dto.permissions) {
      await this.syncRolePermissions(id, dto.permissions);
    }

    return this.loadSerializedRole(id);
  }

  async remove(id: string) {
    const current = await this.findRoleEntityById(id);
    if (current.isSystem) {
      throw new BadRequestException('系统角色不允许删除');
    }

    const userCount = await this.prisma.userRole.count({ where: { roleId: id } });
    if (userCount > 0) {
      throw new BadRequestException('该角色仍有用户使用，无法删除');
    }

    await this.prisma.role.delete({ where: { id } });
    return { success: true };
  }
}

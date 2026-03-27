import { buildDefaultUserAvatar, type AuthUser, type PermissionCode, type RoleSummary, type UserSummary } from '@aurora/shared';
import { BadRequestException, ConflictException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { PrismaService } from '../prisma/prisma.service';
import { RolesService } from '../roles/roles.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const PROTECTED_ADMIN_EMAILS = ['admin@aurora.local'];
const SUPER_ADMIN_ROLE_CODE = 'super-admin';

type UserWithRoles = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  avatar: string | null;
  jobTitle: string;
  phone: string;
  location: string;
  website: string;
  bio: string;
  status: UserStatus;
  passwordUpdatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  roles: Array<{
    role: {
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
    };
  }>;
};

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rolesService: RolesService,
  ) {}

  private readonly userInclude = {
    roles: {
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    },
  } as const;

  private isProtectedUser(email: string) {
    return PROTECTED_ADMIN_EMAILS.includes(email.toLowerCase());
  }

  private normalizeText(value?: string | null) {
    return value?.trim() ?? '';
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private buildAvatar(name: string, email: string, avatar?: string | null) {
    const manualAvatar = this.normalizeText(avatar);
    return manualAvatar || buildDefaultUserAvatar(name, email);
  }

  private isAutoAvatar(avatar: string | null, name: string, email: string) {
    return !avatar || avatar === buildDefaultUserAvatar(name, email);
  }

  private serializeRole(role: UserWithRoles['roles'][number]['role']): RoleSummary {
    return {
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
      permissions: role.permissions
        .map((item) => ({
          code: item.permission.code as PermissionCode,
          name: item.permission.name,
          description: item.permission.description,
          group: item.permission.group as RoleSummary['permissions'][number]['group'],
        }))
        .sort((left, right) => left.code.localeCompare(right.code)),
    };
  }

  private serializeUser(user: UserWithRoles): UserSummary {
    const roles = user.roles.map((item) => this.serializeRole(item.role));
    const permissions = [...new Set(roles.flatMap((role) => role.permissions.map((permission) => permission.code)))].sort();

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      jobTitle: user.jobTitle,
      phone: user.phone,
      location: user.location,
      website: user.website,
      bio: user.bio,
      status: user.status,
      passwordUpdatedAt: user.passwordUpdatedAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      roles,
      permissions,
    };
  }

  private toAuthUser(user: UserWithRoles): AuthUser {
    const serialized = this.serializeUser(user);
    return {
      id: serialized.id,
      email: serialized.email,
      name: serialized.name,
      avatar: serialized.avatar,
      jobTitle: serialized.jobTitle,
      phone: serialized.phone,
      location: serialized.location,
      website: serialized.website,
      bio: serialized.bio,
      status: serialized.status,
      roles: serialized.roles,
      permissions: serialized.permissions,
    };
  }

  async onModuleInit() {
    await this.rolesService.ensureSystemRoles();

    for (const email of PROTECTED_ADMIN_EMAILS) {
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (user) {
        await this.ensureDefaultAdminRole(user.id);
      }
    }
  }

  async ensureDefaultAdminRole(userId: string) {
    await this.rolesService.ensureSystemRoles();
    const superAdminRole = await this.rolesService.findRoleEntityByCode(SUPER_ADMIN_ROLE_CODE);

    await this.prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId,
          roleId: superAdminRole.id,
        },
      },
      update: {},
      create: {
        userId,
        roleId: superAdminRole.id,
      },
    });
  }

  async findAll() {
    await this.rolesService.ensureSystemRoles();
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: this.userInclude,
    });

    return users.map((user) => this.serializeUser(user));
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: this.userInclude,
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: this.userInclude,
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  async findProfileById(id: string) {
    const user = await this.findById(id);
    return this.serializeUser(user);
  }

  async findAuthUserById(id: string) {
    const user = await this.findById(id);
    return this.toAuthUser(user);
  }

  async findAuthUserByEmail(email: string) {
    const user = await this.findByEmail(email);
    if (!user) {
      return null;
    }

    return this.toAuthUser(user);
  }

  private async validateRoleAssignment(roleIds: string[] | undefined, currentEmail?: string) {
    const ids = [...new Set(roleIds ?? [])];
    if (ids.length === 0) {
      throw new BadRequestException('至少分配一个角色');
    }

    const roles = await this.rolesService.getRolesByIds(ids);
    const hasSuperAdminRole = roles.some((role) => role.code === SUPER_ADMIN_ROLE_CODE);

    if (currentEmail && this.isProtectedUser(currentEmail) && !hasSuperAdminRole) {
      throw new BadRequestException('默认管理员必须保留超级管理员角色');
    }

    return roles;
  }

  private async countOtherSuperAdmins(userId: string) {
    return this.prisma.user.count({
      where: {
        id: { not: userId },
        status: UserStatus.ACTIVE,
        roles: {
          some: {
            role: {
              code: SUPER_ADMIN_ROLE_CODE,
            },
          },
        },
      },
    });
  }

  private async syncUserRoles(userId: string, roleIds: string[]) {
    await this.prisma.userRole.deleteMany({ where: { userId } });
    await this.prisma.userRole.createMany({
      data: roleIds.map((roleId) => ({ userId, roleId })),
      skipDuplicates: true,
    });
  }

  async create(dto: CreateUserDto) {
    await this.rolesService.ensureSystemRoles();

    const nextName = dto.name.trim();
    const nextEmail = this.normalizeEmail(dto.email);
    const exists = await this.findByEmail(nextEmail);
    if (exists) {
      throw new ConflictException('该邮箱已被使用');
    }

    const roles = await this.validateRoleAssignment(dto.roleIds);
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: nextName,
        email: nextEmail,
        avatar: this.buildAvatar(nextName, nextEmail, dto.avatar),
        jobTitle: this.normalizeText(dto.jobTitle),
        phone: this.normalizeText(dto.phone),
        location: this.normalizeText(dto.location),
        website: this.normalizeText(dto.website),
        bio: this.normalizeText(dto.bio),
        passwordHash,
        passwordUpdatedAt: new Date(),
        roles: {
          create: roles.map((role) => ({
            roleId: role.id,
          })),
        },
      },
      include: this.userInclude,
    });

    return this.serializeUser(user);
  }

  async update(id: string, dto: UpdateUserDto) {
    const currentUser = await this.findById(id);
    const nextName = dto.name?.trim() || currentUser.name;
    const nextEmail = dto.email ? this.normalizeEmail(dto.email) : currentUser.email;

    if (dto.email) {
      const exists = await this.findByEmail(nextEmail);
      if (exists && exists.id !== id) {
        throw new ConflictException('该邮箱已被使用');
      }
    }

    if (this.isProtectedUser(currentUser.email) && dto.email && nextEmail !== currentUser.email) {
      throw new BadRequestException('默认管理员邮箱不允许修改');
    }

    if (dto.roleIds) {
      const roles = await this.validateRoleAssignment(dto.roleIds, currentUser.email);
      const keepsSuperAdmin = roles.some((role) => role.code === SUPER_ADMIN_ROLE_CODE);

      if (!keepsSuperAdmin) {
        const otherSuperAdmins = await this.countOtherSuperAdmins(id);
        if (otherSuperAdmins === 0) {
          throw new BadRequestException('至少保留一个有效的超级管理员');
        }
      }
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        email: dto.email ? this.normalizeEmail(dto.email) : undefined,
        avatar:
          dto.avatar !== undefined || this.isAutoAvatar(currentUser.avatar, currentUser.name, currentUser.email)
            ? this.buildAvatar(nextName, nextEmail, dto.avatar ?? currentUser.avatar)
            : undefined,
        jobTitle: dto.jobTitle !== undefined ? this.normalizeText(dto.jobTitle) : undefined,
        phone: dto.phone !== undefined ? this.normalizeText(dto.phone) : undefined,
        location: dto.location !== undefined ? this.normalizeText(dto.location) : undefined,
        website: dto.website !== undefined ? this.normalizeText(dto.website) : undefined,
        bio: dto.bio !== undefined ? this.normalizeText(dto.bio) : undefined,
      },
    });

    if (dto.roleIds) {
      await this.syncUserRoles(id, dto.roleIds);
    }

    const user = await this.findById(id);
    return this.serializeUser(user);
  }

  async updateProfile(id: string, dto: UpdateUserDto) {
    const currentUser = await this.findById(id);
    const nextName = dto.name?.trim() || currentUser.name;

    await this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        avatar:
          dto.avatar !== undefined || this.isAutoAvatar(currentUser.avatar, currentUser.name, currentUser.email)
            ? this.buildAvatar(nextName, currentUser.email, dto.avatar ?? currentUser.avatar)
            : undefined,
        jobTitle: dto.jobTitle !== undefined ? this.normalizeText(dto.jobTitle) : undefined,
        phone: dto.phone !== undefined ? this.normalizeText(dto.phone) : undefined,
        location: dto.location !== undefined ? this.normalizeText(dto.location) : undefined,
        website: dto.website !== undefined ? this.normalizeText(dto.website) : undefined,
        bio: dto.bio !== undefined ? this.normalizeText(dto.bio) : undefined,
      },
    });

    return this.findProfileById(id);
  }

  async updateStatus(id: string, status: 'ACTIVE' | 'BANNED') {
    const totalUsers = await this.prisma.user.count();
    const current = await this.findById(id);

    if (this.isProtectedUser(current.email) && status === 'BANNED') {
      throw new BadRequestException('默认管理员账户不允许封禁');
    }

    const hasSuperAdminRole = current.roles.some((item) => item.role.code === SUPER_ADMIN_ROLE_CODE);
    if (hasSuperAdminRole && status === 'BANNED') {
      const otherSuperAdmins = await this.countOtherSuperAdmins(id);
      if (otherSuperAdmins === 0) {
        throw new BadRequestException('至少保留一个有效的超级管理员');
      }
    }

    if (totalUsers === 1 && status === 'BANNED') {
      throw new BadRequestException('至少保留一个可用管理账户');
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: { status },
      include: this.userInclude,
    });

    return this.serializeUser(user);
  }

  async updatePassword(id: string, password: string) {
    await this.findById(id);
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        passwordUpdatedAt: new Date(),
      },
      include: this.userInclude,
    });

    return this.serializeUser(user);
  }

  async updateOwnPassword(id: string, currentPassword: string, password: string) {
    const user = await this.findById(id);
    const matched = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!matched) {
      throw new BadRequestException('当前密码不正确');
    }

    return this.updatePassword(id, password);
  }

  async remove(id: string) {
    const totalUsers = await this.prisma.user.count();
    const current = await this.findById(id);

    if (this.isProtectedUser(current.email)) {
      throw new BadRequestException('默认管理员账户不允许删除');
    }

    const hasSuperAdminRole = current.roles.some((item) => item.role.code === SUPER_ADMIN_ROLE_CODE);
    if (hasSuperAdminRole) {
      const otherSuperAdmins = await this.countOtherSuperAdmins(id);
      if (otherSuperAdmins === 0) {
        throw new BadRequestException('至少保留一个有效的超级管理员');
      }
    }

    if (totalUsers <= 1) {
      throw new BadRequestException('至少保留一个管理账户');
    }

    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }
}

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserStatus } from '@prisma/client';
import { buildDefaultUserAvatar } from '@aurora/shared';
import bcrypt from 'bcryptjs';
import { createHash, randomInt } from 'node:crypto';

import { NotificationsService } from '../notifications/notifications.service';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { RolesService } from '../roles/roles.service';
import { UsersService } from '../users/users.service';
import { AuthMailService } from './auth-mail.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestEmailCodeDto } from './dto/request-email-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

type AuthCodePurpose = 'register' | 'resetPassword';

const AUTH_CODE_EXPIRES_IN_MINUTES = 10;
const AUTH_CODE_RESEND_INTERVAL_SECONDS = 60;
const AUTH_CODE_HOURLY_LIMIT = 10;
const DEFAULT_SIGNUP_ROLE_CODE = 'editor';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly rolesService: RolesService,
    private readonly notificationsService: NotificationsService,
    private readonly operationLogsService: OperationLogsService,
    private readonly authMailService: AuthMailService,
    private readonly configService: ConfigService,
  ) {}

  async login(payload: LoginDto) {
    const user = await this.usersService.findByEmail(payload.email.trim().toLowerCase());

    if (!user) {
      throw new UnauthorizedException('账号或密码错误');
    }

    const matched = await bcrypt.compare(payload.password, user.passwordHash);
    if (!matched) {
      throw new UnauthorizedException('账号或密码错误');
    }

    this.assertUserCanSignIn(user.status);
    return this.buildAuthResponse(user.id);
  }

  async requestEmailCode(dto: RequestEmailCodeDto) {
    const email = dto.email.trim().toLowerCase();
    const purpose = dto.purpose as AuthCodePurpose;
    await this.assertEmailCodeCanBeSent(email, purpose);

    const now = new Date();
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const expiresAt = new Date(now.getTime() + AUTH_CODE_EXPIRES_IN_MINUTES * 60_000);

    await this.prisma.emailVerificationCode.updateMany({
      where: {
        email,
        purpose,
        usedAt: null,
      },
      data: {
        usedAt: now,
      },
    });

    await this.prisma.emailVerificationCode.create({
      data: {
        email,
        purpose,
        codeHash: this.buildCodeHash(email, purpose, code),
        expiresAt,
      },
    });

    const delivery = await this.authMailService.sendVerificationCode({
      email,
      code,
      purpose,
      expiresInMinutes: AUTH_CODE_EXPIRES_IN_MINUTES,
    });

    return {
      success: true,
      expiresInMinutes: AUTH_CODE_EXPIRES_IN_MINUTES,
      message: delivery.delivered ? '验证码已发送到邮箱' : '邮件服务未配置，已返回开发验证码',
      debugCode: delivery.debugCode,
    };
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    await this.consumeEmailCode(email, 'register', dto.code.trim());

    const exists = await this.usersService.findByEmail(email);
    if (exists) {
      throw new ConflictException('该邮箱已注册');
    }

    const signupRoleCode = this.configService.get<string>('AUTH_SIGNUP_ROLE_CODE', DEFAULT_SIGNUP_ROLE_CODE).trim();
    const role = await this.rolesService.findRoleEntityByCode(signupRoleCode || DEFAULT_SIGNUP_ROLE_CODE);
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const created = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email,
        avatar: buildDefaultUserAvatar(dto.name.trim(), email),
        passwordHash,
        passwordUpdatedAt: new Date(),
        roles: {
          create: [{ roleId: role.id }],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    await this.operationLogsService.create({
      action: 'auth.register',
      targetType: 'user',
      targetId: created.id,
      targetLabel: created.name,
      actorId: created.id,
      actorName: created.name,
      detail: {
        email: created.email,
        roleCode: signupRoleCode || DEFAULT_SIGNUP_ROLE_CODE,
      },
    });

    await this.notificationsService.create({
      title: '新用户已注册',
      content: `${created.name} 已完成后台注册。`,
      category: '用户',
      level: 'INFO',
      actorId: created.id,
      actorName: created.name,
      entityType: 'user',
      entityId: created.id,
      link: '/users',
      detail: {
        email: created.email,
      },
    });

    return this.buildAuthResponse(created.id);
  }

  async resetPassword(dto: ResetPasswordDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('该邮箱尚未注册');
    }

    await this.consumeEmailCode(email, 'resetPassword', dto.code.trim());

    const passwordHash = await bcrypt.hash(dto.password, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordUpdatedAt: new Date(),
      },
    });

    await this.operationLogsService.create({
      action: 'auth.resetPassword',
      targetType: 'user',
      targetId: user.id,
      targetLabel: user.name,
      actorId: user.id,
      actorName: user.name,
      detail: {
        email,
      },
    });

    await this.notificationsService.create({
      title: '密码已重置',
      content: `${user.name} 已通过邮箱验证码重置密码。`,
      category: '用户',
      level: 'WARNING',
      actorId: user.id,
      actorName: user.name,
      entityType: 'user',
      entityId: user.id,
      link: '/users',
      detail: {
        email,
      },
    });

    return {
      success: true,
    };
  }

  private assertUserCanSignIn(status: UserStatus) {
    if (status === UserStatus.BANNED) {
      throw new ForbiddenException('当前账号已被封禁，请联系管理员');
    }
  }

  private async buildAuthResponse(userId: string) {
    const authUser = await this.usersService.findAuthUserById(userId);
    return {
      token: await this.jwtService.signAsync({
        sub: authUser.id,
        email: authUser.email,
      }),
      user: authUser,
    };
  }

  private buildCodeHash(email: string, purpose: AuthCodePurpose, code: string) {
    const secret =
      this.configService.get<string>('AUTH_CODE_SECRET') ||
      this.configService.get<string>('JWT_SECRET', 'aurora_super_secret_jwt_key');

    return createHash('sha256').update(`${secret}:${purpose}:${email}:${code}`).digest('hex');
  }

  private async assertEmailCodeCanBeSent(email: string, purpose: AuthCodePurpose) {
    const user = await this.usersService.findByEmail(email);
    if (purpose === 'register' && user) {
      throw new ConflictException('该邮箱已注册');
    }

    if (purpose === 'resetPassword' && !user) {
      throw new NotFoundException('该邮箱尚未注册');
    }

    const latest = await this.prisma.emailVerificationCode.findFirst({
      where: { email, purpose },
      orderBy: { createdAt: 'desc' },
    });

    if (latest) {
      const elapsedSeconds = Math.floor((Date.now() - latest.createdAt.getTime()) / 1000);
      const waitSeconds = AUTH_CODE_RESEND_INTERVAL_SECONDS - elapsedSeconds;
      if (waitSeconds > 0) {
        throw new BadRequestException(`请 ${waitSeconds} 秒后再试`);
      }
    }

    const recentCount = await this.prisma.emailVerificationCode.count({
      where: {
        email,
        purpose,
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000),
        },
      },
    });

    if (recentCount >= AUTH_CODE_HOURLY_LIMIT) {
      throw new BadRequestException('发送过于频繁，请稍后再试');
    }
  }

  private async consumeEmailCode(email: string, purpose: AuthCodePurpose, code: string) {
    const record = await this.prisma.emailVerificationCode.findFirst({
      where: {
        email,
        purpose,
        codeHash: this.buildCodeHash(email, purpose, code),
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new BadRequestException('验证码无效或已过期');
    }

    await this.prisma.emailVerificationCode.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });
  }
}

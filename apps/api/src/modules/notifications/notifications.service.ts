import type { NotificationCenterSummary, NotificationItem, NotificationLevel, PaginatedResponse } from '@aurora/shared';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { buildPaginationMeta } from '../../common/utils/pagination';
import { PrismaService } from '../prisma/prisma.service';

type CreateNotificationInput = {
  title: string;
  content: string;
  category: string;
  level?: NotificationLevel;
  link?: string | null;
  actorId?: string | null;
  actorName?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  detail?: Record<string, unknown> | null;
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateNotificationInput) {
    const item = await this.prisma.notification.create({
      data: {
        title: input.title,
        content: input.content,
        category: input.category,
        level: input.level ?? 'INFO',
        link: input.link ?? null,
        actorId: input.actorId ?? null,
        actorName: input.actorName ?? '',
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        detail: (input.detail as Prisma.InputJsonValue | undefined) ?? undefined,
      },
    });

    return this.serialize(item);
  }

  async findAll(page = 1, pageSize = 12, unreadOnly = false): Promise<PaginatedResponse<NotificationItem>> {
    const where = unreadOnly ? { isRead: false } : undefined;
    const [total, items] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items: items.map((item) => this.serialize(item)),
      meta: buildPaginationMeta(page, pageSize, total),
    };
  }

  async getSummary(limit = 8): Promise<NotificationCenterSummary> {
    const [unreadCount, latest] = await Promise.all([
      this.prisma.notification.count({ where: { isRead: false } }),
      this.prisma.notification.findMany({
        orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
        take: limit,
      }),
    ]);

    return {
      unreadCount,
      latest: latest.map((item) => this.serialize(item)),
    };
  }

  async markRead(id: string) {
    const item = await this.prisma.notification.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('通知不存在');
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: item.readAt ?? new Date(),
      },
    });

    return this.serialize(updated);
  }

  async markAllRead() {
    await this.prisma.notification.updateMany({
      where: { isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return this.getSummary();
  }

  private serialize(item: {
    id: string;
    title: string;
    content: string;
    level: NotificationLevel;
    category: string;
    isRead: boolean;
    readAt: Date | null;
    link: string | null;
    actorName: string;
    entityType: string | null;
    entityId: string | null;
    detail: unknown;
    createdAt: Date;
  }): NotificationItem {
    return {
      id: item.id,
      title: item.title,
      content: item.content,
      level: item.level,
      category: item.category,
      isRead: item.isRead,
      readAt: item.readAt?.toISOString() ?? null,
      link: item.link,
      actorName: item.actorName,
      entityType: item.entityType,
      entityId: item.entityId,
      detail: (item.detail as Record<string, unknown> | null) ?? null,
      createdAt: item.createdAt.toISOString(),
    };
  }
}

import type { OperationLogEntry, PaginatedResponse } from '@aurora/shared';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { buildPaginationMeta } from '../../common/utils/pagination';
import { PrismaService } from '../prisma/prisma.service';

type CreateOperationLogInput = {
  action: string;
  targetType: string;
  targetId?: string | null;
  targetLabel?: string;
  actorId?: string | null;
  actorName?: string;
  detail?: Record<string, unknown> | null;
};

@Injectable()
export class OperationLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateOperationLogInput) {
    await this.prisma.operationLog.create({
      data: {
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId ?? null,
        targetLabel: input.targetLabel ?? '',
        actorId: input.actorId ?? null,
        actorName: input.actorName ?? '',
        detail: input.detail ? (input.detail as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });
  }

  async findAll(page = 1, pageSize = 20, keyword?: string): Promise<PaginatedResponse<OperationLogEntry>> {
    const where: Prisma.OperationLogWhereInput = keyword?.trim()
      ? {
          OR: [
            { action: { contains: keyword.trim(), mode: 'insensitive' } },
            { targetType: { contains: keyword.trim(), mode: 'insensitive' } },
            { targetLabel: { contains: keyword.trim(), mode: 'insensitive' } },
            { actorName: { contains: keyword.trim(), mode: 'insensitive' } },
          ],
        }
      : {};

    const [total, items] = await Promise.all([
      this.prisma.operationLog.count({ where }),
      this.prisma.operationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        action: item.action,
        targetType: item.targetType,
        targetId: item.targetId,
        targetLabel: item.targetLabel,
        actorId: item.actorId,
        actorName: item.actorName,
        detail: item.detail && typeof item.detail === 'object' ? (item.detail as Record<string, unknown>) : null,
        createdAt: item.createdAt.toISOString(),
      })),
      meta: buildPaginationMeta(page, pageSize, total),
    };
  }
}

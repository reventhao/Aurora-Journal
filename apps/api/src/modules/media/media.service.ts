import type { AuthUser, MediaFolderSummary } from '@aurora/shared';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { existsSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import sharp from 'sharp';

import { getAppBaseUrl, normalizeLocalAppUrl } from '../../common/utils/app-url';
import { buildPaginationMeta } from '../../common/utils/pagination';
import { slugify } from '../../common/utils/slugify';
import { NotificationsService } from '../notifications/notifications.service';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { RecycleBinService } from '../recycle-bin/recycle-bin.service';
import { CreateMediaFolderDto } from './dto/create-media-folder.dto';
import { UpdateMediaFolderDto } from './dto/update-media-folder.dto';
import { UpdateMediaMetaDto } from './dto/update-media-meta.dto';

type ExternalMediaSearchParams = {
  provider?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
};

type MediaListRow = {
  id: string;
  fileName: string;
  path: string;
  url: string;
  thumbUrl: string | null;
  mimeType: string;
  size: number;
  source: 'LOCAL' | 'PEXELS';
  folderId: string | null;
  groupName: string;
  folderName: string | null;
  tags: string[];
  altText: string;
  createdAt: Date;
  referenceCount: number;
  referencedPostTitles: string[];
};

@Injectable()
export class MediaService implements OnModuleInit {
  private readonly logger = new Logger(MediaService.name);
  private readonly thumbnailQueue = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly operationLogsService: OperationLogsService,
    private readonly notificationsService: NotificationsService,
    private readonly recycleBinService: RecycleBinService,
  ) {}

  onModuleInit() {
    void this.warmRecentThumbnails();
  }

  async findAll(page = 1, pageSize = 28, keyword?: string, referenced?: boolean, folderId?: string) {
    const whereSql = this.buildMediaWhereSql(keyword, referenced, folderId);
    const offset = (page - 1) * pageSize;

    const [countRows, items] = await Promise.all([
      this.prisma.$queryRaw<Array<{ total: bigint | number }>>(Prisma.sql`
        SELECT COUNT(*) AS total
        FROM "Media" m
        ${whereSql}
      `),
      this.prisma.$queryRaw<MediaListRow[]>(Prisma.sql`
        SELECT
          m.id,
          m."fileName" AS "fileName",
          m.path,
          m.url,
          m."thumbUrl" AS "thumbUrl",
          m."mimeType" AS "mimeType",
          m.size,
          m.source,
          m."folderId" AS "folderId",
          m."groupName" AS "groupName",
          f.name AS "folderName",
          m.tags,
          m."altText" AS "altText",
          m."createdAt" AS "createdAt",
          COALESCE(ref."referenceCount", 0)::int AS "referenceCount",
          COALESCE(ref."referencedPostTitles", ARRAY[]::text[]) AS "referencedPostTitles"
        FROM "Media" m
        LEFT JOIN "MediaFolder" f ON f.id = m."folderId"
        LEFT JOIN LATERAL (
          SELECT
            COUNT(*)::int AS "referenceCount",
            ARRAY(
              SELECT DISTINCT p2.title
              FROM "Post" p2
              WHERE p2."coverImage" = m.url OR p2.content LIKE '%' || m.url || '%'
              ORDER BY p2.title
              LIMIT 3
            ) AS "referencedPostTitles"
          FROM "Post" p
          WHERE p."coverImage" = m.url OR p.content LIKE '%' || m.url || '%'
        ) ref ON true
        ${whereSql}
        ORDER BY m."createdAt" DESC
        LIMIT ${pageSize}
        OFFSET ${offset}
      `),
    ]);

    for (const item of items) {
      this.queueThumbnailGeneration(item.path);
    }

    const total = Number(countRows[0]?.total ?? 0);

    return {
      items: items.map((item) => this.serializeMedia(item)),
      meta: buildPaginationMeta(page, pageSize, total),
    };
  }

  async listFolders(): Promise<MediaFolderSummary[]> {
    await this.syncLegacyFolders();

    const items = await this.prisma.mediaFolder.findMany({
      orderBy: [{ name: 'asc' }],
      include: {
        _count: {
          select: {
            media: true,
          },
        },
      },
    });

    return items.map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: item.description,
      mediaCount: item._count.media,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));
  }

  async createFolder(dto: CreateMediaFolderDto, actor?: Pick<AuthUser, 'id' | 'name'> | null) {
    const name = dto.name.trim();
    const slug = (dto.slug?.trim() || slugify(name)).toLowerCase();
    const exists = await this.prisma.mediaFolder.findUnique({ where: { slug } });
    if (exists) {
      throw new ConflictException('文件夹标识已存在');
    }

    await this.prisma.mediaFolder.create({
      data: {
        name,
        slug,
        description: dto.description?.trim() || '',
      },
    });

    await this.operationLogsService.create({
      action: 'media.createFolder',
      targetType: 'mediaFolder',
      targetLabel: name,
      actorId: actor?.id,
      actorName: actor?.name,
    });

    return this.listFolders();
  }

  async updateFolder(id: string, dto: UpdateMediaFolderDto, actor?: Pick<AuthUser, 'id' | 'name'> | null) {
    const current = await this.prisma.mediaFolder.findUnique({ where: { id } });
    if (!current) {
      throw new NotFoundException('文件夹不存在');
    }

    const nextName = dto.name?.trim() || current.name;
    const nextSlug = (dto.slug?.trim() || (dto.name ? slugify(dto.name) : current.slug)).toLowerCase();
    const exists = await this.prisma.mediaFolder.findUnique({ where: { slug: nextSlug } });
    if (exists && exists.id !== id) {
      throw new ConflictException('文件夹标识已存在');
    }

    await this.prisma.mediaFolder.update({
      where: { id },
      data: {
        name: nextName,
        slug: nextSlug,
        description: dto.description?.trim() ?? current.description,
      },
    });

    await this.prisma.media.updateMany({
      where: { folderId: id },
      data: { groupName: nextName },
    });

    await this.operationLogsService.create({
      action: 'media.updateFolder',
      targetType: 'mediaFolder',
      targetId: id,
      targetLabel: nextName,
      actorId: actor?.id,
      actorName: actor?.name,
    });

    return this.listFolders();
  }

  async removeFolder(id: string, actor?: Pick<AuthUser, 'id' | 'name'> | null) {
    const current = await this.prisma.mediaFolder.findUnique({
      where: { id },
      include: { _count: { select: { media: true } } },
    });
    if (!current) {
      throw new NotFoundException('文件夹不存在');
    }
    if (current._count.media > 0) {
      throw new BadRequestException('该文件夹下仍有媒体，不能删除');
    }

    await this.prisma.mediaFolder.delete({ where: { id } });

    await this.operationLogsService.create({
      action: 'media.removeFolder',
      targetType: 'mediaFolder',
      targetId: id,
      targetLabel: current.name,
      actorId: actor?.id,
      actorName: actor?.name,
    });

    return this.listFolders();
  }

  async create(
    data: {
      fileName: string;
      path: string;
      url: string;
      thumbUrl?: string;
      mimeType: string;
      size: number;
      source?: 'LOCAL' | 'PEXELS';
    },
    actor?: Pick<AuthUser, 'id' | 'name'> | null,
  ) {
    const created = await this.prisma.media.create({
      data: {
        ...data,
        source: data.source || 'LOCAL',
      },
    });

    await this.ensureThumbnail(created.path);
    await this.operationLogsService.create({
      action: 'media.upload',
      targetType: 'media',
      targetId: created.id,
      targetLabel: created.fileName,
      actorId: actor?.id,
      actorName: actor?.name,
      detail: {
        source: created.source,
        mimeType: created.mimeType,
        size: created.size,
      },
    });

    await this.notificationsService.create({
      title: '媒体上传成功',
      content: `${created.fileName} 已加入媒体库。`,
      category: '媒体',
      level: 'SUCCESS',
      actorId: actor?.id,
      actorName: actor?.name,
      entityType: 'media',
      entityId: created.id,
      link: '/media',
    });

    return this.serializeMedia(created);
  }

  async createExternal(
    data: { fileName: string; url: string; provider: string; thumbUrl?: string },
    actor?: Pick<AuthUser, 'id' | 'name'> | null,
  ) {
    const created = await this.prisma.media.create({
      data: {
        fileName: data.fileName,
        path: `external:${data.provider}:${data.url}`,
        url: data.url,
        thumbUrl: data.thumbUrl,
        mimeType: 'image/jpeg',
        size: 0,
        source: 'PEXELS',
      },
    });

    await this.operationLogsService.create({
      action: 'media.importExternal',
      targetType: 'media',
      targetId: created.id,
      targetLabel: created.fileName,
      actorId: actor?.id,
      actorName: actor?.name,
      detail: {
        provider: data.provider,
        source: created.source,
      },
    });

    await this.notificationsService.create({
      title: 'Pexels 图片已导入',
      content: `${created.fileName} 已导入媒体库。`,
      category: '媒体',
      level: 'SUCCESS',
      actorId: actor?.id,
      actorName: actor?.name,
      entityType: 'media',
      entityId: created.id,
      link: '/media',
    });

    return this.serializeMedia(created);
  }

  async getAnalytics() {
    const list = await this.findAll(1, 200);
    const items = list.items;
    const totalSize = items.reduce((sum, item) => sum + item.size, 0);
    const referenced = items.filter((item) => (item.referenceCount ?? 0) > 0);
    const unreferenced = items.filter((item) => (item.referenceCount ?? 0) === 0);

    return {
      totals: {
        total: items.length,
        local: items.filter((item) => item.source === 'LOCAL').length,
        pexels: items.filter((item) => item.source === 'PEXELS').length,
        referenced: referenced.length,
        unreferenced: unreferenced.length,
        totalSize,
      },
      topReferenced: [...referenced]
        .sort((left, right) => (right.referenceCount ?? 0) - (left.referenceCount ?? 0))
        .slice(0, 10),
      unused: unreferenced.slice(0, 10),
      recent: items.slice(0, 12),
    };
  }

  async updateMeta(id: string, dto: UpdateMediaMetaDto, actor?: Pick<AuthUser, 'id' | 'name'> | null) {
    let groupName = dto.groupName?.trim() ?? undefined;
    let folderId: string | null | undefined = undefined;

    if (dto.folderId !== undefined) {
      folderId = dto.folderId ? dto.folderId.trim() : null;

      if (folderId) {
        const folder = await this.prisma.mediaFolder.findUnique({ where: { id: folderId } });
        if (!folder) {
          throw new NotFoundException('文件夹不存在');
        }
        groupName = folder.name;
      } else {
        groupName = '';
      }
    }

    const item = await this.prisma.media.update({
      where: { id },
      data: {
        folderId,
        groupName,
        altText: dto.altText?.trim() ?? undefined,
        tags: dto.tags ? Array.from(new Set(dto.tags.map((item) => item.trim()).filter(Boolean))) : undefined,
      },
    });

    await this.operationLogsService.create({
      action: 'media.updateMeta',
      targetType: 'media',
      targetId: item.id,
      targetLabel: item.fileName,
      actorId: actor?.id,
      actorName: actor?.name,
      detail: {
        groupName: item.groupName,
        tags: item.tags,
        altText: item.altText,
      },
    });

    return this.serializeMedia(item);
  }

  async searchExternal(params: ExternalMediaSearchParams) {
    const provider = params.provider || 'pexels';
    if (provider !== 'pexels') {
      throw new BadRequestException('当前仅支持 Pexels 图库接入');
    }

    const apiKey = this.configService.get<string>('PEXELS_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException('请先在环境变量中配置 PEXELS_API_KEY');
    }

    const hasKeyword = Boolean(params.keyword?.trim());
    const searchUrl = new URL(hasKeyword ? 'https://api.pexels.com/v1/search' : 'https://api.pexels.com/v1/curated');
    if (hasKeyword) {
      searchUrl.searchParams.set('query', params.keyword!.trim());
    }
    searchUrl.searchParams.set('page', String(params.page || 1));
    searchUrl.searchParams.set('per_page', String(params.pageSize || 18));

    const response = await fetch(searchUrl, {
      headers: {
        Authorization: apiKey,
      },
    });

    if (!response.ok) {
      throw new ServiceUnavailableException('Pexels 图库服务暂时不可用');
    }

    const data = (await response.json()) as {
      page: number;
      per_page: number;
      total_results: number;
      photos: Array<{
        id: number;
        width: number;
        height: number;
        alt: string;
        photographer: string;
        url: string;
        src: {
          medium: string;
          large: string;
          large2x?: string;
          landscape?: string;
          original: string;
        };
      }>;
    };

    return {
      provider: 'pexels',
      items: data.photos.map((photo) => ({
        id: `pexels-${photo.id}`,
        sourceId: String(photo.id),
        fileName: photo.alt || `pexels-${photo.id}.jpg`,
        title: photo.alt || 'Pexels 图片',
        thumbUrl: photo.src.large,
        previewUrl: photo.src.large2x || photo.src.large || photo.src.landscape || photo.src.medium,
        url: photo.src.original,
        photographer: photo.photographer,
        sourcePage: photo.url,
        width: photo.width,
        height: photo.height,
      })),
      meta: {
        page: data.page,
        pageSize: data.per_page,
        total: data.total_results,
        pageCount: Math.max(1, Math.ceil(data.total_results / data.per_page)),
      },
    };
  }

  async importExternal(
    payload: {
      provider?: string;
      fileName?: string;
      url: string;
      thumbUrl?: string;
    },
    actor?: Pick<AuthUser, 'id' | 'name'> | null,
  ) {
    const provider = payload.provider || 'pexels';
    const exists = await this.prisma.media.findFirst({
      where: {
        OR: [{ url: payload.url }, { path: `external:${provider}:${payload.url}` }],
      },
    });

    if (exists) {
      return this.serializeMedia(exists);
    }

    return this.createExternal(
      {
        provider,
        fileName: payload.fileName || `${provider}-${Date.now()}.jpg`,
        url: payload.url,
        thumbUrl: payload.thumbUrl,
      },
      actor,
    );
  }

  async remove(id: string, actor?: Pick<AuthUser, 'id' | 'name'> | null) {
    const item = await this.prisma.media.findUnique({ where: { id } });
    if (!item) {
      throw new BadRequestException('媒体不存在或已删除');
    }

    const referencedPosts = await this.prisma.post.findMany({
      where: {
        OR: [{ coverImage: item.url }, { content: { contains: item.url } }],
      },
      select: {
        title: true,
      },
      take: 5,
    });

    if (referencedPosts.length) {
      throw new BadRequestException(
        `该媒体仍被文章引用，暂不能删除：${referencedPosts.map((post) => `《${post.title}》`).join('、')}`,
      );
    }

    return this.recycleBinService.archiveMedia(id, actor);
  }

  private buildMediaWhereSql(keyword?: string, referenced?: boolean, folderId?: string) {
    const conditions: Prisma.Sql[] = [];

    if (keyword?.trim()) {
      conditions.push(Prisma.sql`m."fileName" ILIKE ${`%${keyword.trim()}%`}`);
    }

    if (folderId?.trim()) {
      conditions.push(Prisma.sql`m."folderId" = ${folderId.trim()}`);
    }

    if (referenced !== undefined) {
      const referenceSql = Prisma.sql`
        EXISTS (
          SELECT 1
          FROM "Post" p
          WHERE p."coverImage" = m.url OR p.content LIKE '%' || m.url || '%'
        )
      `;
      conditions.push(referenced ? referenceSql : Prisma.sql`NOT ${referenceSql}`);
    }

    if (!conditions.length) {
      return Prisma.empty;
    }

    const combined = conditions.slice(1).reduce((sql, condition) => Prisma.sql`${sql} AND ${condition}`, conditions[0]);
    return Prisma.sql`WHERE ${combined}`;
  }

  private serializeMedia(item: {
    id: string;
    fileName: string;
    path: string;
    url: string;
    thumbUrl?: string | null;
    mimeType: string;
    size: number;
    source?: 'LOCAL' | 'PEXELS';
    folderId?: string | null;
    groupName?: string;
    folderName?: string | null;
    tags?: string[];
    altText?: string;
    referenceCount?: number;
    referencedPostTitles?: string[];
    createdAt: Date;
  }) {
    const appBaseUrl = getAppBaseUrl(this.configService);
    const normalizedUrl = normalizeLocalAppUrl(item.url, appBaseUrl);

    return {
      id: item.id,
      fileName: item.fileName,
      url: normalizedUrl,
      thumbUrl: this.resolveThumbUrl(
        {
          path: item.path,
          url: normalizedUrl,
          thumbUrl: item.thumbUrl,
        },
        appBaseUrl,
      ),
      mimeType: item.mimeType,
      size: item.size,
      source: item.source,
      folderId: item.folderId ?? null,
      groupName: item.folderName || item.groupName,
      tags: item.tags,
      altText: item.altText,
      referenceCount: item.referenceCount ?? 0,
      referencedPostTitles: item.referencedPostTitles ?? [],
      createdAt: item.createdAt.toISOString(),
    };
  }

  private resolveThumbUrl(item: { path: string; url: string; thumbUrl?: string | null }, appBaseUrl: string) {
    if (item.path.startsWith('external:')) {
      return normalizeLocalAppUrl(item.thumbUrl || undefined, appBaseUrl) || undefined;
    }

    const thumbPath = this.buildThumbnailPath(item.path);
    if (!existsSync(thumbPath)) {
      return undefined;
    }

    const extension = extname(item.url);
    const baseUrl = extension ? item.url.slice(0, -extension.length) : item.url;
    return `${baseUrl}.thumb.webp`;
  }

  private buildThumbnailPath(sourcePath: string) {
    const fileName = basename(sourcePath, extname(sourcePath));
    return join(dirname(sourcePath), `${fileName}.thumb.webp`);
  }

  private queueThumbnailGeneration(sourcePath: string) {
    if (!sourcePath || sourcePath.startsWith('external:')) {
      return;
    }

    const targetPath = this.buildThumbnailPath(sourcePath);
    if (existsSync(targetPath) || this.thumbnailQueue.has(sourcePath)) {
      return;
    }

    this.thumbnailQueue.add(sourcePath);
    void this.ensureThumbnail(sourcePath)
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Thumbnail generation failed for ${sourcePath}: ${message}`);
      })
      .finally(() => {
        this.thumbnailQueue.delete(sourcePath);
      });
  }

  private async warmRecentThumbnails(limit = 120) {
    const items = await this.prisma.media.findMany({
      where: {
        NOT: {
          path: {
            startsWith: 'external:',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      select: {
        path: true,
      },
    });

    for (const item of items) {
      this.queueThumbnailGeneration(item.path);
    }
  }

  private async ensureThumbnail(sourcePath: string) {
    if (!sourcePath || sourcePath.startsWith('external:')) {
      return;
    }

    const targetPath = this.buildThumbnailPath(sourcePath);
    if (existsSync(targetPath)) {
      return;
    }

    await sharp(sourcePath)
      .rotate()
      .resize(320, 320, {
        fit: 'cover',
        position: 'centre',
        withoutEnlargement: true,
      })
      .webp({ quality: 72 })
      .toFile(targetPath);
  }

  private async syncLegacyFolders() {
    const legacyNames = (
      await this.prisma.media.findMany({
        where: {
          groupName: {
            not: '',
          },
          folderId: null,
        },
        select: {
          groupName: true,
        },
        distinct: ['groupName'],
      })
    )
      .map((item) => item.groupName.trim())
      .filter(Boolean);

    for (const name of legacyNames) {
      const slug = slugify(name).toLowerCase();
      let folder = await this.prisma.mediaFolder.findUnique({ where: { slug } });
      if (!folder) {
        folder = await this.prisma.mediaFolder.create({
          data: {
            name,
            slug,
          },
        });
      }

      await this.prisma.media.updateMany({
        where: {
          groupName: name,
          folderId: null,
        },
        data: {
          folderId: folder.id,
        },
      });
    }
  }
}

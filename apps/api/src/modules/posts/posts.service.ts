import type { AuthUser, PaginatedResponse, PostRevisionSummary } from '@aurora/shared';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostStatus, Prisma } from '@prisma/client';
import { marked } from 'marked';

import { getAppBaseUrl, normalizeLocalAppUrl, normalizeLocalAppUrlsInText } from '../../common/utils/app-url';
import { buildPaginationMeta } from '../../common/utils/pagination';
import { slugify } from '../../common/utils/slugify';
import { NotificationsService } from '../notifications/notifications.service';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { RecycleBinService } from '../recycle-bin/recycle-bin.service';
import { CreatePostDto } from './dto/create-post.dto';
import { RestorePostRevisionDto } from './dto/restore-post-revision.dto';
import { UpdatePostDto } from './dto/update-post.dto';

const postInclude = {
  category: true,
  tags: {
    include: {
      tag: true,
    },
  },
} satisfies Prisma.PostInclude;

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly operationLogsService: OperationLogsService,
    private readonly notificationsService: NotificationsService,
    private readonly recycleBinService: RecycleBinService,
  ) {}

  private toDate(value?: string | null) {
    if (!value?.trim()) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private buildRevisionSnapshot(input: {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImage: string;
    status: PostStatus;
    featured: boolean;
    seoTitle: string;
    seoDescription: string;
    categoryId: string | null;
    readingTime: number;
    scheduledPublishAt: Date | null;
    scheduledUnpublishAt: Date | null;
    tags: Array<{ tagId: string }>;
  }) {
    return {
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt,
      content: input.content,
      coverImage: input.coverImage,
      status: input.status,
      featured: input.featured,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      categoryId: input.categoryId,
      readingTime: input.readingTime,
      scheduledPublishAt: input.scheduledPublishAt?.toISOString() ?? null,
      scheduledUnpublishAt: input.scheduledUnpublishAt?.toISOString() ?? null,
      tagIds: input.tags.map((item) => item.tagId),
    };
  }

  private async createRevision(
    postId: string,
    actor?: Pick<AuthUser, 'id' | 'name'> | null,
    reason = '',
  ) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        tags: {
          select: {
            tagId: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    const lastRevision = await this.prisma.postRevision.findFirst({
      where: { postId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    await this.prisma.postRevision.create({
      data: {
        postId,
        version: (lastRevision?.version ?? 0) + 1,
        reason,
        snapshot: this.buildRevisionSnapshot(post) as Prisma.InputJsonValue,
        createdById: actor?.id ?? null,
      },
    });
  }

  private buildListWhere(filters: {
    keyword?: string;
    status?: 'DRAFT' | 'PUBLISHED';
    featured?: boolean;
    categoryId?: string;
    tagId?: string;
  }): Prisma.PostWhereInput {
    return {
      ...(filters.keyword
        ? {
            OR: [
              { title: { contains: filters.keyword, mode: 'insensitive' } },
              { excerpt: { contains: filters.keyword, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.featured === undefined ? {} : { featured: filters.featured } ),
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.tagId
        ? {
            tags: {
              some: {
                tagId: filters.tagId,
              },
            },
          }
        : {}),
    };
  }

  private calculateReadingTime(content: string) {
    const plainText = content.replace(/[#_*`>\-\n]/g, ' ');
    const words = plainText.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 220));
  }

  async findAll(
    page = 1,
    pageSize = 10,
    filters: {
      keyword?: string;
      status?: 'DRAFT' | 'PUBLISHED';
      featured?: boolean;
      categoryId?: string;
      tagId?: string;
    } = {},
  ): Promise<PaginatedResponse<unknown>> {
    const where = this.buildListWhere(filters);

    const [total, items] = await Promise.all([
      this.prisma.post.count({ where }),
      this.prisma.post.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
        include: postInclude,
      }),
    ]);

    return {
      items: items.map(this.serializePost),
      meta: buildPaginationMeta(page, pageSize, total),
    };
  }

  async findOne(id: string) {
    const item = await this.prisma.post.findUnique({
      where: { id },
      include: {
        ...postInclude,
        comments: {
          where: { approved: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return item ? this.serializePost(item) : null;
  }

  async create(dto: CreatePostDto, actor?: Pick<AuthUser, 'id' | 'name'> | null) {
    const readingTime = this.calculateReadingTime(dto.content);
    const item = await this.prisma.post.create({
      data: {
        title: dto.title,
        slug: dto.slug || slugify(dto.title),
        excerpt: dto.excerpt || '',
        content: dto.content,
        coverImage: dto.coverImage || '',
        status: dto.status || PostStatus.DRAFT,
        featured: dto.featured || false,
        seoTitle: dto.seoTitle || dto.title,
        seoDescription: dto.seoDescription || dto.excerpt || '',
        categoryId: dto.categoryId,
        readingTime,
        publishedAt: dto.status === 'PUBLISHED' ? new Date() : null,
        scheduledPublishAt: this.toDate(dto.scheduledPublishAt),
        scheduledUnpublishAt: this.toDate(dto.scheduledUnpublishAt),
        tags: dto.tagIds?.length
          ? {
              create: dto.tagIds.map((tagId) => ({
                tagId,
              })),
            }
          : undefined,
      },
      include: postInclude,
    });

    await this.createRevision(item.id, actor, '创建文章');
    await this.operationLogsService.create({
      action: 'posts.create',
      targetType: 'post',
      targetId: item.id,
      targetLabel: item.title,
      actorId: actor?.id,
      actorName: actor?.name,
      detail: {
        status: item.status,
        scheduledPublishAt: item.scheduledPublishAt?.toISOString() ?? null,
        scheduledUnpublishAt: item.scheduledUnpublishAt?.toISOString() ?? null,
      },
    });

    if (item.status === PostStatus.PUBLISHED) {
      await this.notificationsService.create({
        title: '文章已发布',
        content: `《${item.title}》已发布到前台。`,
        category: '文章',
        level: 'SUCCESS',
        actorId: actor?.id,
        actorName: actor?.name,
        entityType: 'post',
        entityId: item.id,
        link: '/posts',
      });
    }

    return this.serializePost(item);
  }

  async update(id: string, dto: UpdatePostDto, actor?: Pick<AuthUser, 'id' | 'name'> | null) {
    const readingTime = dto.content ? this.calculateReadingTime(dto.content) : undefined;

    await this.prisma.postTag.deleteMany({ where: { postId: id } });
    const item = await this.prisma.post.update({
      where: { id },
      data: {
        title: dto.title,
        slug: dto.slug || (dto.title ? slugify(dto.title) : undefined),
        excerpt: dto.excerpt,
        content: dto.content,
        coverImage: dto.coverImage,
        status: dto.status as PostStatus | undefined,
        featured: dto.featured,
        seoTitle: dto.seoTitle,
        seoDescription: dto.seoDescription,
        categoryId: dto.categoryId,
        readingTime,
        publishedAt: dto.status === 'PUBLISHED' ? new Date() : dto.status === 'DRAFT' ? null : undefined,
        scheduledPublishAt: dto.scheduledPublishAt !== undefined ? this.toDate(dto.scheduledPublishAt) : undefined,
        scheduledUnpublishAt: dto.scheduledUnpublishAt !== undefined ? this.toDate(dto.scheduledUnpublishAt) : undefined,
        tags: dto.tagIds?.length
          ? {
              create: dto.tagIds.map((tagId) => ({
                tagId,
              })),
            }
          : undefined,
      },
      include: postInclude,
    });

    await this.createRevision(id, actor, dto.revisionReason?.trim() || '更新文章');
    await this.operationLogsService.create({
      action: 'posts.update',
      targetType: 'post',
      targetId: item.id,
      targetLabel: item.title,
      actorId: actor?.id,
      actorName: actor?.name,
      detail: {
        status: item.status,
        scheduledPublishAt: item.scheduledPublishAt?.toISOString() ?? null,
        scheduledUnpublishAt: item.scheduledUnpublishAt?.toISOString() ?? null,
        reason: dto.revisionReason?.trim() || '',
      },
    });

    await this.notificationsService.create({
      title: '文章已更新',
      content: `《${item.title}》内容已更新。`,
      category: '文章',
      level: 'INFO',
      actorId: actor?.id,
      actorName: actor?.name,
      entityType: 'post',
      entityId: item.id,
      link: '/posts',
    });

    return this.serializePost(item);
  }

  async remove(id: string, actor?: Pick<AuthUser, 'id' | 'name'> | null) {
    return this.recycleBinService.archivePost(id, actor);
  }

  async toggleStatus(id: string, status: PostStatus, actor?: Pick<AuthUser, 'id' | 'name'> | null) {
    const item = await this.prisma.post.update({
      where: { id },
      data: {
        status,
        publishedAt: status === PostStatus.PUBLISHED ? new Date() : null,
      },
      include: postInclude,
    });

    await this.createRevision(id, actor, status === PostStatus.PUBLISHED ? '手动发布' : '手动下线');
    await this.operationLogsService.create({
      action: 'posts.toggleStatus',
      targetType: 'post',
      targetId: item.id,
      targetLabel: item.title,
      actorId: actor?.id,
      actorName: actor?.name,
      detail: { status },
    });

    await this.notificationsService.create({
      title: status === PostStatus.PUBLISHED ? '文章已上线' : '文章已下线',
      content: `《${item.title}》已${status === PostStatus.PUBLISHED ? '上线' : '下线'}。`,
      category: '文章',
      level: status === PostStatus.PUBLISHED ? 'SUCCESS' : 'INFO',
      actorId: actor?.id,
      actorName: actor?.name,
      entityType: 'post',
      entityId: item.id,
      link: '/posts',
    });

    return this.serializePost(item);
  }

  async toggleFeatured(id: string, featured: boolean, actor?: Pick<AuthUser, 'id' | 'name'> | null) {
    const item = await this.prisma.post.update({
      where: { id },
      data: { featured },
      include: postInclude,
    });

    await this.createRevision(id, actor, featured ? '设为精选' : '取消精选');
    await this.operationLogsService.create({
      action: 'posts.toggleFeatured',
      targetType: 'post',
      targetId: item.id,
      targetLabel: item.title,
      actorId: actor?.id,
      actorName: actor?.name,
      detail: { featured },
    });

    return this.serializePost(item);
  }

  async listRevisions(postId: string): Promise<PostRevisionSummary[]> {
    const revisions = await this.prisma.postRevision.findMany({
      where: { postId },
      orderBy: { version: 'desc' },
      include: {
        createdBy: {
          select: { name: true },
        },
      },
    });

    return revisions.map((item) => ({
      id: item.id,
      postId: item.postId,
      version: item.version,
      reason: item.reason,
      createdAt: item.createdAt.toISOString(),
      createdByName: item.createdBy?.name ?? null,
    }));
  }

  async restoreRevision(
    postId: string,
    revisionId: string,
    dto: RestorePostRevisionDto,
    actor?: Pick<AuthUser, 'id' | 'name'> | null,
  ) {
    const revision = await this.prisma.postRevision.findFirst({
      where: { id: revisionId, postId },
    });

    if (!revision) {
      throw new NotFoundException('修订版本不存在');
    }

    const snapshot = revision.snapshot as {
      title: string;
      slug: string;
      excerpt: string;
      content: string;
      coverImage: string;
      status: PostStatus;
      featured: boolean;
      seoTitle: string;
      seoDescription: string;
      categoryId: string | null;
      readingTime: number;
      scheduledPublishAt: string | null;
      scheduledUnpublishAt: string | null;
      tagIds: string[];
    };

    await this.prisma.postTag.deleteMany({ where: { postId } });
    const item = await this.prisma.post.update({
      where: { id: postId },
      data: {
        title: snapshot.title,
        slug: snapshot.slug,
        excerpt: snapshot.excerpt,
        content: snapshot.content,
        coverImage: snapshot.coverImage,
        status: snapshot.status,
        featured: snapshot.featured,
        seoTitle: snapshot.seoTitle,
        seoDescription: snapshot.seoDescription,
        categoryId: snapshot.categoryId,
        readingTime: snapshot.readingTime,
        scheduledPublishAt: this.toDate(snapshot.scheduledPublishAt),
        scheduledUnpublishAt: this.toDate(snapshot.scheduledUnpublishAt),
        publishedAt: snapshot.status === PostStatus.PUBLISHED ? new Date() : null,
        tags: snapshot.tagIds.length
          ? {
              create: snapshot.tagIds.map((tagId) => ({ tagId })),
            }
          : undefined,
      },
      include: postInclude,
    });

    await this.createRevision(postId, actor, dto.reason?.trim() || `恢复到版本 #${revision.version}`);
    await this.operationLogsService.create({
      action: 'posts.restoreRevision',
      targetType: 'post',
      targetId: item.id,
      targetLabel: item.title,
      actorId: actor?.id,
      actorName: actor?.name,
      detail: {
        revisionId,
        version: revision.version,
      },
    });

    return this.serializePost(item);
  }

  private serializePost = (post: Prisma.PostGetPayload<{ include: typeof postInclude }>) => {
    const appBaseUrl = getAppBaseUrl(this.configService);
    const normalizedContent = normalizeLocalAppUrlsInText(post.content, appBaseUrl);
    const normalizedCoverImage = normalizeLocalAppUrl(post.coverImage, appBaseUrl);

    return {
      ...post,
      content: normalizedContent,
      coverImage: normalizedCoverImage,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      publishedAt: post.publishedAt?.toISOString() ?? null,
      scheduledPublishAt: post.scheduledPublishAt?.toISOString() ?? null,
      scheduledUnpublishAt: post.scheduledUnpublishAt?.toISOString() ?? null,
      html: marked.parse(normalizedContent) as string,
      tags: post.tags.map((item) => item.tag),
    };
  };
}

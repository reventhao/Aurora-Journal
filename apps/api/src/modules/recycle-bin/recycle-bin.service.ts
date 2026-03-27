import type { AuthUser, PaginatedResponse, RecycleBinItem } from '@aurora/shared';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { buildPaginationMeta } from '../../common/utils/pagination';
import { NotificationsService } from '../notifications/notifications.service';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { PrismaService } from '../prisma/prisma.service';

type Actor = Pick<AuthUser, 'id' | 'name'> | null | undefined;
type RestorableEntityType = 'post' | 'comment' | 'media' | 'category' | 'tag';
type TransactionClient = Parameters<Parameters<PrismaService['$transaction']>[0]>[0];

@Injectable()
export class RecycleBinService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operationLogsService: OperationLogsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(
    page = 1,
    pageSize = 20,
    keyword?: string,
    entityType?: string,
  ): Promise<PaginatedResponse<RecycleBinItem>> {
    const where = {
      ...(entityType?.trim() ? { entityType } : {}),
      ...(keyword?.trim()
        ? {
            OR: [
              { title: { contains: keyword.trim(), mode: 'insensitive' as const } },
              { summary: { contains: keyword.trim(), mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.recycleBinItem.count({ where }),
      this.prisma.recycleBinItem.findMany({
        where,
        orderBy: { deletedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          entityType: true,
          entityId: true,
          title: true,
          summary: true,
          deletedByName: true,
          deletedAt: true,
          snapshot: true,
        },
      }),
    ]);

    const previewMap = await this.buildPreviewMap(items);

    return {
      items: items.map((item) => this.serialize(item, previewMap.get(item.id) ?? undefined)),
      meta: buildPaginationMeta(page, pageSize, total),
    };
  }

  async archivePost(id: string, actor?: Actor) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true,
              },
            },
          },
        },
        revisions: true,
        comments: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    const snapshot = {
      post,
      tagIds: post.tags.map((item) => item.tagId),
      tags: post.tags.map((item) => item.tag),
      revisions: post.revisions,
      comments: post.comments,
    };

    await this.prisma.$transaction(async (tx) => {
      await tx.recycleBinItem.upsert({
        where: {
          entityType_entityId: {
            entityType: 'post',
            entityId: post.id,
          },
        },
        update: {
          title: post.title,
          summary: this.buildPostSummary(post.status, snapshot.comments.length),
          snapshot,
          deletedById: actor?.id ?? null,
          deletedByName: actor?.name ?? '',
          deletedAt: new Date(),
        },
        create: {
          entityType: 'post',
          entityId: post.id,
          title: post.title,
          summary: this.buildPostSummary(post.status, snapshot.comments.length),
          snapshot,
          deletedById: actor?.id ?? null,
          deletedByName: actor?.name ?? '',
        },
      });

      await tx.post.delete({ where: { id } });
    });

    await this.operationLogsService.create({
      action: 'recycleBin.archivePost',
      targetType: 'post',
      targetId: post.id,
      targetLabel: post.title,
      actorId: actor?.id,
      actorName: actor?.name,
    });

    await this.notificationsService.create({
      title: '文章已移入内容回收站',
      content: `《${post.title}》已移入内容回收站，可稍后恢复。`,
      category: '内容回收站',
      level: 'WARNING',
      actorId: actor?.id,
      actorName: actor?.name,
      entityType: 'post',
      entityId: post.id,
      link: '/recycle-bin',
    });

    return { success: true };
  }

  async archiveComment(id: string, actor?: Actor) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        post: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    const descendants = await this.collectCommentTree(id);
    const snapshot = {
      comments: descendants,
      post: comment.post,
    };

    await this.prisma.$transaction(async (tx) => {
      await tx.recycleBinItem.upsert({
        where: {
          entityType_entityId: {
            entityType: 'comment',
            entityId: comment.id,
          },
        },
        update: {
          title: comment.author,
          summary: `来自《${comment.post.title}》的评论会话，共 ${descendants.length} 条记录`,
          snapshot,
          deletedById: actor?.id ?? null,
          deletedByName: actor?.name ?? '',
          deletedAt: new Date(),
        },
        create: {
          entityType: 'comment',
          entityId: comment.id,
          title: comment.author,
          summary: `来自《${comment.post.title}》的评论会话，共 ${descendants.length} 条记录`,
          snapshot,
          deletedById: actor?.id ?? null,
          deletedByName: actor?.name ?? '',
        },
      });

      await tx.comment.delete({ where: { id } });
    });

    await this.operationLogsService.create({
      action: 'recycleBin.archiveComment',
      targetType: 'comment',
      targetId: comment.id,
      targetLabel: comment.author,
      actorId: actor?.id,
      actorName: actor?.name,
      detail: { postId: comment.postId },
    });

    await this.notificationsService.create({
      title: '评论已移入内容回收站',
      content: `评论作者 ${comment.author} 的会话已移入内容回收站。`,
      category: '内容回收站',
      level: 'WARNING',
      actorId: actor?.id,
      actorName: actor?.name,
      entityType: 'comment',
      entityId: comment.id,
      link: '/recycle-bin',
    });

    return { success: true };
  }

  async archiveMedia(id: string, actor?: Actor) {
    const media = await this.prisma.media.findUnique({
      where: { id },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!media) {
      throw new NotFoundException('媒体不存在');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.recycleBinItem.upsert({
        where: {
          entityType_entityId: {
            entityType: 'media',
            entityId: media.id,
          },
        },
        update: {
          title: media.fileName,
          summary: `${media.source === 'PEXELS' ? 'Pexels' : '本地'}媒体，${media.mimeType}`,
          snapshot: media,
          deletedById: actor?.id ?? null,
          deletedByName: actor?.name ?? '',
          deletedAt: new Date(),
        },
        create: {
          entityType: 'media',
          entityId: media.id,
          title: media.fileName,
          summary: `${media.source === 'PEXELS' ? 'Pexels' : '本地'}媒体，${media.mimeType}`,
          snapshot: media,
          deletedById: actor?.id ?? null,
          deletedByName: actor?.name ?? '',
        },
      });

      await tx.media.delete({ where: { id } });
    });

    await this.operationLogsService.create({
      action: 'recycleBin.archiveMedia',
      targetType: 'media',
      targetId: media.id,
      targetLabel: media.fileName,
      actorId: actor?.id,
      actorName: actor?.name,
    });

    await this.notificationsService.create({
      title: '媒体已移入内容回收站',
      content: `${media.fileName} 已移入内容回收站，可稍后恢复。`,
      category: '内容回收站',
      level: 'WARNING',
      actorId: actor?.id,
      actorName: actor?.name,
      entityType: 'media',
      entityId: media.id,
      link: '/recycle-bin',
    });

    return { success: true };
  }

  async archiveCategory(id: string, actor?: Actor) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        posts: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    const snapshot = {
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        visible: category.visible,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
      posts: category.posts,
      postIds: category.posts.map((item) => item.id),
    };

    await this.prisma.$transaction(async (tx) => {
      await tx.recycleBinItem.upsert({
        where: {
          entityType_entityId: {
            entityType: 'category',
            entityId: category.id,
          },
        },
        update: {
          title: category.name,
          summary: this.buildCategorySummary(category.posts.length, category.visible),
          snapshot,
          deletedById: actor?.id ?? null,
          deletedByName: actor?.name ?? '',
          deletedAt: new Date(),
        },
        create: {
          entityType: 'category',
          entityId: category.id,
          title: category.name,
          summary: this.buildCategorySummary(category.posts.length, category.visible),
          snapshot,
          deletedById: actor?.id ?? null,
          deletedByName: actor?.name ?? '',
        },
      });

      await tx.category.delete({ where: { id } });
    });

    await this.operationLogsService.create({
      action: 'recycleBin.archiveCategory',
      targetType: 'category',
      targetId: category.id,
      targetLabel: category.name,
      actorId: actor?.id,
      actorName: actor?.name,
      detail: { postCount: category.posts.length },
    });

    await this.notificationsService.create({
      title: '分类已移入内容回收站',
      content: `分类“${category.name}”已移入内容回收站，可稍后恢复。`,
      category: '内容回收站',
      level: 'WARNING',
      actorId: actor?.id,
      actorName: actor?.name,
      entityType: 'category',
      entityId: category.id,
      link: '/recycle-bin',
    });

    return { success: true };
  }

  async archiveTag(id: string, actor?: Actor) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
      include: {
        posts: {
          select: {
            postId: true,
            post: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!tag) {
      throw new NotFoundException('标签不存在');
    }

    const linkedPosts = tag.posts.map((item) => item.post);
    const snapshot = {
      tag: {
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        color: tag.color,
        visible: tag.visible,
        createdAt: tag.createdAt,
        updatedAt: tag.updatedAt,
      },
      posts: linkedPosts,
      postIds: linkedPosts.map((item) => item.id),
    };

    await this.prisma.$transaction(async (tx) => {
      await tx.recycleBinItem.upsert({
        where: {
          entityType_entityId: {
            entityType: 'tag',
            entityId: tag.id,
          },
        },
        update: {
          title: tag.name,
          summary: this.buildTagSummary(linkedPosts.length, tag.visible),
          snapshot,
          deletedById: actor?.id ?? null,
          deletedByName: actor?.name ?? '',
          deletedAt: new Date(),
        },
        create: {
          entityType: 'tag',
          entityId: tag.id,
          title: tag.name,
          summary: this.buildTagSummary(linkedPosts.length, tag.visible),
          snapshot,
          deletedById: actor?.id ?? null,
          deletedByName: actor?.name ?? '',
        },
      });

      await tx.tag.delete({ where: { id } });
    });

    await this.operationLogsService.create({
      action: 'recycleBin.archiveTag',
      targetType: 'tag',
      targetId: tag.id,
      targetLabel: tag.name,
      actorId: actor?.id,
      actorName: actor?.name,
      detail: { postCount: linkedPosts.length },
    });

    await this.notificationsService.create({
      title: '标签已移入内容回收站',
      content: `标签“${tag.name}”已移入内容回收站，可稍后恢复。`,
      category: '内容回收站',
      level: 'WARNING',
      actorId: actor?.id,
      actorName: actor?.name,
      entityType: 'tag',
      entityId: tag.id,
      link: '/recycle-bin',
    });

    return { success: true };
  }

  async restore(id: string, actor?: Actor) {
    const item = await this.prisma.recycleBinItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('回收站记录不存在');
    }

    const entityType = item.entityType as RestorableEntityType;
    if (!['post', 'comment', 'media', 'category', 'tag'].includes(entityType)) {
      throw new BadRequestException('当前记录暂不支持恢复');
    }

    if (entityType === 'post') {
      await this.restorePost(item);
    }

    if (entityType === 'comment') {
      await this.restoreComment(item);
    }

    if (entityType === 'media') {
      await this.restoreMedia(item);
    }

    if (entityType === 'category') {
      await this.restoreCategory(item);
    }

    if (entityType === 'tag') {
      await this.restoreTag(item);
    }

    await this.prisma.recycleBinItem.delete({ where: { id: item.id } });

    await this.operationLogsService.create({
      action: 'recycleBin.restore',
      targetType: item.entityType,
      targetId: item.entityId,
      targetLabel: item.title,
      actorId: actor?.id,
      actorName: actor?.name,
    });

    await this.notificationsService.create({
      title: '内容已从回收站恢复',
      content: `${item.title} 已恢复到原位置。`,
      category: '内容回收站',
      level: 'SUCCESS',
      actorId: actor?.id,
      actorName: actor?.name,
      entityType: item.entityType,
      entityId: item.entityId,
      link: this.resolveRestoreLink(item.entityType),
    });

    return { success: true };
  }

  async restoreMany(ids: string[], actor?: Actor) {
    const normalizedIds = this.normalizeIds(ids);
    if (!normalizedIds.length) {
      throw new BadRequestException('请至少选择一条记录');
    }

    for (const id of normalizedIds) {
      await this.restore(id, actor);
    }

    return { success: true, count: normalizedIds.length };
  }

  async purge(id: string, actor?: Actor) {
    const item = await this.prisma.recycleBinItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('回收站记录不存在');
    }

    await this.prisma.recycleBinItem.delete({ where: { id } });

    await this.operationLogsService.create({
      action: 'recycleBin.purge',
      targetType: item.entityType,
      targetId: item.entityId,
      targetLabel: item.title,
      actorId: actor?.id,
      actorName: actor?.name,
    });

    return { success: true };
  }

  async purgeMany(ids: string[], actor?: Actor) {
    const normalizedIds = this.normalizeIds(ids);
    if (!normalizedIds.length) {
      throw new BadRequestException('请至少选择一条记录');
    }

    for (const id of normalizedIds) {
      await this.purge(id, actor);
    }

    return { success: true, count: normalizedIds.length };
  }

  private async restorePost(item: { entityId: string; snapshot: unknown }) {
    const snapshot = item.snapshot as {
      post: {
        id: string;
        title: string;
        slug: string;
        excerpt: string;
        content: string;
        coverImage: string;
        status: 'DRAFT' | 'PUBLISHED';
        featured: boolean;
        seoTitle: string;
        seoDescription: string;
        readingTime: number;
        views: number;
        publishedAt: string | Date | null;
        scheduledPublishAt: string | Date | null;
        scheduledUnpublishAt: string | Date | null;
        createdAt: string | Date;
        updatedAt: string | Date;
        categoryId: string | null;
      };
      tagIds: string[];
      revisions: Array<{
        id: string;
        postId: string;
        version: number;
        reason: string;
        snapshot: unknown;
        createdAt: string | Date;
        createdById: string | null;
      }>;
      comments: Array<{
        id: string;
        author: string;
        email: string;
        content: string;
        approved: boolean;
        likes: number;
        createdAt: string | Date;
        updatedAt: string | Date;
        parentId: string | null;
        postId: string;
      }>;
    };

    const exists = await this.prisma.post.findUnique({ where: { id: item.entityId } });
    if (exists) {
      throw new BadRequestException('文章已存在，无法重复恢复');
    }

    await this.assertSlugAvailable('post', snapshot.post.slug, item.entityId);

    const categoryExists = snapshot.post.categoryId
      ? await this.prisma.category.findUnique({ where: { id: snapshot.post.categoryId }, select: { id: true } })
      : null;
    const availableTags = snapshot.tagIds.length
      ? await this.prisma.tag.findMany({
          where: { id: { in: snapshot.tagIds } },
          select: { id: true },
        })
      : [];

    await this.prisma.$transaction(async (tx) => {
      await tx.post.create({
        data: {
          id: snapshot.post.id,
          title: snapshot.post.title,
          slug: snapshot.post.slug,
          excerpt: snapshot.post.excerpt,
          content: snapshot.post.content,
          coverImage: snapshot.post.coverImage,
          status: snapshot.post.status,
          featured: snapshot.post.featured,
          seoTitle: snapshot.post.seoTitle,
          seoDescription: snapshot.post.seoDescription,
          readingTime: snapshot.post.readingTime,
          views: snapshot.post.views,
          publishedAt: this.toDate(snapshot.post.publishedAt),
          scheduledPublishAt: this.toDate(snapshot.post.scheduledPublishAt),
          scheduledUnpublishAt: this.toDate(snapshot.post.scheduledUnpublishAt),
          createdAt: this.toDate(snapshot.post.createdAt) ?? undefined,
          updatedAt: this.toDate(snapshot.post.updatedAt) ?? undefined,
          categoryId: categoryExists?.id ?? null,
          tags: availableTags.length
            ? {
                create: availableTags.map((tag) => ({ tagId: tag.id })),
              }
            : undefined,
        },
      });

      if (snapshot.revisions.length) {
        await tx.postRevision.createMany({
          data: snapshot.revisions.map((revision) => ({
            id: revision.id,
            postId: revision.postId,
            version: revision.version,
            reason: revision.reason,
            snapshot: revision.snapshot as never,
            createdAt: this.toDate(revision.createdAt) ?? new Date(),
            createdById: revision.createdById,
          })),
          skipDuplicates: true,
        });
      }

      await this.restoreCommentRows(tx, snapshot.comments);
    });
  }

  private async restoreComment(item: { entityId: string; snapshot: unknown }) {
    const snapshot = item.snapshot as {
      post: { id: string; title: string };
      comments: Array<{
        id: string;
        author: string;
        email: string;
        content: string;
        approved: boolean;
        likes: number;
        createdAt: string | Date;
        updatedAt: string | Date;
        parentId: string | null;
        postId: string;
      }>;
    };

    const postExists = await this.prisma.post.findUnique({ where: { id: snapshot.post.id }, select: { id: true } });
    if (!postExists) {
      throw new BadRequestException('原文章已不存在，无法恢复评论');
    }

    const exists = await this.prisma.comment.findUnique({ where: { id: item.entityId } });
    if (exists) {
      throw new BadRequestException('评论已存在，无法重复恢复');
    }

    await this.prisma.$transaction(async (tx) => {
      await this.restoreCommentRows(tx, snapshot.comments);
    });
  }

  private async restoreMedia(item: { entityId: string; snapshot: unknown }) {
    const media = item.snapshot as {
      id: string;
      fileName: string;
      path: string;
      url: string;
      thumbUrl: string | null;
      mimeType: string;
      size: number;
      source: 'LOCAL' | 'PEXELS';
      groupName: string;
      folderId: string | null;
      tags: string[];
      altText: string;
      createdAt: string | Date;
    };

    const exists = await this.prisma.media.findUnique({ where: { id: item.entityId } });
    if (exists) {
      throw new BadRequestException('媒体已存在，无法重复恢复');
    }

    const folderExists = media.folderId
      ? await this.prisma.mediaFolder.findUnique({ where: { id: media.folderId }, select: { id: true } })
      : null;

    await this.prisma.media.create({
      data: {
        id: media.id,
        fileName: media.fileName,
        path: media.path,
        url: media.url,
        thumbUrl: media.thumbUrl,
        mimeType: media.mimeType,
        size: media.size,
        source: media.source,
        groupName: media.groupName,
        folderId: folderExists?.id ?? null,
        tags: media.tags,
        altText: media.altText,
        createdAt: this.toDate(media.createdAt) ?? undefined,
      },
    });
  }

  private async restoreCategory(item: { entityId: string; snapshot: unknown }) {
    const snapshot = item.snapshot as {
      category: {
        id: string;
        name: string;
        slug: string;
        description: string;
        visible: boolean;
        createdAt: string | Date;
        updatedAt: string | Date;
      };
      postIds: string[];
    };

    const exists = await this.prisma.category.findUnique({ where: { id: item.entityId } });
    if (exists) {
      throw new BadRequestException('分类已存在，无法重复恢复');
    }

    await this.assertSlugAvailable('category', snapshot.category.slug, item.entityId);

    await this.prisma.$transaction(async (tx) => {
      await tx.category.create({
        data: {
          id: snapshot.category.id,
          name: snapshot.category.name,
          slug: snapshot.category.slug,
          description: snapshot.category.description,
          visible: snapshot.category.visible,
          createdAt: this.toDate(snapshot.category.createdAt) ?? undefined,
          updatedAt: this.toDate(snapshot.category.updatedAt) ?? undefined,
        },
      });

      if (snapshot.postIds.length) {
        await tx.post.updateMany({
          where: {
            id: { in: snapshot.postIds },
            categoryId: null,
          },
          data: {
            categoryId: snapshot.category.id,
          },
        });
      }
    });
  }

  private async restoreTag(item: { entityId: string; snapshot: unknown }) {
    const snapshot = item.snapshot as {
      tag: {
        id: string;
        name: string;
        slug: string;
        color: string;
        visible: boolean;
        createdAt: string | Date;
        updatedAt: string | Date;
      };
      postIds: string[];
    };

    const exists = await this.prisma.tag.findUnique({ where: { id: item.entityId } });
    if (exists) {
      throw new BadRequestException('标签已存在，无法重复恢复');
    }

    await this.assertSlugAvailable('tag', snapshot.tag.slug, item.entityId);

    const existingPosts = snapshot.postIds.length
      ? await this.prisma.post.findMany({
          where: { id: { in: snapshot.postIds } },
          select: { id: true },
        })
      : [];

    await this.prisma.$transaction(async (tx) => {
      await tx.tag.create({
        data: {
          id: snapshot.tag.id,
          name: snapshot.tag.name,
          slug: snapshot.tag.slug,
          color: snapshot.tag.color,
          visible: snapshot.tag.visible,
          createdAt: this.toDate(snapshot.tag.createdAt) ?? undefined,
          updatedAt: this.toDate(snapshot.tag.updatedAt) ?? undefined,
        },
      });

      if (existingPosts.length) {
        await tx.postTag.createMany({
          data: existingPosts.map((post) => ({
            postId: post.id,
            tagId: snapshot.tag.id,
          })),
          skipDuplicates: true,
        });
      }
    });
  }

  private async restoreCommentRows(
    tx: TransactionClient,
    comments: Array<{
      id: string;
      author: string;
      email: string;
      content: string;
      approved: boolean;
      likes: number;
      createdAt: string | Date;
      updatedAt: string | Date;
      parentId: string | null;
      postId: string;
    }>,
  ) {
    const pending = [...comments];
    const restored = new Set<string>();

    while (pending.length) {
      const ready = pending.filter((item) => !item.parentId || restored.has(item.parentId));
      if (!ready.length) {
        throw new BadRequestException('评论恢复失败，存在无效的父子关系');
      }

      for (const comment of ready) {
        await tx.comment.create({
          data: {
            id: comment.id,
            author: comment.author,
            email: comment.email,
            content: comment.content,
            approved: comment.approved,
            likes: comment.likes,
            createdAt: this.toDate(comment.createdAt) ?? undefined,
            updatedAt: this.toDate(comment.updatedAt) ?? undefined,
            parentId: comment.parentId,
            postId: comment.postId,
          },
        });
        restored.add(comment.id);
      }

      for (const comment of ready) {
        const index = pending.findIndex((item) => item.id === comment.id);
        if (index >= 0) {
          pending.splice(index, 1);
        }
      }
    }
  }

  private async collectCommentTree(rootId: string) {
    const all = await this.prisma.comment.findMany({
      orderBy: { createdAt: 'asc' },
    });

    const ids = new Set<string>([rootId]);
    let changed = true;

    while (changed) {
      changed = false;
      for (const item of all) {
        if (item.parentId && ids.has(item.parentId) && !ids.has(item.id)) {
          ids.add(item.id);
          changed = true;
        }
      }
    }

    return all.filter((item) => ids.has(item.id));
  }

  private buildPostSummary(status: string, commentCount: number) {
    return `${status === 'PUBLISHED' ? '已发布' : '草稿'}文章，含 ${commentCount} 条评论记录`;
  }

  private buildCategorySummary(postCount: number, visible: boolean) {
    return `${visible ? '显示中' : '已隐藏'}分类，关联 ${postCount} 篇文章`;
  }

  private buildTagSummary(postCount: number, visible: boolean) {
    return `${visible ? '显示中' : '已隐藏'}标签，关联 ${postCount} 篇文章`;
  }

  private resolveRestoreLink(entityType: string) {
    if (entityType === 'post') return '/posts';
    if (entityType === 'comment') return '/comments';
    if (entityType === 'media') return '/media';
    if (entityType === 'category') return '/categories';
    if (entityType === 'tag') return '/tags';
    return '/recycle-bin';
  }

  private async assertSlugAvailable(entityType: 'post' | 'category' | 'tag', slug: string, entityId: string) {
    if (!slug) return;

    if (entityType === 'post') {
      const conflict = await this.prisma.post.findFirst({
        where: {
          slug,
          id: { not: entityId },
        },
        select: { id: true },
      });
      if (conflict) {
        throw new BadRequestException(`文章别名“${slug}”已被占用，请先处理冲突后再恢复`);
      }
      return;
    }

    if (entityType === 'category') {
      const conflict = await this.prisma.category.findFirst({
        where: {
          slug,
          id: { not: entityId },
        },
        select: { id: true },
      });
      if (conflict) {
        throw new BadRequestException(`分类别名“${slug}”已被占用，请先处理冲突后再恢复`);
      }
      return;
    }

    const conflict = await this.prisma.tag.findFirst({
      where: {
        slug,
        id: { not: entityId },
      },
      select: { id: true },
    });
    if (conflict) {
      throw new BadRequestException(`标签别名“${slug}”已被占用，请先处理冲突后再恢复`);
    }
  }

  private toDate(value: string | Date | null | undefined) {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private async buildPreviewMap(
    items: Array<{
      id: string;
      entityType: string;
      snapshot?: unknown;
    }>,
  ) {
    const categoryIds = new Set<string>();
    const tagIds = new Set<string>();

    for (const item of items) {
      if (item.entityType !== 'post' || !item.snapshot || typeof item.snapshot !== 'object') continue;
      const snapshot = item.snapshot as {
        post?: { categoryId?: string | null };
        tagIds?: string[];
      };

      if (snapshot.post?.categoryId) {
        categoryIds.add(snapshot.post.categoryId);
      }

      for (const tagId of snapshot.tagIds || []) {
        if (tagId) tagIds.add(tagId);
      }
    }

    const [categories, tags] = await Promise.all([
      categoryIds.size
        ? this.prisma.category.findMany({
            where: { id: { in: [...categoryIds] } },
            select: { id: true, name: true, slug: true },
          })
        : Promise.resolve([] as Array<{ id: string; name: string; slug: string }>),
      tagIds.size
        ? this.prisma.tag.findMany({
            where: { id: { in: [...tagIds] } },
            select: { id: true, name: true, slug: true, color: true },
          })
        : Promise.resolve([] as Array<{ id: string; name: string; slug: string; color: string }>),
    ]);

    const categoryMap = new Map<string, { id: string; name: string; slug: string }>(
      categories.map((item) => [item.id, item] as const),
    );
    const tagMap = new Map<string, { id: string; name: string; slug: string; color: string }>(
      tags.map((item) => [item.id, item] as const),
    );
    const previewMap = new Map<string, RecycleBinItem['preview']>();

    for (const item of items) {
      const preview = this.extractPreview(item.entityType, item.snapshot);

      if (item.entityType === 'post' && item.snapshot && typeof item.snapshot === 'object') {
        const snapshot = item.snapshot as {
          post?: { categoryId?: string | null };
          tagIds?: string[];
        };

        const nextCategory =
          preview?.category || (snapshot.post?.categoryId ? categoryMap.get(snapshot.post.categoryId) || null : null);
        const nextTags =
          preview?.tags?.length
            ? preview.tags
            : (snapshot.tagIds || [])
                .map((tagId) => tagMap.get(tagId))
                .filter((tag): tag is { id: string; name: string; slug: string; color: string } => Boolean(tag))
                .map((tag) => ({
                  name: tag.name,
                  slug: tag.slug,
                  color: tag.color,
                }));

        previewMap.set(item.id, {
          ...(preview || {}),
          category: nextCategory ? { name: nextCategory.name, slug: nextCategory.slug } : null,
          tags: nextTags,
        });
        continue;
      }

      if (item.entityType === 'media' && preview && item.snapshot && typeof item.snapshot === 'object') {
        const snapshot = item.snapshot as { groupName?: string };
        previewMap.set(item.id, {
          ...preview,
          folderName: preview.folderName || snapshot.groupName || null,
        });
        continue;
      }

      previewMap.set(item.id, preview);
    }

    return previewMap;
  }

  private normalizeIds(ids: string[]) {
    return [...new Set((ids || []).map((item) => item?.trim()).filter(Boolean))];
  }

  private serialize(
    item: {
      id: string;
      entityType: string;
      entityId: string;
      title: string;
      summary: string;
      deletedByName: string;
      deletedAt: Date;
      snapshot?: unknown;
    },
    preview?: RecycleBinItem['preview'],
  ): RecycleBinItem {
    return {
      id: item.id,
      entityType: item.entityType,
      entityId: item.entityId,
      title: item.title,
      summary: item.summary,
      deletedByName: item.deletedByName,
      deletedAt: item.deletedAt.toISOString(),
      preview: preview ?? this.extractPreview(item.entityType, item.snapshot),
    };
  }

  private extractPreview(entityType: string, snapshot: unknown): RecycleBinItem['preview'] {
    if (!snapshot || typeof snapshot !== 'object') {
      return null;
    }

    if (entityType === 'post') {
      const value = snapshot as {
        post?: {
          excerpt?: string;
          coverImage?: string;
          category?: {
            name: string;
            slug: string;
          } | null;
        };
        tags?: Array<{
          name: string;
          slug: string;
          color: string;
        }>;
      };

      return {
        excerpt: value.post?.excerpt || '',
        coverImage: value.post?.coverImage || '',
        category: value.post?.category || null,
        tags: value.tags || [],
      };
    }

    if (entityType === 'media') {
      const value = snapshot as {
        url?: string;
        thumbUrl?: string | null;
        mimeType?: string;
        folder?: {
          name: string;
        } | null;
      };

      return {
        url: value.url || '',
        thumbUrl: value.thumbUrl || value.url || '',
        mimeType: value.mimeType || '',
        folderName: value.folder?.name || null,
      };
    }

    if (entityType === 'comment') {
      const value = snapshot as {
        post?: { title?: string };
        comments?: Array<{ author?: string; content?: string }>;
      };
      const firstComment = value.comments?.[0];

      return {
        author: firstComment?.author || '',
        content: firstComment?.content || '',
        postTitle: value.post?.title || '',
      };
    }

    if (entityType === 'category') {
      const value = snapshot as {
        category?: {
          description?: string;
          visible?: boolean;
        };
        postIds?: string[];
      };

      return {
        description: value.category?.description || '',
        visible: value.category?.visible ?? true,
        postCount: value.postIds?.length || 0,
      };
    }

    if (entityType === 'tag') {
      const value = snapshot as {
        tag?: {
          color?: string;
          visible?: boolean;
        };
        postIds?: string[];
      };

      return {
        color: value.tag?.color || '',
        visible: value.tag?.visible ?? true,
        postCount: value.postIds?.length || 0,
      };
    }

    return null;
  }
}

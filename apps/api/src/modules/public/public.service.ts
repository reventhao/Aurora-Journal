import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostStatus, Prisma } from '@prisma/client';
import { existsSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import { marked } from 'marked';

import { getAppBaseUrl, normalizeLocalAppUrl, normalizeLocalAppUrlsInText } from '../../common/utils/app-url';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';

type PublicCommentNode = {
  id: string;
  author: string;
  email: string;
  content: string;
  approved: boolean;
  likes: number;
  postId: string;
  parentId: string | null;
  replyToAuthor?: string;
  createdAt: string;
  updatedAt: string;
  replies: PublicCommentNode[];
};

@Injectable()
export class PublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
    private readonly configService: ConfigService,
  ) {}

  private resolvePostPathValue(post: { id: string; slug: string | null }) {
    return post.slug && post.slug.trim() ? post.slug : post.id;
  }

  private buildPublishedWhere() {
    const now = new Date();
    return {
      status: PostStatus.PUBLISHED,
      AND: [
        {
          OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: now } }],
        },
        {
          OR: [{ scheduledUnpublishAt: null }, { scheduledUnpublishAt: { gt: now } }],
        },
      ],
    } satisfies Prisma.PostWhereInput;
  }

  private buildThumbnailPath(sourcePath: string) {
    const fileName = basename(sourcePath, extname(sourcePath));
    return join(dirname(sourcePath), `${fileName}.thumb.webp`);
  }

  private resolveMediaThumbUrl(item: { path: string; url: string; thumbUrl?: string | null }) {
    if (item.path.startsWith('external:')) {
      return item.thumbUrl || undefined;
    }

    const thumbPath = this.buildThumbnailPath(item.path);
    if (!existsSync(thumbPath)) {
      return undefined;
    }

    const extension = extname(item.url);
    const baseUrl = extension ? item.url.slice(0, -extension.length) : item.url;
    return `${baseUrl}.thumb.webp`;
  }

  private async resolveCoverThumbMap(coverImages: string[]) {
    const appBaseUrl = getAppBaseUrl(this.configService);
    const urls = Array.from(new Set(coverImages.filter((url) => Boolean(url?.trim()))));
    if (!urls.length) {
      return new Map<string, string>();
    }

    const mediaItems = await this.prisma.media.findMany({
      where: {
        url: {
          in: urls,
        },
      },
      select: {
        url: true,
        path: true,
        thumbUrl: true,
      },
    });

    return new Map(
      mediaItems
        .map((item) => {
          const thumbUrl = this.resolveMediaThumbUrl(item);
          const normalizedUrl = normalizeLocalAppUrl(item.url, appBaseUrl);
          return thumbUrl ? ([normalizedUrl, normalizeLocalAppUrl(thumbUrl, appBaseUrl)] as const) : null;
        })
        .filter((item): item is readonly [string, string] => Boolean(item)),
    );
  }

  private serializePost<
    T extends {
      id: string;
      slug: string;
      coverImage?: string;
      tags: Array<{ tag: unknown }>;
      publishedAt?: Date | string | null;
      scheduledPublishAt?: Date | string | null;
      scheduledUnpublishAt?: Date | string | null;
      createdAt?: Date | string;
      updatedAt?: Date | string;
    },
  >(
    post: T,
    coverThumbMap?: Map<string, string>,
  ) {
    const appBaseUrl = getAppBaseUrl(this.configService);
    const normalizedContent = normalizeLocalAppUrlsInText((post as { content?: string }).content, appBaseUrl);
    const normalizedCoverImage = normalizeLocalAppUrl(post.coverImage, appBaseUrl);

    return {
      ...post,
      slug: this.resolvePostPathValue(post),
      coverImage: normalizedCoverImage,
      content: normalizedContent,
      publishedAt: post.publishedAt instanceof Date ? post.publishedAt.toISOString() : (post.publishedAt ?? null),
      scheduledPublishAt:
        post.scheduledPublishAt instanceof Date ? post.scheduledPublishAt.toISOString() : (post.scheduledPublishAt ?? null),
      scheduledUnpublishAt:
        post.scheduledUnpublishAt instanceof Date
          ? post.scheduledUnpublishAt.toISOString()
          : (post.scheduledUnpublishAt ?? null),
      createdAt: post.createdAt instanceof Date ? post.createdAt.toISOString() : post.createdAt,
      updatedAt: post.updatedAt instanceof Date ? post.updatedAt.toISOString() : post.updatedAt,
      coverThumbUrl: normalizedCoverImage ? coverThumbMap?.get(normalizedCoverImage) : undefined,
      tags: post.tags.map((tagItem) => tagItem.tag),
    };
  }

  private serializeComment(comment: {
    id: string;
    author: string;
    email: string;
    content: string;
    approved: boolean;
    likes: number;
    createdAt: Date;
    updatedAt: Date;
    postId: string;
    parentId: string | null;
    replyToAuthor?: string;
    replies?: Array<{
      id: string;
      author: string;
      email: string;
      content: string;
      approved: boolean;
      likes: number;
      createdAt: Date;
      updatedAt: Date;
      postId: string;
      parentId: string | null;
      replyToAuthor?: string;
      replies?: PublicCommentNode[];
    }>;
  }): PublicCommentNode {
    return {
      id: comment.id,
      author: comment.author,
      email: comment.email,
      content: comment.content,
      approved: comment.approved,
      likes: comment.likes,
      postId: comment.postId,
      parentId: comment.parentId,
      replyToAuthor: comment.replyToAuthor,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      replies:
        comment.replies?.map((reply) => ({
          id: reply.id,
          author: reply.author,
          email: reply.email,
          content: reply.content,
          approved: reply.approved,
          likes: reply.likes,
          postId: reply.postId,
          parentId: reply.parentId,
          replyToAuthor: reply.replyToAuthor,
          createdAt: reply.createdAt.toISOString(),
          updatedAt: reply.updatedAt.toISOString(),
          replies: Array.isArray(reply.replies) ? reply.replies : [],
        })) ?? [],
    };
  }

  private buildCommentTree(
    comments: Array<{
      id: string;
      author: string;
      email: string;
      content: string;
      approved: boolean;
      likes: number;
      createdAt: Date;
      updatedAt: Date;
      postId: string;
      parentId: string | null;
    }>,
  ): PublicCommentNode[] {
    const nodeMap = new Map<string, PublicCommentNode>();
    const roots: PublicCommentNode[] = [];

    for (const comment of comments) {
      nodeMap.set(comment.id, this.serializeComment({ ...comment, replies: [] }));
    }

    for (const comment of comments) {
      const node = nodeMap.get(comment.id);
      if (!node) continue;

      if (comment.parentId) {
        const parent = nodeMap.get(comment.parentId);
        if (parent) {
          node.replyToAuthor = parent.author;
          parent.replies = [...(parent.replies ?? []), node];
          continue;
        }
      }

      roots.push(node);
    }

    const sortTree = (items: PublicCommentNode[], isRoot = false) => {
      items.sort((left, right) => {
        if (isRoot) {
          const likeGap = (right.likes ?? 0) - (left.likes ?? 0);
          if (likeGap !== 0) return likeGap;
          return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
        }

        return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
      });

      for (const item of items) {
        if (item.replies?.length) {
          sortTree(item.replies, false);
        }
      }
    };

    sortTree(roots, true);
    return roots;
  }

  private async findPublishedPostBySlugOrId(slugOrId: string) {
    const post = await this.prisma.post.findFirst({
      where: {
        OR: [{ slug: slugOrId }, { id: slugOrId }],
      },
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
    });

    if (!post || post.status !== PostStatus.PUBLISHED) {
      throw new NotFoundException('文章不存在或尚未发布');
    }

    const now = new Date();
    if ((post.scheduledPublishAt && post.scheduledPublishAt > now) || (post.scheduledUnpublishAt && post.scheduledUnpublishAt <= now)) {
      throw new NotFoundException('文章不存在或尚未发布');
    }

    return post;
  }

  getSiteSettings() {
    return this.settingsService.getSiteSettings();
  }

  async getHome() {
    const settings = await this.settingsService.getSiteSettings();
    const featuredLimit = settings.homeSections.find((item) => item.key === 'featuredPosts')?.limit ?? 3;
    const latestLimit = settings.homeSections.find((item) => item.key === 'latestPosts')?.limit ?? 9;
    const categoriesLimit = settings.homeSections.find((item) => item.key === 'categories')?.limit ?? 8;
    const tagsLimit = settings.homeSections.find((item) => item.key === 'tags')?.limit ?? 10;

    const [featuredPosts, latestPosts, categories, tags] = await Promise.all([
      this.prisma.post.findMany({
        where: { ...this.buildPublishedWhere(), featured: true },
        take: featuredLimit,
        orderBy: { publishedAt: 'desc' },
        include: { category: true, tags: { include: { tag: true } } },
      }),
      this.prisma.post.findMany({
        where: this.buildPublishedWhere(),
        take: latestLimit,
        orderBy: { publishedAt: 'desc' },
        include: { category: true, tags: { include: { tag: true } } },
      }),
      this.prisma.category.findMany({
        where: { visible: true },
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { posts: true } } },
        take: categoriesLimit,
      }),
      this.prisma.tag.findMany({
        where: { visible: true },
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { posts: true } } },
        take: tagsLimit,
      }),
    ]);

    const coverThumbMap = await this.resolveCoverThumbMap([
      ...featuredPosts.map((post) => post.coverImage),
      ...latestPosts.map((post) => post.coverImage),
    ]);

    return {
      settings,
      featuredPosts: featuredPosts.map((post) => this.serializePost(post, coverThumbMap)),
      latestPosts: latestPosts.map((post) => this.serializePost(post, coverThumbMap)),
      categories: categories.map((item) => ({
        ...item,
        postCount: item._count.posts,
      })),
      tags: tags.map((item) => ({
        ...item,
        postCount: item._count.posts,
      })),
    };
  }

  async getCategories() {
    const categories = await this.prisma.category.findMany({
      where: { visible: true },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { posts: true } } },
    });

    return categories.map((item) => ({
      ...item,
      postCount: item._count.posts,
    }));
  }

  async getTags() {
    const tags = await this.prisma.tag.findMany({
      where: { visible: true },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { posts: true } } },
    });

    return tags.map((item) => ({
      ...item,
      postCount: item._count.posts,
    }));
  }

  async getPosts(page = 1, pageSize = 9, keyword?: string, category?: string, tag?: string) {
    const where: Prisma.PostWhereInput = {
      ...this.buildPublishedWhere(),
      ...(keyword
        ? {
            OR: [
              { title: { contains: keyword, mode: 'insensitive' as const } },
              { excerpt: { contains: keyword, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(category ? { category: { slug: category } } : {}),
      ...(tag ? { tags: { some: { tag: { slug: tag } } } } : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.post.count({ where }),
      this.prisma.post.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { publishedAt: 'desc' },
        include: { category: true, tags: { include: { tag: true } } },
      }),
    ]);

    const coverThumbMap = await this.resolveCoverThumbMap(items.map((post) => post.coverImage));

    return {
      items: items.map((post) => this.serializePost(post, coverThumbMap)),
      meta: {
        page,
        pageSize,
        total,
        pageCount: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  async getPostCommentsBySlug(slugOrId: string) {
    const post = await this.findPublishedPostBySlugOrId(slugOrId);

    const comments = await this.prisma.comment.findMany({
      where: { postId: post.id, approved: true },
      orderBy: { createdAt: 'asc' },
    });

    return this.buildCommentTree(comments);
  }

  async getPostBySlug(slugOrId: string) {
    const post = await this.findPublishedPostBySlugOrId(slugOrId);
    const coverThumbMap = await this.resolveCoverThumbMap([post.coverImage]);

    await this.prisma.post.update({
      where: { id: post.id },
      data: { views: { increment: 1 } },
    });

    return {
      ...this.serializePost(post, coverThumbMap),
      html: marked.parse(normalizeLocalAppUrlsInText(post.content, getAppBaseUrl(this.configService))) as string,
    };
  }
}

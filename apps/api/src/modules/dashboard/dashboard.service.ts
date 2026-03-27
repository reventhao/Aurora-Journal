import type { DashboardMetrics } from '@aurora/shared';
import { Injectable } from '@nestjs/common';
import { PostStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getMetrics(): Promise<DashboardMetrics> {
    const [totalPosts, publishedPosts, draftPosts, totalComments, pendingComments, totalViews, recentPosts, recentComments] =
      await Promise.all([
        this.prisma.post.count(),
        this.prisma.post.count({ where: { status: PostStatus.PUBLISHED } }),
        this.prisma.post.count({ where: { status: PostStatus.DRAFT } }),
        this.prisma.comment.count(),
        this.prisma.comment.count({ where: { approved: false } }),
        this.prisma.post.aggregate({ _sum: { views: true } }),
        this.prisma.post.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { category: true, tags: { include: { tag: true } } },
        }),
        this.prisma.comment.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { post: true },
        }),
      ]);

    return {
      totalPosts,
      publishedPosts,
      draftPosts,
      totalComments,
      pendingComments,
      totalViews: totalViews._sum.views || 0,
      recentPosts: recentPosts.map((item) => ({
        ...item,
        publishedAt: item.publishedAt?.toISOString() || null,
        scheduledPublishAt: item.scheduledPublishAt?.toISOString() || null,
        scheduledUnpublishAt: item.scheduledUnpublishAt?.toISOString() || null,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        tags: item.tags.map((tag) => tag.tag),
      })),
      recentComments: recentComments.map((item) => ({
        id: item.id,
        author: item.author,
        email: item.email,
        content: item.content,
        createdAt: item.createdAt.toISOString(),
        approved: item.approved,
        postId: item.postId,
        postTitle: item.post.title,
      })),
    };
  }
}

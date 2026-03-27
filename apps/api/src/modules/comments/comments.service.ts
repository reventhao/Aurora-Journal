import type { AuthUser, CommentConversation } from '@aurora/shared';
import { BadRequestException, Injectable } from '@nestjs/common';

import { NotificationsService } from '../notifications/notifications.service';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { RecycleBinService } from '../recycle-bin/recycle-bin.service';
import { SettingsService } from '../settings/settings.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentRulesDto } from './dto/update-comment-rules.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
    private readonly operationLogsService: OperationLogsService,
    private readonly notificationsService: NotificationsService,
    private readonly recycleBinService: RecycleBinService,
  ) {}

  findAll() {
    return this.prisma.comment.findMany({
      orderBy: [{ parentId: 'asc' }, { createdAt: 'desc' }],
      include: {
        post: {
          select: {
            id: true,
            title: true,
          },
        },
        parent: {
          select: {
            id: true,
            author: true,
            content: true,
            approved: true,
          },
        },
      },
    });
  }

  async findConversations(keyword?: string, approved?: boolean): Promise<CommentConversation[]> {
    const all = await this.prisma.comment.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        post: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    const nodeMap = new Map(
      all.map((item) => [
        item.id,
        {
          ...item,
          replies: [] as typeof all,
        },
      ]),
    );

    const roots: Array<(typeof nodeMap extends Map<any, infer V> ? V : never)> = [];
    for (const item of nodeMap.values()) {
      if (item.parentId && nodeMap.has(item.parentId)) {
        nodeMap.get(item.parentId)!.replies.push(item);
      } else {
        roots.push(item);
      }
    }

    const search = keyword?.trim().toLowerCase();
    return roots
      .map((root) => {
        const replies = this.flattenReplies(root.replies);
        const allInConversation = [root, ...replies];
        const lastActivityAt = allInConversation.reduce(
          (latest, item) => (new Date(item.createdAt).getTime() > latest ? new Date(item.createdAt).getTime() : latest),
          new Date(root.createdAt).getTime(),
        );

        return {
          id: root.id,
          postId: root.postId,
          postTitle: root.post.title,
          rootComment: this.serializeComment(root),
          replies: replies.map((item) => this.serializeComment(item)),
          totalReplies: replies.length,
          pendingReplies: allInConversation.filter((item) => !item.approved).length,
          lastActivityAt: new Date(lastActivityAt).toISOString(),
        } satisfies CommentConversation;
      })
      .filter((conversation) => {
        const approvedMatched = approved === undefined ? true : conversation.pendingReplies === 0 ? approved : !approved;
        if (!approvedMatched) {
          return false;
        }

        if (!search) {
          return true;
        }

        return [
          conversation.postTitle,
          conversation.rootComment.author,
          conversation.rootComment.email,
          conversation.rootComment.content,
          ...conversation.replies.flatMap((reply) => [reply.author, reply.email, reply.content]),
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(search));
      })
      .sort((left, right) => new Date(right.lastActivityAt).getTime() - new Date(left.lastActivityAt).getTime());
  }

  async create(postId: string, dto: CreateCommentDto) {
    const rules = await this.settingsService.getCommentModerationRules();
    if (dto.content.trim().length < rules.minLength) {
      throw new BadRequestException(`评论内容至少需要 ${rules.minLength} 个字`);
    }

    const lowerContent = dto.content.trim().toLowerCase();
    const blockedWord = rules.blockedWords.find((item) => lowerContent.includes(item.toLowerCase()));
    if (blockedWord) {
      throw new BadRequestException(`评论内容包含敏感词：${blockedWord}`);
    }

    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: dto.parentId },
        select: { id: true, postId: true },
      });

      if (!parent || parent.postId !== postId) {
        throw new BadRequestException('回复的评论不存在');
      }
    }

    const emailDomain = dto.email.split('@').pop()?.toLowerCase() || '';
    const approved = rules.autoApproveDomains.includes(emailDomain);

    const created = await this.prisma.comment.create({
      data: {
        author: dto.author,
        email: dto.email,
        content: dto.content,
        approved,
        parentId: dto.parentId,
        postId,
      },
      include: {
        post: {
          select: {
            title: true,
          },
        },
      },
    });

    if (!approved) {
      await this.notificationsService.create({
        title: '有新评论待审核',
        content: `《${created.post.title}》收到来自 ${created.author} 的新评论。`,
        category: '评论',
        level: 'WARNING',
        entityType: 'comment',
        entityId: created.id,
        link: '/comments',
      });
    }

    return created;
  }

  getModerationRules() {
    return this.settingsService.getCommentModerationRules();
  }

  updateModerationRules(dto: UpdateCommentRulesDto, actor?: Pick<AuthUser, 'id' | 'name'> | null) {
    return this.settingsService.updateCommentModerationRules(dto, actor);
  }

  async update(id: string, dto: UpdateCommentDto, actor?: Pick<AuthUser, 'id' | 'name'> | null) {
    const item = await this.prisma.comment.update({
      where: { id },
      data: {
        approved: dto.approved,
      },
    });

    await this.operationLogsService.create({
      action: 'comments.update',
      targetType: 'comment',
      targetId: item.id,
      targetLabel: item.author,
      actorId: actor?.id,
      actorName: actor?.name,
      detail: {
        approved: item.approved,
      },
    });

    return item;
  }

  async remove(id: string, actor?: Pick<AuthUser, 'id' | 'name'> | null) {
    return this.recycleBinService.archiveComment(id, actor);
  }

  async quickReview(id: string, approved: boolean, actor?: Pick<AuthUser, 'id' | 'name'> | null) {
    const item = await this.prisma.comment.update({
      where: { id },
      data: { approved },
      include: {
        post: {
          select: {
            title: true,
          },
        },
      },
    });

    await this.operationLogsService.create({
      action: approved ? 'comments.approve' : 'comments.reject',
      targetType: 'comment',
      targetId: item.id,
      targetLabel: item.author,
      actorId: actor?.id,
      actorName: actor?.name,
      detail: {
        approved,
        postId: item.postId,
      },
    });

    await this.notificationsService.create({
      title: approved ? '评论已通过审核' : '评论已被驳回',
      content: `${actor?.name || '管理员'}已处理《${item.post.title}》下 ${item.author} 的评论。`,
      category: '评论',
      level: approved ? 'SUCCESS' : 'INFO',
      actorId: actor?.id,
      actorName: actor?.name,
      entityType: 'comment',
      entityId: item.id,
      link: '/comments',
    });

    return item;
  }

  like(id: string) {
    return this.prisma.comment.update({
      where: { id },
      data: { likes: { increment: 1 } },
    });
  }

  private flattenReplies(items: Array<any>) {
    const result: Array<any> = [];
    const walk = (nodes: Array<any>) => {
      for (const node of nodes) {
        result.push(node);
        if (node.replies?.length) {
          walk(node.replies);
        }
      }
    };
    walk(items);
    return result;
  }

  private serializeComment(item: {
    id: string;
    author: string;
    email: string;
    content: string;
    approved: boolean;
    parentId: string | null;
    postId: string;
    createdAt: Date;
  }) {
    return {
      id: item.id,
      author: item.author,
      email: item.email,
      content: item.content,
      approved: item.approved,
      parentId: item.parentId,
      postId: item.postId,
      createdAt: item.createdAt.toISOString(),
    };
  }
}

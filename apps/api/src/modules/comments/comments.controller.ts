import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PERMISSIONS, type AuthUser } from '@aurora/shared';

import { Authorize } from '../../common/decorators/authorize.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentRulesDto } from './dto/update-comment-rules.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentsService } from './comments.service';

function normalizeApproved(value: unknown) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }

  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  return value;
}

@ApiTags('Comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Authorize(PERMISSIONS.COMMENTS_VIEW)
  @Get()
  findAll() {
    return this.commentsService.findAll();
  }

  @Authorize(PERMISSIONS.COMMENTS_THREADS_VIEW)
  @Get('threads')
  findThreads(@Query('keyword') keyword?: string, @Query('approved') approved?: 'true' | 'false') {
    return this.commentsService.findConversations(
      keyword,
      approved === undefined ? undefined : approved === 'true',
    );
  }

  @Authorize(PERMISSIONS.COMMENTS_VIEW)
  @Get('rules')
  getRules() {
    return this.commentsService.getModerationRules();
  }

  @Post('post/:postId')
  create(@Param('postId') postId: string, @Body() dto: CreateCommentDto) {
    return this.commentsService.create(postId, dto);
  }

  @Patch(':id/like')
  like(@Param('id') id: string) {
    return this.commentsService.like(id);
  }

  @Authorize(PERMISSIONS.COMMENTS_MODERATE)
  @Patch('rules')
  updateRules(@Body() dto: UpdateCommentRulesDto, @CurrentUser() user: AuthUser) {
    return this.commentsService.updateModerationRules(dto, user);
  }

  @Authorize(PERMISSIONS.COMMENTS_MODERATE)
  @Patch(':id/review')
  quickReview(@Param('id') id: string, @Body('approved') approved: boolean, @CurrentUser() user: AuthUser) {
    return this.commentsService.quickReview(id, normalizeApproved(approved) as boolean, user);
  }

  @Authorize(PERMISSIONS.COMMENTS_MODERATE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCommentDto, @CurrentUser() user: AuthUser) {
    return this.commentsService.update(id, dto, user);
  }

  @Authorize(PERMISSIONS.COMMENTS_DELETE)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.commentsService.remove(id, user);
  }
}

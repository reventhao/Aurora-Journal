import { PERMISSIONS, type AuthUser } from '@aurora/shared';
import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Authorize } from '../../common/decorators/authorize.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { RestorePostRevisionDto } from './dto/restore-post-revision.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsService } from './posts.service';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  private assertCreatePermissions(dto: CreatePostDto, user: AuthUser) {
    if (dto.status === 'PUBLISHED' && !user.permissions.includes(PERMISSIONS.POSTS_PUBLISH)) {
      throw new ForbiddenException('当前账号没有发布文章的权限');
    }

    if (dto.featured && !user.permissions.includes(PERMISSIONS.POSTS_FEATURE)) {
      throw new ForbiddenException('当前账号没有设置精选文章的权限');
    }
  }

  private assertUpdatePermissions(dto: UpdatePostDto, user: AuthUser) {
    if (dto.status !== undefined && !user.permissions.includes(PERMISSIONS.POSTS_PUBLISH)) {
      throw new ForbiddenException('当前账号没有修改文章发布状态的权限');
    }

    if (dto.featured !== undefined && !user.permissions.includes(PERMISSIONS.POSTS_FEATURE)) {
      throw new ForbiddenException('当前账号没有修改文章精选状态的权限');
    }
  }

  @Authorize(PERMISSIONS.POSTS_VIEW)
  @Get()
  findAll(
    @Query() query: PaginationQueryDto,
    @Query('status') status?: 'DRAFT' | 'PUBLISHED',
    @Query('featured') featured?: 'true' | 'false',
    @Query('categoryId') categoryId?: string,
    @Query('tagId') tagId?: string,
  ) {
    return this.postsService.findAll(query.page, query.pageSize, {
      keyword: query.keyword,
      status,
      featured: featured === undefined ? undefined : featured === 'true',
      categoryId,
      tagId,
    });
  }

  @Authorize(PERMISSIONS.POSTS_VIEW)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Authorize(PERMISSIONS.POSTS_CREATE)
  @Post()
  create(@Body() dto: CreatePostDto, @CurrentUser() user: AuthUser) {
    this.assertCreatePermissions(dto, user);
    return this.postsService.create(dto, user);
  }

  @Authorize(PERMISSIONS.POSTS_UPDATE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePostDto, @CurrentUser() user: AuthUser) {
    this.assertUpdatePermissions(dto, user);
    return this.postsService.update(id, dto, user);
  }

  @Authorize(PERMISSIONS.POSTS_PUBLISH)
  @Patch(':id/status')
  toggleStatus(@Param('id') id: string, @Body('status') status: 'DRAFT' | 'PUBLISHED', @CurrentUser() user: AuthUser) {
    return this.postsService.toggleStatus(id, status, user);
  }

  @Authorize(PERMISSIONS.POSTS_FEATURE)
  @Patch(':id/featured')
  toggleFeatured(@Param('id') id: string, @Body('featured') featured: boolean, @CurrentUser() user: AuthUser) {
    return this.postsService.toggleFeatured(id, featured, user);
  }

  @Authorize(PERMISSIONS.POSTS_VIEW)
  @Get(':id/revisions')
  listRevisions(@Param('id') id: string) {
    return this.postsService.listRevisions(id);
  }

  @Authorize(PERMISSIONS.POSTS_UPDATE)
  @Post(':id/revisions/:revisionId/restore')
  restoreRevision(
    @Param('id') id: string,
    @Param('revisionId') revisionId: string,
    @Body() dto: RestorePostRevisionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.postsService.restoreRevision(id, revisionId, dto, user);
  }

  @Authorize(PERMISSIONS.POSTS_DELETE)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.postsService.remove(id, user);
  }
}

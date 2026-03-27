import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { PublicService } from './public.service';

@ApiTags('Public')
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('home')
  getHome() {
    return this.publicService.getHome();
  }

  @Get('categories')
  getCategories() {
    return this.publicService.getCategories();
  }

  @Get('tags')
  getTags() {
    return this.publicService.getTags();
  }

  @Get('posts')
  getPosts(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '9',
    @Query('keyword') keyword?: string,
    @Query('category') category?: string,
    @Query('tag') tag?: string,
  ) {
    return this.publicService.getPosts(Number(page), Number(pageSize), keyword, category, tag);
  }

  @Get('posts/:slug')
  getPostBySlug(@Param('slug') slug: string) {
    return this.publicService.getPostBySlug(slug);
  }

  @Get('posts/:slug/comments')
  getPostCommentsBySlug(@Param('slug') slug: string): Promise<unknown> {
    return this.publicService.getPostCommentsBySlug(slug);
  }

  @Get('settings')
  getSettings() {
    return this.publicService.getSiteSettings();
  }
}

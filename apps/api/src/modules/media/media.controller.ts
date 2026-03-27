import { PERMISSIONS, type AuthUser } from '@aurora/shared';
import { ConfigService } from '@nestjs/config';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'node:path';
import type { Request } from 'express';

import { Authorize } from '../../common/decorators/authorize.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { getAppBaseUrl, resolveRequestBaseUrl } from '../../common/utils/app-url';
import { CreateMediaFolderDto } from './dto/create-media-folder.dto';
import { UpdateMediaFolderDto } from './dto/update-media-folder.dto';
import { UpdateMediaMetaDto } from './dto/update-media-meta.dto';
import { MediaService } from './media.service';

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(
    private readonly mediaService: MediaService,
    private readonly configService: ConfigService,
  ) {}

  @Authorize(PERMISSIONS.MEDIA_VIEW)
  @Get()
  findAll(
    @Query() query: PaginationQueryDto,
    @Query('referenced') referenced?: 'true' | 'false',
    @Query('folderId') folderId?: string,
  ) {
    return this.mediaService.findAll(
      query.page,
      query.pageSize,
      query.keyword,
      referenced === undefined ? undefined : referenced === 'true',
      folderId,
    );
  }

  @Authorize(PERMISSIONS.MEDIA_VIEW)
  @Get('folders')
  listFolders() {
    return this.mediaService.listFolders();
  }

  @Authorize(PERMISSIONS.MEDIA_UPLOAD)
  @Post('folders')
  createFolder(@Body() dto: CreateMediaFolderDto, @CurrentUser() user: AuthUser) {
    return this.mediaService.createFolder(dto, user);
  }

  @Authorize(PERMISSIONS.MEDIA_UPLOAD)
  @Patch('folders/:id')
  updateFolder(@Param('id') id: string, @Body() dto: UpdateMediaFolderDto, @CurrentUser() user: AuthUser) {
    return this.mediaService.updateFolder(id, dto, user);
  }

  @Authorize(PERMISSIONS.MEDIA_DELETE)
  @Delete('folders/:id')
  removeFolder(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.mediaService.removeFolder(id, user);
  }

  @Authorize(PERMISSIONS.MEDIA_ANALYTICS_VIEW)
  @Get('analytics')
  getAnalytics() {
    return this.mediaService.getAnalytics();
  }

  @Authorize(PERMISSIONS.MEDIA_VIEW)
  @Get('external/search')
  searchExternal(
    @Query('provider') provider = 'pexels',
    @Query('keyword') keyword = '',
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '18',
  ) {
    return this.mediaService.searchExternal({
      provider,
      keyword,
      page: Number(page),
      pageSize: Number(pageSize),
    });
  }

  @Authorize(PERMISSIONS.MEDIA_UPLOAD)
  @ApiConsumes('multipart/form-data')
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_request, _file, callback) => {
          callback(null, join(process.cwd(), 'uploads'));
        },
        filename: (_request, file, callback) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          callback(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: AuthUser, @Req() request: Request) {
    const baseUrl = resolveRequestBaseUrl(request, getAppBaseUrl(this.configService));
    const url = `${baseUrl}/uploads/${file.filename}`;
    return this.mediaService.create({
      fileName: file.originalname,
      path: file.path,
      url,
      mimeType: file.mimetype,
      size: file.size,
    }, user);
  }

  @Authorize(PERMISSIONS.MEDIA_IMPORT)
  @Post('external/import')
  importExternal(
    @Body()
    payload: {
      provider?: string;
      fileName?: string;
      url: string;
      thumbUrl?: string;
    },
    @CurrentUser() user: AuthUser,
  ) {
    return this.mediaService.importExternal(payload, user);
  }

  @Authorize(PERMISSIONS.MEDIA_UPLOAD)
  @Patch(':id/meta')
  updateMeta(@Param('id') id: string, @Body() dto: UpdateMediaMetaDto, @CurrentUser() user: AuthUser) {
    return this.mediaService.updateMeta(id, dto, user);
  }

  @Authorize(PERMISSIONS.MEDIA_DELETE)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.mediaService.remove(id, user);
  }
}

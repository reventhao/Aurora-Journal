import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PERMISSIONS, type AuthUser } from '@aurora/shared';

import { Authorize } from '../../common/decorators/authorize.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagsService } from './tags.service';

@ApiTags('Tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Authorize(PERMISSIONS.TAGS_VIEW)
  @Get()
  findAll() {
    return this.tagsService.findAll();
  }

  @Authorize(PERMISSIONS.TAGS_MANAGE)
  @Post()
  create(@Body() dto: CreateTagDto) {
    return this.tagsService.create(dto);
  }

  @Authorize(PERMISSIONS.TAGS_MANAGE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTagDto) {
    return this.tagsService.update(id, dto);
  }

  @Authorize(PERMISSIONS.TAGS_MANAGE)
  @Patch(':id/visibility')
  toggleVisible(@Param('id') id: string, @Body('visible') visible: boolean) {
    return this.tagsService.toggleVisible(id, visible);
  }

  @Authorize(PERMISSIONS.TAGS_MANAGE)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.tagsService.remove(id, user);
  }
}

import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PERMISSIONS, type AuthUser } from '@aurora/shared';

import { Authorize } from '../../common/decorators/authorize.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoriesService } from './categories.service';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Authorize(PERMISSIONS.CATEGORIES_VIEW)
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Authorize(PERMISSIONS.CATEGORIES_MANAGE)
  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Authorize(PERMISSIONS.CATEGORIES_MANAGE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Authorize(PERMISSIONS.CATEGORIES_MANAGE)
  @Patch(':id/visibility')
  toggleVisible(@Param('id') id: string, @Body('visible') visible: boolean) {
    return this.categoriesService.toggleVisible(id, visible);
  }

  @Authorize(PERMISSIONS.CATEGORIES_MANAGE)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.categoriesService.remove(id, user);
  }
}

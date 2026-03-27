import { Injectable } from '@nestjs/common';
import type { AuthUser } from '@aurora/shared';

import { PrismaService } from '../prisma/prisma.service';
import { RecycleBinService } from '../recycle-bin/recycle-bin.service';
import { slugify } from '../../common/utils/slugify';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly recycleBinService: RecycleBinService,
  ) {}

  findAll() {
    return this.prisma.category.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { posts: true } } },
    });
  }

  create(dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        ...dto,
        slug: dto.slug || slugify(dto.name),
        visible: dto.visible ?? true,
      },
    });
  }

  update(id: string, dto: UpdateCategoryDto) {
    return this.prisma.category.update({
      where: { id },
      data: {
        ...dto,
        slug: dto.slug || (dto.name ? slugify(dto.name) : undefined),
      },
    });
  }

  toggleVisible(id: string, visible: boolean) {
    return this.prisma.category.update({
      where: { id },
      data: { visible },
    });
  }

  remove(id: string, user?: AuthUser) {
    return this.recycleBinService.archiveCategory(id, user);
  }
}

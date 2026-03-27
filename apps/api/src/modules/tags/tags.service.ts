import { Injectable } from '@nestjs/common';
import type { AuthUser } from '@aurora/shared';

import { PrismaService } from '../prisma/prisma.service';
import { RecycleBinService } from '../recycle-bin/recycle-bin.service';
import { slugify } from '../../common/utils/slugify';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly recycleBinService: RecycleBinService,
  ) {}

  findAll() {
    return this.prisma.tag.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { posts: true } } },
    });
  }

  create(dto: CreateTagDto) {
    return this.prisma.tag.create({
      data: {
        name: dto.name,
        slug: dto.slug || slugify(dto.name),
        color: dto.color || '#7c3aed',
        visible: dto.visible ?? true,
      },
    });
  }

  update(id: string, dto: UpdateTagDto) {
    return this.prisma.tag.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug || (dto.name ? slugify(dto.name) : undefined),
        color: dto.color,
        visible: dto.visible,
      },
    });
  }

  toggleVisible(id: string, visible: boolean) {
    return this.prisma.tag.update({
      where: { id },
      data: { visible },
    });
  }

  remove(id: string, user?: AuthUser) {
    return this.recycleBinService.archiveTag(id, user);
  }
}

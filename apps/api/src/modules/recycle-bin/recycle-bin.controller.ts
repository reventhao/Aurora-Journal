import { PERMISSIONS, type AuthUser } from '@aurora/shared';
import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Authorize } from '../../common/decorators/authorize.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { RecycleBinService } from './recycle-bin.service';

@ApiTags('RecycleBin')
@Controller('recycle-bin')
export class RecycleBinController {
  constructor(private readonly recycleBinService: RecycleBinService) {}

  @Authorize(PERMISSIONS.RECYCLE_BIN_VIEW)
  @Get()
  findAll(@Query() query: PaginationQueryDto, @Query('entityType') entityType?: string) {
    return this.recycleBinService.findAll(query.page, query.pageSize, query.keyword, entityType);
  }

  @Authorize(PERMISSIONS.RECYCLE_BIN_RESTORE)
  @Patch('batch/restore')
  restoreMany(@Body('ids') ids: string[], @CurrentUser() user: AuthUser) {
    return this.recycleBinService.restoreMany(ids, user);
  }

  @Authorize(PERMISSIONS.RECYCLE_BIN_RESTORE)
  @Patch(':id/restore')
  restore(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.recycleBinService.restore(id, user);
  }

  @Authorize(PERMISSIONS.RECYCLE_BIN_PURGE)
  @Delete('batch')
  purgeMany(@Body('ids') ids: string[], @CurrentUser() user: AuthUser) {
    return this.recycleBinService.purgeMany(ids, user);
  }

  @Authorize(PERMISSIONS.RECYCLE_BIN_PURGE)
  @Delete(':id')
  purge(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.recycleBinService.purge(id, user);
  }
}

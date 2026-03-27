import { PERMISSIONS } from '@aurora/shared';
import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Authorize } from '../../common/decorators/authorize.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Authorize(PERMISSIONS.NOTIFICATIONS_VIEW)
  @Get()
  findAll(@Query() query: PaginationQueryDto, @Query('unreadOnly') unreadOnly?: 'true' | 'false') {
    return this.notificationsService.findAll(query.page, query.pageSize, unreadOnly === 'true');
  }

  @Authorize(PERMISSIONS.NOTIFICATIONS_VIEW)
  @Get('summary')
  getSummary() {
    return this.notificationsService.getSummary();
  }

  @Authorize(PERMISSIONS.NOTIFICATIONS_VIEW)
  @Patch(':id/read')
  markRead(@Param('id') id: string) {
    return this.notificationsService.markRead(id);
  }

  @Authorize(PERMISSIONS.NOTIFICATIONS_VIEW)
  @Patch('read-all')
  markAllRead() {
    return this.notificationsService.markAllRead();
  }
}

import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PERMISSIONS, type AuthUser } from '@aurora/shared';

import { Authorize } from '../../common/decorators/authorize.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SettingsService } from './settings.service';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Authorize(PERMISSIONS.SETTINGS_VIEW)
  @Get('site')
  getSiteSettings() {
    return this.settingsService.getSiteSettings();
  }

  @Authorize(PERMISSIONS.SETTINGS_UPDATE)
  @Patch('site')
  updateSiteSettings(@Body() dto: UpdateSettingsDto, @CurrentUser() user: AuthUser) {
    return this.settingsService.updateSiteSettings(dto, user);
  }

  @Authorize(PERMISSIONS.SETTINGS_VERSIONS_VIEW)
  @Get('versions')
  listVersions(@Query() query: PaginationQueryDto, @Query('settingKey') settingKey?: string) {
    return this.settingsService.listVersions(settingKey || 'site', query.page, query.pageSize);
  }

  @Authorize(PERMISSIONS.SETTINGS_VERSIONS_RESTORE)
  @Patch('versions/:id/restore')
  restoreVersion(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.settingsService.restoreVersion(id, user);
  }
}

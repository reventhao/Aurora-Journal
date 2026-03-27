import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@aurora/shared';

import { Authorize } from '../../common/decorators/authorize.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Authorize(PERMISSIONS.DASHBOARD_VIEW)
  @Get('metrics')
  getMetrics() {
    return this.dashboardService.getMetrics();
  }
}

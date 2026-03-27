import { PERMISSIONS } from '@aurora/shared';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Authorize } from '../../common/decorators/authorize.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { OperationLogsService } from './operation-logs.service';

@ApiTags('OperationLogs')
@Controller('operation-logs')
export class OperationLogsController {
  constructor(private readonly operationLogsService: OperationLogsService) {}

  @Authorize(PERMISSIONS.SETTINGS_VIEW)
  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.operationLogsService.findAll(query.page, query.pageSize, query.keyword);
  }
}

import { Controller, Get, Query } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { Roles, Role } from '../common/decorators/roles.decorator';

@Controller('admin')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('metrics')
  @Roles(Role.admin)
  getMetrics(@Query('from') from?: string, @Query('to') to?: string) {
    return this.metricsService.getMetrics(from, to);
  }
}

import { Controller, Get, Query } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { Roles, Role } from '../common/decorators/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Metrics')
@ApiCookieAuth('cookie-auth')
@Controller('admin')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('metrics')
  @Roles(Role.admin)
  @ApiOperation({
    summary: 'Obtener métricas del sistema (Admin)',
    description: `Devuelve estadísticas generales del sistema incluyendo:
    - Total de usuarios por rol
    - Total de prescripciones (consumidas y activas)
    - Prescripciones por día en el rango de fechas especificado
    - Top 5 doctores con más prescripciones`,
  })
  @ApiQuery({
    name: 'from',
    required: false,
    type: String,
    description: 'Fecha inicial en formato ISO (YYYY-MM-DD)',
    example: '2025-01-01',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    type: String,
    description: 'Fecha final en formato ISO (YYYY-MM-DD)',
    example: '2025-12-31',
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas del sistema',
    schema: {
      example: {
        users: {
          total: 150,
          byRole: {
            admin: 2,
            doctor: 48,
            patient: 100,
          },
        },
        prescriptions: {
          total: 450,
          consumed: 380,
          active: 70,
          byDay: [
            { date: '2025-12-01', count: 15 },
            { date: '2025-12-02', count: 12 },
          ],
        },
        topDoctors: [
          {
            id: 'clg1h2j3k4l5m6n7o8p9',
            name: 'Dr. Juan Pérez',
            prescriptionCount: 45,
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No autorizado - requiere rol admin' })
  getMetrics(@Query('from') from?: string, @Query('to') to?: string) {
    return this.metricsService.getMetrics(from, to);
  }
}

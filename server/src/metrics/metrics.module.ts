import { Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MetricsController],
  providers: [MetricsService],
})
export class MetricsModule {}

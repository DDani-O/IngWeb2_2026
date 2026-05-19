// src/modules/analytics/analytics.module.ts

import { Module } from '@nestjs/common';
import { SupabaseModule } from '../../common/supabase/supabase.module';
import { CategoriesModule } from '../categories/categories.module';
import { AnalyticsController } from './analytics.controller';
import { ConsumptionAnalyticsService } from './services/consumption-analytics.service';
import { AnomalyDetectionService } from './services/anomaly-detection.service';

@Module({
  imports: [SupabaseModule, CategoriesModule],
  controllers: [AnalyticsController],
  providers: [ConsumptionAnalyticsService, AnomalyDetectionService],
  exports: [ConsumptionAnalyticsService, AnomalyDetectionService],
})
export class AnalyticsModule {}

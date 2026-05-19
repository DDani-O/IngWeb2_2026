// src/modules/analytics/analytics.controller.ts

import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ConsumptionAnalyticsService } from './services/consumption-analytics.service';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/auth.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('cliente')
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly consumptionAnalytics: ConsumptionAnalyticsService,
  ) {}

  /**
   * GET /api/v1/analytics/consumption
   * Análisis de consumo personal (endpoint interno, se usa vía /users/me/consumption-analysis)
   */
  @Get('consumption')
  async getConsumptionAnalysis(
    @CurrentUser() user: JwtPayload,
    @Query('monthsBack') monthsBack?: string,
  ) {
    const months = monthsBack ? parseInt(monthsBack, 10) : 12;

    if (isNaN(months) || months < 1 || months > 60) {
      throw new BadRequestException(
        'monthsBack debe ser un número entre 1 y 60',
      );
    }

    return this.consumptionAnalytics.getConsumptionAnalysis(user.sub, months);
  }
}

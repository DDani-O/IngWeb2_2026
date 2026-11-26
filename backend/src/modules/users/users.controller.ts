import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  CurrentUser,
  JwtAuthGuard,
  JwtPayload,
  Roles,
  RolesGuard,
} from "../../common/auth";
import { ConsumptionAnalyticsService } from "../analytics/services/consumption-analytics.service";

/**
 * Pendiente de la fase I3: el análisis se reescribe con las reglas de la spec §10.6
 * y pasa a `GET /analysis/me`. Mientras tanto se mantiene la ruta heredada.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("cliente")
@Controller("users")
export class UsersController {
  constructor(
    private readonly consumptionAnalytics: ConsumptionAnalyticsService,
  ) {}

  @Get("me/consumption-analysis")
  async getConsumptionAnalysis(
    @CurrentUser() user: JwtPayload,
    @Query("monthsBack") monthsBack?: string,
  ) {
    const months = monthsBack ? parseInt(monthsBack, 10) : 12;
    return this.consumptionAnalytics.getConsumptionAnalysis(user.sub, months);
  }
}

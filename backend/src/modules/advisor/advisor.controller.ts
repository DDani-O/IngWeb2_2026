import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AdvisorService } from "./advisor.service";
import { CurrentUser, JwtPayload, JwtAuthGuard, Roles, RolesGuard } from "../../common/auth";
import { AdvisorClientsQueryDto } from "./dto/advisor-clients-query.dto";
import { AssignClientProfileDto } from "./dto/assign-client-profile.dto";
import { ConsumptionAnalyticsService } from "../analytics/services/consumption-analytics.service";

/**
 * Rutas heredadas del panel del asesor. Se reemplazan en la fase I3 por `/clients`,
 * `/clients/:id` y `/analysis/*` (spec §10.6–10.7) y este módulo se elimina.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("asesor")
@Controller("advisor")
export class AdvisorController {
  constructor(
    private readonly advisorService: AdvisorService,
    private readonly consumptionAnalytics: ConsumptionAnalyticsService,
  ) {}

  @Get("dashboard")
  getDashboard(@CurrentUser() user: JwtPayload) {
    return this.advisorService.getDashboard(user);
  }

  @Get("clients")
  getClients(
    @CurrentUser() user: JwtPayload,
    @Query() query: AdvisorClientsQueryDto,
  ) {
    return this.advisorService.getClients(user, query);
  }

  @Get("clients/:clientId")
  getClient(
    @CurrentUser() user: JwtPayload,
    @Param("clientId", new ParseUUIDPipe()) clientId: string,
  ) {
    return this.advisorService.getClientDetail(user, clientId);
  }

  @Get("reports")
  getReports(@CurrentUser() user: JwtPayload) {
    return this.advisorService.getReports(user);
  }

  @Get("clients/:clientId/consumption-analysis")
  async getClientConsumptionAnalysis(
    @CurrentUser() user: JwtPayload,
    @Param("clientId", new ParseUUIDPipe()) clientId: string,
    @Query("monthsBack") monthsBack?: string,
  ) {
    // Verify advisor is assigned to this client
    await this.advisorService.verifyClientAssignment(user.sub, clientId);

    const months = monthsBack ? parseInt(monthsBack, 10) : 12;
    return this.consumptionAnalytics.getConsumptionAnalysis(clientId, months);
  }

  @Patch("clients/:clientId/profile")
  assignClientProfile(
    @CurrentUser() user: JwtPayload,
    @Param("clientId", new ParseUUIDPipe()) clientId: string,
    @Body() dto: AssignClientProfileDto,
  ) {
    return this.advisorService.assignClientProfile(user, clientId, dto);
  }

  @Get("risk-assessment")
  async getRiskAssessment(@CurrentUser() user: JwtPayload) {
    return this.advisorService.getRiskAssessment(user);
  }
}

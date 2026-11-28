import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { AssignmentsService } from "../../common/assignments/assignments.service";
import {
  CurrentUser,
  JwtAuthGuard,
  JwtPayload,
  Roles,
  RolesGuard,
} from "../../common/auth";
import { AnalysisService } from "./analysis.service";

/** Análisis de consumo (spec §10.6). */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("analysis")
export class AnalysisController {
  constructor(
    private readonly analysisService: AnalysisService,
    private readonly assignments: AssignmentsService,
  ) {}

  /** GET /analysis/me: análisis propio del cliente. */
  @Roles("cliente")
  @Get("me")
  getMine(@CurrentUser() user: JwtPayload) {
    return this.analysisService.getClientAnalysis(user.sub);
  }

  @Roles("asesor")
  /** GET /analysis/advisor/summary: resumen de la cartera del asesor. */
  @Get("advisor/summary")
  getAdvisorSummary(@CurrentUser() user: JwtPayload) {
    return this.analysisService.getAdvisorSummary(user.sub);
  }

  /** GET /analysis/clients/:id: análisis de un cliente del asesor (403 si no está asignado). */
  @Roles("asesor")
  @Get("clients/:id")
  async getForClient(
    @CurrentUser() user: JwtPayload,
    @Param("id") clientId: string,
  ) {
    await this.assignments.assertAssigned(user.sub, clientId);
    return this.analysisService.getClientAnalysis(clientId);
  }
}

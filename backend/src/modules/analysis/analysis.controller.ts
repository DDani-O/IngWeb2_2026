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

  @Roles("cliente")
  @Get("me")
  getMine(@CurrentUser() user: JwtPayload) {
    return this.analysisService.getClientAnalysis(user.sub);
  }

  @Roles("asesor")
  @Get("advisor/summary")
  getAdvisorSummary(@CurrentUser() user: JwtPayload) {
    return this.analysisService.getAdvisorSummary(user.sub);
  }

  /** 403 si el cliente no está asignado al asesor. */
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

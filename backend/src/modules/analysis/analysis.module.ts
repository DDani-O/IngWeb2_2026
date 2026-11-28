/** Módulo del análisis de consumo: reglas, perfil de gasto y resumen del asesor (exporta el servicio a `users` y `clients`). */
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AssignmentsModule } from "../../common/assignments/assignments.module";
import { SupabaseModule } from "../../common/supabase/supabase.module";
import { AnalysisController } from "./analysis.controller";
import { AnalysisService } from "./analysis.service";

/** Controller, servicios y dependencias del dominio. */
@Module({
  imports: [ConfigModule, SupabaseModule, AssignmentsModule],
  controllers: [AnalysisController],
  providers: [AnalysisService],
  exports: [AnalysisService],
})
export class AnalysisModule {}

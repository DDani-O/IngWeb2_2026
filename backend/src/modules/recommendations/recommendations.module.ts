/** Módulo de recomendaciones financieras del asesor al cliente. */
import { Module } from "@nestjs/common";
import { SupabaseModule } from "../../common/supabase/supabase.module";
import { AssignmentsModule } from "../../common/assignments/assignments.module";
import { RecommendationsController } from "./recommendations.controller";
import { RecommendationsService } from "./recommendations.service";

/** Controller, servicios y dependencias del dominio. */
@Module({
  imports: [SupabaseModule, AssignmentsModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
})
export class RecommendationsModule {}

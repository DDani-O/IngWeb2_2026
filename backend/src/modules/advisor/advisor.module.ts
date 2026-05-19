import { Module } from "@nestjs/common";
import { SupabaseModule } from "../../common/supabase/supabase.module";
import { AnalyticsModule } from "../analytics/analytics.module";
import { AdvisorController } from "./advisor.controller";
import { AdvisorService } from "./advisor.service";

@Module({
  imports: [SupabaseModule, AnalyticsModule],
  controllers: [AdvisorController],
  providers: [AdvisorService],
  exports: [AdvisorService], // ← Exportar para que otros módulos lo usen
})
export class AdvisorModule {}

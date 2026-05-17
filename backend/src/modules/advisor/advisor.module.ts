import { Module } from "@nestjs/common";
import { SupabaseModule } from "../../common/supabase/supabase.module";
import { AdvisorController } from "./advisor.controller";
import { AdvisorService } from "./advisor.service";

@Module({
  imports: [SupabaseModule],
  controllers: [AdvisorController],
  providers: [AdvisorService],
})
export class AdvisorModule {}

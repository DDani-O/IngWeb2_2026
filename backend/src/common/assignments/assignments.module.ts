import { Module } from "@nestjs/common";
import { SupabaseModule } from "../supabase/supabase.module";
import { AssignmentsService } from "./assignments.service";

@Module({
  imports: [SupabaseModule],
  providers: [AssignmentsService],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}

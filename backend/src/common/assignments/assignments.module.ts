/** Módulo del control de asignación asesor ↔ cliente, compartido por los dominios del asesor. */
import { Module } from "@nestjs/common";
import { SupabaseModule } from "../supabase/supabase.module";
import { AssignmentsService } from "./assignments.service";

/** Exporta `AssignmentsService`. */
@Module({
  imports: [SupabaseModule],
  providers: [AssignmentsService],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}

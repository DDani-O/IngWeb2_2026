/** Módulo de gastos del cliente (exporta el servicio para la vista del asesor). */
import { Module } from "@nestjs/common";
import { SupabaseModule } from "../../common/supabase/supabase.module";
import { ExpensesController } from "./expenses.controller";
import { ExpensesService } from "./expenses.service";

/** Controller, servicios y dependencias del dominio. */
@Module({
  imports: [SupabaseModule],
  controllers: [ExpensesController],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}

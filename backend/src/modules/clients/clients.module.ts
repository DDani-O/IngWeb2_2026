/** Módulo de la cartera del asesor: clientes asignados, su detalle, sus gastos y la elección de su perfil. */
import { Module } from "@nestjs/common";
import { AssignmentsModule } from "../../common/assignments/assignments.module";
import { SupabaseModule } from "../../common/supabase/supabase.module";
import { AnalysisModule } from "../analysis/analysis.module";
import { ExpensesModule } from "../expenses/expenses.module";
import { UsersModule } from "../users/users.module";
import { ClientsController } from "./clients.controller";
import { ClientsService } from "./clients.service";

/** Controller, servicios y dependencias del dominio. */
@Module({
  imports: [
    SupabaseModule,
    AssignmentsModule,
    AnalysisModule,
    ExpensesModule,
    UsersModule,
  ],
  controllers: [ClientsController],
  providers: [ClientsService],
})
export class ClientsModule {}

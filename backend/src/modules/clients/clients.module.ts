import { Module } from "@nestjs/common";
import { AssignmentsModule } from "../../common/assignments/assignments.module";
import { SupabaseModule } from "../../common/supabase/supabase.module";
import { AnalysisModule } from "../analysis/analysis.module";
import { ExpensesModule } from "../expenses/expenses.module";
import { UsersModule } from "../users/users.module";
import { ClientsController } from "./clients.controller";
import { ClientsService } from "./clients.service";

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

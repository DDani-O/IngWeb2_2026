import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { ExpensesModule } from "./modules/expenses/expenses.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { TicketsModule } from "./modules/tickets/tickets.module";
import { ClientsModule } from "./modules/clients/clients.module";
import { RecommendationsModule } from "./modules/recommendations/recommendations.module";
import { AnalysisModule } from "./modules/analysis/analysis.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    ExpensesModule,
    CategoriesModule,
    TicketsModule,
    ClientsModule,
    RecommendationsModule,
    AnalysisModule,
  ],
})
export class AppModule {}

import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { ExpensesModule } from "./modules/expenses/expenses.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { AdvisorModule } from "./modules/advisor/advisor.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    ExpensesModule,
    CategoriesModule,
    AdvisorModule,
  ],
})
export class AppModule {}

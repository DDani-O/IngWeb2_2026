import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./modules/auth/auth.module";
import { ExpensesModule } from "./modules/expenses/expenses.module";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, ExpensesModule],
})
export class AppModule {}

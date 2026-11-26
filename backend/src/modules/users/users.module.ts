import { Module } from "@nestjs/common";
import { SupabaseModule } from "../../common/supabase/supabase.module";
import { AnalysisModule } from "../analysis/analysis.module";
import { UsersService } from "./users.service";

/** Cuentas de usuario. Sin rutas propias: las expone `auth` (`/auth/me`, `/auth/profile`). */
@Module({
  imports: [SupabaseModule, AnalysisModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

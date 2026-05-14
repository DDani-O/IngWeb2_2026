import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { supabaseProvider } from "./supabase.provider";

@Module({
  imports: [ConfigModule],
  providers: [supabaseProvider],
  exports: [supabaseProvider],
})
export class SupabaseModule {}

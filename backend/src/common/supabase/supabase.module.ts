import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { supabaseProvider, supabasePublicProvider } from "./supabase.provider";

@Module({
  imports: [ConfigModule],
  providers: [supabaseProvider, supabasePublicProvider],
  exports: [supabaseProvider, supabasePublicProvider],
})
export class SupabaseModule {}

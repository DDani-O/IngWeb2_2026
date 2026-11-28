/** Módulo que provee los dos clientes de Supabase a los módulos de dominio. */
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { supabaseProvider, supabasePublicProvider } from "./supabase.provider";

/** Exporta el cliente service role y el público (anon). */
@Module({
  imports: [ConfigModule],
  providers: [supabaseProvider, supabasePublicProvider],
  exports: [supabaseProvider, supabasePublicProvider],
})
export class SupabaseModule {}

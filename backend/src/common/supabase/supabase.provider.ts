/**
 * Clientes de Supabase. El de service role saltea RLS: por eso la autorización y la
 * pertenencia se controlan en los servicios de Nest. El público (anon) solo lo usa
 * `AuthService` para el login con contraseña de Supabase Auth.
 */
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { ConfigService } from "@nestjs/config";

export const SUPABASE_CLIENT = "SUPABASE_CLIENT";
export const SUPABASE_PUBLIC_CLIENT = "SUPABASE_PUBLIC_CLIENT";

/** Cliente con la service key (todas las lecturas y escrituras de la API). */
export const supabaseProvider = {
  provide: SUPABASE_CLIENT,
  useFactory: (configService: ConfigService): SupabaseClient => {
    const url = configService.get<string>("SUPABASE_URL");
    const serviceKey = configService.get<string>("SUPABASE_SERVICE_KEY");

    if (!url || !serviceKey) {
      throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY en el .env.");
    }

    return createClient(url, serviceKey);
  },
  inject: [ConfigService],
};

/** Cliente con la anon key, para validar email y contraseña en el login. */
export const supabasePublicProvider = {
  provide: SUPABASE_PUBLIC_CLIENT,
  useFactory: (configService: ConfigService): SupabaseClient => {
    const url = configService.get<string>("SUPABASE_URL");
    const anonKey = configService.get<string>("SUPABASE_ANON_KEY");

    if (!url || !anonKey) {
      throw new Error("Faltan SUPABASE_URL o SUPABASE_ANON_KEY en el .env.");
    }

    return createClient(url, anonKey);
  },
  inject: [ConfigService],
};

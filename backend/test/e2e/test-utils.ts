import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { SupabaseClient } from "@supabase/supabase-js";
import request from "supertest";
import { AppModule } from "../../src/app.module";
import { API_PREFIX, configureApp } from "../../src/app.setup";
import { SUPABASE_CLIENT } from "../../src/common/supabase/supabase.provider";

/**
 * Los tests e2e corren contra un proyecto de Supabase real (el del `.env`): crean sus
 * propios usuarios y los borran al terminar. Usar un proyecto de prueba, no el de producción.
 */

export const TEST_PASSWORD = "Prueba1234";

/** Levanta la app con la misma configuración que `main.ts` (prefijo, validación y errores). */
export async function createTestApp(): Promise<{
  app: INestApplication;
  supabase: SupabaseClient;
}> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleFixture.createNestApplication();
  configureApp(app);
  await app.init();
  return { app, supabase: app.get(SUPABASE_CLIENT) };
}

/** Atajo para pedir rutas con el prefijo `/api/v1`. */
export function api(app: INestApplication) {
  const server = app.getHttpServer();
  const url = (path: string) => `/${API_PREFIX}${path}`;
  return {
    get: (path: string) => request(server).get(url(path)),
    post: (path: string) => request(server).post(url(path)),
    put: (path: string) => request(server).put(url(path)),
    delete: (path: string) => request(server).delete(url(path)),
  };
}

export interface TestAccount {
  id: string;
  token: string;
  email: string;
}

/** Registra una cuenta por la API y devuelve su id y token. */
export async function registerAccount(
  app: INestApplication,
  rol: "cliente" | "asesor",
  prefix: string,
): Promise<TestAccount> {
  const email = generateTestEmail(prefix);
  const body: Record<string, string> = {
    nombre_completo: `Test ${prefix}`,
    email,
    password: TEST_PASSWORD,
    rol,
  };
  if (rol === "asesor") {
    body.matricula = `MAT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    body.especialidad = "Finanzas personales";
  }

  const res = await api(app).post("/auth/register").send(body);
  if (res.status !== 201) {
    throw new Error(`Registro de ${rol} fallido: ${JSON.stringify(res.body)}`);
  }
  return { id: res.body.usuario.id, token: res.body.token, email };
}

/**
 * Deja al cliente asignado solo al asesor dado (el registro lo asigna automáticamente
 * al asesor con más capacidad libre, que puede ser cualquiera).
 */
export async function assignClient(
  supabase: SupabaseClient,
  advisorId: string,
  clientId: string,
) {
  await supabase
    .from("asignaciones_de_clientes")
    .update({ activo: false })
    .eq("cliente_id", clientId);
  // (asesor_id, cliente_id) es único: si el registro ya lo asignó a este asesor, se reactiva.
  const { error } = await supabase
    .from("asignaciones_de_clientes")
    .upsert(
      { asesor_id: advisorId, cliente_id: clientId, activo: true },
      { onConflict: "asesor_id,cliente_id" },
    );
  if (error) {
    throw new Error(`Asignación fallida: ${error.message}`);
  }
}

/**
 * Borra un usuario de prueba de las tablas de la aplicación y de Supabase Auth,
 * para que los tests sean repetibles y no dejen datos basura.
 */
export async function cleanupTestUser(
  supabase: SupabaseClient,
  userId?: string,
) {
  if (!userId) return;

  try {
    const { data: tickets } = await supabase
      .from("tickets")
      .select("id")
      .eq("cliente_id", userId);
    const ticketIds = (tickets ?? []).map((ticket) => ticket.id);
    if (ticketIds.length) {
      await supabase.from("analisis_ocr").delete().in("ticket_id", ticketIds);
    }

    await supabase
      .from("asignaciones_de_clientes")
      .delete()
      .or(`asesor_id.eq.${userId},cliente_id.eq.${userId}`);
    await supabase
      .from("recomendaciones_financieras")
      .delete()
      .or(`asesor_id.eq.${userId},cliente_id.eq.${userId}`);
    await supabase
      .from("clasificacion_de_perfil")
      .delete()
      .eq("cliente_id", userId);
    await supabase.from("gastos").delete().eq("cliente_id", userId);
    await supabase.from("tickets").delete().eq("cliente_id", userId);
    await supabase.from("perfiles_usuarios").delete().eq("usuario_id", userId);
    await supabase.from("perfiles_asesores").delete().eq("usuario_id", userId);
    await supabase.from("usuarios").delete().eq("id", userId);

    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      console.warn(
        `[Cleanup] Error eliminando usuario de auth ${userId}:`,
        error.message,
      );
    }
  } catch (err) {
    console.error(`[Cleanup] Error fatal al limpiar usuario ${userId}:`, err);
  }
}

/** Email único por test para evitar conflictos de duplicidad. */
export function generateTestEmail(prefix: string) {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 1000)}@test.com`;
}

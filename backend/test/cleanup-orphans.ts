import { createClient } from "@supabase/supabase-js";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../src/app.module";

async function cleanupOrphans() {
  console.log("--- Iniciando limpieza de usuarios de prueba ---");

  // Levantamos el contexto de Nest para obtener las variables de entorno (.env)
  const app = await NestFactory.createApplicationContext(AppModule);
  const configService = app.get(ConfigService);

  const supabaseUrl = configService.get<string>("SUPABASE_URL");
  const supabaseServiceKey = configService.get<string>("SUPABASE_SERVICE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Error: No se encontraron las credenciales de Supabase en el .env");
    await app.close();
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // 1. Obtener todos los usuarios registrados en Auth
  const { data, error: listError } = await supabase.auth.admin.listUsers();

  if (listError || !data?.users) {
    console.error("Error listando usuarios:", listError);
    await app.close();
    return;
  }

  const users = data.users;

  // Filtrar emails de prueba generados por los tests
  const testUsers = users.filter(u =>
    u.email?.endsWith("@test.com") ||
    u.email?.includes("advisor") ||
    u.email?.includes("client") ||
    u.email?.includes("auth.user") ||
    u.email?.includes("expenses") ||
    u.email?.includes("users.test") ||
    u.email?.includes("example.com")
  );

  console.log(`Se encontraron ${testUsers.length} usuarios huérfanos.`);

  for (const user of testUsers) {
    console.log(`Eliminando: ${user.email} (${user.id})...`);

    try {
      // Eliminar datos en cascada manual (limpieza profunda)
      await supabase.from("asignaciones_de_clientes").delete().or(`asesor_id.eq.${user.id},cliente_id.eq.${user.id}`);
      await supabase.from("recomendaciones_financieras").delete().or(`asesor_id.eq.${user.id},cliente_id.eq.${user.id}`);
      await supabase.from("mensajes_asesor").delete().or(`asesor_id.eq.${user.id},cliente_id.eq.${user.id}`);
      await supabase.from("gastos").delete().eq("cliente_id", user.id);
      await supabase.from("perfiles_usuarios").delete().eq("usuario_id", user.id);
      await supabase.from("perfiles_asesores").delete().eq("usuario_id", user.id);
      await supabase.from("usuarios").delete().eq("id", user.id);

      // Eliminar definitivamente de Supabase Auth
      await supabase.auth.admin.deleteUser(user.id);
    } catch (e: any) {
      console.error(`  Error procesando ${user.email}:`, e.message);
    }
  }

  console.log("--- Limpieza completada ---");
  await app.close();
}

cleanupOrphans();

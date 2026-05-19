import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Utilidad para limpiar usuarios de prueba tanto de las tablas de la base de datos como de Supabase Auth.
 * Esta función asegura que los tests sean idempotentes y no dejen datos basura.
 *
 * @param supabase Cliente de Supabase con privilegios de administrador (service role).
 * @param userId ID del usuario a eliminar.
 */
export async function cleanupTestUser(supabase: SupabaseClient, userId: string) {
  if (!userId) return;

  try {
    // 1. Eliminar datos de las tablas de la aplicación.
    // Se eliminan registros donde el usuario sea cliente o asesor en relaciones.
    await supabase.from('asignaciones_de_clientes').delete().or(`asesor_id.eq.${userId},cliente_id.eq.${userId}`);
    await supabase.from('recomendaciones_financieras').delete().or(`asesor_id.eq.${userId},cliente_id.eq.${userId}`);
    await supabase.from('gastos').delete().eq('cliente_id', userId);
    await supabase.from('perfiles_usuarios').delete().eq('usuario_id', userId);
    await supabase.from('perfiles_asesores').delete().eq('usuario_id', userId);
    await supabase.from('usuarios').delete().eq('id', userId);

    // 2. Eliminar el usuario de la autenticación de Supabase (requiere service_role).
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      console.warn(`[Cleanup] Error eliminando usuario de auth ${userId}:`, error.message);
    }
  } catch (err) {
    console.error(`[Cleanup] Error fatal al limpiar usuario ${userId}:`, err);
  }
}

/**
 * Genera un correo electrónico único para las pruebas para evitar conflictos de duplicidad.
 * Combina un prefijo con la marca de tiempo actual y un número aleatorio.
 *
 * @param prefix Prefijo para identificar el tipo de test (ej. 'auth.user').
 * @returns Un string con el formato: prefix.timestamp.random@test.com
 */
export function generateTestEmail(prefix: string) {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 1000)}@test.com`;
}

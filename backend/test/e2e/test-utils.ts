import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Utility to clean up test users from both Auth and Public tables.
 * This ensures tests are idempotent and don't leak data.
 */
export async function cleanupTestUser(supabase: SupabaseClient, userId: string) {
  if (!userId) return;

  try {
    // 1. Delete from application tables (cascade might not be enough depending on RLS/FKs)
    await supabase.from('asignaciones_de_clientes').delete().or(`asesor_id.eq.${userId},cliente_id.eq.${userId}`);
    await supabase.from('recomendaciones_financieras').delete().or(`asesor_id.eq.${userId},cliente_id.eq.${userId}`);
    await supabase.from('mensajes_asesor').delete().or(`asesor_id.eq.${userId},cliente_id.eq.${userId}`);
    await supabase.from('gastos').delete().eq('cliente_id', userId);
    await supabase.from('perfiles_usuarios').delete().eq('usuario_id', userId);
    await supabase.from('perfiles_asesores').delete().eq('usuario_id', userId);
    await supabase.from('usuarios').delete().eq('id', userId);

    // 2. Delete from Auth (requires service role / admin client)
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      console.warn(`[Cleanup] Error deleting auth user ${userId}:`, error.message);
    }
  } catch (err) {
    console.error(`[Cleanup] Fatal error cleaning up user ${userId}:`, err);
  }
}

/**
 * Generates a unique email for tests to avoid conflicts.
 */
export function generateTestEmail(prefix: string) {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 1000)}@test.com`;
}

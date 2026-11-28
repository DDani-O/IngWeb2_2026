import { Inject, Injectable, Logger } from "@nestjs/common";
import { SupabaseClient } from "@supabase/supabase-js";
import { internalError } from "../../common/errors";
import { SUPABASE_CLIENT } from "../../common/supabase/supabase.provider";

/** Elemento de `GET /categories` (contrato §3.2, backend/README.md). */
export interface Categoria {
  id: string;
  nombre: string;
  icono: string;
}

/** Elemento de `GET /spending-profiles` (contrato §3.2, backend/README.md). */
export interface PerfilDeGastoCatalogo {
  id: string;
  nombre: string;
  descripcion: string;
}

/**
 * Catálogos globales de solo lectura: categorías de gasto y perfiles de gasto.
 */
@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  /** Categorías globales, por nombre. */
  async listCategories(): Promise<Categoria[]> {
    const { data, error } = await this.supabase
      .from("categorias_de_gasto")
      .select("id, nombre, icono")
      .order("nombre", { ascending: true });

    if (error) {
      this.logger.error(`categorias_de_gasto: ${error.message}`);
      throw internalError("No se pudieron obtener las categorias.");
    }
    return data ?? [];
  }

  /** Perfiles activos, del más austero al más gastador (`criterio_regla.discrecional_max`). */
  async listSpendingProfiles(): Promise<PerfilDeGastoCatalogo[]> {
    const { data, error } = await this.supabase
      .from("perfiles_de_gasto")
      .select("id, nombre, descripcion, criterio_regla")
      .eq("activo", true);

    if (error) {
      this.logger.error(`perfiles_de_gasto: ${error.message}`);
      throw internalError("No se pudieron obtener los perfiles de gasto.");
    }

    const threshold = (rule: unknown) => {
      const value = Number(
        (rule as { discrecional_max?: unknown } | null)?.discrecional_max,
      );
      return Number.isFinite(value) ? value : Number.POSITIVE_INFINITY;
    };

    return (data ?? [])
      .sort(
        (a, b) =>
          threshold(a.criterio_regla) - threshold(b.criterio_regla) ||
          a.nombre.localeCompare(b.nombre),
      )
      .map(({ id, nombre, descripcion }) => ({
        id,
        nombre,
        descripcion: descripcion ?? "",
      }));
  }
}

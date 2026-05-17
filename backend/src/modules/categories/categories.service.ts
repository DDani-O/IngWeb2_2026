import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_CLIENT } from "../../common/supabase/supabase.provider";
import { CategoryDto } from "./dto/category.dto";

@Injectable()
export class CategoriesService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  /**
   * Obtiene todas las categorías globales (única opción disponible)
   * @returns {Promise<CategoryDto[]>} Lista de categorías ordenadas por nombre
   */
  async findAll(): Promise<CategoryDto[]> {
    try {
      const { data: categories, error } = await this.supabase
        .from("categorias_de_gasto")
        .select("id, nombre, icono, descripcion")
        .order("nombre", { ascending: true });

      if (error) {
        throw new BadRequestException("Error al obtener las categorías");
      }

      return (categories || []).map(
        (category) =>
          new CategoryDto({
            id: category.id,
            nombre: category.nombre,
            icono: category.icono,
            descripcion: category.descripcion,
          }),
      );
    } catch (err) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      throw new BadRequestException("Error inesperado al obtener categorías");
    }
  }
}

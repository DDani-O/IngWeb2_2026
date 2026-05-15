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
   * Obtiene categorías globales (cliente_id = null) + categorías del usuario
   */
  async findAll(userId: string): Promise<CategoryDto[]> {
    try {
      // Obtener categorías globales (cliente_id = null) Y categorías del usuario actual
      const { data: categories, error } = await this.supabase
        .from("categorias_de_gasto")
        .select("id, nombre, icono, cliente_id, categoria_sistema")
        .or(`cliente_id.is.null,cliente_id.eq.${userId}`)
        .order("nombre", { ascending: true });

      if (error) {
        throw new BadRequestException("Error al obtener las categorías");
      }

      // Mapear a DTOs
      const result = (categories || []).map(
        (category) =>
          new CategoryDto({
            id: category.id,
            nombre: category.nombre,
            icono: category.icono,
            cliente_id: category.cliente_id,
            categoria_sistema: category.categoria_sistema,
          }),
      );

      return result;
    } catch (err) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      throw new BadRequestException("Error inesperado al obtener categorías");
    }
  }

  /**
   * Obtiene solo categorías globales (cliente_id = null)
   */
  async findGlobal(): Promise<CategoryDto[]> {
    try {
      const { data: categories, error } = await this.supabase
        .from("categorias_de_gasto")
        .select("id, nombre, icono, cliente_id, categoria_sistema")
        .is("cliente_id", null)
        .order("nombre", { ascending: true });

      if (error) {
        throw new BadRequestException("Error al obtener las categorías globales");
      }

      const result = (categories || []).map(
        (category) =>
          new CategoryDto({
            id: category.id,
            nombre: category.nombre,
            icono: category.icono,
            cliente_id: category.cliente_id,
            categoria_sistema: category.categoria_sistema,
          }),
      );

      return result;
    } catch (err) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      throw new BadRequestException("Error inesperado al obtener categorías globales");
    }
  }

  /**
   * Obtiene solo categorías personalizadas del usuario
   */
  async findUserCategories(userId: string): Promise<CategoryDto[]> {
    try {
      const { data: categories, error } = await this.supabase
        .from("categorias_de_gasto")
        .select("id, nombre, icono, cliente_id, categoria_sistema")
        .eq("cliente_id", userId)
        .order("nombre", { ascending: true });

      if (error) {
        throw new BadRequestException("Error al obtener las categorías del usuario");
      }

      const result = (categories || []).map(
        (category) =>
          new CategoryDto({
            id: category.id,
            nombre: category.nombre,
            icono: category.icono,
            cliente_id: category.cliente_id,
            categoria_sistema: category.categoria_sistema,
          }),
      );

      return result;
    } catch (err) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      throw new BadRequestException("Error inesperado al obtener categorías del usuario");
    }
  }
}

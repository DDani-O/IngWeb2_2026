/** Módulo de catálogos: categorías de gasto y perfiles de gasto. */
import { Module } from "@nestjs/common";
import { SupabaseModule } from "../../common/supabase/supabase.module";
import { CategoriesController } from "./categories.controller";
import { CategoriesService } from "./categories.service";

/** Controller, servicios y dependencias del dominio. */
@Module({
  imports: [SupabaseModule],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}

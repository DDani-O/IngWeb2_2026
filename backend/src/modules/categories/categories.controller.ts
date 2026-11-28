/** Controller de los catálogos: `/categories` y `/spending-profiles`. */
import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/auth";
import { CategoriesService } from "./categories.service";

/** Catálogos (contrato §3.2, backend/README.md): requieren token, cualquier rol. */
@UseGuards(JwtAuthGuard)
@Controller()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /** GET /categories: `[{ id, nombre, icono }]` por nombre. */
  @Get("categories")
  listCategories() {
    return this.categoriesService.listCategories();
  }

  /** GET /spending-profiles: los perfiles activos, del más austero al más gastador. */
  @Get("spending-profiles")
  listSpendingProfiles() {
    return this.categoriesService.listSpendingProfiles();
  }
}

import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/auth";
import { CategoriesService } from "./categories.service";

/** Catálogos (spec §10.2): requieren token, cualquier rol. */
@UseGuards(JwtAuthGuard)
@Controller()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get("categories")
  listCategories() {
    return this.categoriesService.listCategories();
  }

  @Get("spending-profiles")
  listSpendingProfiles() {
    return this.categoriesService.listSpendingProfiles();
  }
}

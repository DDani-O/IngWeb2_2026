import { Controller, Get, UseGuards } from "@nestjs/common";
import { CategoriesService } from "./categories.service";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { CategoryDto } from "./dto/category.dto";

@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * GET /api/v1/categories
   * Retorna solo las categorías globales del sistema
   */
  @Get()
  async findAll(): Promise<CategoryDto[]> {
    return this.categoriesService.findAll();
  }
}

import { Controller, Get, UseGuards } from "@nestjs/common";
import { CategoriesService } from "./categories.service";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import type { JwtPayload } from "../../common/auth/auth.types";
import { CategoryDto } from "./dto/category.dto";

@UseGuards(JwtAuthGuard)
@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * GET /api/v1/categories
   * Retorna todas las categorías: globales (user_id = null) + del usuario autenticado
   */
  @Get()
  async findAll(@CurrentUser() user: JwtPayload): Promise<CategoryDto[]> {
    return this.categoriesService.findAll(user.sub);
  }

  /**
   * GET /api/v1/categories/global
   * Retorna solo las categorías globales
   */
  @Get("global")
  async findGlobal(): Promise<CategoryDto[]> {
    return this.categoriesService.findGlobal();
  }

  /**
   * GET /api/v1/categories/my
   * Retorna solo las categorías del usuario autenticado
   */
  @Get("my")
  async findUserCategories(@CurrentUser() user: JwtPayload): Promise<CategoryDto[]> {
    return this.categoriesService.findUserCategories(user.sub);
  }
}

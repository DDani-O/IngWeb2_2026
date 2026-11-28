/** Controller de `/recommendations`: las que recibe el cliente y las que envía el asesor. */
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  CurrentUser,
  JwtAuthGuard,
  JwtPayload,
  Roles,
  RolesGuard,
} from "../../common/auth";
import { CreateRecommendationDto } from "./dto/create-recommendation.dto";
import { QuerySentRecommendationsDto } from "./dto/query-sent.dto";
import { RecommendationsService } from "./recommendations.service";

/** Recomendaciones (contrato §3.5, backend/README.md): el rol de cada ruta lo fija `@Roles`. */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("recommendations")
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @Roles("cliente")
  /** GET /recommendations: las recibidas por el cliente, más nuevas primero. */
  @Get()
  listMine(@CurrentUser() user: JwtPayload) {
    return this.recommendationsService.listForClient(user.sub);
  }

  @Roles("cliente")
  /** PUT /recommendations/:id/read: la marca como leída (404 si es de otro cliente). */
  @Put(":id/read")
  markAsRead(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.recommendationsService.markAsRead(user.sub, id);
  }

  @Roles("asesor")
  /** GET /recommendations/sent: las enviadas por el asesor (filtro opcional por cliente). */
  @Get("sent")
  listSent(
    @CurrentUser() user: JwtPayload,
    @Query() query: QuerySentRecommendationsDto,
  ) {
    return this.recommendationsService.listSent(user.sub, query);
  }

  @Roles("asesor")
  /** POST /recommendations: crea una para un cliente asignado (403 si no lo está). */
  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateRecommendationDto,
  ) {
    return this.recommendationsService.create(user.sub, dto);
  }
}

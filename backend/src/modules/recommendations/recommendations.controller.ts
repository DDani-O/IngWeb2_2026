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

/** Recomendaciones (spec §10.5): el rol de cada ruta lo fija `@Roles`. */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("recommendations")
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @Roles("cliente")
  @Get()
  listMine(@CurrentUser() user: JwtPayload) {
    return this.recommendationsService.listForClient(user.sub);
  }

  @Roles("cliente")
  @Put(":id/read")
  markAsRead(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.recommendationsService.markAsRead(user.sub, id);
  }

  @Roles("asesor")
  @Get("sent")
  listSent(
    @CurrentUser() user: JwtPayload,
    @Query() query: QuerySentRecommendationsDto,
  ) {
    return this.recommendationsService.listSent(user.sub, query);
  }

  @Roles("asesor")
  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateRecommendationDto,
  ) {
    return this.recommendationsService.create(user.sub, dto);
  }
}

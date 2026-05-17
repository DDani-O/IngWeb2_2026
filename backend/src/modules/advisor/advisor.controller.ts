import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AdvisorService } from "./advisor.service";
import { CurrentUser, JwtPayload, JwtAuthGuard, Roles, RolesGuard } from "../../common/auth";
import { AdvisorClientsQueryDto } from "./dto/advisor-clients-query.dto";
import { AdvisorClientExpensesQueryDto } from "./dto/advisor-client-expenses-query.dto";
import { AdvisorMessagesQueryDto } from "./dto/advisor-messages-query.dto";
import { AdvisorRecommendationsQueryDto } from "./dto/advisor-recommendations-query.dto";
import { CreateAdvisorMessageDto } from "./dto/create-advisor-message.dto";
import { CreateAdvisorRecommendationDto } from "./dto/create-advisor-recommendation.dto";
import { UpdateRecommendationDto } from "./dto/update-recommendation.dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("asesor")
@Controller("advisor")
export class AdvisorController {
  constructor(private readonly advisorService: AdvisorService) {}

  @Get("dashboard")
  getDashboard(@CurrentUser() user: JwtPayload) {
    return this.advisorService.getDashboard(user);
  }

  @Get("clients")
  getClients(
    @CurrentUser() user: JwtPayload,
    @Query() query: AdvisorClientsQueryDto,
  ) {
    return this.advisorService.getClients(user, query);
  }

  @Get("clients/:clientId")
  getClient(
    @CurrentUser() user: JwtPayload,
    @Param("clientId", new ParseUUIDPipe()) clientId: string,
  ) {
    return this.advisorService.getClientDetail(user, clientId);
  }

  @Get("clients/:clientId/expenses")
  getClientExpenses(
    @CurrentUser() user: JwtPayload,
    @Param("clientId", new ParseUUIDPipe()) clientId: string,
    @Query() query: AdvisorClientExpensesQueryDto,
  ) {
    return this.advisorService.getClientExpenses(user, clientId, query);
  }

  @Get("recommendations")
  getRecommendations(
    @CurrentUser() user: JwtPayload,
    @Query() query: AdvisorRecommendationsQueryDto,
  ) {
    return this.advisorService.getRecommendations(user, query);
  }

  @Post("recommendations")
  createRecommendation(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateAdvisorRecommendationDto,
  ) {
    return this.advisorService.createRecommendation(user, dto);
  }

  @Patch("recommendations/:id")
  updateRecommendation(
    @CurrentUser() user: JwtPayload,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateRecommendationDto,
  ) {
    return this.advisorService.updateRecommendation(user, id, dto);
  }

  @Delete("recommendations/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteRecommendation(
    @CurrentUser() user: JwtPayload,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.advisorService.deleteRecommendation(user, id);
  }

  @Get("messages")
  getMessages(
    @CurrentUser() user: JwtPayload,
    @Query() query: AdvisorMessagesQueryDto,
  ) {
    return this.advisorService.getMessages(user, query);
  }

  @Post("messages")
  createMessage(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateAdvisorMessageDto,
  ) {
    return this.advisorService.createMessage(user, dto);
  }

  @Patch("messages/:messageId/read")
  markMessageAsRead(
    @CurrentUser() user: JwtPayload,
    @Param("messageId", new ParseUUIDPipe()) messageId: string,
  ) {
    return this.advisorService.markMessageAsRead(user, messageId);
  }
}

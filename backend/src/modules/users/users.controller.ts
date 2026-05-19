import { Body, Controller, Get, Patch, UseGuards, Query } from "@nestjs/common";
import { CurrentUser, JwtAuthGuard, JwtPayload, RolesGuard, Roles } from "../../common/auth";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersService } from "./users.service";
import { ConsumptionAnalyticsService } from "../analytics/services/consumption-analytics.service";

@UseGuards(JwtAuthGuard)
@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly consumptionAnalytics: ConsumptionAnalyticsService,
  ) {}

  @Get("me")
  async getMe(@CurrentUser() user: JwtPayload) {
    return this.usersService.getMe(user);
  }

  @Patch("me")
  async updateMe(@CurrentUser() user: JwtPayload, @Body() dto: UpdateUserDto) {
    return this.usersService.updateMe(user, dto);
  }

  @Get("me/recommendations")
  async getMyRecommendations(@CurrentUser() user: JwtPayload) {
    return this.usersService.getMyRecommendations(user);
  }

  @UseGuards(RolesGuard)
  @Roles("cliente")
  @Get("me/consumption-analysis")
  async getConsumptionAnalysis(
    @CurrentUser() user: JwtPayload,
    @Query("monthsBack") monthsBack?: string,
  ) {
    const months = monthsBack ? parseInt(monthsBack, 10) : 12;
    return this.consumptionAnalytics.getConsumptionAnalysis(user.sub, months);
  }

  @UseGuards(RolesGuard)
  @Roles("cliente")
  @Get("me/dashboard")
  async getDashboard(@CurrentUser() user: JwtPayload) {
    return this.usersService.getClientDashboard(user);
  }
}

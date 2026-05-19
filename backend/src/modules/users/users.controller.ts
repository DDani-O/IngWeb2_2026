import { Body, Controller, Get, Patch, Query, UseGuards } from "@nestjs/common";
import { ConsumptionAnalyticsService } from "../analytics/services/consumption-analytics.service";
import { CurrentUser, JwtAuthGuard, JwtPayload, RolesGuard, Roles } from "../../common/auth";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersService } from "./users.service";

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
  @Get("me/dashboard")
  async getClientDashboard(@CurrentUser() user: JwtPayload) {
    return this.usersService.getClientDashboard(user);
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

  @Get("spending-profiles")
  async getSpendingProfiles() {
    return this.usersService.getSpendingProfiles();
  }

}

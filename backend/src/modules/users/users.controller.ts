import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { CurrentUser, JwtAuthGuard, JwtPayload } from "../../common/auth";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersService } from "./users.service";

@UseGuards(JwtAuthGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
}

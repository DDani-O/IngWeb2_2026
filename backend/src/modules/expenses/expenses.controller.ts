import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ExpensesService } from "./expenses.service";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";
import { QueryExpensesDto } from "./dto/query-expenses.dto";
import { SummaryQueryDto } from "./dto/summary-query.dto";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { RolesGuard } from "../../common/auth/roles.guard";
import { Roles } from "../../common/auth/roles.decorator";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import type { JwtPayload } from "../../common/auth/auth.types";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("cliente")
@Controller("expenses")
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryExpensesDto,
  ) {
    return this.expensesService.findAll(user.sub, query);
  }

  @Get("summary")
  async summary(
    @CurrentUser() user: JwtPayload,
    @Query() query: SummaryQueryDto,
  ) {
    return this.expensesService.getSummary(user.sub, query);
  }

  @Get(":id")
  async findOne(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.expensesService.findOne(user.sub, id);
  }

  @Post()
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateExpenseDto,
  ) {
    return this.expensesService.create(user.sub, dto);
  }

  @Patch(":id")
  async update(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(user.sub, id, dto);
  }

  @Delete(":id")
  @HttpCode(204)
  async remove(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.expensesService.remove(user.sub, id);
  }
}

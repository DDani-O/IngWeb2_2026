import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
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
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { QueryExpensesDto } from "./dto/query-expenses.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";
import { ExpensesService } from "./expenses.service";

/** Gastos del cliente autenticado (spec §10.3). */
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("cliente")
@Controller("expenses")
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload, @Query() query: QueryExpensesDto) {
    return this.expensesService.list(user.sub, query);
  }

  @Get(":id")
  get(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.expensesService.get(user.sub, id);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateExpenseDto) {
    return this.expensesService.create(user.sub, dto);
  }

  @Put(":id")
  update(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(user.sub, id, dto);
  }

  @Delete(":id")
  @HttpCode(204)
  async remove(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    await this.expensesService.remove(user.sub, id);
  }
}

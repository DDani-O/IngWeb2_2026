/** Controller de `/expenses`: CRUD de los gastos del cliente. */
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

/** Gastos del cliente autenticado (contrato §3.3, backend/README.md). */
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("cliente")
@Controller("expenses")
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  /** GET /expenses: `{ datos, total }` con filtros, orden y límite. */
  @Get()
  list(@CurrentUser() user: JwtPayload, @Query() query: QueryExpensesDto) {
    return this.expensesService.list(user.sub, query);
  }

  /** GET /expenses/:id: un gasto propio (404 si no existe o es de otro cliente). */
  @Get(":id")
  get(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.expensesService.get(user.sub, id);
  }

  /** POST /expenses: alta manual o desde un ticket (`ticket_id`); 201 con el `gasto`. */
  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateExpenseDto) {
    return this.expensesService.create(user.sub, dto);
  }

  /** PUT /expenses/:id: edición parcial (también recategoriza). */
  @Put(":id")
  update(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(user.sub, id, dto);
  }

  /** DELETE /expenses/:id: 204 sin cuerpo. */
  @Delete(":id")
  @HttpCode(204)
  async remove(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    await this.expensesService.remove(user.sub, id);
  }
}

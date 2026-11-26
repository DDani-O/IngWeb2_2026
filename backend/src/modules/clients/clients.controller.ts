import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import {
  CurrentUser,
  JwtAuthGuard,
  JwtPayload,
  Roles,
  RolesGuard,
} from "../../common/auth";
import { QueryExpensesDto } from "../expenses/dto/query-expenses.dto";
import { ExpensesService } from "../expenses/expenses.service";
import { ClientsService } from "./clients.service";

/** Clientes del asesor (spec §10.7). `GET /clients` y `GET /clients/:id` llegan en la fase I3. */
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("asesor")
@Controller("clients")
export class ClientsController {
  constructor(
    private readonly clientsService: ClientsService,
    private readonly expensesService: ExpensesService,
  ) {}

  /** Mismos filtros y forma que `GET /expenses`; 403 si el cliente no está asignado. */
  @Get(":id/expenses")
  async listExpenses(
    @CurrentUser() user: JwtPayload,
    @Param("id") clientId: string,
    @Query() query: QueryExpensesDto,
  ) {
    await this.clientsService.assertAssigned(user.sub, clientId);
    return this.expensesService.list(clientId, query);
  }
}

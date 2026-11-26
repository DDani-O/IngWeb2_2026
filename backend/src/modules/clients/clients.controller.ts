import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { AssignmentsService } from "../../common/assignments/assignments.service";
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

/** Clientes asignados al asesor (spec §10.7). */
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("asesor")
@Controller("clients")
export class ClientsController {
  constructor(
    private readonly clientsService: ClientsService,
    private readonly assignments: AssignmentsService,
    private readonly expensesService: ExpensesService,
  ) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.clientsService.list(user.sub);
  }

  @Get(":id")
  get(@CurrentUser() user: JwtPayload, @Param("id") clientId: string) {
    return this.clientsService.get(user.sub, clientId);
  }

  /** Mismos filtros y forma que `GET /expenses`; 403 si el cliente no está asignado. */
  @Get(":id/expenses")
  async listExpenses(
    @CurrentUser() user: JwtPayload,
    @Param("id") clientId: string,
    @Query() query: QueryExpensesDto,
  ) {
    await this.assignments.assertAssigned(user.sub, clientId);
    return this.expensesService.list(clientId, query);
  }
}

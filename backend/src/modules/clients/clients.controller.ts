import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
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
import { AssignProfileDto } from "./dto/assign-profile.dto";

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

  /** El asesor elige el perfil de gasto del cliente; la regla automática deja de pisarlo. */
  @Put(":id/spending-profile")
  assignProfile(
    @CurrentUser() user: JwtPayload,
    @Param("id") clientId: string,
    @Body() dto: AssignProfileDto,
  ) {
    return this.clientsService.assignProfile(user.sub, clientId, dto);
  }

  /** Quita la elección del asesor: vuelve a valer el perfil que sugiere el sistema. */
  @Delete(":id/spending-profile")
  resetProfile(@CurrentUser() user: JwtPayload, @Param("id") clientId: string) {
    return this.clientsService.resetProfile(user.sub, clientId);
  }
}

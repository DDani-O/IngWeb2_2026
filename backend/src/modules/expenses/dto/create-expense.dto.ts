import { IsOptional } from "class-validator";
import { ExpenseField, ExpenseOrigin } from "./expense-fields";

/** POST /expenses (contrato §3.3, backend/README.md). Con `ticket_id` el gasto queda vinculado al ticket (§3.4). */
export class CreateExpenseDto {
  @ExpenseField.comercio()
  comercio!: string;

  @ExpenseField.fecha()
  fecha_gasto!: string;

  @ExpenseField.monto()
  monto!: number;

  @ExpenseField.categoria()
  categoria_id!: string;

  @IsOptional()
  @ExpenseField.descripcion()
  descripcion?: string;

  @IsOptional()
  @ExpenseField.origen()
  origen?: ExpenseOrigin;

  @IsOptional()
  @ExpenseField.ticket()
  ticket_id?: string;
}

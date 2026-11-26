import { IsOptional } from "class-validator";
import { ExpenseField, ExpenseOrigin } from "./expense-fields";

/**
 * PUT /expenses/:id (spec §10.3): mismos campos que el alta, todos opcionales.
 * `origen` y `ticket_id` se aceptan (el front reenvía el gasto completo) pero no se
 * modifican: el origen de un gasto es histórico.
 */
export class UpdateExpenseDto {
  @IsOptional()
  @ExpenseField.comercio()
  comercio?: string;

  @IsOptional()
  @ExpenseField.fecha()
  fecha_gasto?: string;

  @IsOptional()
  @ExpenseField.monto()
  monto?: number;

  @IsOptional()
  @ExpenseField.categoria()
  categoria_id?: string;

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

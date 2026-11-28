/** DTO de los filtros de `GET /expenses` y `GET /clients/:id/expenses` (query en español). */
import { Type } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { Trim } from "../../../common/validation/transforms";
import { ExpenseField, ExpenseOrigin } from "./expense-fields";

export const EXPENSE_SORTS = ["fecha", "monto_desc", "monto_asc"] as const;
export type ExpenseSort = (typeof EXPENSE_SORTS)[number];

/** Query de GET /expenses y GET /clients/:id/expenses (spec §10.3). Todo opcional. */
export class QueryExpensesDto {
  @IsOptional()
  @Trim()
  @IsString({ message: "La busqueda debe ser texto." })
  @MaxLength(100, {
    message: "La busqueda no puede superar los 100 caracteres.",
  })
  busqueda?: string;

  @IsOptional()
  @ExpenseField.categoria()
  categoria_id?: string;

  @IsOptional()
  @ExpenseField.origen()
  origen?: ExpenseOrigin;

  @IsOptional()
  @ExpenseField.rangoFecha()
  desde?: string;

  @IsOptional()
  @ExpenseField.rangoFecha()
  hasta?: string;

  @IsOptional()
  @IsIn([...EXPENSE_SORTS], {
    message: "El orden debe ser fecha, monto_desc o monto_asc.",
  })
  orden?: ExpenseSort;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "El limite debe ser un numero entero." })
  @Min(1, { message: "El limite debe ser al menos 1." })
  @Max(1000, { message: "El limite no puede superar 1000." })
  limite?: number;
}

import { applyDecorators } from "@nestjs/common";
import { Transform } from "class-transformer";
import {
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from "class-validator";

/** Valores de los ENUM de la BD que usa el contrato de gastos. */
export const EXPENSE_ORIGINS = ["manual", "ticket"] as const;
export type ExpenseOrigin = (typeof EXPENSE_ORIGINS)[number];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DATE_MESSAGE = "La fecha debe tener formato AAAA-MM-DD.";

const trim = Transform(({ value }) =>
  typeof value === "string" ? value.trim() : value,
);

/**
 * Aplica las reglas en el mismo orden que si estuvieran apiladas sobre la propiedad
 * (de abajo hacia arriba), para que el mensaje que se informa sea el de la primera regla
 * (ver `flattenErrors` en app.setup.ts).
 */
const rules = (...decorators: PropertyDecorator[]) =>
  applyDecorators(...decorators.reverse());

/**
 * Reglas de cada campo de un gasto (spec §10.3), compartidas por el alta y la edición
 * para que los dos validen exactamente igual.
 */
export const ExpenseField = {
  comercio: () =>
    rules(
      trim,
      IsString({ message: "El comercio es obligatorio." }),
      IsNotEmpty({ message: "El comercio es obligatorio." }),
      MaxLength(100, {
        message: "El comercio no puede superar los 100 caracteres.",
      }),
    ),
  fecha: () =>
    rules(
      Matches(DATE_PATTERN, { message: DATE_MESSAGE }),
      IsISO8601({ strict: true }, { message: DATE_MESSAGE }),
    ),
  monto: () =>
    rules(
      IsNumber(
        { maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false },
        { message: "El monto debe ser un numero con hasta 2 decimales." },
      ),
      IsPositive({ message: "El monto debe ser mayor a cero." }),
    ),
  categoria: () => IsUUID(undefined, { message: "La categoria no existe." }),
  descripcion: () =>
    rules(
      trim,
      IsString({ message: "La descripcion debe ser texto." }),
      MaxLength(500, {
        message: "La descripcion no puede superar los 500 caracteres.",
      }),
    ),
  origen: () =>
    IsIn([...EXPENSE_ORIGINS], {
      message: "El origen debe ser manual o ticket.",
    }),
  ticket: () => IsUUID(undefined, { message: "El ticket no existe." }),
  rangoFecha: () => Matches(DATE_PATTERN, { message: DATE_MESSAGE }),
};

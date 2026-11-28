/** Validaciones de los campos de un gasto, compartidas por los DTOs de alta y de edición. */
import { applyDecorators } from "@nestjs/common";
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
  ValidateBy,
} from "class-validator";
import { Trim } from "../../../common/validation/transforms";
import { DEFAULT_TIMEZONE, todayIn } from "../../analysis/calendar";

/** Valores de los ENUM de la BD que usa el contrato de gastos. */
export const EXPENSE_ORIGINS = ["manual", "ticket"] as const;
export type ExpenseOrigin = (typeof EXPENSE_ORIGINS)[number];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DATE_MESSAGE = "La fecha debe tener formato AAAA-MM-DD.";

/**
 * La fecha del gasto no puede ser posterior a hoy en la zona de la app (`APP_TIMEZONE`,
 * la misma que usa el análisis). Se lee del entorno en cada validación porque los
 * decoradores no tienen acceso al ConfigService; ConfigModule ya cargó el `.env` en
 * `process.env`. Compara strings AAAA-MM-DD (el formato lo validan las reglas previas).
 */
const NotAfterToday = () =>
  ValidateBy({
    name: "notAfterToday",
    validator: {
      validate: (value: unknown) =>
        typeof value !== "string" ||
        value <= todayIn(process.env.APP_TIMEZONE || DEFAULT_TIMEZONE),
      defaultMessage: () => "La fecha no puede ser posterior a hoy.",
    },
  });

/**
 * Aplica las reglas en el mismo orden que si estuvieran apiladas sobre la propiedad
 * (de abajo hacia arriba), para que el mensaje que se informa sea el de la primera regla
 * (ver `flattenErrors` en app.setup.ts).
 */
const rules = (...decorators: PropertyDecorator[]) =>
  applyDecorators(...decorators.reverse());

/**
 * Reglas de cada campo de un gasto (contrato §3.3, backend/README.md), compartidas por el alta y la edición
 * para que los dos validen exactamente igual.
 */
export const ExpenseField = {
  comercio: () =>
    rules(
      Trim(),
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
      NotAfterToday(),
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
      Trim(),
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

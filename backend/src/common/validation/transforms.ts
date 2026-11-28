/** Transformaciones de entrada compartidas por los DTO (se aplican antes de validar). */
import { Transform } from "class-transformer";

/**
 * Recorta los espacios de un texto. Lo que no es texto pasa sin cambios para que la
 * regla de tipo del campo (`@IsString`, `@IsEmail`…) lo rechace con su mensaje.
 */
export const Trim = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  );

/** Como `Trim` y además en minúsculas: emails, que se comparan sin distinguir mayúsculas. */
export const TrimLowercase = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  );

/** Como `Trim`, pero un texto que queda vacío se guarda como `null` (campos opcionales). */
export const TrimToNull = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() || null : value,
  );

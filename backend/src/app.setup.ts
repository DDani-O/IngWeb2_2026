/** Configuración común de la app Nest (prefijo, validación y errores), compartida por main.ts y los e2e. */
import {
  INestApplication,
  ValidationError,
  ValidationPipe,
} from "@nestjs/common";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { validationError } from "./common/errors/api.exception";

/** Prefijo global de la API (contrato §3.0, backend/README.md). */
export const API_PREFIX = "api/v1";

/**
 * Aplana los errores de class-validator (incluidos los anidados) a `[ruta, mensaje]`, un
 * mensaje por campo. class-validator lista las reglas en orden inverso al declarado, así
 * que se toma la última: la primera regla del DTO ("es obligatorio" antes que "es muy largo").
 */
function flattenErrors(
  errors: ValidationError[],
  parent = "",
): Array<[string, string]> {
  return errors.flatMap((error) => {
    const path = parent ? `${parent}.${error.property}` : error.property;
    const constraints = Object.entries(error.constraints ?? {});
    const [key, message] = constraints[constraints.length - 1] ?? [];
    const own: Array<[string, string]> = key
      ? [
          [
            path,
            key === "whitelistValidation"
              ? `El campo ${path} no esta permitido.`
              : String(message),
          ],
        ]
      : [];
    return [...own, ...flattenErrors(error.children ?? [], path)];
  });
}

/**
 * Configuración común de la app: la usan `main.ts` y los tests e2e para que
 * ambos se comporten igual (prefijo, validación y formato de errores).
 */
export function configureApp(app: INestApplication) {
  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const flat = flattenErrors(errors);
        const campos = [...new Set(flat.map(([path]) => path))];
        return validationError(flat[0]?.[1] ?? "Datos invalidos.", campos);
      },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
}

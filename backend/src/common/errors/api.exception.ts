/** Errores del contrato: códigos, cuerpo de error, `ApiException` y los helpers para lanzarlos. */
import { HttpException, HttpStatus } from "@nestjs/common";

/**
 * Códigos de error del contrato (§3.0, backend/README.md).
 */
export type ErrorCode =
  | "SOLICITUD_INVALIDA"
  | "CREDENCIALES_INVALIDAS"
  | "NO_AUTENTICADO"
  | "PROHIBIDO"
  | "NO_ENCONTRADO"
  | "RUTA_INEXISTENTE"
  | "EMAIL_DUPLICADO"
  | "MATRICULA_DUPLICADA"
  | "CONFLICTO"
  | "VALIDACION"
  | "ERROR_INTERNO";

export interface ApiErrorBody {
  error: true;
  mensaje: string;
  codigo: ErrorCode;
  detalles: Record<string, unknown> | null;
}

/**
 * Excepción con el cuerpo de error del contrato: `{ error, mensaje, codigo, detalles }`.
 * El filtro global la serializa tal cual.
 */
export class ApiException extends HttpException {
  constructor(
    status: HttpStatus,
    codigo: ErrorCode,
    mensaje: string,
    detalles: Record<string, unknown> | null = null,
  ) {
    const body: ApiErrorBody = { error: true, mensaje, codigo, detalles };
    super(body, status);
  }
}

/** 422: datos inválidos; `campos` lista los campos con problemas. */
export const validationError = (mensaje: string, campos: string[]) =>
  new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "VALIDACION", mensaje, {
    campos,
  });

/** 404: recurso inexistente o ajeno (no se distingue para no filtrar información). */
export const notFoundError = (mensaje: string) =>
  new ApiException(HttpStatus.NOT_FOUND, "NO_ENCONTRADO", mensaje);

/** 403: rol incorrecto o cliente no asignado al asesor. */
export const forbiddenError = (
  mensaje = "No tenes permiso para esta accion.",
) => new ApiException(HttpStatus.FORBIDDEN, "PROHIBIDO", mensaje);

/** 500: error no controlado (el detalle técnico va al log, no a la respuesta). */
export const internalError = (mensaje = "Error interno del servidor.") =>
  new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "ERROR_INTERNO", mensaje);

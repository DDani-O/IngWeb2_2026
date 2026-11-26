import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Response } from "express";
import { ApiErrorBody, ErrorCode } from "../errors/api.exception";

const DEFAULTS: Partial<
  Record<number, { codigo: ErrorCode; mensaje: string }>
> = {
  [HttpStatus.BAD_REQUEST]: {
    codigo: "SOLICITUD_INVALIDA",
    mensaje: "La solicitud no es valida.",
  },
  [HttpStatus.UNAUTHORIZED]: {
    codigo: "NO_AUTENTICADO",
    mensaje: "La sesion no es valida o expiro.",
  },
  [HttpStatus.FORBIDDEN]: {
    codigo: "PROHIBIDO",
    mensaje: "No tenes permiso para esta accion.",
  },
  [HttpStatus.NOT_FOUND]: {
    codigo: "NO_ENCONTRADO",
    mensaje: "Recurso no encontrado.",
  },
  [HttpStatus.CONFLICT]: {
    codigo: "CONFLICTO",
    mensaje: "El recurso ya existe.",
  },
  [HttpStatus.UNPROCESSABLE_ENTITY]: {
    codigo: "VALIDACION",
    mensaje: "Datos invalidos.",
  },
};

const isApiErrorBody = (body: unknown): body is ApiErrorBody =>
  typeof body === "object" &&
  body !== null &&
  (body as ApiErrorBody).error === true &&
  "codigo" in body;

/**
 * Serializa todos los errores con el formato del contrato:
 * `{ error: true, mensaje, codigo, detalles }`.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const { status, body } = this.toErrorBody(exception);
    response.status(status).json(body);
  }

  private toErrorBody(exception: unknown): {
    status: number;
    body: ApiErrorBody;
  } {
    if (!(exception instanceof HttpException)) {
      this.logger.error(
        exception instanceof Error ? exception.stack : String(exception),
      );
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        body: {
          error: true,
          mensaje: "Error interno del servidor.",
          codigo: "ERROR_INTERNO",
          detalles: null,
        },
      };
    }

    const status = exception.getStatus();
    const raw = exception.getResponse();

    if (isApiErrorBody(raw)) {
      if (status >= 500) {
        this.logger.error(`${raw.codigo}: ${raw.mensaje}`);
      }
      return { status, body: raw };
    }

    // Multer corta los archivos más grandes que el límite con un 413.
    if (status === HttpStatus.PAYLOAD_TOO_LARGE) {
      return {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        body: {
          error: true,
          mensaje: "El archivo supera el tamano maximo de 5 MB.",
          codigo: "VALIDACION",
          detalles: { campos: ["archivo"] },
        },
      };
    }

    // Ruta inexistente: el router de Nest responde "Cannot <METODO> <ruta>".
    const message =
      typeof raw === "object" && raw !== null
        ? (raw as { message?: unknown }).message
        : raw;
    if (
      status === HttpStatus.NOT_FOUND &&
      typeof message === "string" &&
      message.startsWith("Cannot ")
    ) {
      return {
        status,
        body: {
          error: true,
          mensaje: `No existe ${message.slice("Cannot ".length)}.`,
          codigo: "RUTA_INEXISTENTE",
          detalles: null,
        },
      };
    }

    const fallback = DEFAULTS[status] ?? {
      codigo: "ERROR_INTERNO" as ErrorCode,
      mensaje: "Error interno del servidor.",
    };
    if (status >= 500) {
      this.logger.error(exception.stack);
    }
    return {
      status,
      body: {
        error: true,
        mensaje: fallback.mensaje,
        codigo: fallback.codigo,
        detalles: null,
      },
    };
  }
}

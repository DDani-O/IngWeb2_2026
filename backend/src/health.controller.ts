import { Controller, Get } from "@nestjs/common";

/**
 * GET /api/v1/health (contrato §3.0, backend/README.md): ruta pública y sin acceso a la BD. La usan el health check
 * del hosting (Render) y el front, que la llama al abrir la app para "despertar" el
 * servidor del plan gratuito antes del primer pedido real.
 */
@Controller()
export class HealthController {
  /** GET /health: `{ estado: "ok" }`. */
  @Get("health")
  check() {
    return { estado: "ok" };
  }
}

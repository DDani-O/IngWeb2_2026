/** Tests e2e de `/health`. */
import { INestApplication } from "@nestjs/common";
import { api, createTestApp } from "./test-utils";

/**
 * GET /health (contrato §3.0, backend/README.md): público y sin BD. Lo usan Render (health check) y el front
 * (despertar el servidor del plan gratuito antes del primer pedido real).
 */
describe("Health (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /health responde 200 sin token", async () => {
    const res = await api(app).get("/health").expect(200);
    expect(res.body).toEqual({ estado: "ok" });
  });
});

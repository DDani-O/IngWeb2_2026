/** Tests e2e de `/categories` y `/spending-profiles`. */
import { INestApplication } from "@nestjs/common";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  api,
  cleanupTestUser,
  createTestApp,
  registerAccount,
  TestAccount,
} from "./test-utils";

/**
 * Catálogos (contrato §3.2, backend/README.md): categorías y perfiles de gasto, con token de cualquier rol.
 */
describe("Catálogos (e2e)", () => {
  let app: INestApplication;
  let supabase: SupabaseClient;
  let cliente: TestAccount;

  beforeAll(async () => {
    ({ app, supabase } = await createTestApp());
    cliente = await registerAccount(app, "cliente", "catalogos");
  });

  afterAll(async () => {
    await cleanupTestUser(supabase, cliente?.id);
    await app.close();
  });

  it("GET /categories requiere token", async () => {
    const res = await api(app).get("/categories").expect(401);
    expect(res.body.codigo).toBe("NO_AUTENTICADO");
  });

  it("GET /categories devuelve [{ id, nombre, icono }]", async () => {
    const res = await api(app)
      .get("/categories")
      .set("Authorization", `Bearer ${cliente.token}`)
      .expect(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(Object.keys(res.body[0]).sort()).toEqual(["icono", "id", "nombre"]);
  });

  it("GET /spending-profiles devuelve [{ id, nombre, descripcion }]", async () => {
    const res = await api(app)
      .get("/spending-profiles")
      .set("Authorization", `Bearer ${cliente.token}`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach((perfil: Record<string, unknown>) => {
      expect(Object.keys(perfil).sort()).toEqual([
        "descripcion",
        "id",
        "nombre",
      ]);
    });
  });
});

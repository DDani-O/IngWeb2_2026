/** Tests e2e de `/recommendations` y de `/clients/:id/expenses`. */
import { INestApplication } from "@nestjs/common";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  api,
  assignClient,
  cleanupTestUser,
  createTestApp,
  registerAccount,
  TestAccount,
} from "./test-utils";

/**
 * Recomendaciones (contrato §3.5) y gastos de un cliente vistos por su asesor (§3.7), en backend/README.md.
 */
describe("Recomendaciones y clientes (e2e)", () => {
  let app: INestApplication;
  let supabase: SupabaseClient;
  let asesor: TestAccount;
  let cliente: TestAccount;
  let clienteAjeno: TestAccount;
  let recomendacionId: string;

  const auth = (account: TestAccount) => ({
    Authorization: `Bearer ${account.token}`,
  });
  const nueva = (clienteId: string) => ({
    cliente_id: clienteId,
    titulo: "Reducir streaming",
    mensaje: "Tenes tres suscripciones parecidas.",
    tipo: "sugerencia",
    prioridad: "alta",
  });

  beforeAll(async () => {
    ({ app, supabase } = await createTestApp());
    asesor = await registerAccount(app, "asesor", "rec.asesor");
    cliente = await registerAccount(app, "cliente", "rec.cliente");
    clienteAjeno = await registerAccount(app, "cliente", "rec.ajeno");
    await assignClient(supabase, asesor.id, cliente.id);
    await supabase
      .from("asignaciones_de_clientes")
      .update({ activo: false })
      .eq("cliente_id", clienteAjeno.id)
      .eq("asesor_id", asesor.id);
  });

  afterAll(async () => {
    for (const account of [asesor, cliente, clienteAjeno])
      await cleanupTestUser(supabase, account?.id);
    await app.close();
  });

  it("POST /recommendations crea una recomendación de origen asesor", async () => {
    const res = await api(app)
      .post("/recommendations")
      .set(auth(asesor))
      .send(nueva(cliente.id))
      .expect(201);
    expect(res.body).toMatchObject({
      titulo: "Reducir streaming",
      tipo: "sugerencia",
      prioridad: "alta",
      origen: "asesor",
      leida: false,
      leida_en: null,
      asesor: { id: asesor.id },
      cliente: { id: cliente.id },
    });
    recomendacionId = res.body.id;
  });

  it("POST /recommendations responde 403 si el cliente no está asignado", async () => {
    const res = await api(app)
      .post("/recommendations")
      .set(auth(asesor))
      .send(nueva(clienteAjeno.id))
      .expect(403);
    expect(res.body.codigo).toBe("PROHIBIDO");
  });

  it("un cliente no puede crear recomendaciones (403)", async () => {
    await api(app)
      .post("/recommendations")
      .set(auth(cliente))
      .send(nueva(cliente.id))
      .expect(403);
  });

  it("GET /recommendations lista las del cliente", async () => {
    const res = await api(app)
      .get("/recommendations")
      .set(auth(cliente))
      .expect(200);
    expect(res.body.map((item: { id: string }) => item.id)).toEqual([
      recomendacionId,
    ]);
  });

  it("PUT /recommendations/:id/read la marca como leída", async () => {
    const res = await api(app)
      .put(`/recommendations/${recomendacionId}/read`)
      .set(auth(cliente))
      .expect(200);
    expect(res.body.leida).toBe(true);
    expect(typeof res.body.leida_en).toBe("string");
  });

  it("PUT /recommendations/:id/read responde 404 para una recomendación ajena", async () => {
    await api(app)
      .put(`/recommendations/${recomendacionId}/read`)
      .set(auth(clienteAjeno))
      .expect(404);
  });

  it("GET /recommendations/sent filtra por cliente", async () => {
    const propias = await api(app)
      .get(`/recommendations/sent?cliente_id=${cliente.id}`)
      .set(auth(asesor))
      .expect(200);
    expect(propias.body).toHaveLength(1);
    expect(propias.body[0]).toMatchObject({ id: recomendacionId, leida: true });

    const ajenas = await api(app)
      .get(`/recommendations/sent?cliente_id=${clienteAjeno.id}`)
      .set(auth(asesor))
      .expect(200);
    expect(ajenas.body).toHaveLength(0);
  });

  it("GET /clients/:id/expenses devuelve los gastos de un cliente asignado", async () => {
    const res = await api(app)
      .get(`/clients/${cliente.id}/expenses`)
      .set(auth(asesor))
      .expect(200);
    expect(res.body).toEqual({ datos: [], total: 0 });
  });

  it("GET /clients/:id/expenses responde 403 para un cliente no asignado", async () => {
    await api(app)
      .get(`/clients/${clienteAjeno.id}/expenses`)
      .set(auth(asesor))
      .expect(403);
  });
});

import { INestApplication } from "@nestjs/common";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  api,
  cleanupTestUser,
  createTestApp,
  registerAccount,
  TestAccount,
} from "./test-utils";
import {
  addDays,
  DEFAULT_TIMEZONE,
  todayIn,
} from "../../src/modules/analysis/calendar";

/**
 * CRUD de gastos del cliente (contrato §3.3, backend/README.md).
 */
describe("Gastos (e2e)", () => {
  let app: INestApplication;
  let supabase: SupabaseClient;
  let cliente: TestAccount;
  let otroCliente: TestAccount;
  let categoriaId: string;
  let otraCategoriaId: string;
  let gastoId: string;

  const auth = (account: TestAccount) => ({
    Authorization: `Bearer ${account.token}`,
  });

  beforeAll(async () => {
    ({ app, supabase } = await createTestApp());
    cliente = await registerAccount(app, "cliente", "gastos");
    otroCliente = await registerAccount(app, "cliente", "gastos.otro");

    const categorias = await api(app).get("/categories").set(auth(cliente));
    [categoriaId, otraCategoriaId] = categorias.body.map(
      (categoria: { id: string }) => categoria.id,
    );
  });

  afterAll(async () => {
    await cleanupTestUser(supabase, cliente?.id);
    await cleanupTestUser(supabase, otroCliente?.id);
    await app.close();
  });

  it("POST /expenses crea un gasto manual", async () => {
    const res = await api(app)
      .post("/expenses")
      .set(auth(cliente))
      .send({
        comercio: "Supermercado Central",
        fecha_gasto: "2026-11-20",
        monto: 18500.5,
        categoria_id: categoriaId,
        descripcion: "Compra semanal",
      })
      .expect(201);

    expect(res.body).toMatchObject({
      comercio: "Supermercado Central",
      fecha_gasto: "2026-11-20",
      monto: 18500.5,
      descripcion: "Compra semanal",
      origen: "manual",
      moneda: "ARS",
      ticket_principal_id: null,
    });
    expect(res.body.categoria).toMatchObject({ id: categoriaId });
    gastoId = res.body.id;
  });

  it("POST /expenses valida los datos (422 con los campos)", async () => {
    const res = await api(app)
      .post("/expenses")
      .set(auth(cliente))
      .send({
        comercio: "",
        fecha_gasto: "20/11/2026",
        monto: -5,
        categoria_id: categoriaId,
      })
      .expect(422);
    expect(res.body.detalles.campos).toEqual([
      "comercio",
      "fecha_gasto",
      "monto",
    ]);
  });

  it("POST /expenses responde 422 si la categoría no existe", async () => {
    const res = await api(app)
      .post("/expenses")
      .set(auth(cliente))
      .send({
        comercio: "X",
        fecha_gasto: "2026-11-20",
        monto: 10,
        categoria_id: "00000000-0000-4000-8000-000000000000",
      })
      .expect(422);
    expect(res.body.detalles.campos).toEqual(["categoria_id"]);
  });

  it("GET /expenses devuelve { datos, total } con filtros y orden", async () => {
    await api(app)
      .post("/expenses")
      .set(auth(cliente))
      .send({
        comercio: "Cine",
        fecha_gasto: "2026-11-21",
        monto: 9000,
        categoria_id: otraCategoriaId,
      });

    const todos = await api(app)
      .get("/expenses")
      .set(auth(cliente))
      .expect(200);
    expect(todos.body.total).toBe(2);
    expect(todos.body.datos[0].comercio).toBe("Cine"); // orden por fecha descendente

    const porMonto = await api(app)
      .get("/expenses?orden=monto_asc&limite=1")
      .set(auth(cliente))
      .expect(200);
    expect(porMonto.body).toMatchObject({
      total: 2,
      datos: [{ comercio: "Cine" }],
    });

    const busqueda = await api(app)
      .get("/expenses?busqueda=super")
      .set(auth(cliente))
      .expect(200);
    expect(
      busqueda.body.datos.map((gasto: { id: string }) => gasto.id),
    ).toEqual([gastoId]);

    const rango = await api(app)
      .get("/expenses?desde=2026-11-21&hasta=2026-11-30")
      .set(auth(cliente))
      .expect(200);
    expect(rango.body.total).toBe(1);
  });

  it("rechaza fecha_gasto posterior a hoy en APP_TIMEZONE (alta y edición) y acepta hoy", async () => {
    const hoy = todayIn(process.env.APP_TIMEZONE || DEFAULT_TIMEZONE);
    const manana = addDays(hoy, 1);
    const gasto = { comercio: "X", monto: 10, categoria_id: categoriaId };

    const alta = await api(app)
      .post("/expenses")
      .set(auth(cliente))
      .send({ ...gasto, fecha_gasto: manana })
      .expect(422);
    expect(alta.body).toMatchObject({
      codigo: "VALIDACION",
      mensaje: "La fecha no puede ser posterior a hoy.",
      detalles: { campos: ["fecha_gasto"] },
    });

    const lejana = await api(app)
      .post("/expenses")
      .set(auth(cliente))
      .send({ ...gasto, fecha_gasto: "2099-01-01" })
      .expect(422);
    expect(lejana.body.detalles.campos).toEqual(["fecha_gasto"]);

    const edicion = await api(app)
      .put(`/expenses/${gastoId}`)
      .set(auth(cliente))
      .send({ fecha_gasto: manana })
      .expect(422);
    expect(edicion.body.detalles.campos).toEqual(["fecha_gasto"]);

    const deHoy = await api(app)
      .post("/expenses")
      .set(auth(cliente))
      .send({ ...gasto, fecha_gasto: hoy })
      .expect(201);
    expect(deHoy.body.fecha_gasto).toBe(hoy);
  });

  it("PUT /expenses/:id recategoriza y ignora origen", async () => {
    const res = await api(app)
      .put(`/expenses/${gastoId}`)
      .set(auth(cliente))
      .send({ categoria_id: otraCategoriaId, monto: 20000, origen: "ticket" })
      .expect(200);
    expect(res.body).toMatchObject({
      monto: 20000,
      origen: "manual",
      categoria: { id: otraCategoriaId },
    });
  });

  it("otro cliente no ve ni edita el gasto (404)", async () => {
    await api(app)
      .get(`/expenses/${gastoId}`)
      .set(auth(otroCliente))
      .expect(404);
    await api(app)
      .put(`/expenses/${gastoId}`)
      .set(auth(otroCliente))
      .send({ monto: 1 })
      .expect(404);
    await api(app)
      .delete(`/expenses/${gastoId}`)
      .set(auth(otroCliente))
      .expect(404);
  });

  it("DELETE /expenses/:id borra el gasto (204) y después responde 404", async () => {
    await api(app)
      .delete(`/expenses/${gastoId}`)
      .set(auth(cliente))
      .expect(204);
    const res = await api(app)
      .get(`/expenses/${gastoId}`)
      .set(auth(cliente))
      .expect(404);
    expect(res.body.codigo).toBe("NO_ENCONTRADO");
  });
});

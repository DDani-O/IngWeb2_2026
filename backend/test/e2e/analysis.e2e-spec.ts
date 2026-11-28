import { INestApplication } from "@nestjs/common";
import { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_TIMEZONE, todayIn } from "../../src/modules/analysis/calendar";
import {
  api,
  assignClient,
  cleanupTestUser,
  createTestApp,
  registerAccount,
  TestAccount,
} from "./test-utils";

/**
 * Análisis de consumo (spec §10.6) y cartera del asesor (spec §10.7). Las reglas en
 * detalle están en src/modules/analysis/analysis.rules.spec.ts; acá se prueba el
 * recorrido completo contra la BD, incluida la clasificación automática del perfil.
 */
describe("Análisis y clientes (e2e)", () => {
  let app: INestApplication;
  let supabase: SupabaseClient;
  let asesor: TestAccount;
  let otroAsesor: TestAccount;
  let cliente: TestAccount;
  let categorias: Record<string, string>;

  const auth = (account: TestAccount) => ({
    Authorization: `Bearer ${account.token}`,
  });
  // Misma "fecha de hoy" que usa el backend (zona horaria de la app).
  const hoy = () => todayIn(DEFAULT_TIMEZONE);

  beforeAll(async () => {
    ({ app, supabase } = await createTestApp());
    asesor = await registerAccount(app, "asesor", "analisis.asesor");
    otroAsesor = await registerAccount(app, "asesor", "analisis.otro");
    cliente = await registerAccount(app, "cliente", "analisis.cliente");
    await assignClient(supabase, asesor.id, cliente.id);

    const res = await api(app).get("/categories").set(auth(cliente));
    categorias = Object.fromEntries(
      res.body.map((c: { id: string; nombre: string }) => [
        c.nombre.normalize("NFD").replace(/[̀-ͯ]/g, ""),
        c.id,
      ]),
    );
  });

  afterAll(async () => {
    for (const account of [asesor, otroAsesor, cliente])
      await cleanupTestUser(supabase, account?.id);
    await app.close();
  });

  const cargarGasto = (
    monto: number,
    categoria: string,
    comercio = "Comercio",
  ) =>
    api(app)
      .post("/expenses")
      .set(auth(cliente))
      .send({
        comercio,
        fecha_gasto: hoy(),
        monto,
        categoria_id: categorias[categoria],
      })
      .expect(201);

  const vigentes = async () => {
    const { data } = await supabase
      .from("clasificacion_de_perfil")
      .select("perfil:perfil_id (nombre), asesor_id")
      .eq("cliente_id", cliente.id)
      .is("vigente_hasta", null);
    return data ?? [];
  };

  it("sin gastos: alerta informativa, riesgo bajo y sin perfil", async () => {
    const res = await api(app)
      .get("/analysis/me")
      .set(auth(cliente))
      .expect(200);
    expect(res.body).toMatchObject({
      cliente_id: cliente.id,
      cantidad_gastos: 0,
      nivel_riesgo: "bajo",
      perfil_de_gasto: null,
    });
    expect(res.body.alertas[0].nivel).toBe("info");
    expect(await vigentes()).toHaveLength(0);
  });

  it("asigna Drácula Nocturno con poco gasto discrecional y lo persiste", async () => {
    await cargarGasto(9500, "Alimentacion", "Super");
    await cargarGasto(500, "Entretenimiento", "Cine");

    const res = await api(app)
      .get("/analysis/me")
      .set(auth(cliente))
      .expect(200);
    expect(res.body.perfil_de_gasto.nombre).toBe("Drácula Nocturno");
    expect(res.body.gasto_mes_actual).toBe(10000);
    expect(res.body.gastos_por_mes).toHaveLength(7);
    expect(res.body.gastos_por_dia).toHaveLength(14);
    expect(res.body.ranking_comercios[0]).toMatchObject({
      comercio: "Super",
      monto: 9500,
    });

    const actuales = await vigentes();
    expect(actuales).toHaveLength(1);
    expect(actuales[0].asesor_id).toBeNull();
  });

  it("recalcula el perfil cuando cambia el gasto y deja una sola clasificación vigente", async () => {
    await cargarGasto(20000, "Suscripciones", "Streaming");
    const me = await api(app).get("/auth/me").set(auth(cliente)).expect(200);
    expect(me.body.perfil_cliente.perfil_de_gasto.nombre).toBe(
      "Espíritu Libre",
    );
    expect(await vigentes()).toHaveLength(1);
  });

  it("el asesor ve el mismo análisis que el cliente", async () => {
    const propio = await api(app)
      .get("/analysis/me")
      .set(auth(cliente))
      .expect(200);
    const delAsesor = await api(app)
      .get(`/analysis/clients/${cliente.id}`)
      .set(auth(asesor))
      .expect(200);
    expect(delAsesor.body).toEqual(propio.body);
  });

  it("GET /clients y GET /clients/:id devuelven el resumen del cliente", async () => {
    const lista = await api(app).get("/clients").set(auth(asesor)).expect(200);
    const resumen = lista.body.find((c: { id: string }) => c.id === cliente.id);
    expect(resumen).toMatchObject({
      estado: "activo",
      gasto_mes_actual: 30000,
      perfil_de_gasto: { nombre: "Espíritu Libre" },
    });

    const detalle = await api(app)
      .get(`/clients/${cliente.id}`)
      .set(auth(asesor))
      .expect(200);
    expect(detalle.body).toMatchObject({
      id: cliente.id,
      usuario: {
        rol: "cliente",
        perfil_cliente: { asesor: { id: asesor.id } },
      },
    });
  });

  it("GET /analysis/advisor/summary resume la cartera", async () => {
    const res = await api(app)
      .get("/analysis/advisor/summary")
      .set(auth(asesor))
      .expect(200);
    expect(res.body).toMatchObject({
      asesor_id: asesor.id,
      clientes_activos: 1,
    });
    expect(res.body.distribucion_por_perfil).toEqual([
      { perfil: "Espíritu Libre", cantidad: 1 },
    ]);
    expect(res.body.actividad_mensual).toHaveLength(7);
  });

  it("un asesor sin el cliente asignado recibe 403", async () => {
    await api(app)
      .get(`/analysis/clients/${cliente.id}`)
      .set(auth(otroAsesor))
      .expect(403);
    await api(app)
      .get(`/clients/${cliente.id}`)
      .set(auth(otroAsesor))
      .expect(403);
  });

  it("un cliente no accede a las rutas del asesor", async () => {
    await api(app).get("/clients").set(auth(cliente)).expect(403);
    await api(app)
      .get("/analysis/advisor/summary")
      .set(auth(cliente))
      .expect(403);
  });

  /**
   * Clasificación manual (spec §10.7): el asesor elige el perfil, la regla automática no
   * lo pisa y el asesor puede volver a la sugerencia. Arranca con el cliente en
   * "Espíritu Libre" (automático), que dejan los tests anteriores.
   */
  describe("perfil elegido por el asesor", () => {
    let perfiles: Record<string, string>;
    const ruta = () => `/clients/${cliente.id}/spending-profile`;

    beforeAll(async () => {
      const res = await api(app)
        .get("/spending-profiles")
        .set(auth(asesor))
        .expect(200);
      perfiles = Object.fromEntries(
        res.body.map((p: { id: string; nombre: string }) => [p.nombre, p.id]),
      );
    });

    it("solo lo puede cambiar el asesor asignado, con un perfil válido", async () => {
      const body = { perfil_id: perfiles["Drácula Nocturno"] };
      await api(app).put(ruta()).set(auth(otroAsesor)).send(body).expect(403);
      await api(app).put(ruta()).set(auth(cliente)).send(body).expect(403);
      await api(app).delete(ruta()).set(auth(otroAsesor)).expect(403);

      for (const perfil_id of [
        "no-es-un-uuid",
        "00000000-0000-4000-8000-000000000000",
      ]) {
        const res = await api(app)
          .put(ruta())
          .set(auth(asesor))
          .send({ perfil_id })
          .expect(422);
        expect(res.body).toMatchObject({
          codigo: "VALIDACION",
          detalles: { campos: ["perfil_id"] },
        });
      }
    });

    it("guarda la elección con asesor_id y motivo, y deja una sola vigente", async () => {
      const res = await api(app)
        .put(ruta())
        .set(auth(asesor))
        .send({
          perfil_id: perfiles["Drácula Nocturno"],
          motivo: "  Está ahorrando para mudarse  ",
        })
        .expect(200);
      expect(res.body.perfil_de_gasto).toMatchObject({
        nombre: "Drácula Nocturno",
        origen: "asesor",
        motivo: "Está ahorrando para mudarse",
      });

      const actuales = await vigentes();
      expect(actuales).toHaveLength(1);
      expect(actuales[0].asesor_id).toBe(asesor.id);
    });

    it("la regla automática no la pisa aunque cambien los gastos", async () => {
      await cargarGasto(15000, "Suscripciones", "Streaming");

      const analisis = await api(app)
        .get("/analysis/me")
        .set(auth(cliente))
        .expect(200);
      expect(analisis.body.perfil_de_gasto).toMatchObject({
        nombre: "Drácula Nocturno",
        origen: "asesor",
      });
      expect(analisis.body.perfil_sugerido.nombre).toBe("Espíritu Libre");

      const me = await api(app).get("/auth/me").set(auth(cliente)).expect(200);
      expect(me.body.perfil_cliente.perfil_de_gasto.origen).toBe("asesor");

      const lista = await api(app)
        .get("/clients")
        .set(auth(asesor))
        .expect(200);
      const resumen = lista.body.find(
        (c: { id: string }) => c.id === cliente.id,
      );
      expect(resumen.perfil_de_gasto.nombre).toBe("Drácula Nocturno");

      const actuales = await vigentes();
      expect(actuales).toHaveLength(1);
      expect(actuales[0].asesor_id).toBe(asesor.id);
    });

    it("volver a la automática deja vigente la sugerencia del sistema", async () => {
      for (let vez = 0; vez < 2; vez++) {
        const res = await api(app).delete(ruta()).set(auth(asesor)).expect(200);
        expect(res.body.perfil_de_gasto).toMatchObject({
          nombre: "Espíritu Libre",
          origen: "sistema",
        });
      }

      const actuales = await vigentes();
      expect(actuales).toHaveLength(1);
      expect(actuales[0].asesor_id).toBeNull();
    });
  });
});

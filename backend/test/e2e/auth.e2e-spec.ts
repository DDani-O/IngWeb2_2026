/** Tests e2e de `/auth`. */
import { INestApplication } from "@nestjs/common";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  api,
  cleanupTestUser,
  createTestApp,
  generateTestEmail,
  TEST_PASSWORD,
} from "./test-utils";

/**
 * Autenticación y perfil propio (contrato §3.1, backend/README.md): registro, login, /auth/me y /auth/profile.
 */
describe("Auth (e2e)", () => {
  let app: INestApplication;
  let supabase: SupabaseClient;
  const email = generateTestEmail("auth.cliente");
  const createdIds: string[] = [];
  let token: string;

  beforeAll(async () => {
    ({ app, supabase } = await createTestApp());
  });

  afterAll(async () => {
    for (const id of createdIds) await cleanupTestUser(supabase, id);
    await app.close();
  });

  describe("POST /auth/register", () => {
    it("registra un cliente y devuelve { token, usuario } en español", async () => {
      const res = await api(app)
        .post("/auth/register")
        .send({
          nombre_completo: "Cliente de Prueba",
          email,
          password: TEST_PASSWORD,
          rol: "cliente",
        })
        .expect(201);

      expect(typeof res.body.token).toBe("string");
      expect(res.body.usuario).toMatchObject({
        email,
        rol: "cliente",
        nombre_completo: "Cliente de Prueba",
        estado: "activo",
      });
      expect(res.body.usuario.perfil_cliente).toMatchObject({
        ocupacion: "",
        ingreso_estimado: null,
        objetivo_financiero: "",
      });
      expect(res.body.usuario).not.toHaveProperty("perfil_asesor");
      createdIds.push(res.body.usuario.id);
      token = res.body.token;
    });

    it("registra un asesor con matrícula y especialidad", async () => {
      const res = await api(app)
        .post("/auth/register")
        .send({
          nombre_completo: "Asesor de Prueba",
          email: generateTestEmail("auth.asesor"),
          password: TEST_PASSWORD,
          rol: "asesor",
          matricula: `MAT-${Date.now()}`,
          especialidad: "Inversiones",
        })
        .expect(201);

      expect(res.body.usuario.perfil_asesor).toMatchObject({
        especialidad: "Inversiones",
        clientes_asignados: 0,
      });
      createdIds.push(res.body.usuario.id);
    });

    it("responde 409 EMAIL_DUPLICADO con un email existente", async () => {
      const res = await api(app)
        .post("/auth/register")
        .send({
          nombre_completo: "Otro",
          email,
          password: TEST_PASSWORD,
          rol: "cliente",
        })
        .expect(409);
      expect(res.body).toMatchObject({
        error: true,
        codigo: "EMAIL_DUPLICADO",
      });
    });

    it("responde 422 si un asesor no manda matrícula ni especialidad", async () => {
      const res = await api(app)
        .post("/auth/register")
        .send({
          nombre_completo: "Asesor",
          email: generateTestEmail("auth.x"),
          password: TEST_PASSWORD,
          rol: "asesor",
        })
        .expect(422);
      expect(res.body.detalles.campos).toEqual(["matricula", "especialidad"]);
    });

    it.each([
      ["corta", "Ab1"],
      ["sin mayúscula", "prueba1234"],
      ["sin número", "PruebaSinNumero"],
    ])(
      "responde 422 con una contraseña %s (misma regla que el front)",
      async (_caso, password) => {
        const res = await api(app)
          .post("/auth/register")
          .send({
            nombre_completo: "Cliente",
            email: generateTestEmail("auth.x"),
            password,
            rol: "cliente",
          })
          .expect(422);
        expect(res.body).toMatchObject({
          codigo: "VALIDACION",
          mensaje:
            "La contrasena debe tener al menos 8 caracteres, una mayuscula y un numero.",
          detalles: { campos: ["password"] },
        });
      },
    );

    it("rechaza los nombres de campo del contrato viejo", async () => {
      const res = await api(app)
        .post("/auth/register")
        .send({
          fullName: "X",
          email: generateTestEmail("auth.x"),
          password: TEST_PASSWORD,
          role: "cliente",
        })
        .expect(422);
      expect(res.body.codigo).toBe("VALIDACION");
    });
  });

  describe("POST /auth/login", () => {
    it("inicia sesión con credenciales válidas", async () => {
      const res = await api(app)
        .post("/auth/login")
        .send({ email, password: TEST_PASSWORD })
        .expect(200);
      expect(typeof res.body.token).toBe("string");
      expect(res.body.usuario).toMatchObject({ email, rol: "cliente" });
    });

    it("responde 401 CREDENCIALES_INVALIDAS con una contraseña incorrecta", async () => {
      const res = await api(app)
        .post("/auth/login")
        .send({ email, password: "Incorrecta123" })
        .expect(401);
      expect(res.body.codigo).toBe("CREDENCIALES_INVALIDAS");
    });
  });

  describe("GET /auth/me y PUT /auth/profile", () => {
    it("devuelve el usuario del token", async () => {
      const res = await api(app)
        .get("/auth/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
      expect(res.body).toMatchObject({ email, rol: "cliente" });
    });

    it("responde 401 NO_AUTENTICADO sin token", async () => {
      const res = await api(app).get("/auth/me").expect(401);
      expect(res.body.codigo).toBe("NO_AUTENTICADO");
    });

    it("actualiza el perfil del cliente", async () => {
      const res = await api(app)
        .put("/auth/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({
          nombre_completo: "Cliente Editado",
          biografia: "Hola",
          ocupacion: "Docente",
          ingreso_estimado: 250000,
          objetivo_financiero: "Ahorrar",
        })
        .expect(200);

      expect(res.body).toMatchObject({
        nombre_completo: "Cliente Editado",
        biografia: "Hola",
      });
      expect(res.body.perfil_cliente).toMatchObject({
        ocupacion: "Docente",
        ingreso_estimado: 250000,
        objetivo_financiero: "Ahorrar",
      });
    });

    it("rechaza campos de asesor en el perfil de un cliente", async () => {
      const res = await api(app)
        .put("/auth/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({ nombre_completo: "Cliente", matricula: "X" })
        .expect(422);
      expect(res.body.detalles.campos).toEqual(["matricula"]);
    });
  });
});

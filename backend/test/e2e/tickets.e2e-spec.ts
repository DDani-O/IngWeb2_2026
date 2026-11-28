/** Tests e2e de `/tickets/upload` y del gasto creado a partir de un ticket. */
import { INestApplication } from "@nestjs/common";
import { SupabaseClient } from "@supabase/supabase-js";
import { APIConnectionTimeoutError } from "openai";
import { DEFAULT_TIMEZONE, todayIn } from "../../src/modules/analysis/calendar";
import { ParsedTicket } from "../../src/modules/tickets/ocr.service";
import { TICKET_MAX_BYTES } from "../../src/modules/tickets/tickets.service";
import {
  api,
  cleanupTestUser,
  createTestApp,
  FakeOcr,
  registerAccount,
  TestAccount,
} from "./test-utils";

/**
 * Carga de tickets (contrato §3.4, backend/README.md) contra Supabase real (Storage, `tickets` y `analisis_ocr`)
 * con el OCR simulado: cada test decide qué responde la IA, así se prueban el éxito, la
 * falla, el timeout y el OCR sin configurar sin llamar a Groq. El parseo de la respuesta
 * del modelo está en src/modules/tickets/ocr.service.spec.ts.
 */
describe("Tickets (e2e)", () => {
  let app: INestApplication;
  let supabase: SupabaseClient;
  let cliente: TestAccount;
  let otroCliente: TestAccount;
  let asesor: TestAccount;
  let categoriaId: string;

  const ocr = {
    isAvailable: jest.fn(() => true),
    analyzeTicket: jest.fn<Promise<ParsedTicket>, [Buffer, string]>(),
  } satisfies FakeOcr;

  const lectura: ParsedTicket = {
    comercio_detectado: "Carrefour Express",
    fecha_detectada: "2026-11-20",
    monto_detectado: 1500.5,
    categoria_sugerida: "Alimentación",
    confianza_general: 87,
    texto_extraido: "TOTAL $1.500,50",
    respuesta_modelo: { comercio: "Carrefour Express" },
  };

  const auth = (account: TestAccount) => ({
    Authorization: `Bearer ${account.token}`,
  });
  const imagen = Buffer.from("imagen de prueba");
  const subir = (
    account: TestAccount,
    archivo = imagen,
    tipo = { filename: "ticket.png", contentType: "image/png" },
  ) =>
    api(app)
      .post("/tickets/upload")
      .set(auth(account))
      .attach("archivo", archivo, tipo);

  const ticketEnBase = async (id: string) => {
    const { data } = await supabase
      .from("tickets")
      .select("estado_procesamiento, tipo_mime, tamano_bytes")
      .eq("id", id)
      .single();
    return data;
  };
  const analisisEnBase = async (ticketId: string) => {
    const { data } = await supabase
      .from("analisis_ocr")
      .select("comercio_detectado, monto_detectado, gasto_id")
      .eq("ticket_id", ticketId);
    return data ?? [];
  };
  const archivosEnStorage = async (account: TestAccount) => {
    const { data } = await supabase.storage.from("tickets").list(account.id);
    return data ?? [];
  };

  beforeAll(async () => {
    ({ app, supabase } = await createTestApp({ ocr }));
    cliente = await registerAccount(app, "cliente", "tickets.cliente");
    otroCliente = await registerAccount(app, "cliente", "tickets.otro");
    asesor = await registerAccount(app, "asesor", "tickets.asesor");
    const res = await api(app).get("/categories").set(auth(cliente));
    categoriaId = res.body[0].id;
  });

  afterAll(async () => {
    for (const account of [cliente, otroCliente, asesor])
      await cleanupTestUser(supabase, account?.id);
    await app.close();
  });

  beforeEach(() => {
    ocr.isAvailable.mockReturnValue(true);
    ocr.analyzeTicket.mockReset();
  });

  describe("validación de la subida", () => {
    it("pide sesión y rol cliente", async () => {
      await api(app)
        .post("/tickets/upload")
        .attach("archivo", imagen, "t.png")
        .expect(401);
      await subir(asesor).expect(403);
    });

    it("responde 422 sin archivo", async () => {
      const res = await api(app)
        .post("/tickets/upload")
        .set(auth(cliente))
        .expect(422);
      expect(res.body.detalles.campos).toEqual(["archivo"]);
    });

    it.each([
      ["texto", { filename: "notas.txt", contentType: "text/plain" }],
      ["PDF", { filename: "factura.pdf", contentType: "application/pdf" }],
      ["GIF", { filename: "ticket.gif", contentType: "image/gif" }],
    ])("responde 422 con un archivo de tipo %s", async (_caso, tipo) => {
      const res = await subir(cliente, imagen, tipo).expect(422);
      expect(res.body).toMatchObject({
        codigo: "VALIDACION",
        mensaje: "El archivo debe ser una imagen JPEG, PNG o WebP.",
        detalles: { campos: ["archivo"] },
      });
    });

    it("responde 422 con un archivo de más de 5 MB", async () => {
      const res = await subir(
        cliente,
        Buffer.alloc(TICKET_MAX_BYTES + 1),
      ).expect(422);
      expect(res.body).toMatchObject({
        codigo: "VALIDACION",
        mensaje: "El archivo supera el tamano maximo de 5 MB.",
        detalles: { campos: ["archivo"] },
      });
    });

    it("no guarda nada ni llama a la IA si la subida es inválida", async () => {
      await subir(cliente, imagen, {
        filename: "notas.txt",
        contentType: "text/plain",
      }).expect(422);
      expect(ocr.analyzeTicket).not.toHaveBeenCalled();
      expect(await archivosEnStorage(cliente)).toHaveLength(0);
    });
  });

  describe("análisis con IA", () => {
    it("con lectura correcta guarda la imagen, el análisis y la categoría sugerida", async () => {
      ocr.analyzeTicket.mockResolvedValueOnce(lectura);

      const res = await subir(cliente).expect(201);
      expect(res.body).toMatchObject({
        ticket: {
          nombre_archivo: "ticket.png",
          estado_procesamiento: "procesado",
        },
        analisis: {
          comercio_detectado: "Carrefour Express",
          fecha_detectada: "2026-11-20",
          monto_detectado: 1500.5,
          categoria_sugerida: { nombre: "Alimentación" },
          confianza_general: 87,
        },
      });
      expect(ocr.analyzeTicket).toHaveBeenCalledWith(
        expect.any(Buffer),
        "image/png",
      );

      const id = res.body.ticket.id;
      expect(await ticketEnBase(id)).toMatchObject({
        estado_procesamiento: "procesado",
        tipo_mime: "image/png",
        tamano_bytes: imagen.length,
      });
      expect(await analisisEnBase(id)).toEqual([
        {
          comercio_detectado: "Carrefour Express",
          monto_detectado: 1500.5,
          gasto_id: null,
        },
      ]);
      expect(await archivosEnStorage(cliente)).toHaveLength(1);
    });

    it("con una categoría que no está en el catálogo, la sugerida queda en null", async () => {
      ocr.analyzeTicket.mockResolvedValueOnce({
        ...lectura,
        categoria_sugerida: "Mascotas",
      });
      const res = await subir(cliente).expect(201);
      expect(res.body.analisis.categoria_sugerida).toBeNull();
    });

    it.each([
      ["la IA falla", () => new Error("Groq 500")],
      ["la IA no responde a tiempo", () => new APIConnectionTimeoutError()],
      [
        "la respuesta no se puede leer",
        () => new Error("JSON no parseable: {"),
      ],
    ])(
      "si %s, guarda el ticket en error y responde analisis: null",
      async (_caso, error) => {
        ocr.analyzeTicket.mockRejectedValueOnce(error());

        const res = await subir(cliente).expect(201);
        expect(res.body).toMatchObject({
          ticket: { estado_procesamiento: "error" },
          analisis: null,
        });
        expect(await ticketEnBase(res.body.ticket.id)).toMatchObject({
          estado_procesamiento: "error",
        });
        expect(await analisisEnBase(res.body.ticket.id)).toHaveLength(0);
      },
    );

    it("sin OCR configurado responde analisis: null sin llamar a la IA", async () => {
      ocr.isAvailable.mockReturnValue(false);
      const res = await subir(cliente).expect(201);
      expect(res.body.analisis).toBeNull();
      expect(ocr.analyzeTicket).not.toHaveBeenCalled();
    });
  });

  describe("del ticket al gasto", () => {
    const crearGasto = (account: TestAccount, ticketId: string) =>
      api(app)
        .post("/expenses")
        .set(auth(account))
        .send({
          comercio: "Carrefour Express",
          fecha_gasto: todayIn(DEFAULT_TIMEZONE),
          monto: 1500.5,
          categoria_id: categoriaId,
          ticket_id: ticketId,
        });

    const gastoEnBase = async (id: string) => {
      const { data } = await supabase
        .from("gastos")
        .select("origen, ticket_principal_id, ocr_estado, ocr_confianza")
        .eq("id", id)
        .single();
      return data;
    };

    it("un ticket leído crea un gasto de origen ticket y vincula el análisis", async () => {
      ocr.analyzeTicket.mockResolvedValueOnce(lectura);
      const subida = await subir(cliente).expect(201);
      const ticketId = subida.body.ticket.id;

      const res = await crearGasto(cliente, ticketId).expect(201);
      expect(res.body).toMatchObject({
        origen: "ticket",
        monto: 1500.5,
        ticket_principal_id: ticketId,
      });
      expect(await gastoEnBase(res.body.id)).toMatchObject({
        origen: "ticket",
        ocr_estado: "procesado",
        ocr_confianza: 87,
      });
      expect(await analisisEnBase(ticketId)).toEqual([
        expect.objectContaining({ gasto_id: res.body.id }),
      ]);
    });

    it("un ticket que la IA no leyó crea el gasto con ocr_estado fallido", async () => {
      ocr.analyzeTicket.mockRejectedValueOnce(new Error("Groq 500"));
      const subida = await subir(cliente).expect(201);

      const res = await crearGasto(cliente, subida.body.ticket.id).expect(201);
      expect(await gastoEnBase(res.body.id)).toMatchObject({
        origen: "ticket",
        ocr_estado: "fallido",
        ocr_confianza: null,
      });
    });

    it("no se puede usar el ticket de otro cliente", async () => {
      ocr.analyzeTicket.mockResolvedValueOnce(lectura);
      const subida = await subir(cliente).expect(201);

      const res = await crearGasto(otroCliente, subida.body.ticket.id).expect(
        422,
      );
      expect(res.body).toMatchObject({
        codigo: "VALIDACION",
        detalles: { campos: ["ticket_id"] },
      });
    });
  });
});

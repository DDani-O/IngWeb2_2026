/** Objeto `gasto` del contrato (spec §10, "Objetos comunes"). */
export interface Gasto {
  id: string;
  comercio: string;
  fecha_gasto: string;
  monto: number;
  descripcion: string;
  origen: "manual" | "ticket";
  moneda: string;
  categoria: { id: string; nombre: string; icono: string } | null;
  ticket_principal_id: string | null;
  creado_en: string;
  actualizado_en: string;
}

/** Columnas que se leen de `gastos` para armar un `gasto`. */
export const GASTO_SELECT =
  "id, comercio, fecha_gasto, monto, descripcion, origen, moneda, ticket_principal_id, creado_en, actualizado_en, categoria:categoria_id (id, nombre, icono)";

type CategoriaRow = { id: string; nombre: string; icono: string };

export interface GastoRow {
  id: string;
  comercio: string;
  fecha_gasto: string;
  monto: number | string;
  descripcion: string | null;
  origen: "manual" | "ticket";
  moneda: string;
  ticket_principal_id: string | null;
  creado_en: string;
  actualizado_en: string | null;
  categoria: CategoriaRow | CategoriaRow[] | null;
}

/** Fila de `gastos` (con su categoría embebida) → `gasto`. */
export function toGasto(row: GastoRow): Gasto {
  const categoria = Array.isArray(row.categoria)
    ? (row.categoria[0] ?? null)
    : row.categoria;
  return {
    id: row.id,
    comercio: row.comercio,
    fecha_gasto: row.fecha_gasto,
    monto: Number(row.monto),
    descripcion: row.descripcion ?? "",
    origen: row.origen,
    moneda: row.moneda,
    categoria: categoria
      ? { id: categoria.id, nombre: categoria.nombre, icono: categoria.icono }
      : null,
    ticket_principal_id: row.ticket_principal_id,
    creado_en: row.creado_en,
    actualizado_en: row.actualizado_en ?? row.creado_en,
  };
}

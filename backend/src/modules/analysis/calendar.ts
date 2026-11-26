/**
 * Aritmética de fechas sobre strings `AAAA-MM-DD`, sin depender de la zona horaria
 * del servidor: "hoy" se calcula en la zona de la app y el resto opera en UTC puro.
 */

/** Zona horaria por defecto: los clientes cargan gastos con fechas de Argentina. */
export const DEFAULT_TIMEZONE = "America/Argentina/Buenos_Aires";

const pad = (value: number) => String(value).padStart(2, "0");

const toUtc = (iso: string) => {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

const fromUtc = (date: Date) =>
  `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;

/** Fecha de hoy (`AAAA-MM-DD`) en la zona horaria indicada. */
export function todayIn(timeZone: string, now = new Date()): string {
  // en-CA formatea como AAAA-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Suma (o resta) días a una fecha. */
export function addDays(iso: string, days: number): string {
  const date = toUtc(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return fromUtc(date);
}

/** Clave de mes `AAAA-MM`. */
export const monthKey = (iso: string) => iso.slice(0, 7);

/** Los últimos `count` meses hasta el de `today` inclusive, del más viejo al actual. */
export function monthKeysUntil(today: string, count: number): string[] {
  const [year, month] = today.split("-").map(Number);
  return Array.from({ length: count }, (_, index) =>
    fromUtc(new Date(Date.UTC(year, month - 1 - (count - 1 - index), 1))).slice(
      0,
      7,
    ),
  );
}

/** Primer día del mes que está `monthsBack` meses antes del de `today`. */
export function startOfMonthsBack(today: string, monthsBack: number): string {
  const [year, month] = today.split("-").map(Number);
  return fromUtc(new Date(Date.UTC(year, month - 1 - monthsBack, 1)));
}

/** Día de la semana: 0 = domingo … 6 = sábado. */
export const weekday = (iso: string) => toUtc(iso).getUTCDay();

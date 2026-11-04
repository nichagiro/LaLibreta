/**
 * Formateo de presentación para COP y fechas.
 *
 * Capa puramente visual: los valores crudos siguen siendo enteros en COP
 * (`180000`) y fechas estrictas `YYYY-MM-DD`. Aquí solo se dora para lectura.
 * No contiene reglas de negocio ni cálculos de saldo.
 */

// ==========================================
// 1. Moneda (COP, enteros sin decimales)
// ==========================================

const copNumber = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
  useGrouping: true,
});

export interface CopFormatOptions {
  /** Incluye el símbolo `$`. Por defecto `true`. */
  symbol?: boolean;
  /** Añade el código `COP` al final. Por defecto `false`. */
  code?: boolean;
}

/**
 * Convierte un entero COP a texto legible.
 *
 * @example formatCop(180000)                  // "$ 180.000"
 * @example formatCop(180000, { code: true })  // "$ 180.000 COP"
 * @example formatCop(180000, { symbol: false }) // "180.000"
 */
export function formatCop(amount: number, options: CopFormatOptions = {}): string {
  const { symbol = true, code = false } = options;
  const safe = Number.isFinite(amount) ? Math.trunc(amount) : 0;
  const digits = copNumber.format(Math.abs(safe));
  const sign = safe < 0 ? '-' : '';
  const body = symbol ? `$ ${digits}` : digits;
  return `${sign}${body}${code ? ' COP' : ''}`;
}

/**
 * Extrae el entero COP de lo que el usuario escribió en un campo de dinero.
 * Devuelve `null` cuando no hay dígitos válidos.
 *
 * @example parseCopInput("$ 180.000") // 180000
 * @example parseCopInput("abc")       // null
 */
export function parseCopInput(raw: string): number | null {
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return null;
  const value = Number(digits);
  return Number.isSafeInteger(value) ? value : null;
}

// ==========================================
// 2. Fechas (YYYY-MM-DD de negocio, America/Bogota)
// ==========================================

const shortDateFormat = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const longDateFormat = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const clockFormat = new Intl.DateTimeFormat('es-CO', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/**
 * Interpreta `YYYY-MM-DD` como fecha de calendario local.
 *
 * `new Date('2026-11-04')` se resuelve como medianoche UTC y, en America/Bogota
 * (UTC-5), caería en el día 3. Por eso se construye con los componentes locales.
 */
function parseCalendarDate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Fecha de negocio corta: `4 nov 2026`.
 * Devuelve la cadena original si no cumple `YYYY-MM-DD`.
 */
export function formatDateEs(iso: string): string {
  const date = parseCalendarDate(iso);
  return date ? shortDateFormat.format(date) : iso;
}

/**
 * Fecha de negocio larga: `4 de noviembre de 2026`.
 * Devuelve la cadena original si no cumple `YYYY-MM-DD`.
 */
export function formatDateLongEs(iso: string): string {
  const date = parseCalendarDate(iso);
  return date ? longDateFormat.format(date) : iso;
}

/**
 * Timestamp de auditoría ISO UTC a texto local legible: `4 nov 2026, 10:00`.
 * Devuelve la cadena original si no es un timestamp válido.
 */
export function formatTimestampEs(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return isoTimestamp;
  return `${shortDateFormat.format(date)}, ${clockFormat.format(date)}`;
}

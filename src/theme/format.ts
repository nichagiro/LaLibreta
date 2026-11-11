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
 * Normaliza cualquier formato de fecha (Date, ISO con hora, texto canónico,
 * `MM/DD/YYYY`, `DD/MM/YYYY` o fecha completa de Google Sheets como
 * "Sun Feb 08 2026 00:00:00 GMT-0500 (hora estándar de Colombia)")
 * a formato canónico "YYYY-MM-DD".
 *
 * Debe mantenerse en sincronía con `formatSheetDate` de `apps-script/Code.gs`:
 * el backend es quien guarda y compara fechas, y el frontend solo las dora
 * para lectura. Si las dos capas interpretan distinto un mismo texto, el
 * resumen y la lista se contradicen.
 */
export function normalizeDate(raw: unknown): string {
  if (!raw) return '';
  if (raw instanceof Date) {
    if (Number.isNaN(raw.getTime())) return '';
    const y = raw.getFullYear();
    const m = String(raw.getMonth() + 1).padStart(2, '0');
    const d = String(raw.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const str = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})(?:[T ]|$)/.exec(str);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }
  const ymdMatch = /^(\d{4})[/.](\d{1,2})[/.](\d{1,2})$/.exec(str);
  if (ymdMatch) {
    return `${ymdMatch[1]}-${ymdMatch[2].padStart(2, '0')}-${ymdMatch[3].padStart(2, '0')}`;
  }
  // Interpreta cadenas devueltas por Google Sheets cuando la celda es tipo fecha:
  // "Sun Feb 08 2026 00:00:00 GMT-0500 (hora estándar de Colombia)"
  const months: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  };
  const match = /[A-Za-z]{3}\s+([A-Za-z]{3})\s+(\d{1,2})\s+(\d{4})/.exec(str);
  if (match) {
    const m = months[match[1].toLowerCase()];
    if (m) {
      return `${match[3]}-${m}-${match[2].padStart(2, '0')}`;
    }
  }
  const monthFirst = /^([A-Za-z]{3})\s+(\d{1,2}),?\s+(\d{4})$/.exec(str);
  if (monthFirst) {
    const m = months[monthFirst[1].toLowerCase()];
    if (m) return `${monthFirst[3]}-${m}-${monthFirst[2].padStart(2, '0')}`;
  }
  const dayFirst = /^(\d{1,2})\s+([A-Za-z]{3}),?\s+(\d{4})$/.exec(str);
  if (dayFirst) {
    const m = months[dayFirst[2].toLowerCase()];
    if (m) return `${dayFirst[3]}-${m}-${dayFirst[1].padStart(2, '0')}`;
  }
  // "MM/DD/YYYY" o "DD/MM/YYYY": se desempata por los propios números.
  // Cuando siguen siendo ambiguos se usa el orden mes/día, que es el que
  // aplica `new Date()` en el navegador.
  const numericMatch = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/.exec(str);
  if (numericMatch) {
    const first = Number(numericMatch[1]);
    const second = Number(numericMatch[2]);
    const year = numericMatch[3];
    let day: number;
    let month: number;
    if (first > 12) {
      day = first;
      month = second;
    } else if (second > 12) {
      month = first;
      day = second;
    } else {
      month = first;
      day = second;
    }
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }
  const clean = str.replace(/\s*\([^)]*\)$/, '');
  const parsed = new Date(clean);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return str;
}

/**
 * Interpreta `YYYY-MM-DD` como fecha de calendario local.
 *
 * `new Date('2026-11-04')` se resuelve como medianoche UTC y, en America/Bogota
 * (UTC-5), caería en el día 3. Por eso se construye con los componentes locales.
 */
function parseCalendarDate(iso: string): Date | null {
  const normalized = normalizeDate(iso);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);
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
  if (!isoTimestamp) return '';
  const clean = isoTimestamp.replace(/\s*\([^)]*\)$/, '');
  const date = new Date(clean);
  if (Number.isNaN(date.getTime())) return isoTimestamp;
  return `${shortDateFormat.format(date)}, ${clockFormat.format(date)}`;
}

/**
 * Normaliza y formatea un código de referencia legible para comprobantes PDF.
 * Si recibe un identificador técnico de BD con prefijo "act_" y formato UUID o similar,
 * lo formatea a una referencia limpia como "ACT-YYYY-XXXXXXXX" para evitar desbordes
 * y presentar una numeración estética y profesional.
 *
 * @example formatReferenceCode("act_90caf568-8d7e-41db-977f-3fd1e5631c8e", "2026-10-25")
 *          // "ACT-2026-90CAF568"
 * @example formatReferenceCode("ACT-2026-001")
 *          // "ACT-2026-001"
 */
export function formatReferenceCode(code: string, dateIso?: string): string {
  if (!code) return '';
  const trimmed = code.trim();
  if (trimmed.startsWith('act_')) {
    const rawSeq = trimmed.replace('act_', '').replace(/[^a-zA-Z0-9]/g, '');
    const seq = (rawSeq.slice(0, 8) || '0001').toUpperCase();
    const year = dateIso ? normalizeDate(dateIso).slice(0, 4) : '';
    return year && year.length === 4 ? `ACT-${year}-${seq}` : `ACT-${seq}`;
  }
  return trimmed;
}

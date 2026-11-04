/**
 * Design tokens — dirección visual «La Libreta».
 *
 * Análogo físico: el cuaderno de cuentas / talonario de recibos del trabajador
 * independiente. Papel frío, tinta casi negra, reglas finas que ordenan la
 * información y cifras alineadas.
 *
 * Principio rector: **el cromo es papel y tinta; el color tiene significado
 * financiero, nada más.** Ningún color se usa decorativamente.
 *
 * `tailwind.config.js` expone estos mismos valores como utilidades de clase.
 * Este módulo existe para consumo tipado fuera del CSS: muestras de la galería,
 * hoja de referencia del PDF y formateadores.
 */

// ==========================================
// 1. Color
// ==========================================

export const colors = {
  /** Fondo de página. Papel frío, deliberadamente no crema. */
  paper: '#F4F6F5',
  /** Panel elevado sobre el papel. Sin sombra: solo borde hairline. */
  panel: '#FFFFFF',

  /** Texto primario y acción primaria sólida. */
  ink: '#121716',
  /** Foco, enlaces y navegación activa. */
  accent: '#2C5C8F',

  /** Reglas: estructura, no decoración. */
  ruleSubtle: '#EAEFED',
  rule: '#DBE2E0',
  ruleStrong: '#C2CCC9',

  /** Escala neutra (texto y superficies). */
  surface100: '#EAEFED',
  surface200: '#DBE2E0',
  surface300: '#C2CCC9',
  surface500: '#5F6C67',
  surface600: '#4A5652',
  surface800: '#262E2C',
  surface900: '#121716',

  /** Dinero recibido / pagado. */
  received: '#0E6E58',
  receivedTint: '#E3F1ED',

  /** Saldo pendiente por cobrar / abono parcial. */
  owed: '#A6511C',
  owedTint: '#FAEBE0',

  /** Cancelado / archivado. */
  cancelled: '#6B7280',
  cancelledTint: '#ECEFEE',

  /** Eje del estado de actividad: progreso del trabajo. */
  activityPending: '#5F6C67',
  activityProgress: '#2C5C8F',
  activityDone: '#16406B',
  activityCancelled: '#6B7280',
} as const;

/** Muestras para la galería y la documentación. */
export interface ColorSwatch {
  key: keyof typeof colors;
  label: string;
  role: string;
}

export const swatches: readonly ColorSwatch[] = [
  { key: 'paper', label: 'Papel', role: 'Fondo de página' },
  { key: 'panel', label: 'Panel', role: 'Superficie elevada' },
  { key: 'ink', label: 'Tinta', role: 'Texto primario y acción primaria' },
  { key: 'accent', label: 'Acento', role: 'Foco, enlaces y navegación activa' },
  { key: 'rule', label: 'Regla', role: 'Bordes y separadores de fila' },
  { key: 'surface500', label: 'Texto atenuado', role: 'Metadatos y etiquetas' },
  { key: 'received', label: 'Cobro', role: 'Dinero recibido / pagado' },
  { key: 'receivedTint', label: 'Cobro tinte', role: 'Fondo de chip pagado' },
  { key: 'owed', label: 'Deuda', role: 'Saldo pendiente / abono parcial' },
  { key: 'owedTint', label: 'Deuda tinte', role: 'Fondo de chip pendiente' },
  { key: 'cancelled', label: 'Anulado', role: 'Cancelado / archivado' },
  { key: 'cancelledTint', label: 'Anulado tinte', role: 'Fondo de chip anulado' },
];

// ==========================================
// 2. Tipografía
// ==========================================

export const typography = {
  /**
   * Archivo (Omnibus-Type). Una sola familia para todo, con contraste de peso
   * y de escala en lugar de una segunda tipografía. Los numerales tabulares
   * se activan por utilidad `tabular-nums`, no con una fuente monoespaciada.
   */
  fontFamily:
    "'Archivo', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",

  scale: [
    { token: 'display', css: 'text-3xl md:text-4xl', size: '30 / 36 px', weight: '600', usage: 'Saldo o cifra principal' },
    { token: 'h1', css: 'text-2xl md:text-3xl', size: '24 / 30 px', weight: '600', usage: 'Título de página' },
    { token: 'h2', css: 'text-base md:text-lg', size: '16 / 18 px', weight: '600', usage: 'Título de sección' },
    { token: 'h3', css: 'text-sm md:text-base', size: '14 / 16 px', weight: '600', usage: 'Título de fila o bloque' },
    { token: 'body', css: 'text-sm', size: '14 px', weight: '400', usage: 'Cuerpo de texto, máx. 80 caracteres' },
    { token: 'meta', css: 'text-xs', size: '12 px', weight: '500', usage: 'Metadatos y etiquetas en sentence case' },
  ] as const,
} as const;

// ==========================================
// 3. Espaciado, radios y elevación
// ==========================================

/** Base de 4 px (escala Tailwind). Ningún valor fuera de esta grilla. */
export const spacing = {
  pageGutter: 'px-4 md:px-6 lg:px-8',
  sectionGap: 'space-y-6 lg:space-y-8',
  contentWidth: 'max-w-6xl',
  /** Filas de lista: densa pero con target táctil ≥ 44 px. */
  row: 'py-3',
} as const;

/**
 * Radios jerárquicos: no hay un único radio para todo.
 * Filas sin radio (libreta), controles 6 px, paneles 8 px, chips de estado
 * 2 px (aspecto de sello), marcadores redondos.
 */
export const radii = {
  row: 'rounded-none',
  control: 'rounded-md',
  panel: 'rounded-lg',
  chip: 'rounded-sm',
} as const;

/**
 * Sombra reservada exclusivamente a overlays (diálogos y hojas móviles).
 * Los paneles usan borde hairline: nada de la "misma sombra suave bajo cada
 * tarjeta".
 */
export const elevation = {
  dialog: '0 20px 48px rgba(18, 23, 22, 0.18)',
  sheet: '0 -8px 28px rgba(18, 23, 22, 0.14)',
} as const;

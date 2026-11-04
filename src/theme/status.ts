/**
 * Metadatos de presentación para estados, tipos y métodos de pago.
 *
 * Regla del sistema: **el estado de actividad y el estado de pago nunca se
 * confunden** porque usan dos ejes distintos:
 *
 * - Estado de actividad (progreso del trabajo) → chip contorneado, marcador
 *   cuadrado, familia azul/tinta.
 * - Estado de pago (dinero) → chip relleno, marcador circular, familia
 *   verde/naranja.
 *
 * El color nunca comunica solo: cada chip lleva etiqueta en español y una
 * forma distinta, de modo que es legible en escala de grises y para usuarios
 * con deficiencia de visión cromática.
 */

import type { ActivityStatus, ActivityType, PaymentMethod, PaymentStatus } from '@/types';

/** Forma dibujada a SVG detrás de la etiqueta. Independiente de la tipografía. */
export type StatusMarker =
  | 'square-empty'
  | 'square-half'
  | 'square-full'
  | 'square-cross'
  | 'circle-empty'
  | 'circle-half'
  | 'circle-full';

/**
 * Tono semántico. Lo resuelve `StatusChip` con los tokens de color; no expone
 * hex sueltos a las pantallas.
 */
export type StatusTone =
  | 'neutral'
  | 'progress'
  | 'done'
  | 'cancelled'
  | 'money-pending'
  | 'money-partial'
  | 'money-paid';

export interface StatusMeta {
  /** Texto visible en español. Siempre se renderiza. */
  label: string;
  tone: StatusTone;
  marker: StatusMarker;
}

// ==========================================
// 1. Estado operativo de la actividad
// ==========================================

export const ACTIVITY_STATUS_META: Record<ActivityStatus, StatusMeta> = {
  pending: { label: 'Pendiente', tone: 'neutral', marker: 'square-empty' },
  in_progress: { label: 'En proceso', tone: 'progress', marker: 'square-half' },
  completed: { label: 'Finalizada', tone: 'done', marker: 'square-full' },
  cancelled: { label: 'Cancelada', tone: 'cancelled', marker: 'square-cross' },
};

/** Orden lógico para listados y filtros (no alfabético). */
export const ACTIVITY_STATUS_ORDER: readonly ActivityStatus[] = [
  'pending',
  'in_progress',
  'completed',
  'cancelled',
];

// ==========================================
// 2. Estado financiero derivado del pago
// ==========================================

export const PAYMENT_STATUS_META: Record<PaymentStatus, StatusMeta> = {
  pending: { label: 'Sin abonos', tone: 'money-pending', marker: 'circle-empty' },
  partial: { label: 'Abono parcial', tone: 'money-partial', marker: 'circle-half' },
  paid: { label: 'Pagado', tone: 'money-paid', marker: 'circle-full' },
};

export const PAYMENT_STATUS_ORDER: readonly PaymentStatus[] = [
  'pending',
  'partial',
  'paid',
];

// ==========================================
// 3. Tipos de actividad y métodos de pago
// ==========================================

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  service: 'Servicio',
  sale: 'Venta',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  transferencia_bancaria: 'Transferencia bancaria',
  nequi: 'Nequi',
  daviplata: 'Daviplata',
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  otro: 'Otro',
};

/** Orden de presentación en selectores. */
export const PAYMENT_METHOD_ORDER: readonly PaymentMethod[] = [
  'transferencia_bancaria',
  'nequi',
  'daviplata',
  'efectivo',
  'tarjeta',
  'otro',
];

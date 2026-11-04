import type { ActivityStatus, PaymentStatus } from '@/types';
import { cn } from '@/theme/cn';
import {
  ACTIVITY_STATUS_META,
  PAYMENT_STATUS_META,
  type StatusMarker,
  type StatusTone,
} from '@/theme/status';

export type StatusChipKind = 'activity' | 'payment';

export interface StatusChipProps {
  /**
   * `activity` → estado operativo del trabajo (chip contorneado, marcador
   * cuadrado, familia azul/tinta).
   * `payment` → estado financiero derivado de los abonos (chip relleno,
   * marcador circular, familia verde/naranja).
   */
  kind: StatusChipKind;
  value: ActivityStatus | PaymentStatus;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Chip de estado.
 *
 * El color nunca actúa solo: siempre van etiqueta en español y una forma
 * distinta (cuadrado para actividad, círculo para dinero). Así el chip sigue
 * distinguiéndose en escala de grises y con deficiencia de visión cromática.
 */
export function StatusChip({ kind, value, size = 'md', className }: StatusChipProps) {
  const meta =
    kind === 'activity'
      ? ACTIVITY_STATUS_META[value as ActivityStatus]
      : PAYMENT_STATUS_META[value as PaymentStatus];

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center whitespace-nowrap rounded-sm border font-medium',
        size === 'md' ? 'gap-1.5 px-2 py-1 text-xs' : 'gap-1 px-1.5 py-0.5 text-[11px]',
        toneClasses[meta.tone],
        className,
      )}
    >
      <StatusMarkerIcon shape={meta.marker} size={size === 'md' ? 10 : 9} />
      {meta.label}
    </span>
  );
}

/**
 * Estado de actividad → contorno. Estado de pago → relleno.
 * Esta es la separación que impide confundir "finalizada" con "pagada".
 */
const toneClasses: Record<StatusTone, string> = {
  neutral: 'border-rule-strong bg-transparent text-surface-600',
  progress: 'border-accent/50 bg-transparent text-accent',
  done: 'border-activity-done/50 bg-transparent text-activity-done',
  cancelled: 'border-cancelled/50 bg-transparent text-cancelled',
  'money-pending': 'border-owed/25 bg-owed-tint text-owed',
  'money-partial': 'border-owed/55 bg-owed-tint text-owed',
  'money-paid': 'border-received/30 bg-received-tint text-received',
};

interface MarkerProps {
  shape: StatusMarker;
  size: number;
}

function StatusMarkerIcon({ shape, size }: MarkerProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 10 10"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      {shape === 'square-empty' ? (
        <rect x="1" y="1" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.6" />
      ) : null}
      {shape === 'square-half' ? (
        <>
          <rect x="1" y="1" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.6" />
          <path d="M1.8 1.8h3.2v6.4H1.8z" fill="currentColor" />
        </>
      ) : null}
      {shape === 'square-full' ? (
        <rect x="1" y="1" width="8" height="8" rx="1" fill="currentColor" />
      ) : null}
      {shape === 'square-cross' ? (
        <path
          d="M2 2l6 6M8 2L2 8"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      ) : null}
      {shape === 'circle-empty' ? (
        <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.6" />
      ) : null}
      {shape === 'circle-half' ? (
        <>
          <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.6" />
          <path d="M5 1.4a3.6 3.6 0 0 1 0 7.2z" fill="currentColor" />
        </>
      ) : null}
      {shape === 'circle-full' ? <circle cx="5" cy="5" r="4" fill="currentColor" /> : null}
    </svg>
  );
}

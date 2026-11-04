import { cn } from '@/theme/cn';
import { formatCop } from '@/theme/format';
import { Money } from './Money';

export interface BalanceRailProps {
  /** Valor total acordado (actividad) o sumado (período). */
  total: number;
  /** Dinero ya cobrado. */
  received: number;
  /** Saldo por cobrar. En una actividad cancelada es 0. */
  pending: number;
  /** Actividad cancelada: el resto se pinta en gris en lugar de ámbar. */
  cancelled?: boolean;
  /** Etiquetas de los extremos. */
  receivedLabel?: string;
  pendingLabel?: string;
  size?: 'sm' | 'md';
  /** Muestra los montos bajo la barra. */
  showAmounts?: boolean;
  className?: string;
}

/**
 * Barra de saldo: qué parte de la actividad o del período ya se cobró y qué
 * parte sigue pendiente.
 *
 * Es el elemento firma del sistema y es puramente informativo: la proporción
 * se calcula a partir de los montos que recibe, nunca deriva saldos por su
 * cuenta. Bajo la barra siempre hay etiqueta con las dos cifras, de modo que
 * el dato se lee aunque no se distingan los colores.
 */
export function BalanceRail({
  total,
  received,
  pending,
  cancelled = false,
  receivedLabel = 'Cobrado',
  pendingLabel = 'Pendiente',
  size = 'md',
  showAmounts = true,
  className,
}: BalanceRailProps) {
  const safeTotal = Number.isFinite(total) && total > 0 ? total : 0;
  const safeReceived = Number.isFinite(received) && received > 0 ? Math.min(received, safeTotal || received) : 0;
  const safePending = Number.isFinite(pending) && pending > 0 ? pending : 0;

  const receivedPct =
    safeTotal > 0 ? Math.min(100, (safeReceived / safeTotal) * 100) : 0;
  const remainderPct = 100 - receivedPct;
  const hasValue = safeTotal > 0;

  const remainderTone = cancelled ? 'bg-cancelled' : 'bg-owed';

  const ariaLabel = hasValue
    ? `${receivedLabel}: ${formatCop(received)}. ${pendingLabel}: ${formatCop(pending)}. Total: ${formatCop(total)}.`
    : `${receivedLabel}: ${formatCop(received)}. ${pendingLabel}: ${formatCop(pending)}.`;

  return (
    <div className={cn('space-y-2', className)}>
      <div
        role="img"
        aria-label={ariaLabel}
        className={cn(
          'flex w-full overflow-hidden rounded-sm border border-rule bg-surface-100',
          size === 'md' ? 'h-3' : 'h-2',
        )}
      >
        {hasValue ? (
          <>
            <div
              className="bg-received transition-[width] duration-300"
              style={{ width: `${receivedPct}%` }}
            />
            <div
              className={cn('transition-[width] duration-300', remainderTone)}
              style={{ width: `${remainderPct}%` }}
            />
          </>
        ) : (
          <div className="w-full bg-surface-200" />
        )}
      </div>

      {showAmounts ? (
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-xs">
          <span className="flex items-center gap-1.5 text-surface-600">
            <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-received" />
            <span>{receivedLabel}</span>
            <Money value={received} tone="received" emphasis="strong" />
          </span>

          <span className="flex items-center gap-1.5 text-surface-600">
            <span
              aria-hidden="true"
              className={cn('h-2 w-2 shrink-0 rounded-full', remainderTone)}
            />
            <span>{pendingLabel}</span>
            <Money
              value={safePending}
              tone={cancelled ? 'muted' : 'owed'}
              emphasis="strong"
            />
          </span>
        </div>
      ) : null}
    </div>
  );
}

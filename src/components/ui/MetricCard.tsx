import type { ReactNode } from 'react';
import { cn } from '@/theme/cn';
import { Money, type MoneyTone } from './Money';
import { Skeleton } from './Skeleton';

export interface MetricCardProps {
  /** Qué mide la cifra, en una frase corta. */
  label: string;
  /** Entero COP. */
  value: number | null;
  /** Eje semántico: cobro, deuda o neutro. */
  tone?: MoneyTone;
  /** Aclaración bajo el valor, por ejemplo el rango de fechas analizado. */
  detail?: string;
  /** Contenido auxiliar al pie, por ejemplo el desglose de conteos. */
  footer?: ReactNode;
  /** Indica si la métrica se encuentra actualizándose. */
  loading?: boolean;
  className?: string;
}

/**
 * Tarjeta de indicador del resumen financiero.
 *
 * Sin sombra y sin degradado: la jerarquía la dan el rótulo atenuado y la
 * cifra en numerales tabulares. El color del valor identifica el eje al que
 * pertenece, pero la etiqueta siempre lo dice con palabras.
 */
export function MetricCard({
  label,
  value,
  tone = 'default',
  detail,
  footer,
  loading = false,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1.5 rounded-lg border border-rule bg-panel p-4 sm:p-5 transition-opacity',
        className,
      )}
    >
      <p className="text-xs font-medium text-surface-500">{label}</p>

      {loading ? (
        <div className="h-8 flex items-center">
          <Skeleton className="h-7 w-32" />
        </div>
      ) : (
        <Money value={value} tone={tone} emphasis="display" />
      )}

      {detail ? <p className="text-xs leading-snug text-surface-500">{detail}</p> : null}

      {footer ? <div className="mt-2 border-t border-rule-subtle pt-2.5 text-xs text-surface-600">{footer}</div> : null}
    </div>
  );
}

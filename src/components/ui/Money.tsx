import { cn } from '@/theme/cn';
import { formatCop } from '@/theme/format';

export type MoneyTone = 'default' | 'received' | 'owed' | 'muted';
export type MoneyEmphasis = 'hero' | 'display' | 'strong' | 'normal';

export interface MoneyProps {
  /** Entero COP. `null` o `undefined` renderiza `fallback`. */
  value: number | null | undefined;
  /** Color semántico. El significado lo fija la etiqueta que lo acompaña. */
  tone?: MoneyTone;
  /** Peso visual: cifra principal, cifra en fila o texto corrido. */
  emphasis?: MoneyEmphasis;
  /** Añade el código `COP` al final. */
  showCode?: boolean;
  /** Texto cuando no hay valor. Por defecto un guion largo. */
  fallback?: string;
  className?: string;
}

const toneClasses: Record<MoneyTone, string> = {
  default: 'text-ink',
  received: 'text-received',
  owed: 'text-owed',
  muted: 'text-surface-500',
};

const emphasisClasses: Record<MoneyEmphasis, string> = {
  hero: 'text-3xl font-semibold tracking-tight md:text-4xl',
  display: 'text-2xl font-semibold tracking-tight md:text-3xl',
  strong: 'text-sm font-semibold md:text-base',
  normal: 'text-sm font-medium',
};

/**
 * Cifra en COP.
 *
 * Todos los montos pasan por aquí para que la presentación sea idéntica en
 * toda la aplicación: numerales tabulares, sin decimales y con el separador
 * de miles de `es-CO`.
 */
export function Money({
  value,
  tone = 'default',
  emphasis = 'normal',
  showCode = false,
  fallback = '—',
  className,
}: MoneyProps) {
  const hasValue = typeof value === 'number' && Number.isFinite(value);

  return (
    <span
      className={cn(
        'tabular-nums',
        toneClasses[tone],
        emphasisClasses[emphasis],
        className,
      )}
    >
      {hasValue ? formatCop(value, { code: showCode }) : fallback}
    </span>
  );
}

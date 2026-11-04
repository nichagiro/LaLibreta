import type { ReactNode } from 'react';
import { cn } from '@/theme/cn';

export interface PanelProps {
  /** Encabezado opcional de la sección. */
  title?: string;
  /** Aclaración breve bajo el encabezado. */
  description?: string;
  /** Acciones alineadas a la derecha del encabezado. */
  actions?: ReactNode;
  children: ReactNode;
  /**
   * `default` aplica el padding estándar.
   * `flush` deja el contenido pegado al borde: para listas y tablas cuyas
   * filas ya declaran su propio padding y separación.
   */
  padding?: 'default' | 'flush';
  className?: string;
}

/**
 * Superficie elevada.
 *
 * Siempre papel blanco con borde hairline y **sin sombra**: la jerarquía la
 * dan el borde y el espacio, no una sombra idéntica bajo cada bloque. La
 * sombra está reservada a los overlays (`Dialog`).
 */
export function Panel({
  title,
  description,
  actions,
  children,
  padding = 'default',
  className,
}: PanelProps) {
  const hasHeader = Boolean(title || actions);

  return (
    <section className={cn('rounded-lg border border-rule bg-panel', className)}>
      {hasHeader ? (
        <header className="flex flex-wrap items-start justify-between gap-3 px-4 pt-4 sm:px-5">
          <div className="min-w-0">
            {title ? <h2 className="text-base font-semibold text-ink">{title}</h2> : null}
            {description ? (
              <p className="mt-0.5 text-xs leading-snug text-surface-500">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}

      <div
        className={cn(
          hasHeader && 'pt-4',
          padding === 'default' && 'p-4 sm:p-5',
        )}
      >
        {children}
      </div>
    </section>
  );
}

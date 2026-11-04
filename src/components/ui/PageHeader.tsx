import type { ReactNode } from 'react';
import { cn } from '@/theme/cn';
import { IconArrowLeft } from './Icon';

export interface PageHeaderProps {
  /** Título de la página. Siempre un `h1`. */
  title: string;
  /** Bajada breve que explica qué se ve o qué se puede hacer aquí. */
  description?: string;
  /** Muestra el botón de volver. */
  onBack?: () => void;
  /** Acciones alineadas a la derecha: el botón primario vive aquí. */
  actions?: ReactNode;
  /** Contenido complementario debajo: filtros, resumen, pestañas. */
  children?: ReactNode;
  className?: string;
}

/**
 * Encabezado de página.
 *
 * El título a la izquierda y la acción principal a la derecha en escritorio;
 * en móvil las acciones pasan a una segunda línea para no comprimir el
 * título. La bajada se limita a `max-w-prose` para no pasar de 80 caracteres.
 */
export function PageHeader({
  title,
  description,
  onBack,
  actions,
  children,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn('space-y-4', className)}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="flex min-w-0 items-start gap-2.5">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Volver"
              className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-rule-strong bg-panel text-surface-600 transition-colors hover:bg-surface-100 hover:text-ink"
            >
              <IconArrowLeft size={16} />
            </button>
          ) : null}

          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-ink md:text-3xl">{title}</h1>
            {description ? (
              <p className="mt-1 max-w-prose text-sm leading-relaxed text-surface-600">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>

      {children}
    </header>
  );
}

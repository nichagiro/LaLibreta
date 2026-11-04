import type { ReactNode } from 'react';
import { cn } from '@/theme/cn';
import { IconInbox } from './Icon';

export interface EmptyStateProps {
  /** Qué falta, en una frase. */
  title: string;
  /** Cómo resolverlo, en una o dos frases. */
  description?: string;
  /** Acción que llena el vacío: crear el primer registro, limpiar filtros… */
  action?: ReactNode;
  /** Icono distinto al de bandeja por defecto. */
  icon?: ReactNode;
  className?: string;
}

/**
 * Estado vacío.
 *
 * Es una invitación a actuar, no un decorado: nombra qué falta y ofrece la
 * salida. No se aplica sobre tablas filtradas: ahí el vacío es culpa del
 * filtro y la acción correcta es limpiarlo (ver `DataTable`).
 */
export function EmptyState({ title, description, action, icon, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-rule bg-panel px-6 py-12 text-center',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="flex h-11 w-11 items-center justify-center rounded-md bg-surface-100 text-surface-500"
      >
        {icon ?? <IconInbox size={20} />}
      </span>

      <div className="max-w-sm space-y-1">
        <p className="text-sm font-semibold text-ink">{title}</p>
        {description ? (
          <p className="text-xs leading-relaxed text-surface-500">{description}</p>
        ) : null}
      </div>

      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}

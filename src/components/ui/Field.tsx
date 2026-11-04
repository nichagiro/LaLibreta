import type { ReactNode } from 'react';
import { cn } from '@/theme/cn';
import { fieldLabel, fieldMessage } from '@/theme/classes';
import { IconAlert } from './Icon';

export interface FieldProps {
  /** Id del control. Debe coincidir con el `id` que recibe el input. */
  id: string;
  label: string;
  /** Texto auxiliar bajo el control. Se omite si hay `error`. */
  hint?: string;
  /** Mensaje de error. Reemplaza al `hint` y se asocia por `aria-describedby`. */
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Envoltorio de un campo: etiqueta, control y mensaje auxiliar o de error.
 *
 * El `label` siempre está visible y apunta al control por `htmlFor`, de modo
 * que pulsar la etiqueta enfoca el campo en móvil y escritorio. El marcador
 * `*` se anuncia como "(obligatorio)" para lectores de pantalla.
 */
export function Field({
  id,
  label,
  hint,
  error,
  required = false,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className={fieldLabel}>
        {label}
        {required ? (
          <>
            <span aria-hidden="true" className="ml-1 text-owed">
              *
            </span>
            <span className="sr-only"> (obligatorio)</span>
          </>
        ) : null}
      </label>

      {children}

      {error ? (
        <p id={`${id}-error`} className={cn(fieldMessage, 'text-owed')}>
          <IconAlert size={13} className="mt-px shrink-0" />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className={cn(fieldMessage, 'text-surface-500')}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

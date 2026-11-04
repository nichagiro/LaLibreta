import { useId } from 'react';
import { cn } from '@/theme/cn';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Etiqueta visible. Siempre presente: el control nunca queda sin rótulo. */
  label: string;
  /** Aclaración opcional bajo la etiqueta. */
  description?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

/**
 * Interruptor binario para estados de activo/inactivo (clientes y categorías).
 *
 * Es un `input[type=checkbox]` real dentro de un `label`, así que pulsar
 * cualquier parte de la fila alterna el valor y el foco de teclado se ve en el
 * riel mediante `peer-focus-visible`. El estado no se comunica solo con
 * color: `aria-checked` lo expone a los lectores de pantalla.
 */
export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id,
  className,
}: SwitchProps) {
  const generatedId = useId();
  const switchId = id ?? generatedId;
  const descriptionId = description ? `${switchId}-description` : undefined;

  return (
    <label
      htmlFor={switchId}
      className={cn(
        'flex cursor-pointer items-start justify-between gap-4',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink">{label}</span>
        {description ? (
          <span
            id={descriptionId}
            className="mt-0.5 block text-xs leading-snug text-surface-500"
          >
            {description}
          </span>
        ) : null}
      </span>

      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          id={switchId}
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          aria-describedby={descriptionId}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />

        <span
          aria-hidden="true"
          className={cn(
            'block h-6 w-11 rounded-full border transition-colors',
            checked ? 'border-ink bg-ink' : 'border-rule-strong bg-surface-200',
          )}
        />

        <span
          aria-hidden="true"
          className={cn(
            'absolute left-0.5 top-0.5 block h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
            checked && 'translate-x-5',
          )}
        />

        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-paper"
        />
      </span>
    </label>
  );
}

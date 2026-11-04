import { useId } from 'react';
import type { ChangeEvent } from 'react';
import { cn } from '@/theme/cn';
import {
  controlBase,
  controlIdle,
  controlInvalid,
  fieldDescribedBy,
} from '@/theme/classes';
import { formatCop, parseCopInput } from '@/theme/format';
import { Field } from './Field';

export interface MoneyFieldProps {
  label: string;
  /** Entero COP o `null` cuando el campo está vacío. */
  value: number | null;
  onValueChange: (value: number | null) => void;
  hint?: string;
  error?: string;
  required?: boolean;
  id?: string;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Muestra el código `COP` a la derecha. */
  showCode?: boolean;
  containerClassName?: string;
}

/**
 * Campo de dinero en COP.
 *
 * El símbolo `$` es un adorno fijo fuera del input; el campo solo contiene
 * cifras agrupadas (`180.000`), de modo que el cursor nunca salta mientras se
 * escribe. El valor que sale del componente siempre es un entero o `null`.
 *
 * `inputMode="numeric"` abre el teclado numérico en móvil sin bloquear
 * caracteres por `pattern` (la sanitización la hace `parseCopInput`).
 */
export function MoneyField({
  label,
  value,
  onValueChange,
  hint,
  error,
  required,
  id,
  name,
  placeholder = '0',
  disabled,
  autoFocus,
  showCode = false,
  containerClassName,
}: MoneyFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const hasError = Boolean(error);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onValueChange(parseCopInput(event.target.value));
  };

  return (
    <Field
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      required={required === true}
      className={containerClassName}
    >
      <div className="relative">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 pl-3.5 text-sm text-surface-500"
        >
          $
        </span>

        <input
          id={fieldId}
          name={name}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          required={required}
          disabled={disabled}
          autoFocus={autoFocus}
          placeholder={placeholder}
          value={value === null ? '' : formatCop(value, { symbol: false })}
          onChange={handleChange}
          aria-invalid={hasError || undefined}
          aria-describedby={fieldDescribedBy(fieldId, hint, error)}
          className={cn(
            controlBase,
            controlIdle,
            hasError && controlInvalid,
            'h-11 pl-9 text-base tabular-nums md:text-sm',
            showCode ? 'pr-14' : 'pr-3.5',
            disabled && 'cursor-not-allowed',
          )}
        />

        {showCode ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-surface-500"
          >
            COP
          </span>
        ) : null}
      </div>
    </Field>
  );
}

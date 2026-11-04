import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/theme/cn';
import {
  controlBase,
  controlIdle,
  controlInvalid,
  controlSize,
  fieldDescribedBy,
} from '@/theme/classes';
import { Field } from './Field';
import { IconClose, IconSearch } from './Icon';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Etiqueta visible. Obligatoria: ningún campo se queda sin rótulo. */
  label: string;
  hint?: string;
  /** Mensaje de error. Sustituye al `hint` y marca el campo con `aria-invalid`. */
  error?: string;
  /** Prefijo visual fijo, por ejemplo el símbolo `$`. */
  prefix?: string;
  /** Sufijo visual fijo, por ejemplo `COP`. */
  suffix?: string;
  /** Icono al inicio del campo (búsqueda, teléfono, correo). */
  iconStart?: ReactNode;
  /** Muestra un botón para vaciar el campo. Requiere `value` controlado. */
  clearable?: boolean;
  onClear?: () => void;
  /** Clases para el contenedor del campo, no para el input. */
  containerClassName?: string;
}

const iconStartClass =
  'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-surface-500';

/**
 * Campo de texto de una línea.
 *
 * - `id` autogenerado con `useId` si no se provee, para que etiqueta y control
 *   siempre estén asociados.
 * - El anillo de foco viene del anillo global de `src/index.css`.
 * - `inputMode` se hereda del atributo: usa `inputMode="search"` para buscar
 *   y `inputMode="email"` / `inputMode="tel"` en móvil.
 */
export function TextField({
  label,
  hint,
  error,
  prefix,
  suffix,
  iconStart,
  clearable = false,
  onClear,
  containerClassName,
  className,
  id,
  required,
  disabled,
  type = 'text',
  ...rest
}: TextFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const hasError = Boolean(error);

  const clearVisible =
    clearable && onClear !== undefined && typeof rest.value === 'string' && rest.value.length > 0;

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
        {iconStart ? (
          <span className={cn(iconStartClass, 'left-3')}>
            {iconStart}
            <span className="sr-only">{label}</span>
          </span>
        ) : null}

        {prefix ? (
          <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 pl-3.5 text-sm text-surface-500">
            {prefix}
          </span>
        ) : null}

        <input
          id={fieldId}
          type={type}
          required={required}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={fieldDescribedBy(fieldId, hint, error)}
          className={cn(
            controlBase,
            controlSize,
            controlIdle,
            hasError && controlInvalid,
            iconStart ? 'pl-9' : null,
            !iconStart && prefix ? 'pl-9' : null,
            (clearVisible || suffix) && 'pr-10',
            className,
          )}
          {...rest}
        />

        {suffix ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-surface-500">
            {suffix}
          </span>
        ) : null}

        {clearVisible ? (
          <button
            type="button"
            onClick={onClear}
            aria-label={`Limpiar ${label.toLowerCase()}`}
            className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-surface-500 transition-colors hover:bg-surface-100 hover:text-ink"
          >
            <IconClose size={14} />
          </button>
        ) : null}
      </div>
    </Field>
  );
}

/** Atajo tipográfico para el patrón de búsqueda. */
export function SearchField(props: Omit<TextFieldProps, 'iconStart'>) {
  return <TextField {...props} iconStart={<IconSearch size={16} />} />;
}

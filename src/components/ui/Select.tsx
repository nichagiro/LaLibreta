import { useId } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { cn } from '@/theme/cn';
import {
  controlBase,
  controlIdle,
  controlInvalid,
  fieldDescribedBy,
} from '@/theme/classes';
import { Field } from './Field';
import { IconChevronDown } from './Icon';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** Etiqueta visible. Obligatoria. */
  label: string;
  hint?: string;
  error?: string;
  /** Opciones simples. Si se omiten, se usan los `children`. */
  options?: readonly SelectOption[];
  /** Opción vacía inicial. Imprescindible en selectores obligatorios. */
  placeholder?: string;
  containerClassName?: string;
}

/**
 * Selector nativo.
 *
 * Se mantiene el `<select>` del sistema en lugar de un listado personalizado:
 * en iOS y Android abre el picker nativo, que es más rápido y accesible que
 * cualquier alternativa construida a mano.
 */
export function Select({
  label,
  hint,
  error,
  options,
  placeholder,
  containerClassName,
  className,
  id,
  required,
  disabled,
  children,
  ...rest
}: SelectProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const hasError = Boolean(error);

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
        <select
          id={fieldId}
          required={required}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={fieldDescribedBy(fieldId, hint, error)}
          className={cn(
            controlBase,
            controlIdle,
            hasError && controlInvalid,
            'h-11 cursor-pointer appearance-none pl-3.5 pr-10 text-base md:text-sm',
            className,
          )}
          {...rest}
        >
          {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
          {options
            ? options.map((option) => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
              ))
            : children}
        </select>

        <IconChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-surface-500"
        />
      </div>
    </Field>
  );
}

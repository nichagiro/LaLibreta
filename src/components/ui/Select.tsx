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
  /**
   * Opción de entrada con valor vacío. Impide que el navegador deje
   * preseleccionada la primera opción real.
   */
  placeholder?: string;
  containerClassName?: string;
}

/**
 * Selector nativo.
 *
 * Se mantiene el `<select>` del sistema en lugar de un listado personalizado:
 * en iOS y Android abre el picker nativo, que es más rápido y accesible que
 * cualquier alternativa construida a mano.
 *
 * Cuando hay `placeholder`, el campo es obligatorio de verdad pero la
 * validación la hace el formulario (mensajes en español): el `required`
 * nativo se desactiva porque el navegador lo intercepta con un mensaje
 * propio y sin traducción. `aria-required` conserva la semántica para los
 * lectores de pantalla.
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
  value,
  defaultValue,
  children,
  ...rest
}: SelectProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const hasError = Boolean(error);
  const hasPlaceholder = placeholder !== undefined;
  // Valor mostrado: controlado (`value`) o el inicial de un selector no controlado.
  const currentValue = value !== undefined ? value : defaultValue;
  // Con opción de entrada, el valor vacío es un estado legítimo del control.
  const showPlaceholderValue = hasPlaceholder && (currentValue === undefined || currentValue === '');

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
          required={required === true && !hasPlaceholder}
          aria-required={required === true || undefined}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={fieldDescribedBy(fieldId, hint, error)}
          className={cn(
            controlBase,
            controlIdle,
            hasError && controlInvalid,
            // La opción de entrada se muestra atenuada mientras siga activa.
            showPlaceholderValue && 'text-surface-500',
            'h-11 cursor-pointer appearance-none pl-3.5 pr-10 text-base md:text-sm',
            className,
          )}
          {...(value !== undefined ? { value } : { defaultValue })}
          {...rest}
        >
          {hasPlaceholder ? <option value="">{placeholder}</option> : null}
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

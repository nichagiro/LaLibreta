import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/theme/cn';
import {
  controlBase,
  controlIdle,
  controlInvalid,
  fieldDescribedBy,
} from '@/theme/classes';
import { Field } from './Field';

export interface DateFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Etiqueta visible. Obligatoria. */
  label: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

/**
 * Campo de fecha de negocio (`YYYY-MM-DD`).
 *
 * Usa el picker nativo: en móvil abre el calendario del sistema y en
 * escritorio escribe en el formato del navegador. El valor que sale siempre
 * es la cadena estricta `YYYY-MM-DD` que exige el modelo de datos.
 */
export function DateField({
  label,
  hint,
  error,
  containerClassName,
  className,
  id,
  required,
  disabled,
  ...rest
}: DateFieldProps) {
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
      <input
        id={fieldId}
        type="date"
        lang="es-CO"
        required={required}
        disabled={disabled}
        aria-invalid={hasError || undefined}
        aria-describedby={fieldDescribedBy(fieldId, hint, error)}
        className={cn(
          controlBase,
          controlIdle,
          hasError && controlInvalid,
          'h-11 px-3.5 text-base md:text-sm',
          className,
        )}
        {...rest}
      />
    </Field>
  );
}

import { useId } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { cn } from '@/theme/cn';
import {
  controlBase,
  controlIdle,
  controlInvalid,
  fieldDescribedBy,
} from '@/theme/classes';
import { Field } from './Field';

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Etiqueta visible. Obligatoria. */
  label: string;
  hint?: string;
  error?: string;
  /** Clases para el contenedor del campo, no para el textarea. */
  containerClassName?: string;
}

/**
 * Área de texto multilínea: descripción libre de la actividad, notas internas,
 * notas públicas y comentarios.
 *
 * Es `resize-y`: el usuario puede alargarlo en escritorio, pero en móvil se
 * mantiene la altura declarada para no romper el desplazamiento de la página.
 */
export function TextArea({
  label,
  hint,
  error,
  containerClassName,
  className,
  id,
  required,
  disabled,
  rows = 4,
  ...rest
}: TextAreaProps) {
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
      <textarea
        id={fieldId}
        rows={rows}
        required={required}
        disabled={disabled}
        aria-invalid={hasError || undefined}
        aria-describedby={fieldDescribedBy(fieldId, hint, error)}
        className={cn(
          controlBase,
          controlIdle,
          hasError && controlInvalid,
          'min-h-24 resize-y px-3.5 py-2.5 text-base leading-relaxed md:text-sm',
          className,
        )}
        {...rest}
      />
    </Field>
  );
}

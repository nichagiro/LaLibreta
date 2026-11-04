import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/theme/cn';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Tinta sólida. Una sola acción primaria por pantalla. */
  variant?: ButtonVariant;
  /**
   * `sm` 36 px para filas densas de escritorio.
   * `md` 44 px: target táctil mínimo recomendado.
   * `lg` 48 px para acciones primarias en móvil.
   */
  size?: ButtonSize;
  /** Mantiene el ancho de la etiqueta y anuncia `aria-busy`. */
  loading?: boolean;
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
  fullWidth?: boolean;
}

const baseClasses =
  'relative inline-flex select-none items-center justify-center gap-2 rounded-md font-medium ' +
  'transition-colors duration-150 whitespace-nowrap ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-white hover:bg-surface-800 active:bg-surface-900',
  secondary:
    'border border-rule-strong bg-panel text-ink hover:bg-surface-100 active:bg-surface-200',
  ghost: 'text-surface-600 hover:bg-surface-100 hover:text-ink active:bg-surface-200',
  danger: 'bg-owed text-white hover:bg-owed-hover active:bg-owed-hover',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-sm md:text-base',
};

/**
 * Botón del sistema.
 *
 * - `type` por defecto `button`: dentro de un formulario hay que declarar
 *   `type="submit"` de forma explícita para evitar envíos accidentales.
 * - El estado de carga reemplaza el icono inicial y conserva la etiqueta,
 *   de modo que el ancho del control no salta.
 * - El foco visible viene del anillo global definido en `src/index.css`.
 */
export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  iconStart,
  iconEnd,
  fullWidth = false,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled === true || loading}
      aria-busy={loading || undefined}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Spinner size={size === 'sm' ? 14 : 16} className="shrink-0" />
      ) : (
        iconStart
      )}
      {children}
      {iconEnd}
    </button>
  );
}

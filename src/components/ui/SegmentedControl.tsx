import type { ReactNode } from 'react';
import { cn } from '@/theme/cn';
import { fieldLabel } from '@/theme/classes';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  /** Nombre compartido: habilita la navegación con flechas del sistema. */
  name: string;
  value: T;
  options: ReadonlyArray<SegmentedOption<T>>;
  onChange: (value: T) => void;
  /** Rótulo accesible del grupo. */
  legend: string;
  /** Muestra el rótulo también de forma visible. */
  showLegend?: boolean;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Selector segmentado para elecciones cortas y excluyentes: tipo de actividad
 * (Servicio / Venta), filtros de estado, rangos rápidos.
 *
 * Está construido con radios nativos dentro de un `fieldset`, así que el
 * teclado ya navega entre opciones con las flechas sin código adicional.
 * El estado activo se calcula en el render: no se pelea con especificidad CSS.
 */
export function SegmentedControl<T extends string>({
  name,
  value,
  options,
  onChange,
  legend,
  showLegend = false,
  size = 'md',
  fullWidth = false,
  disabled = false,
  className,
}: SegmentedControlProps<T>) {
  return (
    <fieldset className={cn('min-w-0', className)}>
      <legend className={cn(fieldLabel, showLegend ? 'mb-1.5' : 'sr-only')}>{legend}</legend>

      <div
        className={cn(
          'inline-flex rounded-md border border-rule-strong bg-panel p-0.5',
          fullWidth && 'w-full',
        )}
      >
        {options.map((option) => {
          const active = option.value === value;
          return (
            <label key={option.value} className={cn('relative', fullWidth && 'flex-1')}>
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={active}
                disabled={disabled}
                onChange={() => onChange(option.value)}
                className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
              />

              <span
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded font-medium transition-colors',
                  size === 'md' ? 'h-10 px-3.5 text-sm' : 'h-8 px-3 text-xs',
                  fullWidth && 'w-full',
                  disabled
                    ? 'cursor-not-allowed bg-surface-100 text-surface-500'
                    : cn(
                        'text-surface-600 hover:bg-surface-100',
                        active && 'bg-ink text-white hover:bg-ink',
                      ),
                  'peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-inset',
                )}
              >
                {option.icon}
                {option.label}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

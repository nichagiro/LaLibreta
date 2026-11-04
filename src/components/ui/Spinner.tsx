import { cn } from '@/theme/cn';

export interface SpinnerProps {
  /** Lado en píxeles. Por defecto 16. */
  size?: number;
  /**
   * Etiqueta accesible. Si se provee, el spinner anuncia el estado de carga
   * mediante `role="status"`; sin ella se asume decorativo.
   */
  label?: string;
  className?: string;
}

/**
 * Indicador de carga. Respeta `prefers-reduced-motion` (ver `src/index.css`):
 * con movimiento reducido se detiene, por lo que la etiqueta accesible es
 * imprescindible para que el estado siga siendo comunicado.
 */
export function Spinner({ size = 16, label, className }: SpinnerProps) {
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center', className)}
      role={label ? 'status' : undefined}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        focusable="false"
        className="animate-spin motion-reduce:animate-none"
      >
        <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="2.75" opacity="0.25" />
        <path
          d="M21.25 12A9.25 9.25 0 0 0 12 2.75"
          stroke="currentColor"
          strokeWidth="2.75"
          strokeLinecap="round"
        />
      </svg>
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}

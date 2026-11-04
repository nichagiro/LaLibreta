import { cn } from '@/theme/cn';

export interface SkeletonProps {
  /** Clases de tamaño Tailwind. Por ejemplo `h-4 w-40`. */
  className?: string;
}

/**
 * Bloque de contenido que todavía no llegó. Es decorativo: la información
 * accesible del estado de carga la comunica el componente que lo renderiza
 * (un `Spinner` con `label` o un texto de estado con `role="status"`).
 *
 * Con `prefers-reduced-motion` la animación se detiene y el bloque queda
 * como superficie plana, sin perder el hueco de diseño.
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded bg-surface-200 motion-reduce:animate-none',
        className,
      )}
    />
  );
}

import type { ReactNode } from 'react';
import { cn } from '@/theme/cn';

/** Título de sección dentro de la galería. */
export function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold text-ink md:text-lg">{title}</h2>
      {description ? (
        <p className="mt-1 max-w-prose text-sm leading-relaxed text-surface-600">{description}</p>
      ) : null}
    </div>
  );
}

/** Caja especímen: nombra qué se muestra y, si hace falta, por qué. */
export function Example({
  title,
  note,
  children,
  className,
}: {
  title: string;
  note?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('overflow-hidden rounded-lg border border-rule bg-panel', className)}>
      <div className="border-b border-rule-subtle px-4 py-2.5">
        <p className="text-xs font-semibold text-ink">{title}</p>
        {note ? <p className="mt-0.5 text-xs leading-snug text-surface-500">{note}</p> : null}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/** Fila flexible para agrupar especímenes. */
export function SpecimenRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-start gap-4">{children}</div>;
}

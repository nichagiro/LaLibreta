import type { ReactNode } from 'react';
import { cn } from '@/theme/cn';

export interface KeyValueItem {
  label: string;
  value: ReactNode;
}

export interface KeyValueProps {
  items: readonly KeyValueItem[];
  /** `stacked` pone la etiqueta encima: útil en columnas angostas. */
  layout?: 'inline' | 'stacked';
  className?: string;
}

/**
 * Lista de datos rotulada para fichas y detalles (contacto, fechas, datos del
 * emisor). En escritorio etiqueta y valor comparten línea; en móvil el valor
 * puede caer a la línea siguiente sin romper la lectura.
 */
export function KeyValue({ items, layout = 'inline', className }: KeyValueProps) {
  return (
    <dl className={cn('divide-y divide-rule-subtle', className)}>
      {items.map((item, index) => (
        <div
          key={`${item.label}-${index}`}
          className={cn(
            'py-2.5 first:pt-0 last:pb-0',
            layout === 'inline' ? 'flex items-baseline justify-between gap-4' : 'space-y-0.5',
          )}
        >
          <dt className="shrink-0 text-xs font-medium text-surface-500">{item.label}</dt>
          <dd
            className={cn(
              'min-w-0 text-sm text-ink',
              layout === 'inline' ? 'text-right' : 'text-left',
            )}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

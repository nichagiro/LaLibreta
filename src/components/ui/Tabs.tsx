import { useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { cn } from '@/theme/cn';

export interface TabItem {
  key: string;
  label: string;
  /** Contador opcional junto a la etiqueta. */
  count?: number;
  /** Id del panel que controla. Permite `aria-controls` correcto. */
  panelId?: string;
  /** Id del propio tab, si el panel lo referencia con `aria-labelledby`. */
  tabId?: string;
}

export interface TabsProps {
  items: readonly TabItem[];
  value: string;
  onChange: (key: string) => void;
  /** Nombre accesible del conjunto. */
  label: string;
  className?: string;
}

/**
 * Pestañas controladas.
 *
 * Sigue el patrón ARIA completo: `role="tablist"` / `role="tab"`,
 * `aria-selected` y navegación con flechas, `Home` y `End`. La activación es
 * automática (mover el foco cambia la pestaña), que es lo esperado cuando los
 * paneles son ligeros.
 */
export function Tabs({ items, value, onChange, label, className }: TabsProps) {
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = items.findIndex((item) => item.key === value);
    if (currentIndex < 0 || items.length === 0) return;

    let nextIndex = -1;
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % items.length;
    else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + items.length) % items.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = items.length - 1;

    if (nextIndex < 0) return;

    event.preventDefault();
    const next = items[nextIndex];
    onChange(next.key);
    tabRefs.current.get(next.key)?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={handleKeyDown}
      className={cn(
        'scrollbar-thin -mb-px flex gap-1 overflow-x-auto overflow-y-hidden border-b border-rule',
        className,
      )}
    >
      {items.map((item) => {
        const active = item.key === value;
        return (
          <button
            key={item.key}
            ref={(node) => {
              if (node) tabRefs.current.set(item.key, node);
              else tabRefs.current.delete(item.key);
            }}
            type="button"
            role="tab"
            id={item.tabId}
            aria-controls={item.panelId}
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.key)}
            className={cn(
              'relative shrink-0 px-3 py-2.5 text-sm font-medium transition-colors',
              active ? 'text-ink' : 'text-surface-500 hover:text-ink',
            )}
          >
            <span className="flex items-center gap-1.5">
              {item.label}
              {typeof item.count === 'number' ? (
                <span
                  className={cn(
                    'rounded-sm px-1.5 py-0.5 text-[11px] tabular-nums',
                    active ? 'bg-surface-200 text-surface-600' : 'bg-surface-100 text-surface-500',
                  )}
                >
                  {item.count}
                </span>
              ) : null}
            </span>

            <span
              aria-hidden="true"
              className={cn(
                'absolute inset-x-0 bottom-0 h-0.5',
                active ? 'bg-ink' : 'bg-transparent',
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

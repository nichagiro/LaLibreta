import type { ReactNode } from 'react';
import { cn } from '@/theme/cn';
import type { NavItem } from './nav';

export interface SideNavProps {
  items: readonly NavItem[];
  activeKey: string;
  onNavigate: (key: string) => void;
  /** Identidad al tope del rail. Si se omite usa la marca por defecto. */
  brand?: ReactNode;
  className?: string;
}

/**
 * Navegación lateral fija, de 240 px, visible a partir de `lg`.
 *
 * El destino activo se marca con una regla de acento a la izquierda y con
 * `aria-current="page"`: la posición se comunica por forma y por ARIA, no
 * solo por color.
 */
export function SideNav({
  items,
  activeKey,
  onNavigate,
  brand,
  className,
}: SideNavProps) {
  return (
    <nav
      aria-label="Navegación principal"
      className={cn(
        'fixed inset-y-0 left-0 z-30 w-60 flex-col border-r border-rule bg-panel',
        className,
      )}
    >
      <div className="px-4 pb-4 pt-5">
        {brand ?? (
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-ink text-xs font-semibold text-white"
            >
              CI
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight text-ink">
                Control de Ingresos
              </p>
              <p className="truncate text-xs text-surface-500">Trabajador independiente</p>
            </div>
          </div>
        )}
      </div>

      <ul className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
        {items.map((item) => {
          const active = item.key === activeKey;
          return (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => onNavigate(item.key)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex w-full items-center gap-3 border-l-2 px-3 py-2.5 text-left text-sm transition-colors',
                  active
                    ? 'border-accent bg-surface-100 font-semibold text-ink'
                    : 'border-transparent font-medium text-surface-600 hover:bg-surface-50 hover:text-ink',
                )}
              >
                <span className={cn('shrink-0', active ? 'text-accent' : 'text-surface-500')}>
                  {item.icon}
                </span>
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {typeof item.badge === 'number' && item.badge > 0 ? (
                  <span className="shrink-0 rounded-sm bg-owed-tint px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-owed">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

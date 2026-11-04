import { cn } from '@/theme/cn';
import type { NavItem } from './nav';

export interface BottomNavProps {
  items: readonly NavItem[];
  activeKey: string;
  onNavigate: (key: string) => void;
  className?: string;
}

/**
 * Navegación inferior para móvil y tablet, hasta `lg`.
 *
 * Reserva el área segura del sistema (`env(safe-area-inset-bottom)`) para que
 * el último ítem no quede bajo la barra del teléfono. El destino activo se
 * marca con una regla superior y `aria-current="page"`.
 */
export function BottomNav({ items, activeKey, onNavigate, className }: BottomNavProps) {
  return (
    <nav
      aria-label="Navegación principal"
      className={cn(
        'fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-panel/95 backdrop-blur',
        'pb-[env(safe-area-inset-bottom)]',
        className,
      )}
    >
      <ul className="flex">
        {items.map((item) => {
          const active = item.key === activeKey;
          return (
            <li key={item.key} className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => onNavigate(item.key)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex w-full flex-col items-center justify-center gap-1 border-t-2 px-1 pb-2 pt-2.5 transition-colors',
                  active
                    ? 'border-accent font-semibold text-ink'
                    : 'border-transparent font-medium text-surface-500',
                )}
              >
                <span className={active ? 'text-accent' : 'text-surface-500'}>{item.icon}</span>
                <span className="max-w-full truncate text-[11px]">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

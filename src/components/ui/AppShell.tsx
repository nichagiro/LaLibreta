import type { ReactNode } from 'react';
import { cn } from '@/theme/cn';
import { BottomNav } from './BottomNav';
import type { NavItem } from './nav';
import { SideNav } from './SideNav';

export interface AppShellProps {
  /** Destinos de navegación compartidos por el rail lateral y la barra inferior. */
  items: readonly NavItem[];
  activeKey: string;
  onNavigate: (key: string) => void;
  /** Identidad en el rail lateral. */
  brand?: ReactNode;
  children: ReactNode;
  /** Clases para la columna de contenido. */
  mainClassName?: string;
}

/**
 * Armazón de la aplicación.
 *
 * A partir de `lg` muestra un rail lateral fijo de 240 px; por debajo, una
 * barra inferior con el área segura reservada. El contenido siempre queda
 * centrado dentro de `max-w-6xl` y con margen inferior suficiente para no
 * quedar tapado por la barra de navegación.
 *
 * No hay router: `onNavigate` recibe la clave elegida y quien monta el shell
 * decide cómo cambiar de vista.
 */
export function AppShell({
  items,
  activeKey,
  onNavigate,
  brand,
  children,
  mainClassName,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <SideNav
        items={items}
        activeKey={activeKey}
        onNavigate={onNavigate}
        brand={brand}
        className="hidden lg:flex lg:flex-col"
      />

      <div className="lg:pl-60">
        <main
          className={cn(
            'mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-14 lg:pt-10',
            mainClassName,
          )}
        >
          {children}
        </main>

        <BottomNav
          items={items}
          activeKey={activeKey}
          onNavigate={onNavigate}
          className="lg:hidden"
        />
      </div>
    </div>
  );
}

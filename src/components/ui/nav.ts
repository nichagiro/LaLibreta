import type { ReactNode } from 'react';

/** Una entrada de navegación. La comparten `SideNav`, `BottomNav` y `AppShell`. */
export interface NavItem {
  /** Clave estable del destino. Coincide con la ruta o vista. */
  key: string;
  /** Etiqueta visible en español. */
  label: string;
  icon: ReactNode;
  /** Contador opcional, por ejemplo saldos pendientes. */
  badge?: number;
}

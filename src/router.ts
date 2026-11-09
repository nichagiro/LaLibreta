/**
 * Ruteo por hash para la SPA estática.
 *
 * La vista activa vive en el fragmento de la URL (`#/actividades`), no en el
 * estado de React. Así la recarga (F5) conserva la pantalla, los enlaces
 * profundos funcionan y los botones Atrás/Adelante del navegador navegan entre
 * secciones, sin necesidad de configurar reescrituras en el hosting.
 *
 * Sin dependencias: se apoya en `hashchange` y `useSyncExternalStore`.
 */

import { useSyncExternalStore } from 'react';

/** Vistas de primer nivel de la aplicación. */
export type AppRoute = 'dashboard' | 'activities' | 'clients' | 'settings';

/** Vista mostrada cuando el hash está vacío o no se reconoce. */
export const DEFAULT_ROUTE: AppRoute = 'dashboard';

/** Hash canónico de cada vista. */
export const ROUTE_HASHES: Readonly<Record<AppRoute, string>> = {
  dashboard: '#/inicio',
  activities: '#/actividades',
  clients: '#/clientes',
  settings: '#/configuracion',
};

/** Alias aceptados para tolerar la raíz y enlaces en inglés. */
const ROUTE_ALIASES: Readonly<Record<string, AppRoute>> = {
  '': DEFAULT_ROUTE,
  '#': DEFAULT_ROUTE,
  '#/': DEFAULT_ROUTE,
  '#/inicio': 'dashboard',
  '#/dashboard': 'dashboard',
  '#/actividades': 'activities',
  '#/activities': 'activities',
  '#/clientes': 'clients',
  '#/clients': 'clients',
  '#/configuracion': 'settings',
  '#/settings': 'settings',
};

/** Traduce el hash actual a una vista conocida. */
export function routeFromHash(hash: string): AppRoute {
  return ROUTE_ALIASES[hash.trim().toLowerCase()] ?? DEFAULT_ROUTE;
}

/** Hash canónico de una vista. */
export function hashFromRoute(route: AppRoute): string {
  return ROUTE_HASHES[route];
}

function currentHash(): string {
  return typeof window === 'undefined' ? '' : window.location.hash;
}

/** Vista activa según la URL. */
export function getCurrentRoute(): AppRoute {
  return routeFromHash(currentHash());
}

/** Suscripción a los cambios de hash (incluye Atrás/Adelante). */
export function subscribeToRoute(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('hashchange', listener);
  return () => window.removeEventListener('hashchange', listener);
}

/** Navega a una vista agregando una entrada al historial. */
export function navigateTo(route: AppRoute): void {
  if (typeof window === 'undefined') return;
  const nextHash = hashFromRoute(route);
  if (window.location.hash === nextHash) return;
  window.location.hash = nextHash;
}

/** Vista activa sincronizada con el hash de la URL. */
export function useAppRoute(): AppRoute {
  return useSyncExternalStore(subscribeToRoute, getCurrentRoute, () => DEFAULT_ROUTE);
}

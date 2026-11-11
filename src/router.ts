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

/** Información canónica de la ruta y parámetros actuales. */
export interface RouteLocation {
  route: AppRoute;
  id: string | null;
  action: 'edit' | 'view' | null;
  params: Record<string, string>;
}

export interface NavigateOptions {
  id?: string | null;
  action?: 'edit' | 'view' | null;
  params?: Record<string, string>;
  replace?: boolean;
}

/** Descompone el fragmento hash en ruta, identificador de recurso y acción. */
export function parseHash(rawHash: string): RouteLocation {
  const hash = (rawHash || '').trim();
  const [pathAndSegments, queryString = ''] = hash.split('?');
  const clean = pathAndSegments.replace(/^#\/?/, '').trim();
  const segments = clean ? clean.split('/').map((s) => decodeURIComponent(s.trim())) : [];

  const baseSegment = (segments[0] || '').toLowerCase();
  const route = ROUTE_ALIASES[`#/${baseSegment}`] ?? ROUTE_ALIASES[baseSegment] ?? DEFAULT_ROUTE;

  let id: string | null = segments[1] ? segments[1] : null;
  let action: 'edit' | 'view' | null = null;

  if (segments[2]) {
    const act = segments[2].toLowerCase();
    if (act === 'editar' || act === 'edit') action = 'edit';
  }

  const searchParams = new URLSearchParams(queryString);
  const params: Record<string, string> = {};
  searchParams.forEach((val, key) => {
    params[key] = val;
  });

  // Retrocompatibilidad con query params (?id=... y ?action=edit / ?edit=true)
  if (!id && searchParams.get('id')) {
    id = searchParams.get('id');
  }
  if (!action) {
    const act = searchParams.get('action');
    const edit = searchParams.get('edit');
    if (act === 'edit' || act === 'editar' || edit === 'true' || edit === '1') {
      action = 'edit';
    }
  }

  return { route, id, action, params };
}

/** Traduce el hash actual a una vista conocida. */
export function routeFromHash(hash: string): AppRoute {
  return parseHash(hash).route;
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
  return parseHash(currentHash()).route;
}

/** Ubicación completa activa según la URL. */
export function getCurrentRouteLocation(): RouteLocation {
  return parseHash(currentHash());
}

/** Suscripción a los cambios de hash (incluye Atrás/Adelante). */
export function subscribeToRoute(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('hashchange', listener);
  return () => window.removeEventListener('hashchange', listener);
}

/** Extrae todos los parámetros de consulta del hash actual. */
export function getRouteParams(): Record<string, string> {
  return parseHash(currentHash()).params;
}

/** Devuelve el valor de un parámetro del hash actual, o `null` si no existe. */
export function getRouteParam(key: string): string | null {
  const loc = parseHash(currentHash());
  if (key === 'id') return loc.id;
  if (key === 'action') return loc.action;
  return loc.params[key] ?? null;
}

/** Hook que sincroniza la ubicación completa de la ruta con el ciclo de vida de React. */
export function useRouteLocation(): RouteLocation {
  return useSyncExternalStore(
    subscribeToRoute,
    getCurrentRouteLocation,
    () => ({ route: DEFAULT_ROUTE, id: null, action: null, params: {} }),
  );
}

/** Hook que sincroniza el ID de recurso de la URL con el ciclo de vida de React. */
export function useRouteId(): string | null {
  return useSyncExternalStore(
    subscribeToRoute,
    () => getCurrentRouteLocation().id,
    () => null,
  );
}

/** Hook que sincroniza la acción de la URL ('edit' | 'view') con el ciclo de vida de React. */
export function useRouteAction(): 'edit' | 'view' | null {
  return useSyncExternalStore(
    subscribeToRoute,
    () => getCurrentRouteLocation().action,
    () => null,
  );
}

/** Hook que sincroniza el valor de un parámetro de URL con el ciclo de vida de React. */
export function useRouteParam(key: string): string | null {
  return useSyncExternalStore(
    subscribeToRoute,
    () => getRouteParam(key),
    () => null,
  );
}

/**
 * Navega a una vista generando una URL canónica limpia (ej: `#/actividades/act_123` o `#/actividades/act_123/editar`).
 */
export function navigateTo(
  route: AppRoute,
  optionsOrParams?: NavigateOptions | Record<string, string>,
): void {
  if (typeof window === 'undefined') return;
  const basePath = hashFromRoute(route);
  let nextHash = basePath;

  if (optionsOrParams) {
    if ('id' in optionsOrParams || 'action' in optionsOrParams || 'replace' in optionsOrParams) {
      const opts = optionsOrParams as NavigateOptions;
      if (opts.id) {
        nextHash += `/${encodeURIComponent(opts.id)}`;
        if (opts.action === 'edit') {
          nextHash += '/editar';
        }
      }
      if (opts.params && Object.keys(opts.params).length > 0) {
        nextHash += '?' + new URLSearchParams(opts.params).toString();
      }
      if (window.location.hash === nextHash) return;
      if (opts.replace) {
        const url = new URL(window.location.href);
        url.hash = nextHash;
        window.history.replaceState(null, '', url.toString());
        const event =
          typeof HashChangeEvent !== 'undefined'
            ? new HashChangeEvent('hashchange')
            : new Event('hashchange');
        window.dispatchEvent(event);
        return;
      }
    } else {
      const params = optionsOrParams as Record<string, string>;
      if (params.id) {
        nextHash += `/${encodeURIComponent(params.id)}`;
        const rest = { ...params };
        delete rest.id;
        if (Object.keys(rest).length > 0) {
          nextHash += '?' + new URLSearchParams(rest).toString();
        }
      } else if (Object.keys(params).length > 0) {
        nextHash += '?' + new URLSearchParams(params).toString();
      }
    }
  }

  if (window.location.hash === nextHash) return;
  window.location.hash = nextHash;
}

/**
 * Limpia la URL de la vista eliminando cualquier ID o sub-ruta activa (ej: vuelve a `#/actividades`).
 * Usa `replaceState` para no ensuciar el historial al cerrar modales.
 */
export function clearRouteDetail(route: AppRoute = 'activities'): void {
  if (typeof window === 'undefined') return;
  const nextHash = hashFromRoute(route);
  if (window.location.hash === nextHash) return;
  const url = new URL(window.location.href);
  url.hash = nextHash;
  window.history.replaceState(null, '', url.toString());
  const event =
    typeof HashChangeEvent !== 'undefined'
      ? new HashChangeEvent('hashchange')
      : new Event('hashchange');
  window.dispatchEvent(event);
}

/**
 * Modifica o elimina parámetros del hash actual.
 * `options.replace`: si es `true`, reemplaza la entrada en el historial sin acumular navegación (ideal al cerrar modales).
 */
export function setRouteParams(
  params: Record<string, string | null | undefined>,
  options: { replace?: boolean } = {},
): void {
  if (typeof window === 'undefined') return;
  const hash = currentHash();
  const [base, query = ''] = hash.split('?');
  const searchParams = new URLSearchParams(query);

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') {
      searchParams.delete(key);
    } else {
      searchParams.set(key, value);
    }
  }

  const queryString = searchParams.toString();
  const nextHash = queryString ? `${base}?${queryString}` : base;
  if (window.location.hash === nextHash) return;

  if (options.replace) {
    const url = new URL(window.location.href);
    url.hash = nextHash;
    window.history.replaceState(null, '', url.toString());
    const event =
      typeof HashChangeEvent !== 'undefined'
        ? new HashChangeEvent('hashchange')
        : new Event('hashchange');
    window.dispatchEvent(event);
  } else {
    window.location.hash = nextHash;
  }
}

/** Vista activa sincronizada con el hash de la URL. */
export function useAppRoute(): AppRoute {
  return useSyncExternalStore(subscribeToRoute, getCurrentRoute, () => DEFAULT_ROUTE);
}

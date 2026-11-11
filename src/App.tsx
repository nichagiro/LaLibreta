import React, { Suspense, lazy, useState, useEffect } from 'react';
import { AppShell } from '@/components/ui/AppShell';
import type { NavItem } from '@/components/ui/nav';
import {
  IconHome,
  IconActivities,
  IconClients,
  IconSettings,
} from '@/components/ui/Icon';
import { DashboardView } from '@/features/dashboard/DashboardView';
import { ActivitiesView } from '@/features/activities/ActivitiesView';
import { ClientsView } from '@/features/clients/ClientsView';
import { SettingsView } from '@/features/settings/SettingsView';
import { api } from '@/services/api';
import { sheetsApi } from '@/services/sheets-api';
import { navigateTo, useAppRoute, type AppRoute } from '@/router';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

// Muestra visual del sistema de diseño (Sesión 2). Se carga solo cuando la URL
// trae `?ui=1`, así el bundle de la aplicación no se lleva la galería.
const UiGallery = lazy(() =>
  import('@/components/ui/gallery/UiGallery').then((module) => ({ default: module.UiGallery }))
);

const galleryRequested = () =>
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('ui');

export const App: React.FC = () => {
  const activeRoute = useAppRoute();
  // El modo es fijo: lo decide VITE_DATA_SOURCE en tiempo de compilación.
  const isMockMode = api.isMockMode();
  const sheetsConfigured = sheetsApi.isConfigured();
  const [selectedClientIdForNewActivity, setSelectedClientIdForNewActivity] = useState<string | null>(null);

  useEffect(() => {
    // Al salir de Actividades (incluido Atrás/Adelante) se descarta el cliente preseleccionado.
    if (activeRoute !== 'activities') {
      setSelectedClientIdForNewActivity(null);
    }
  }, [activeRoute]);

  if (galleryRequested()) {
    return (
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-paper text-sm text-surface-500">
            Cargando muestra del sistema de diseño…
          </div>
        }
      >
        <UiGallery />
      </Suspense>
    );
  }

  const navItems: ReadonlyArray<NavItem> = [
    {
      key: 'dashboard',
      label: 'Inicio',
      icon: <IconHome size={18} />,
    },
    {
      key: 'activities',
      label: 'Actividades',
      icon: <IconActivities size={18} />,
    },
    {
      key: 'clients',
      label: 'Clientes',
      icon: <IconClients size={18} />,
    },
    {
      key: 'settings',
      label: 'Configuración',
      icon: <IconSettings size={18} />,
    },
  ];

  return (
    <AppShell
      items={navItems}
      activeKey={activeRoute}
      onNavigate={(key) => {
        navigateTo(key as AppRoute);
        if (key !== 'activities') {
          setSelectedClientIdForNewActivity(null);
        }
      }}
      brand={
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded bg-ink text-xs font-semibold text-white tracking-wider">
            LI
          </span>
          <div>
            <span className="block text-xs font-semibold leading-tight text-ink">
              La Libreta
            </span>
            <span className="block text-[10px] leading-tight text-surface-500">
              Control de Ingresos
            </span>
          </div>
        </div>
      }
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Banner de Modo de Prueba si VITE_DATA_SOURCE=mock */}
        {isMockMode ? (
          <div
            role="status"
            className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900"
          >
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>
                <strong>Modo de prueba:</strong> los datos se gestionan localmente durante la
                sesión y no se guardan de forma permanente. Para usar el modo de producción,
                asigna <code className="font-mono">VITE_DATA_SOURCE=sheets</code> y reconstruye
                la aplicación.
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('settings')}
              className="font-semibold underline underline-offset-2 hover:text-amber-950 text-left sm:text-right shrink-0"
            >
              Ver configuración →
            </button>
          </div>
        ) : null}

        {/* Aviso estático cuando el modo de producción está activo pero falta configuración */}
        {!isMockMode && !sheetsConfigured ? (
          <div
            role="alert"
            className="p-3 bg-red-50 border border-red-300 rounded-lg text-xs text-red-900"
          >
            <strong>Configuración incompleta:</strong> el modo de producción está activo, pero
            faltan <code className="font-mono">VITE_APPS_SCRIPT_URL</code> y/o{' '}
            <code className="font-mono">VITE_APP_AUTH_TOKEN</code> en el archivo{' '}
            <code className="font-mono">.env</code>. No hay datos de respaldo ni conmutación
            automática: las operaciones fallarán hasta completar la configuración.
          </div>
        ) : null}

        {/* Vistas Principales */}
        <ErrorBoundary>
          {activeRoute === 'dashboard' ? (
            <DashboardView
              onNavigateToActivities={() => navigateTo('activities')}
              onNavigateToClients={() => navigateTo('clients')}
              onSelectActivity={(activityId) => navigateTo('activities', { id: activityId })}
            />
          ) : null}

          {activeRoute === 'activities' ? (
            <ActivitiesView
              initialClientId={selectedClientIdForNewActivity}
              onClearInitialClient={() => setSelectedClientIdForNewActivity(null)}
            />
          ) : null}

          {activeRoute === 'clients' ? (
            <ClientsView
              onCreateActivityWithClient={(clientId) => {
                setSelectedClientIdForNewActivity(clientId);
                navigateTo('activities');
              }}
              onSelectActivity={(activityId) => {
                navigateTo('activities', { id: activityId });
              }}
            />
          ) : null}

          {activeRoute === 'settings' ? <SettingsView /> : null}
        </ErrorBoundary>
      </div>
    </AppShell>
  );
};

export default App;

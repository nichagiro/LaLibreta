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

// Muestra visual del sistema de diseño (Sesión 2). Se carga solo cuando la URL
// trae `?ui=1`, así el bundle de la aplicación no se lleva la galería.
const UiGallery = lazy(() =>
  import('@/components/ui/gallery/UiGallery').then((module) => ({ default: module.UiGallery }))
);

const galleryRequested = () =>
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('ui');

export const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'activities' | 'clients' | 'settings'>('dashboard');
  const [isMockMode, setIsMockMode] = useState<boolean>(api.isMockMode());
  const [selectedClientIdForNewActivity, setSelectedClientIdForNewActivity] = useState<string | null>(null);

  useEffect(() => {
    // Comprobar salud del backend en arranque si no fue verificado
    api.checkBackendHealth().then(() => {
      setIsMockMode(api.isMockMode());
    });
    const unsubscribe = api.subscribeModeChange((mock) => setIsMockMode(mock));
    return () => unsubscribe();
  }, []);

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
      activeKey={activeView}
      onNavigate={(key) => {
        setActiveView(key as typeof activeView);
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
      navFooter={
        <div className="text-[11px] text-surface-500 space-y-1">
          <p className="font-medium text-surface-700">Trabajador Independiente</p>
          <a
            href="?ui=1"
            className="inline-block text-accent hover:underline text-[11px]"
          >
            Muestra del sistema UI →
          </a>
        </div>
      }
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Banner de Modo de Prueba si no hay persistencia real en Google Sheets */}
        {isMockMode ? (
          <div
            role="status"
            className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900"
          >
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>
                <strong>Modo de prueba (Adaptador en memoria):</strong> Los datos se gestionan
                localmente durante la sesión. Para conectar con Google Sheets, despliega el Web App
                según la guía.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveView('settings')}
              className="font-semibold underline underline-offset-2 hover:text-amber-950 text-left sm:text-right shrink-0"
            >
              Ver configuración →
            </button>
          </div>
        ) : null}

        {/* Vistas Principales */}
        {activeView === 'dashboard' ? (
          <DashboardView
            onNavigateToActivities={() => setActiveView('activities')}
            onNavigateToClients={() => setActiveView('clients')}
          />
        ) : null}

        {activeView === 'activities' ? (
          <ActivitiesView
            initialClientId={selectedClientIdForNewActivity}
            onClearInitialClient={() => setSelectedClientIdForNewActivity(null)}
          />
        ) : null}

        {activeView === 'clients' ? (
          <ClientsView
            onCreateActivityWithClient={(clientId) => {
              setSelectedClientIdForNewActivity(clientId);
              setActiveView('activities');
            }}
            onSelectActivity={(_activityId) => {
              setActiveView('activities');
            }}
          />
        ) : null}

        {activeView === 'settings' ? <SettingsView /> : null}
      </div>
    </AppShell>
  );
};

export default App;

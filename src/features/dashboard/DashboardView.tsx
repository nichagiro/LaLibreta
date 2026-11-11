import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { MetricCard } from '@/components/ui/MetricCard';
import { Panel } from '@/components/ui/Panel';
import { DataTable, type DataColumn } from '@/components/ui/DataTable';
import { StatusChip } from '@/components/ui/StatusChip';
import { Money } from '@/components/ui/Money';
import { DateField } from '@/components/ui/DateField';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Spinner } from '@/components/ui/Spinner';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { IconPlus, IconClients } from '@/components/ui/Icon';
import { api } from '@/services/api';
import type { Activity, Category, Client, FinancialSummary } from '@/types';
import { formatDateEs } from '@/theme/format';
import { ActivityFormDialog } from '../activities/ActivityFormDialog';
import { ClientFormDialog } from '../clients/ClientFormDialog';

/**
 * Deriva el resumen financiero a partir de la lista de actividades en el cliente.
 * Se utiliza como respaldo preventivo si el backend remoto devuelve ceros debido
 * a desfases de formato de celda en Google Sheets o versiones anteriores del script.
 */
function deriveSummaryFallback(
  acts: Activity[],
  from: string,
  to: string,
): FinancialSummary {
  let totalActivitiesValue = 0;
  let totalBalancePending = 0;
  let totalMoneyReceived = 0;
  const counts = { total: 0, pending: 0, in_progress: 0, completed: 0, cancelled: 0 };

  acts.forEach((act) => {
    const actDate = act.activity_date || '';
    if (!from || !to || (actDate >= from && actDate <= to)) {
      counts.total++;
      if (counts[act.status] !== undefined) {
        counts[act.status]++;
      }
      if (act.status !== 'cancelled') {
        totalActivitiesValue += act.total_value;
        totalBalancePending += act.balance_pending || 0;
        totalMoneyReceived += act.total_received || 0;
      }
    }
  });

  return {
    period_from: from,
    period_to: to,
    total_activities_value: totalActivitiesValue,
    total_money_received: totalMoneyReceived,
    total_balance_pending: totalBalancePending,
    activities_count: counts,
  };
}

function resolveSummary(
  remoteSummary: FinancialSummary,
  acts: Activity[],
  from: string,
  to: string,
): FinancialSummary {
  if (
    remoteSummary.activities_count.total > 0 ||
    remoteSummary.total_activities_value > 0 ||
    remoteSummary.total_money_received > 0
  ) {
    return remoteSummary;
  }
  const fallback = deriveSummaryFallback(acts, from, to);
  if (fallback.activities_count.total > 0 || fallback.total_activities_value > 0) {
    return fallback;
  }
  return remoteSummary;
}

export interface DashboardViewProps {
  onNavigateToActivities: () => void;
  onNavigateToClients: () => void;
  onSelectActivity?: (activityId: string) => void;
}

export function DashboardView({
  onNavigateToActivities,
  onNavigateToClients,
  onSelectActivity,
}: DashboardViewProps) {
  // Rango de fechas por defecto: Mes actual (noviembre 2026 según contexto o fecha actual)
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
  const firstDay = `${currentYear}-${currentMonth}-01`;
  const lastDayOfMonth = new Date(currentYear, today.getMonth() + 1, 0).getDate();
  const lastDay = `${currentYear}-${currentMonth}-${String(lastDayOfMonth).padStart(2, '0')}`;

  const [dateFrom, setDateFrom] = useState(firstDay);
  const [dateTo, setDateTo] = useState(lastDay);
  const [appliedFrom, setAppliedFrom] = useState(firstDay);
  const [appliedTo, setAppliedTo] = useState(lastDay);
  const [periodPreset, setPeriodPreset] = useState<'current_month' | 'prev_month' | 'custom'>('current_month');
  const [dateError, setDateError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);

  // Modales
  const [activityFormOpen, setActivityFormOpen] = useState(false);
  const [clientFormOpen, setClientFormOpen] = useState(false);

  /**
   * Carga completa inicial: actividades recientes, clientes, categorías y resumen financiero.
   * Se ejecuta al montar la vista de Inicio y cuando se registra una nueva actividad.
   */
  const loadInitialData = useCallback(async (force = false) => {
    setLoading(true);
    setLoadError(null);
    try {
      const [sum, acts, clis, cats] = await Promise.all([
        api.getSummary(appliedFrom, appliedTo, { forceRefresh: force }),
        api.getActivities({ forceRefresh: force }),
        api.getClients({ forceRefresh: force }),
        api.getCategories({ forceRefresh: force }),
      ]);
      setAllActivities(acts);
      setSummary(resolveSummary(sum, acts, appliedFrom, appliedTo));
      // Ordenar actividades por fecha descendente de forma segura y tomar las 5 más recientes
      const sorted = [...acts].sort((a, b) => (b.activity_date || '').localeCompare(a.activity_date || ''));
      setRecentActivities(sorted.slice(0, 5));
      setClients(clis);
      setCategories(cats);
    } catch (err: unknown) {
      setLoadError((err as Error)?.message || 'No fue posible cargar los datos del inicio.');
    } finally {
      setLoading(false);
    }
  }, [appliedFrom, appliedTo]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  /**
   * Filtrado rápido por fechas:
   * Valida localmente para no hacer llamadas inválidas y consulta ÚNICAMENTE api.getSummary,
   * evitando saturar Google Apps Script con peticiones múltiples concurrentes.
   */
  const handleApplyFilter = async () => {
    if (!dateFrom || !dateTo) {
      setDateError('Debes seleccionar tanto la fecha inicial como la final.');
      return;
    }
    if (dateFrom > dateTo) {
      setDateError('La fecha inicial no puede ser posterior a la fecha final.');
      return;
    }
    setDateError(null);

    setFilterLoading(true);
    try {
      const newSummary = await api.getSummary(dateFrom, dateTo);
      setSummary(resolveSummary(newSummary, allActivities, dateFrom, dateTo));
      setAppliedFrom(dateFrom);
      setAppliedTo(dateTo);
    } catch (err: unknown) {
      setDateError((err as Error)?.message || 'No fue posible consultar el resumen financiero.');
    } finally {
      setFilterLoading(false);
    }
  };

  /**
   * Cambio de presets rápidos (Mes actual, Mes anterior):
   * Calcula las fechas canónicas y actualiza el resumen del período.
   */
  const handlePeriodChange = async (preset: 'current_month' | 'prev_month' | 'custom') => {
    setPeriodPreset(preset);
    setDateError(null);

    let targetFrom = dateFrom;
    let targetTo = dateTo;

    if (preset === 'current_month') {
      targetFrom = firstDay;
      targetTo = lastDay;
    } else if (preset === 'prev_month') {
      const prevDate = new Date(currentYear, today.getMonth() - 1, 1);
      const prevY = prevDate.getFullYear();
      const prevM = String(prevDate.getMonth() + 1).padStart(2, '0');
      const prevLast = new Date(prevY, prevDate.getMonth() + 1, 0).getDate();
      targetFrom = `${prevY}-${prevM}-01`;
      targetTo = `${prevY}-${prevM}-${String(prevLast).padStart(2, '0')}`;
    } else {
      return;
    }

    setDateFrom(targetFrom);
    setDateTo(targetTo);

    setFilterLoading(true);
    try {
      const newSummary = await api.getSummary(targetFrom, targetTo);
      setSummary(resolveSummary(newSummary, allActivities, targetFrom, targetTo));
      setAppliedFrom(targetFrom);
      setAppliedTo(targetTo);
    } catch (err: unknown) {
      setDateError((err as Error)?.message || 'No fue posible consultar el resumen para el período seleccionado.');
    } finally {
      setFilterLoading(false);
    }
  };

  const clientMap = new Map(clients.map((c) => [c.id, c.name]));

  const columns: ReadonlyArray<DataColumn<Activity>> = [
    {
      key: 'title',
      header: 'Actividad Reciente',
      primary: true,
      cell: (row) => (
        <span className="block text-left">
          <span className="block font-medium text-ink truncate">{row.title}</span>
          <span className="mt-0.5 block truncate text-xs text-surface-500">
            {clientMap.get(row.client_id) || 'Cliente sin nombre'}
          </span>
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Fecha',
      cell: (row) => (
        <span className="whitespace-nowrap text-xs text-surface-700">
          {formatDateEs(row.activity_date)}
        </span>
      ),
    },
    {
      key: 'activity_status',
      header: 'Estado',
      hideMobileLabel: true,
      cell: (row) => <StatusChip kind="activity" value={row.status} size="sm" />,
    },
    {
      key: 'payment_status',
      header: 'Pago',
      hideMobileLabel: true,
      cell: (row) => (
        <StatusChip kind="payment" value={row.payment_status ?? 'pending'} size="sm" />
      ),
    },
    {
      key: 'total_value',
      header: 'Valor Total',
      align: 'right',
      cell: (row) => <Money value={row.total_value} />,
    },
    {
      key: 'balance_pending',
      header: 'Saldo',
      align: 'right',
      cell: (row) => {
        const bal = row.balance_pending ?? 0;
        return <Money value={bal} tone={bal > 0 ? 'owed' : 'muted'} />;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inicio"
        description="Resumen financiero, cartera de cobros pendientes y actividad reciente."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setClientFormOpen(true)}
              iconStart={<IconClients size={16} />}
            >
              Nuevo Cliente
            </Button>
            <Button
              variant="primary"
              onClick={() => setActivityFormOpen(true)}
              iconStart={<IconPlus size={16} />}
            >
              Nueva Actividad
            </Button>
          </div>
        }
      >
        {/* Selector de Período */}
        <div className="mt-4 p-4 bg-white border border-rule rounded-lg flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="w-full md:w-auto">
            <SegmentedControl
              name="period_preset"
              legend="Período de análisis"
              value={periodPreset}
              onChange={(val) =>
                handlePeriodChange(val as 'current_month' | 'prev_month' | 'custom')
              }
              options={[
                { value: 'current_month', label: 'Mes actual' },
                { value: 'prev_month', label: 'Mes anterior' },
                { value: 'custom', label: 'Personalizado' },
              ]}
            />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleApplyFilter();
            }}
            className="flex flex-wrap sm:flex-nowrap items-end gap-2 w-full md:w-auto"
          >
            <DateField
              label="Desde"
              value={dateFrom}
              onChange={(e) => {
                setPeriodPreset('custom');
                setDateFrom(e.target.value);
                if (dateError) setDateError(null);
              }}
            />
            <DateField
              label="Hasta"
              value={dateTo}
              onChange={(e) => {
                setPeriodPreset('custom');
                setDateTo(e.target.value);
                if (dateError) setDateError(null);
              }}
            />
            <Button
              type="submit"
              variant="secondary"
              loading={filterLoading}
              className="shrink-0"
            >
              Filtrar
            </Button>
          </form>
        </div>

        {dateError ? (
          <div className="mt-3">
            <Alert variant="error" onDismiss={() => setDateError(null)}>
              {dateError}
            </Alert>
          </div>
        ) : null}

        {loadError ? (
          <div className="mt-3">
            <Alert
              variant="error"
              action={
                <Button size="sm" variant="secondary" onClick={() => loadInitialData(true)}>
                  Reintentar
                </Button>
              }
            >
              {loadError}
            </Alert>
          </div>
        ) : null}
      </PageHeader>

      {/* Indicadores Principales del Período */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Dinero Recibido"
          value={summary?.total_money_received ?? 0}
          tone="received"
          loading={loading || filterLoading}
          detail="Abonos y cobros cobrados efectivamente dentro del rango de fechas."
        />

        <MetricCard
          label="Valor de Actividades"
          value={summary?.total_activities_value ?? 0}
          loading={loading || filterLoading}
          detail="Total acordado en servicios y ventas no canceladas en el período."
        />

        <MetricCard
          label="Saldo Pendiente"
          value={summary?.total_balance_pending ?? 0}
          tone={(summary?.total_balance_pending ?? 0) > 0 ? 'owed' : 'default'}
          loading={loading || filterLoading}
          detail="Cartera pendiente por cobrar de actividades del período analizado."
        />
      </div>

      {/* Conteo Operativo de Actividades */}
      {summary?.activities_count ? (
        <div className="p-4 bg-white border border-rule rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider block">
              Estado Operativo de Actividades en el Período ({summary.activities_count.total})
            </span>
            {filterLoading ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-surface-400 font-medium">
                <Spinner size={11} label="Actualizando conteos..." />
                <span>Actualizando…</span>
              </span>
            ) : null}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded border border-rule bg-surface-50">
              <span className="text-surface-500 block">Pendientes:</span>
              <span className="text-base font-semibold text-surface-900">
                {filterLoading ? <Skeleton className="h-5 w-8 mt-0.5" /> : summary.activities_count.pending}
              </span>
            </div>
            <div className="p-2.5 rounded border border-rule bg-surface-50">
              <span className="text-surface-500 block">En Proceso:</span>
              <span className="text-base font-semibold text-accent">
                {filterLoading ? <Skeleton className="h-5 w-8 mt-0.5" /> : summary.activities_count.in_progress}
              </span>
            </div>
            <div className="p-2.5 rounded border border-rule bg-surface-50">
              <span className="text-surface-500 block">Finalizadas:</span>
              <span className="text-base font-semibold text-received">
                {filterLoading ? <Skeleton className="h-5 w-8 mt-0.5" /> : summary.activities_count.completed}
              </span>
            </div>
            <div className="p-2.5 rounded border border-rule bg-surface-50">
              <span className="text-surface-500 block">Canceladas:</span>
              <span className="text-base font-semibold text-surface-500">
                {filterLoading ? <Skeleton className="h-5 w-8 mt-0.5" /> : summary.activities_count.cancelled}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Actividades Recientes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-surface-900">Actividades Recientes</h3>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onNavigateToClients}>
              Directorio de clientes →
            </Button>
            <Button variant="ghost" size="sm" onClick={onNavigateToActivities}>
              {allActivities.length > 5
                ? `Ver todas las actividades (${allActivities.length}) →`
                : 'Ver todas las actividades →'}
            </Button>
          </div>
        </div>

        <Panel padding="flush">
          <DataTable
            columns={columns}
            rows={recentActivities}
            getRowKey={(row) => row.id}
            caption="Actividades recientes"
            onRowClick={(row) => {
              if (onSelectActivity) {
                onSelectActivity(row.id);
              } else {
                onNavigateToActivities();
              }
            }}
            rowClassName={(row) => (row.status === 'cancelled' ? 'opacity-65' : undefined)}
            loading={loading}
          />
        </Panel>
      </div>

      {/* Modal Nueva Actividad */}
      <ActivityFormDialog
        open={activityFormOpen}
        onClose={() => setActivityFormOpen(false)}
        onSaved={() => {
          void loadInitialData();
        }}
        clients={clients}
        categories={categories}
      />

      {/* Modal Nuevo Cliente */}
      <ClientFormDialog
        open={clientFormOpen}
        onClose={() => setClientFormOpen(false)}
        onSaved={(saved) => {
          // Crear/editar cliente no altera métricas: se refleja en el estado local.
          setClients((prev) => {
            const exists = prev.some((c) => c.id === saved.id);
            return exists
              ? prev.map((c) => (c.id === saved.id ? { ...c, ...saved } : c))
              : [...prev, saved];
          });
        }}
      />
    </div>
  );
}

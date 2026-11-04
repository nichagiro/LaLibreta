import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { MetricCard } from '@/components/ui/MetricCard';
import { DataTable, type DataColumn } from '@/components/ui/DataTable';
import { StatusChip } from '@/components/ui/StatusChip';
import { Money } from '@/components/ui/Money';
import { DateField } from '@/components/ui/DateField';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { IconPlus, IconClients } from '@/components/ui/Icon';
import { api } from '@/services/api';
import type { Activity, Category, Client, FinancialSummary } from '@/types';
import { formatDateEs } from '@/theme/format';
import { ActivityDetailModal } from '../activities/ActivityDetailModal';
import { ActivityFormDialog } from '../activities/ActivityFormDialog';
import { ClientFormDialog } from '../clients/ClientFormDialog';

export interface DashboardViewProps {
  onNavigateToActivities: () => void;
  onNavigateToClients: () => void;
}

export function DashboardView({
  onNavigateToActivities,
  onNavigateToClients,
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
  const [periodPreset, setPeriodPreset] = useState<'current_month' | 'prev_month' | 'custom'>('current_month');

  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [activityFormOpen, setActivityFormOpen] = useState(false);
  const [clientFormOpen, setClientFormOpen] = useState(false);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [sum, acts, clis, cats] = await Promise.all([
        api.getSummary(dateFrom, dateTo),
        api.getActivities(),
        api.getClients(),
        api.getCategories(),
      ]);
      setSummary(sum);
      // Ordenar actividades por fecha descendente y tomar las 5 más recientes
      const sorted = [...acts].sort((a, b) => b.activity_date.localeCompare(a.activity_date));
      setRecentActivities(sorted.slice(0, 5));
      setClients(clis);
      setCategories(cats);
    } catch {
      // Manejo de error
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handlePeriodChange = (preset: 'current_month' | 'prev_month' | 'custom') => {
    setPeriodPreset(preset);
    if (preset === 'current_month') {
      setDateFrom(firstDay);
      setDateTo(lastDay);
    } else if (preset === 'prev_month') {
      const prevDate = new Date(currentYear, today.getMonth() - 1, 1);
      const prevY = prevDate.getFullYear();
      const prevM = String(prevDate.getMonth() + 1).padStart(2, '0');
      const prevLast = new Date(prevY, prevDate.getMonth() + 1, 0).getDate();
      setDateFrom(`${prevY}-${prevM}-01`);
      setDateTo(`${prevY}-${prevM}-${String(prevLast).padStart(2, '0')}`);
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

          <div className="flex items-center gap-2 w-full md:w-auto">
            <DateField
              label="Desde"
              value={dateFrom}
              onChange={(e) => {
                setPeriodPreset('custom');
                setDateFrom(e.target.value);
              }}
            />
            <DateField
              label="Hasta"
              value={dateTo}
              onChange={(e) => {
                setPeriodPreset('custom');
                setDateTo(e.target.value);
              }}
            />
          </div>
        </div>
      </PageHeader>

      {/* Indicadores Principales del Período */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Dinero Recibido"
          value={summary?.total_money_received ?? 0}
          tone="received"
          detail="Abonos y cobros cobrados efectivamente dentro del rango de fechas."
        />

        <MetricCard
          label="Valor de Actividades"
          value={summary?.total_activities_value ?? 0}
          detail="Total acordado en servicios y ventas no canceladas en el período."
        />

        <MetricCard
          label="Saldo Pendiente"
          value={summary?.total_balance_pending ?? 0}
          tone={(summary?.total_balance_pending ?? 0) > 0 ? 'owed' : 'default'}
          detail="Cartera pendiente por cobrar de actividades del período analizado."
        />
      </div>

      {/* Conteo Operativo de Actividades */}
      {summary?.activities_count ? (
        <div className="p-4 bg-white border border-rule rounded-lg">
          <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider block mb-3">
            Estado Operativo de Actividades en el Período ({summary.activities_count.total})
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded border border-rule bg-surface-50">
              <span className="text-surface-500 block">Pendientes:</span>
              <span className="text-base font-semibold text-surface-900">
                {summary.activities_count.pending}
              </span>
            </div>
            <div className="p-2.5 rounded border border-rule bg-surface-50">
              <span className="text-surface-500 block">En Proceso:</span>
              <span className="text-base font-semibold text-accent">
                {summary.activities_count.in_progress}
              </span>
            </div>
            <div className="p-2.5 rounded border border-rule bg-surface-50">
              <span className="text-surface-500 block">Finalizadas:</span>
              <span className="text-base font-semibold text-received">
                {summary.activities_count.completed}
              </span>
            </div>
            <div className="p-2.5 rounded border border-rule bg-surface-50">
              <span className="text-surface-500 block">Canceladas:</span>
              <span className="text-base font-semibold text-surface-500">
                {summary.activities_count.cancelled}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Actividad Reciente */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-surface-900">Actividad Reciente</h3>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onNavigateToClients}>
              Directorio de clientes →
            </Button>
            <Button variant="ghost" size="sm" onClick={onNavigateToActivities}>
              Ver todas las actividades →
            </Button>
          </div>
        </div>

        <DataTable
          columns={columns}
          rows={recentActivities}
          getRowKey={(row) => row.id}
          caption="Actividades recientes"
          onRowClick={(row) => setSelectedActivityId(row.id)}
          rowClassName={(row) => (row.status === 'cancelled' ? 'opacity-65' : undefined)}
          loading={loading}
        />
      </div>

      {/* Modal de Detalle */}
      <ActivityDetailModal
        open={Boolean(selectedActivityId)}
        onClose={() => setSelectedActivityId(null)}
        activityId={selectedActivityId}
        clients={clients}
        categories={categories}
        onActivityUpdated={loadDashboardData}
        onEditActivity={() => {
          setSelectedActivityId(null);
          onNavigateToActivities();
        }}
      />

      {/* Modal Nueva Actividad */}
      <ActivityFormDialog
        open={activityFormOpen}
        onClose={() => setActivityFormOpen(false)}
        onSaved={loadDashboardData}
        clients={clients}
        categories={categories}
      />

      {/* Modal Nuevo Cliente */}
      <ClientFormDialog
        open={clientFormOpen}
        onClose={() => setClientFormOpen(false)}
        onSaved={loadDashboardData}
      />
    </div>
  );
}

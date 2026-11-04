import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { DataTable, type DataColumn } from '@/components/ui/DataTable';
import { StatusChip } from '@/components/ui/StatusChip';
import { Money } from '@/components/ui/Money';
import { SearchField } from '@/components/ui/TextField';
import { Select } from '@/components/ui/Select';
import { DateField } from '@/components/ui/DateField';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconPlus, IconActivities } from '@/components/ui/Icon';
import { api } from '@/services/api';
import type { Activity, Category, Client } from '@/types';
import { formatDateEs } from '@/theme/format';
import { ACTIVITY_STATUS_ORDER, PAYMENT_STATUS_ORDER } from '@/theme/status';
import { ActivityDetailModal } from './ActivityDetailModal';
import { ActivityFormDialog } from './ActivityFormDialog';

export interface ActivitiesViewProps {
  initialClientId?: string | null;
  onClearInitialClient?: () => void;
}

export function ActivitiesView({ initialClientId, onClearInitialClient }: ActivitiesViewProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>(initialClientId || 'all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedActStatus, setSelectedActStatus] = useState<string>('all');
  const [selectedPayStatus, setSelectedPayStatus] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modales
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [activityToEdit, setActivityToEdit] = useState<Activity | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [acts, clis, cats] = await Promise.all([
        api.getActivities(),
        api.getClients(),
        api.getCategories(),
      ]);
      setActivities(acts);
      setClients(clis);
      setCategories(cats);
    } catch {
      // Error silencioso, manejado por estado vacío
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (initialClientId) {
      setSelectedClientId(initialClientId);
    }
  }, [initialClientId]);

  // Mapas para lookup rápido
  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c.name])), [clients]);

  // Filtrado de actividades
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      // Búsqueda de texto
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const clientName = (clientMap.get(act.client_id) || '').toLowerCase();
        const matchesTitle = act.title.toLowerCase().includes(query);
        const matchesClient = clientName.includes(query);
        if (!matchesTitle && !matchesClient) return false;
      }

      // Cliente
      if (selectedClientId !== 'all' && act.client_id !== selectedClientId) {
        return false;
      }

      // Categoría
      if (selectedCategoryId !== 'all' && act.category_id !== selectedCategoryId) {
        return false;
      }

      // Estado operativo
      if (selectedActStatus !== 'all' && act.status !== selectedActStatus) {
        return false;
      }

      // Estado de pago
      if (selectedPayStatus !== 'all' && (act.payment_status ?? 'pending') !== selectedPayStatus) {
        return false;
      }

      // Rango de fechas
      if (dateFrom && act.activity_date < dateFrom) return false;
      if (dateTo && act.activity_date > dateTo) return false;

      return true;
    });
  }, [
    activities,
    searchTerm,
    selectedClientId,
    selectedCategoryId,
    selectedActStatus,
    selectedPayStatus,
    dateFrom,
    dateTo,
    clientMap,
  ]);

  const hasActiveFilters = Boolean(
    searchTerm ||
      selectedClientId !== 'all' ||
      selectedCategoryId !== 'all' ||
      selectedActStatus !== 'all' ||
      selectedPayStatus !== 'all' ||
      dateFrom ||
      dateTo
  );

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedClientId('all');
    setSelectedCategoryId('all');
    setSelectedActStatus('all');
    setSelectedPayStatus('all');
    setDateFrom('');
    setDateTo('');
    if (onClearInitialClient) onClearInitialClient();
  };

  const columns: ReadonlyArray<DataColumn<Activity>> = [
    {
      key: 'title',
      header: 'Actividad',
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
        title="Actividades"
        description="Gestión de servicios prestados, ventas acordadas, saldos y comprobantes."
        actions={
          <Button
            variant="primary"
            onClick={() => {
              setActivityToEdit(null);
              setFormOpen(true);
            }}
            iconStart={<IconPlus size={16} />}
          >
            Nueva Actividad
          </Button>
        }
      >
        {/* Barra de Filtros */}
        <div className="mt-4 p-4 bg-white border border-rule rounded-lg space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <SearchField
              label="Buscar por título o cliente"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm('')}
              placeholder="Buscar..."
            />

            <Select
              label="Cliente"
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              options={[
                { value: 'all', label: 'Todos los clientes' },
                ...clients.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />

            <Select
              label="Categoría"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              options={[
                { value: 'all', label: 'Todas las categorías' },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />

            <Select
              label="Estado operativo"
              value={selectedActStatus}
              onChange={(e) => setSelectedActStatus(e.target.value)}
              options={[
                { value: 'all', label: 'Todos los estados' },
                ...ACTIVITY_STATUS_ORDER.map((st) => ({
                  value: st,
                  label:
                    st === 'pending'
                      ? 'Pendiente'
                      : st === 'in_progress'
                      ? 'En proceso'
                      : st === 'completed'
                      ? 'Finalizada'
                      : 'Cancelada',
                })),
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-rule-subtle items-end">
            <Select
              label="Estado de pago"
              value={selectedPayStatus}
              onChange={(e) => setSelectedPayStatus(e.target.value)}
              options={[
                { value: 'all', label: 'Todos los pagos' },
                ...PAYMENT_STATUS_ORDER.map((pst) => ({
                  value: pst,
                  label:
                    pst === 'pending'
                      ? 'Sin abonos'
                      : pst === 'partial'
                      ? 'Abono parcial'
                      : 'Pagado',
                })),
              ]}
            />

            <div className="grid grid-cols-2 gap-2">
              <DateField
                label="Desde"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <DateField
                label="Hasta"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              {hasActiveFilters ? (
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  Limpiar filtros
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </PageHeader>

      {/* Tabla de Actividades */}
      <DataTable
        columns={columns}
        rows={filteredActivities}
        getRowKey={(row) => row.id}
        caption="Listado de actividades y servicios"
        onRowClick={(row) => setSelectedActivityId(row.id)}
        rowClassName={(row) => (row.status === 'cancelled' ? 'opacity-65' : undefined)}
        loading={loading}
        emptyState={
          hasActiveFilters ? (
            <EmptyState
              title="No hay actividades con los filtros actuales"
              description="Prueba cambiando los criterios de búsqueda o limpia los filtros."
              action={
                <Button variant="secondary" onClick={handleClearFilters}>
                  Limpiar filtros
                </Button>
              }
              icon={<IconActivities size={28} />}
            />
          ) : (
            <EmptyState
              title="Aún no tienes actividades registradas"
              description="Registra tu primer servicio o venta para comenzar a llevar el control."
              action={
                <Button
                  variant="primary"
                  onClick={() => {
                    setActivityToEdit(null);
                    setFormOpen(true);
                  }}
                  iconStart={<IconPlus size={16} />}
                >
                  Crear Primera Actividad
                </Button>
              }
              icon={<IconActivities size={28} />}
            />
          )
        }
      />

      {/* Modal de Detalle */}
      <ActivityDetailModal
        open={Boolean(selectedActivityId)}
        onClose={() => setSelectedActivityId(null)}
        activityId={selectedActivityId}
        clients={clients}
        categories={categories}
        onActivityUpdated={loadData}
        onEditActivity={(act) => {
          setSelectedActivityId(null);
          setActivityToEdit(act);
          setFormOpen(true);
        }}
      />

      {/* Modal de Formulario (Crear/Editar) */}
      <ActivityFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          loadData();
        }}
        activityToEdit={activityToEdit}
        preselectedClientId={selectedClientId !== 'all' ? selectedClientId : null}
        clients={clients}
        categories={categories}
      />
    </div>
  );
}

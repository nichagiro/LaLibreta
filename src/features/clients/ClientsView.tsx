import { useState, useMemo, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { DataTable, type DataColumn } from '@/components/ui/DataTable';
import { Money } from '@/components/ui/Money';
import { SearchField } from '@/components/ui/TextField';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconPlus, IconClients } from '@/components/ui/Icon';
import { api } from '@/services/api';
import type { Activity, Client, Payment } from '@/types';
import { ClientDetailModal } from './ClientDetailModal';
import { ClientFormDialog } from './ClientFormDialog';

export interface ClientsViewProps {
  onCreateActivityWithClient: (clientId: string) => void;
  onSelectActivity: (activityId: string) => void;
}

interface ClientRowData extends Client {
  totalInvoiced: number;
  totalReceived: number;
  totalBalance: number;
}

export function ClientsView({
  onCreateActivityWithClient,
  onSelectActivity,
}: ClientsViewProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'all'>('active');

  // Modales
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cls, acts, pays] = await Promise.all([
        api.getClients(),
        api.getActivities(),
        api.getPayments(),
      ]);
      setClients(cls);
      setActivities(acts);
      setPayments(pays);

      // Si había un cliente seleccionado, actualizarlo usando callback funcional
      setSelectedClient((prev) => (prev ? cls.find((c) => c.id === prev.id) || null : null));
    } catch {
      // Manejado por estado
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Inserta o reemplaza el cliente con el registro que la API devuelve ya
   * persistido, evitando recargar clientes + actividades + pagos.
   * Un cliente nuevo no tiene actividades: sus totales se calculan en 0.
   */
  const handleClientSaved = (saved: Client) => {
    setClients((prev) => {
      const exists = prev.some((c) => c.id === saved.id);
      return exists
        ? prev.map((c) => (c.id === saved.id ? { ...c, ...saved } : c))
        : [...prev, saved];
    });
    setSelectedClient((prev) =>
      prev && prev.id === saved.id ? { ...prev, ...saved } : prev
    );
  };

  /** Estado actualizado con la respuesta de toggleClientStatus. */
  const handleClientStatusToggled = (updated: Client) => {
    setClients((prev) =>
      prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
    );
    setSelectedClient((prev) =>
      prev && prev.id === updated.id ? { ...prev, ...updated } : prev
    );
  };

  // Calcular totales por cliente
  const clientRows: ClientRowData[] = useMemo(() => {
    // Mapa de pagos por actividad
    const paymentsByAct = new Map<string, number>();
    for (const p of payments) {
      paymentsByAct.set(p.activity_id, (paymentsByAct.get(p.activity_id) || 0) + p.amount);
    }

    // Mapa de totales por cliente
    const statsByClient = new Map<
      string,
      { invoiced: number; received: number; balance: number }
    >();

    for (const act of activities) {
      const current = statsByClient.get(act.client_id) || {
        invoiced: 0,
        received: 0,
        balance: 0,
      };

      if (act.status !== 'cancelled') {
        current.invoiced += act.total_value;
        current.balance += act.balance_pending ?? 0;
      }
      current.received += paymentsByAct.get(act.id) || 0;

      statsByClient.set(act.client_id, current);
    }

    return clients.map((c) => {
      const stats = statsByClient.get(c.id) || { invoiced: 0, received: 0, balance: 0 };
      return {
        ...c,
        totalInvoiced: stats.invoiced,
        totalReceived: stats.received,
        totalBalance: stats.balance,
      };
    });
  }, [clients, activities, payments]);

  // Filtrar clientes
  const filteredClients = useMemo(() => {
    return clientRows.filter((c) => {
      if (statusFilter === 'active' && !c.is_active) {
        return false;
      }

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(query);
        const matchesPhone = c.phone?.toLowerCase().includes(query) ?? false;
        const matchesEmail = c.email?.toLowerCase().includes(query) ?? false;
        if (!matchesName && !matchesPhone && !matchesEmail) return false;
      }

      return true;
    });
  }, [clientRows, statusFilter, searchTerm]);

  const columns: ReadonlyArray<DataColumn<ClientRowData>> = [
    {
      key: 'name',
      header: 'Cliente',
      primary: true,
      cell: (row) => (
        <span className="block text-left">
          <span className="block font-medium text-ink truncate">{row.name}</span>
          <span className="mt-0.5 block truncate text-xs text-surface-500">
            {row.phone || row.email || 'Sin datos de contacto'}
          </span>
        </span>
      ),
    },
    {
      key: 'invoiced',
      header: 'Facturado',
      align: 'right',
      cell: (row) => <Money value={row.totalInvoiced} />,
    },
    {
      key: 'received',
      header: 'Dinero Recibido',
      align: 'right',
      cell: (row) => <Money value={row.totalReceived} tone="received" />,
    },
    {
      key: 'balance',
      header: 'Saldo Pendiente',
      align: 'right',
      cell: (row) => (
        <Money
          value={row.totalBalance}
          tone={row.totalBalance > 0 ? 'owed' : 'muted'}
        />
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      cell: (row) => (
        <span
          className={`inline-block text-[11px] px-2 py-0.5 rounded font-medium ${
            row.is_active
              ? 'bg-received-tint text-received'
              : 'bg-surface-200 text-surface-600'
          }`}
        >
          {row.is_active ? 'Activo' : 'Desactivado'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Directorio de clientes, historial comercial de actividades y cartera de cobros."
        actions={
          <Button
            variant="primary"
            onClick={() => {
              setClientToEdit(null);
              setFormOpen(true);
            }}
            iconStart={<IconPlus size={16} />}
          >
            Nuevo Cliente
          </Button>
        }
      >
        <div className="mt-4 p-4 bg-white border border-rule rounded-lg flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="w-full sm:w-80">
            <SearchField
              label="Buscar clientes"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm('')}
              placeholder="Buscar por nombre, teléfono o correo..."
            />
          </div>

          <div className="w-full sm:w-auto">
            <SegmentedControl
              name="client_filter"
              legend="Filtro de estado de cliente"
              value={statusFilter}
              onChange={(val) => setStatusFilter(val as 'active' | 'all')}
              options={[
                { value: 'active', label: 'Solo Activos' },
                { value: 'all', label: 'Todos' },
              ]}
            />
          </div>
        </div>
      </PageHeader>

      {/* Tabla de Clientes */}
      <Panel padding="flush">
        <DataTable
          columns={columns}
          rows={filteredClients}
          getRowKey={(row) => row.id}
          caption="Listado de clientes"
          onRowClick={(row) => setSelectedClient(row)}
          rowClassName={(row) => (!row.is_active ? 'opacity-60' : undefined)}
          loading={loading}
          emptyState={
            <EmptyState
              title="No se encontraron clientes"
              description={
                searchTerm
                  ? 'No hay clientes que coincidan con la búsqueda ingresada.'
                  : 'Añade tu primer cliente para comenzar a registrar actividades.'
              }
              action={
                searchTerm ? (
                  <Button variant="secondary" onClick={() => setSearchTerm('')}>
                    Limpiar búsqueda
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={() => {
                      setClientToEdit(null);
                      setFormOpen(true);
                    }}
                    iconStart={<IconPlus size={16} />}
                  >
                    Crear Primer Cliente
                  </Button>
                )
              }
              icon={<IconClients size={28} />}
            />
          }
        />
      </Panel>

      {/* Modal Ficha del Cliente */}
      <ClientDetailModal
        open={Boolean(selectedClient)}
        onClose={() => setSelectedClient(null)}
        client={selectedClient}
        activities={activities}
        payments={payments}
        onClientUpdated={handleClientStatusToggled}
        onEditClient={(c) => {
          setSelectedClient(null);
          setClientToEdit(c);
          setFormOpen(true);
        }}
        onCreateActivityForClient={(cId) => {
          setSelectedClient(null);
          onCreateActivityWithClient(cId);
        }}
        onSelectActivity={onSelectActivity}
      />

      {/* Modal Formulario (Crear/Editar) */}
      <ClientFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={handleClientSaved}
        clientToEdit={clientToEdit}
        existingClients={clients}
      />
    </div>
  );
}

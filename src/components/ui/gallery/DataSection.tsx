import { useState } from 'react';
import { BalanceRail } from '../BalanceRail';
import { DataTable, type DataColumn } from '../DataTable';
import { KeyValue } from '../KeyValue';
import { MetricCard } from '../MetricCard';
import { Money } from '../Money';
import { Panel } from '../Panel';
import { StatusChip } from '../StatusChip';
import { Tabs } from '../Tabs';
import { ACTIVITY_TYPE_LABELS } from '@/theme/status';
import { activities, categories, clients, summary } from './fixtures';
import { Example, SectionHeading } from './parts';

const clientName = (clientId: string) =>
  clients.find((client) => client.id === clientId)?.name ?? '—';

const categoryName = (categoryId: string) =>
  categories.find((category) => category.id === categoryId)?.name ?? '—';

interface ActivityRow {
  id: string;
  title: string;
  client: string;
  date: string;
  typeName: string;
  categoryName: string;
  activityStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'partial' | 'paid';
  totalValue: number;
  balancePending: number;
}

const activityRows: ActivityRow[] = activities.map((activity) => ({
  id: activity.id,
  title: activity.title,
  client: clientName(activity.client_id),
  date: activity.activity_date,
  typeName: ACTIVITY_TYPE_LABELS[activity.type],
  categoryName: categoryName(activity.category_id),
  activityStatus: activity.status,
  paymentStatus: activity.payment_status ?? 'pending',
  totalValue: activity.total_value,
  balancePending: activity.balance_pending ?? 0,
}));

const activityColumns: ReadonlyArray<DataColumn<ActivityRow>> = [
  {
    key: 'title',
    header: 'Actividad',
    primary: true,
    cell: (row) => (
      <span className="block">
        <span className="block truncate">{row.title}</span>
        <span className="mt-0.5 block truncate text-xs font-normal text-surface-500">
          {row.client} · {row.categoryName}
        </span>
      </span>
    ),
  },
  { key: 'date', header: 'Fecha', cell: (row) => row.date, mobileLabel: 'Fecha' },
  { key: 'type', header: 'Tipo', cell: (row) => row.typeName, mobileLabel: 'Tipo' },
  {
    key: 'activity_status',
    header: 'Estado',
    hideMobileLabel: true,
    cell: (row) => <StatusChip kind="activity" value={row.activityStatus} size="sm" />,
  },
  {
    key: 'payment_status',
    header: 'Pago',
    hideMobileLabel: true,
    cell: (row) => <StatusChip kind="payment" value={row.paymentStatus} size="sm" />,
  },
  {
    key: 'total_value',
    header: 'Valor',
    align: 'right',
    cell: (row) => <Money value={row.totalValue} />,
  },
  {
    key: 'balance_pending',
    header: 'Saldo',
    align: 'right',
    cell: (row) => (
      <Money value={row.balancePending} tone={row.balancePending > 0 ? 'owed' : 'muted'} />
    ),
  },
];

interface ClientRow {
  id: string;
  name: string;
  phone: string;
  invoiced: number;
  received: number;
  balance: number;
}

const clientRows: ClientRow[] = [
  { id: clients[0].id, name: clients[0].name, phone: clients[0].phone ?? '', invoiced: 1800000, received: 900000, balance: 900000 },
  { id: clients[1].id, name: clients[1].name, phone: clients[1].phone ?? '', invoiced: 630000, received: 150000, balance: 480000 },
  { id: clients[2].id, name: clients[2].name, phone: clients[2].phone ?? '', invoiced: 960000, received: 960000, balance: 0 },
];

const clientColumns: ReadonlyArray<DataColumn<ClientRow>> = [
  {
    key: 'name',
    header: 'Cliente',
    primary: true,
    cell: (row) => (
      <span className="block">
        <span className="block truncate">{row.name}</span>
        <span className="mt-0.5 block truncate text-xs font-normal text-surface-500">
          {row.phone}
        </span>
      </span>
    ),
  },
  { key: 'invoiced', header: 'Facturado', align: 'right', cell: (row) => <Money value={row.invoiced} /> },
  { key: 'received', header: 'Recibido', align: 'right', cell: (row) => <Money value={row.received} tone="received" /> },
  {
    key: 'balance',
    header: 'Saldo',
    align: 'right',
    cell: (row) => <Money value={row.balance} tone={row.balance > 0 ? 'owed' : 'muted'} />,
  },
];

export function DataSection() {
  const [historyTab, setHistoryTab] = useState('activities');

  return (
    <>
      <section>
        <SectionHeading
          title="Indicadores del resumen"
          description="Tres cifras en numerales tabulares. El color identifica el eje, pero la etiqueta lo dice con palabras."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            label="Valor de actividades registradas"
            value={summary.total_activities_value}
            detail="Del 1 al 30 de noviembre de 2026, sin canceladas."
          />
          <MetricCard
            label="Dinero recibido"
            value={summary.total_money_received}
            tone="received"
            detail="Suma de los abonos cuya fecha de pago cae en el rango."
          />
          <MetricCard
            label="Saldo pendiente"
            value={summary.total_balance_pending}
            tone="owed"
            detail="Lo que aún se debe por las actividades del período."
            footer={
              <span className="flex flex-wrap gap-x-3 gap-y-1 tabular-nums">
                <span>{summary.activities_count.total} actividades</span>
                <span>{summary.activities_count.pending} pendientes</span>
                <span>{summary.activities_count.in_progress} en proceso</span>
                <span>{summary.activities_count.completed} finalizadas</span>
                <span>{summary.activities_count.cancelled} canceladas</span>
              </span>
            }
          />
        </div>
      </section>

      <section>
        <SectionHeading
          title="Barra de saldo"
          description="El elemento firma. La proporción sale de los montos que recibe; nunca deriva saldos. Debajo siempre están las dos cifras etiquetadas."
        />

        <div className="space-y-4">
          <Example title="Período agregado">
            <BalanceRail
              total={summary.total_activities_value}
              received={summary.total_money_received}
              pending={summary.total_balance_pending}
              receivedLabel="Dinero recibido"
              pendingLabel="Saldo pendiente"
            />
          </Example>

          <div className="grid gap-4 md:grid-cols-3">
            <Example title="Abono parcial">
              <BalanceRail total={350000} received={150000} pending={200000} size="sm" />
            </Example>
            <Example title="Pagado">
              <BalanceRail total={540000} received={540000} pending={0} size="sm" />
            </Example>
            <Example title="Cancelada">
              <BalanceRail total={400000} received={0} pending={0} cancelled size="sm" />
            </Example>
          </div>
        </div>
      </section>

      <section>
        <SectionHeading
          title="Listados"
          description="Tabla real a partir de md; en móvil cada registro se apila con el título arriba, las cifras a la derecha y el resto como metadatos."
        />

        <div className="space-y-4">
          <Panel
            title="Actividades"
            description="Los dos chips conviven en la misma fila: estado de trabajo y estado de pago."
            padding="flush"
            actions={<span className="text-xs text-surface-500">{activityRows.length} registros</span>}
          >
            <DataTable
              columns={activityColumns}
              rows={activityRows}
              getRowKey={(row) => row.id}
              caption="Listado de actividades del período"
              onRowClick={() => undefined}
              rowClassName={(row) => (row.activityStatus === 'cancelled' ? 'opacity-60' : undefined)}
            />
          </Panel>

          <Panel title="Clientes" description="Totales derivados por cliente." padding="flush">
            <DataTable
              columns={clientColumns}
              rows={clientRows}
              getRowKey={(row) => row.id}
              caption="Listado de clientes con sus totales"
            />
          </Panel>
        </div>
      </section>

      <section>
        <SectionHeading
          title="Sin resultados y sin registros"
          description="Dos vacíos distintos: el primero pide crear, el segundo pide limpiar el filtro."
        />

        <div className="grid gap-4 md:grid-cols-2">
          <DataTable
            columns={clientColumns}
            rows={[]}
            getRowKey={(row) => row.id}
            emptyState={
              <Example title="Sin registros">
                <p className="text-sm text-surface-600">
                  Se muestra el <code>EmptyState</code> que pase el llamador, con la acción de crear
                  el primer registro.
                </p>
              </Example>
            }
          />
          <DataTable
            columns={clientColumns}
            rows={[]}
            getRowKey={(row) => row.id}
            emptyState={
              <Example title="Sin resultados por filtro">
                <p className="text-sm text-surface-600">
                  Aquí la acción correcta es <strong>limpiar los filtros</strong>, no crear un
                  registro nuevo.
                </p>
              </Example>
            }
          />
        </div>
      </section>

      <section>
        <SectionHeading
          title="Ficha y datos rotulados"
          description="KeyValue para datos de contacto y de detalle; Tabs para separar el historial."
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Panel title="Cliente">
            <KeyValue
              items={[
                { label: 'Teléfono', value: '+57 310 482 1190' },
                { label: 'Correo', value: 'maria.ospina@correo.com' },
                { label: 'Estado', value: <StatusChip kind="activity" value="completed" size="sm" /> },
                { label: 'Alta', value: '20 ago 2026' },
              ]}
            />
          </Panel>

          <Panel title="Actividad">
            <KeyValue
              items={[
                { label: 'Tipo', value: 'Servicio' },
                { label: 'Categoría', value: 'Sistemas' },
                { label: 'Fecha', value: '4 nov 2026' },
                { label: 'Referencia', value: <code className="text-xs">act_3d77c91a-0001</code> },
              ]}
            />
          </Panel>
        </div>

        <div className="mt-4">
          <Panel title="Historial de María Fernanda Ospina" padding="flush">
            <div className="px-4">
              <Tabs
                label="Historial del cliente"
                value={historyTab}
                onChange={setHistoryTab}
                items={[
                  { key: 'activities', label: 'Actividades', count: 3 },
                  { key: 'payments', label: 'Pagos', count: 4 },
                  { key: 'notes', label: 'Notas', count: 1 },
                ]}
              />
            </div>
            <div className="px-4 py-4 text-sm text-surface-600">
              {historyTab === 'activities'
                ? 'Aquí va el listado de actividades del cliente, con los mismos dos chips y las mismas columnas del listado general.'
                : historyTab === 'payments'
                  ? 'Aquí va el listado de abonos recibidos, ordenado por fecha de pago.'
                  : 'Aquí van las notas internas del cliente. Nunca aparecen en el comprobante.'}
            </div>
          </Panel>
        </div>
      </section>
    </>
  );
}

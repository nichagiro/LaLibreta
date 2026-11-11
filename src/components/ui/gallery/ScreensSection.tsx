import { useState } from 'react';
import type { ReactNode } from 'react';
import { BalanceRail } from '../BalanceRail';
import { Button } from '../Button';
import { DataTable, type DataColumn } from '../DataTable';
import { DateField } from '../DateField';
import { KeyValue } from '../KeyValue';
import { MoneyField } from '../MoneyField';
import { MetricCard } from '../MetricCard';
import { Money } from '../Money';
import { PageHeader } from '../PageHeader';
import { Panel } from '../Panel';
import { SearchField } from '../TextField';
import { SegmentedControl } from '../SegmentedControl';
import { Select } from '../Select';
import { StatusChip } from '../StatusChip';
import { Switch } from '../Switch';
import { Tabs } from '../Tabs';
import { TextArea } from '../TextArea';
import { TextField } from '../TextField';
import { IconPlus } from '../Icon';
import { PAYMENT_METHOD_LABELS } from '@/theme/status';
import { activities, categories, clients, payments, summary } from './fixtures';
import { SectionHeading } from './parts';

// ------------------------------------------
// Datos derivados de la muestra
// ------------------------------------------

const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? '—';

interface ActivityRow {
  id: string;
  title: string;
  client: string;
  date: string;
  activityStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'partial' | 'paid';
  totalValue: number;
  balancePending: number;
}

const activityRows: ActivityRow[] = activities.map((a) => ({
  id: a.id,
  title: a.title,
  client: clientName(a.client_id),
  date: a.activity_date,
  activityStatus: a.status,
  paymentStatus: a.payment_status ?? 'pending',
  totalValue: a.total_value,
  balancePending: a.balance_pending ?? 0,
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
          {row.client}
        </span>
      </span>
    ),
  },
  { key: 'date', header: 'Fecha', cell: (row) => row.date },
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

interface PaymentRow {
  id: string;
  date: string;
  method: string;
  notes: string;
  amount: number;
}

const paymentRows: PaymentRow[] = payments
  .filter((payment) => payment.activity_id === activities[0].id)
  .map((payment) => ({
    id: payment.id,
    date: payment.payment_date,
    method: PAYMENT_METHOD_LABELS[payment.payment_method],
    notes: payment.notes ?? '—',
    amount: payment.amount,
  }));

const paymentColumns: ReadonlyArray<DataColumn<PaymentRow>> = [
  {
    key: 'date',
    header: 'Fecha',
    primary: true,
    cell: (row) => (
      <span className="block">
        <span className="block">{row.date}</span>
        <span className="mt-0.5 block truncate text-xs font-normal text-surface-500">
          {row.notes}
        </span>
      </span>
    ),
  },
  { key: 'method', header: 'Método', cell: (row) => row.method, mobileLabel: 'Método' },
  { key: 'amount', header: 'Monto', align: 'right', cell: (row) => <Money value={row.amount} tone="received" /> },
];

const clientActivityRows = activityRows.filter((row) => row.client === clients[0].name);

// ------------------------------------------

function ScreenFrame({ children }: { children: ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}

export function ScreensSection() {
  const [historyTab, setHistoryTab] = useState('activities');
  const [activityType, setActivityType] = useState<'service' | 'sale'>('service');
  const [categoryStates, setCategoryStates] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(categories.map((category) => [category.id, category.is_active])),
  );

  return (
    <>
      <section>
        <SectionHeading
          title="1 · Inicio"
          description="Tres cifras del período, la barra de saldo agregada y el listado de lo más reciente. Nada decorativo: todo lo que se ve es saldo o estado."
        />

        <ScreenFrame>
          <PageHeader
            title="Inicio"
            description="Resumen del 1 al 30 de noviembre de 2026."
            actions={
              <Button variant="primary" iconStart={<IconPlus size={16} />}>
                Nueva actividad
              </Button>
            }
          >
            <div className="flex flex-wrap items-end gap-3">
              <DateField label="Desde" defaultValue="2026-11-01" className="w-40" />
              <DateField label="Hasta" defaultValue="2026-11-30" className="w-40" />
              <Button variant="secondary">Aplicar</Button>
            </div>
          </PageHeader>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard
              label="Valor de actividades registradas"
              value={summary.total_activities_value}
              detail="Sin canceladas."
            />
            <MetricCard
              label="Dinero recibido"
              value={summary.total_money_received}
              tone="received"
              detail="Por fecha de pago."
            />
            <MetricCard
              label="Saldo pendiente"
              value={summary.total_balance_pending}
              tone="owed"
              detail="Por cobrar en el período."
            />
          </div>

          <Panel title="Cartera del período" description="Proporción de lo cobrado frente a lo pendiente.">
            <BalanceRail
              total={summary.total_activities_value}
              received={summary.total_money_received}
              pending={summary.total_balance_pending}
              receivedLabel="Dinero recibido"
              pendingLabel="Saldo pendiente"
            />
          </Panel>

          <Panel title="Actividades recientes" padding="flush">
            <DataTable
              columns={activityColumns}
              rows={activityRows.slice(0, 4)}
              getRowKey={(row) => row.id}
              caption="Actividades más recientes"
            />
          </Panel>
        </ScreenFrame>
      </section>

      <section>
        <SectionHeading
          title="2 · Clientes"
          description="Búsqueda arriba, totales derivados por cliente a la derecha y el botón de alta siempre visible."
        />

        <ScreenFrame>
          <PageHeader
            title="Clientes"
            description="3 activos · 1 archivado"
            actions={
              <Button variant="primary" iconStart={<IconPlus size={16} />}>
                Nuevo cliente
              </Button>
            }
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <SearchField
                label="Buscar cliente"
                placeholder="Nombre, teléfono o correo"
                defaultValue=""
              />
              <Select
                label="Estado"
                defaultValue="active"
                options={[
                  { value: 'active', label: 'Activos' },
                  { value: 'archived', label: 'Archivados' },
                  { value: 'all', label: 'Todos' },
                ]}
              />
            </div>
          </PageHeader>

          <Panel padding="flush">
            <DataTable
              columns={clientColumns}
              rows={clientRows}
              getRowKey={(row) => row.id}
              caption="Clientes con sus totales"
            />
          </Panel>
        </ScreenFrame>
      </section>

      <section>
        <SectionHeading
          title="3 · Ficha de cliente e historial"
          description="Cabecera con contacto, tres totales, barra de saldo y el historial separado en pestañas."
        />

        <ScreenFrame>
          <PageHeader
            title="María Fernanda Ospina"
            description="+57 310 482 1190 · maria.ospina@correo.com"
            onBack={() => undefined}
            actions={
              <>
                <Button variant="secondary">Editar</Button>
                <Button variant="primary" iconStart={<IconPlus size={16} />}>
                  Nueva actividad
                </Button>
              </>
            }
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard label="Total facturado" value={1800000} />
            <MetricCard label="Dinero recibido" value={900000} tone="received" />
            <MetricCard label="Saldo pendiente" value={900000} tone="owed" />
          </div>

          <Panel title="Cartera del cliente">
            <BalanceRail total={1800000} received={900000} pending={900000} size="sm" />
          </Panel>

          <Panel title="Historial" padding="flush">
            <div className="px-4">
              <Tabs
                label="Historial del cliente"
                value={historyTab}
                onChange={setHistoryTab}
                items={[
                  { key: 'activities', label: 'Actividades', count: clientActivityRows.length },
                  { key: 'payments', label: 'Pagos', count: 4 },
                ]}
              />
            </div>
            <div className="pt-2">
              {historyTab === 'activities' ? (
                <DataTable
                  columns={activityColumns}
                  rows={clientActivityRows}
                  getRowKey={(row) => row.id}
                  caption="Actividades del cliente"
                />
              ) : (
                <DataTable
                  columns={paymentColumns}
                  rows={paymentRows}
                  getRowKey={(row) => row.id}
                  caption="Abonos recibidos del cliente"
                />
              )}
            </div>
          </Panel>
        </ScreenFrame>
      </section>

      <section>
        <SectionHeading
          title="4 · Listado de actividades"
          description="Filtros combinables: rango de fechas, tipo, categoría, estado de actividad y estado de pago. Los dos estados se filtran por separado."
        />

        <ScreenFrame>
          <PageHeader
            title="Actividades"
            description={`${activityRows.length} registros · ${summary.total_balance_pending > 0 ? 'saldo por cobrar en el período' : 'sin saldo pendiente'}`}
            actions={
              <Button variant="primary" iconStart={<IconPlus size={16} />}>
                Nueva actividad
              </Button>
            }
          >
            <Panel title="Filtros">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <DateField label="Desde" defaultValue="2026-11-01" />
                <DateField label="Hasta" defaultValue="2026-11-30" />
                <Select
                  label="Categoría"
                  defaultValue=""
                  placeholder="Todas"
                  options={categories
                    .filter((category) => category.is_active)
                    .map((category) => ({ value: category.id, label: category.name }))}
                />
                <Select
                  label="Estado de actividad"
                  defaultValue=""
                  placeholder="Todos"
                  options={[
                    { value: 'pending', label: 'Pendiente' },
                    { value: 'in_progress', label: 'En proceso' },
                    { value: 'completed', label: 'Finalizada' },
                    { value: 'cancelled', label: 'Cancelada' },
                  ]}
                />
                <Select
                  label="Estado de pago"
                  defaultValue=""
                  placeholder="Todos"
                  options={[
                    { value: 'pending', label: 'Sin abonos' },
                    { value: 'partial', label: 'Abono parcial' },
                    { value: 'paid', label: 'Pagado' },
                  ]}
                />
                <div className="flex items-end gap-2">
                  <Button variant="secondary" fullWidth>
                    Limpiar filtros
                  </Button>
                </div>
              </div>
            </Panel>
          </PageHeader>

          <Panel padding="flush">
            <DataTable
              columns={activityColumns}
              rows={activityRows}
              getRowKey={(row) => row.id}
              caption="Listado de actividades"
              onRowClick={() => undefined}
              rowClassName={(row) => (row.activityStatus === 'cancelled' ? 'opacity-60' : undefined)}
            />
          </Panel>
        </ScreenFrame>
      </section>

      <section>
        <SectionHeading
          title="5 · Formulario de actividad"
          description="Se abre en un diálogo en escritorio y en una hoja inferior en móvil. Los campos se agrupan por bloque y el valor total usa el campo de dinero."
        />

        <ScreenFrame>
          <Panel
            title="Nueva actividad"
            description="Cliente, tipo y categoría primero; después el detalle y el dinero."
            actions={<span className="text-xs text-surface-500">Diálogo de 800 px en escritorio</span>}
          >
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Select
                  label="Cliente"
                  required
                  defaultValue=""
                  placeholder="Selecciona un cliente"
                  options={clients
                    .filter((client) => client.is_active)
                    .map((client) => ({ value: client.id, label: client.name }))}
                />
                <SegmentedControl
                  name="screen-activity-type"
                  legend="Tipo de actividad"
                  showLegend
                  value={activityType}
                  onChange={setActivityType}
                  options={[
                    { value: 'service', label: 'Servicio' },
                    { value: 'sale', label: 'Venta' },
                  ]}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Select
                  label="Categoría"
                  required
                  defaultValue=""
                  placeholder="Selecciona una categoría"
                  options={categories
                    .filter((category) => category.is_active)
                    .map((category) => ({ value: category.id, label: category.name }))}
                />
                <DateField label="Fecha" defaultValue="2026-11-04" required />
                <MoneyField label="Valor total" value={350000} onValueChange={() => undefined} showCode required />
              </div>

              <TextField
                label="Título"
                defaultValue="Mantenimiento mensual del servidor y backup"
                hint="Texto libre. No hay catálogo de servicios."
                required
              />

              <TextArea
                label="Descripción"
                rows={3}
                defaultValue="Depuración de logs, actualización de paquetes y configuración de snapshot diario."
                hint="Desglosa los detalles aquí si lo necesitas."
              />

              <TextArea
                label="Observaciones públicas"
                rows={2}
                defaultValue="Garantía de 30 días sobre la configuración realizada."
                hint="Estas sí se imprimen en el comprobante."
              />

              <TextArea
                label="Notas internas"
                rows={2}
                defaultValue="El cliente demoró tres días en entregar los accesos root."
                hint="Privadas. Nunca aparecen en el comprobante."
              />
            </div>
          </Panel>

          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary">Cancelar</Button>
            <Button variant="primary">Guardar actividad</Button>
          </div>
        </ScreenFrame>
      </section>

      <section>
        <SectionHeading
          title="6 · Detalle de actividad y pagos"
          description="Los dos estados juntos, el bloque de dinero con su barra, la lista de abonos y las acciones. Las notas internas se marcan como privadas."
        />

        <ScreenFrame>
          <PageHeader
            title="Mantenimiento mensual del servidor y backup"
            description="Panadería La Esquina S.A.S. · Sistemas · 4 nov 2026"
            onBack={() => undefined}
            actions={
              <>
                <Button variant="secondary">Editar</Button>
                <Button variant="primary">Registrar abono</Button>
              </>
            }
          >
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip kind="activity" value="completed" />
              <StatusChip kind="payment" value="partial" />
              <span className="text-xs text-surface-500">
                Finalizada y con abono parcial: son estados distintos.
              </span>
            </div>
          </PageHeader>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Dinero">
              <div className="grid grid-cols-3 gap-3 border-b border-rule-subtle pb-4">
                <div>
                  <p className="text-xs text-surface-500">Valor total</p>
                  <Money value={350000} emphasis="display" className="mt-1 block" />
                </div>
                <div>
                  <p className="text-xs text-surface-500">Dinero recibido</p>
                  <Money value={150000} emphasis="display" tone="received" className="mt-1 block" />
                </div>
                <div>
                  <p className="text-xs text-surface-500">Saldo pendiente</p>
                  <Money value={200000} emphasis="display" tone="owed" className="mt-1 block" />
                </div>
              </div>
              <div className="pt-4">
                <BalanceRail total={350000} received={150000} pending={200000} size="sm" />
              </div>
            </Panel>

            <Panel title="Abonos" description="2 pagos registrados" padding="flush">
              <DataTable
                columns={paymentColumns}
                rows={paymentRows}
                getRowKey={(row) => row.id}
                caption="Abonos de la actividad"
              />
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Descripción">
              <p className="text-sm leading-relaxed text-surface-600">
                Depuración de logs, actualización de paquetes y configuración de snapshot diario en
                el servidor de la panadería.
              </p>
            </Panel>

            <div className="space-y-4">
              <Panel title="Observaciones públicas">
                <p className="text-sm leading-relaxed text-surface-600">
                  Garantía de 30 días sobre la configuración realizada.
                </p>
                <p className="mt-3 rounded-md border border-received/30 bg-received-tint px-3 py-2 text-xs text-surface-600">
                  Se imprime en el comprobante.
                </p>
              </Panel>

              <Panel title="Notas internas">
                <p className="text-sm leading-relaxed text-surface-600">
                  El cliente demoró tres días en entregar los accesos root.
                </p>
                <p className="mt-3 rounded-md border border-owed/40 bg-owed-tint px-3 py-2 text-xs text-surface-600">
                  Privadas. Jamás se envían al comprobante.
                </p>
              </Panel>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary">Descargar comprobante</Button>
            <Button variant="danger">Cancelar actividad</Button>
          </div>
        </ScreenFrame>
      </section>

      <section>
        <SectionHeading
          title="7 · Configuración y categorías"
          description="Datos del emisor que van al comprobante, instrucciones de pago y las categorías con su interruptor de activo."
        />

        <ScreenFrame>
          <PageHeader
            title="Configuración"
            description="Estos datos aparecen en el comprobante que envías por WhatsApp."
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Datos del emisor">
              <div className="space-y-4">
                <TextField label="Nombre completo" defaultValue="David Chávez" required />
                <TextField label="Nombre comercial" defaultValue="DJ Soluciones Tech" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField label="Teléfono" defaultValue="+57 300 123 4567" />
                  <TextField label="Correo" defaultValue="propietario@correo.com" />
                </div>
              </div>
            </Panel>

            <Panel title="Comprobante">
              <div className="space-y-4">
                <TextArea
                  label="Instrucciones de pago"
                  rows={3}
                  defaultValue="Bancolombia Ahorros 123-456-789 a nombre de David Chávez | Nequi / Daviplata 3001234567"
                  hint="Se imprimen al pie del comprobante."
                />
                <TextField
                  label="Logo"
                  defaultValue=""
                  placeholder="Pega la URL o el contenido Base64 de tu logo"
                  hint="Opcional. Se muestra en el encabezado del comprobante."
                />
                <div className="flex justify-end gap-2">
                  <Button variant="secondary">Descartar</Button>
                  <Button variant="primary">Guardar cambios</Button>
                </div>
              </div>
            </Panel>
          </div>

          <Panel title="Categorías" description="Desactivar una categoría no altera el historial." padding="flush">
            <ul className="divide-y divide-rule-subtle">
              {categories.map((category) => (
                <li
                  key={category.id}
                  className="flex flex-wrap items-center justify-between gap-4 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{category.name}</p>
                    <p className="mt-0.5 text-xs text-surface-500">
                      {category.is_active ? 'Aparece en los formularios' : 'Desactivada · el historial se conserva'}
                    </p>
                  </div>
                  <Switch
                    checked={categoryStates[category.id]}
                    onChange={(next) =>
                      setCategoryStates((previous) => ({
                        ...previous,
                        [category.id]: next,
                      }))
                    }
                    label={categoryStates[category.id] ? 'Activa' : 'Desactivada'}
                    id={`category-${category.id}`}
                  />
                </li>
              ))}
            </ul>
          </Panel>
        </ScreenFrame>
      </section>

      <section>
        <SectionHeading
          title="Referencia de datos usada en estas composiciones"
          description="Los datos de ejemplo viven en gallery/fixtures.ts. Son de presentación: no se leen de Sheets ni alimentan reglas de negocio."
        />

        <KeyValue
          layout="stacked"
          items={[
            { label: 'Período', value: '1 al 30 de noviembre de 2026' },
            { label: 'Valor de actividades', value: <Money value={summary.total_activities_value} /> },
            { label: 'Dinero recibido', value: <Money value={summary.total_money_received} tone="received" /> },
            { label: 'Saldo pendiente', value: <Money value={summary.total_balance_pending} tone="owed" /> },
          ]}
        />
      </section>
    </>
  );
}

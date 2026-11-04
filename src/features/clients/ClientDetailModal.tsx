import { useState, useMemo } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Money } from '@/components/ui/Money';
import { StatusChip } from '@/components/ui/StatusChip';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Alert } from '@/components/ui/Alert';
import { IconPlus, IconPencil } from '@/components/ui/Icon';
import { api } from '@/services/api';
import type { Activity, Client, Payment } from '@/types';
import { formatDateEs } from '@/theme/format';
import { PAYMENT_METHOD_LABELS } from '@/theme/status';

export interface ClientDetailModalProps {
  open: boolean;
  onClose: () => void;
  client: Client | null;
  activities: Activity[];
  payments: Payment[];
  onClientUpdated: () => void;
  onEditClient: (client: Client) => void;
  onCreateActivityForClient: (clientId: string) => void;
  onSelectActivity: (activityId: string) => void;
}

export function ClientDetailModal({
  open,
  onClose,
  client,
  activities,
  payments,
  onClientUpdated,
  onEditClient,
  onCreateActivityForClient,
  onSelectActivity,
}: ClientDetailModalProps) {
  const [toggleConfirmOpen, setToggleConfirmOpen] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Actividades del cliente
  const clientActivities = useMemo(() => {
    if (!client) return [];
    return activities.filter((a) => a.client_id === client.id);
  }, [activities, client]);

  // IDs de actividades del cliente
  const clientActIds = useMemo(
    () => new Set(clientActivities.map((a) => a.id)),
    [clientActivities]
  );

  // Pagos correspondientes al cliente
  const clientPayments = useMemo(() => {
    return payments.filter((p) => clientActIds.has(p.activity_id));
  }, [payments, clientActIds]);

  // Métricas acumuladas del cliente
  const totals = useMemo(() => {
    const activeActs = clientActivities.filter((a) => a.status !== 'cancelled');
    const totalInvoiced = activeActs.reduce((sum, a) => sum + a.total_value, 0);
    const totalReceived = clientPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalBalance = activeActs.reduce((sum, a) => sum + (a.balance_pending ?? 0), 0);

    return { totalInvoiced, totalReceived, totalBalance };
  }, [clientActivities, clientPayments]);

  if (!open || !client) return null;

  const handleToggleStatus = async () => {
    setToggling(true);
    setError(null);
    try {
      await api.toggleClientStatus(client.id, !client.is_active);
      setToggleConfirmOpen(false);
      onClientUpdated();
    } catch (err: unknown) {
      setError((err as Error)?.message || 'No fue posible actualizar el estado del cliente.');
    } finally {
      setToggling(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title={client.name}
        description={`Ficha del cliente · Creado el ${formatDateEs(client.created_at.split('T')[0])}`}
        size="lg"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2 w-full">
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => onCreateActivityForClient(client.id)}
                iconStart={<IconPlus size={14} />}
              >
                Nueva Actividad para este Cliente
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onEditClient(client)}
                iconStart={<IconPencil size={14} />}
              >
                Editar Datos
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setToggleConfirmOpen(true)}
              >
                {client.is_active ? 'Desactivar Cliente' : 'Reactivar Cliente'}
              </Button>
              <Button variant="secondary" size="sm" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-5">
          {error ? (
            <Alert variant="error" title="Atención">
              {error}
            </Alert>
          ) : null}

          {/* Tarjetas de Métricas Acumuladas del Cliente */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-surface-50 border border-rule rounded-lg">
              <span className="text-xs text-surface-500 block">Total Facturado</span>
              <span className="text-lg font-semibold tabular-nums text-surface-900 block mt-0.5">
                <Money value={totals.totalInvoiced} />
              </span>
            </div>

            <div className="p-3 bg-surface-50 border border-rule rounded-lg">
              <span className="text-xs text-surface-500 block">Dinero Recibido</span>
              <span className="text-lg font-semibold tabular-nums text-received block mt-0.5">
                <Money value={totals.totalReceived} tone="received" />
              </span>
            </div>

            <div className="p-3 bg-surface-50 border border-rule rounded-lg">
              <span className="text-xs text-surface-500 block">Saldo Pendiente</span>
              <span
                className={`text-lg font-semibold tabular-nums block mt-0.5 ${
                  totals.totalBalance > 0 ? 'text-owed' : 'text-surface-500'
                }`}
              >
                <Money value={totals.totalBalance} tone={totals.totalBalance > 0 ? 'owed' : 'muted'} />
              </span>
            </div>
          </div>

          {/* Datos de Contacto y Estado */}
          <div className="p-4 bg-white border border-rule rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-surface-800 uppercase tracking-wider">
                Datos de Contacto
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded font-medium ${
                  client.is_active
                    ? 'bg-received-tint text-received'
                    : 'bg-surface-200 text-surface-600'
                }`}
              >
                {client.is_active ? 'Activo' : 'Desactivado (Archivado)'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-surface-500 block">Teléfono / WhatsApp:</span>
                <span className="font-medium text-surface-800">
                  {client.phone || 'No registrado'}
                </span>
              </div>
              <div>
                <span className="text-surface-500 block">Correo Electrónico:</span>
                <span className="font-medium text-surface-800">
                  {client.email || 'No registrado'}
                </span>
              </div>
            </div>

            {client.notes ? (
              <div className="text-xs pt-2 border-t border-rule-subtle">
                <span className="text-surface-500 block">Notas internas del cliente:</span>
                <p className="mt-0.5 text-surface-700 bg-surface-50 p-2.5 rounded border border-rule leading-relaxed whitespace-pre-wrap">
                  {client.notes}
                </p>
              </div>
            ) : null}
          </div>

          {/* Historial de Actividades del Cliente */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-surface-800 uppercase tracking-wider">
              Historial de Actividades ({clientActivities.length})
            </h4>

            {clientActivities.length === 0 ? (
              <p className="text-xs text-surface-500 italic py-2">
                Este cliente aún no tiene actividades registradas.
              </p>
            ) : (
              <div className="border border-rule rounded-lg overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-50 border-b border-rule text-surface-500 text-[11px]">
                    <tr>
                      <th className="py-2 px-3">Actividad</th>
                      <th className="py-2 px-3">Fecha</th>
                      <th className="py-2 px-3">Estado</th>
                      <th className="py-2 px-3">Pago</th>
                      <th className="py-2 px-3 text-right">Valor</th>
                      <th className="py-2 px-3 text-right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule-subtle">
                    {clientActivities.map((act) => (
                      <tr
                        key={act.id}
                        onClick={() => {
                          onClose();
                          onSelectActivity(act.id);
                        }}
                        className="hover:bg-surface-50/70 cursor-pointer transition-colors"
                      >
                        <td className="py-2.5 px-3 font-medium text-ink max-w-[200px] truncate">
                          {act.title}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-surface-600">
                          {formatDateEs(act.activity_date)}
                        </td>
                        <td className="py-2.5 px-3">
                          <StatusChip kind="activity" value={act.status} size="sm" />
                        </td>
                        <td className="py-2.5 px-3">
                          <StatusChip
                            kind="payment"
                            value={act.payment_status ?? 'pending'}
                            size="sm"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium tabular-nums">
                          <Money value={act.total_value} />
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium tabular-nums">
                          <Money
                            value={act.balance_pending ?? 0}
                            tone={(act.balance_pending ?? 0) > 0 ? 'owed' : 'muted'}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Historial de Pagos del Cliente */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-surface-800 uppercase tracking-wider">
              Historial de Pagos Recibidos ({clientPayments.length})
            </h4>

            {clientPayments.length === 0 ? (
              <p className="text-xs text-surface-500 italic py-2">
                No hay pagos registrados para este cliente.
              </p>
            ) : (
              <div className="border border-rule rounded-lg overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-50 border-b border-rule text-surface-500 text-[11px]">
                    <tr>
                      <th className="py-2 px-3">Fecha</th>
                      <th className="py-2 px-3">Método</th>
                      <th className="py-2 px-3">Detalle</th>
                      <th className="py-2 px-3 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule-subtle">
                    {clientPayments.map((p) => (
                      <tr key={p.id}>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {formatDateEs(p.payment_date)}
                        </td>
                        <td className="py-2.5 px-3">
                          {PAYMENT_METHOD_LABELS[p.payment_method] || p.payment_method}
                        </td>
                        <td className="py-2.5 px-3 text-surface-500 max-w-[200px] truncate">
                          {p.notes || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold tabular-nums text-received">
                          <Money value={p.amount} tone="received" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </Dialog>

      {/* Confirmación para desactivar o reactivar cliente */}
      <ConfirmDialog
        open={toggleConfirmOpen}
        onCancel={() => setToggleConfirmOpen(false)}
        onConfirm={handleToggleStatus}
        title={client.is_active ? '¿Desactivar cliente?' : '¿Reactivar cliente?'}
        message={
          client.is_active ? (
            <>
              Al desactivar a <strong>«{client.name}»</strong> se aplicará un borrado lógico.
              El historial de actividades y pagos se conservará intacto, pero el cliente ya no
              aparecerá en la selección de nuevas actividades.
            </>
          ) : (
            <>
              Al reactivar a <strong>«{client.name}»</strong> volverá a estar disponible para la
              creación de nuevos servicios y ventas.
            </>
          )
        }
        confirmLabel={client.is_active ? 'Desactivar Cliente' : 'Reactivar Cliente'}
        cancelLabel="Volver"
        destructive={client.is_active}
        loading={toggling}
      />
    </>
  );
}

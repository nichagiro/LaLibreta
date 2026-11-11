import { useState, useEffect, useCallback } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { StatusChip } from '@/components/ui/StatusChip';
import { BalanceRail } from '@/components/ui/BalanceRail';
import { Money } from '@/components/ui/Money';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { IconDownload, IconPencil, IconPlus, IconTrash } from '@/components/ui/Icon';
import { api } from '@/services/api';
import type { Activity, Category, Client, Payment } from '@/types';
import { formatCop, formatDateEs } from '@/theme/format';
import { PAYMENT_METHOD_LABELS } from '@/theme/status';
import { PaymentFormDialog } from './PaymentFormDialog';
import { PdfPreviewDialog } from '../pdf/PdfPreviewDialog';

export interface ActivityDetailModalProps {
  open: boolean;
  onClose: () => void;
  activityId: string | null;
  clients: Client[];
  categories: Category[];
  onActivityUpdated: (activity?: Activity) => void;
  onEditActivity: (activity: Activity) => void;
}

export function ActivityDetailModal({
  open,
  onClose,
  activityId,
  clients,
  categories,
  onActivityUpdated,
  onEditActivity,
}: ActivityDetailModalProps) {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Modales secundarios
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
  const [deletingPayment, setDeletingPayment] = useState(false);

  const loadDetails = useCallback(async () => {
    if (!activityId) return;
    setError(null);
    setLoadingDetails(true);
    try {
      const [allActs, actPayments] = await Promise.all([
        api.getActivities(),
        api.getPayments(activityId),
      ]);
      const current = allActs.find((a) => a.id === activityId);
      if (current) {
        setActivity(current);
        setPayments(actPayments);
      } else {
        setError('La actividad no existe o fue eliminada.');
      }
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Error al cargar detalles de la actividad.');
    } finally {
      setLoadingDetails(false);
    }
  }, [activityId]);

  useEffect(() => {
    if (open && activityId) {
      loadDetails();
    } else {
      setActivity(null);
      setPayments([]);
      setError(null);
      setSyncing(false);
    }
  }, [open, activityId, loadDetails]);

  if (!open) return null;

  const client = clients.find((c) => c.id === activity?.client_id);
  const category = categories.find((c) => c.id === activity?.category_id);

  const handleCancelActivity = async () => {
    if (!activity) return;
    setCancelling(true);
    try {
      const cancelled = await api.cancelActivity(activity.id);
      setCancelConfirmOpen(false);
      setActivity(cancelled);
      onActivityUpdated(cancelled);
      setSyncing(true);
      await loadDetails();
    } catch (err: unknown) {
      setError((err as Error)?.message || 'No fue posible cancelar la actividad.');
    } finally {
      setCancelling(false);
      setSyncing(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;
    const paymentId = paymentToDelete.id;
    const paymentAmount = paymentToDelete.amount;
    setDeletingPayment(true);
    try {
      await api.deletePayment(paymentId);
      setPaymentToDelete(null);

      // Actualización optimista inmediata
      setPayments((prev) => prev.filter((p) => p.id !== paymentId));
      let updatedAct: Activity | undefined;
      setActivity((prev) => {
        if (!prev) return null;
        const totalReceived = Math.max(0, (prev.total_received ?? 0) - paymentAmount);
        const balancePending = Math.max(0, prev.total_value - totalReceived);
        const paymentStatus =
          balancePending === 0 ? 'paid' : totalReceived > 0 ? 'partial' : 'pending';
        updatedAct = {
          ...prev,
          total_received: totalReceived,
          balance_pending: balancePending,
          payment_status: paymentStatus as Activity['payment_status'],
        };
        return updatedAct;
      });
      if (updatedAct) {
        onActivityUpdated(updatedAct);
      }
      setSyncing(true);
      await loadDetails();
    } catch (err: unknown) {
      setError((err as Error)?.message || 'No fue posible eliminar el abono.');
    } finally {
      setDeletingPayment(false);
      setSyncing(false);
    }
  };

  const handlePaymentAdded = async (newPayment: Payment) => {
    // 1. Actualización optimista inmediata en la interfaz
    setPayments((prev) => [newPayment, ...prev]);
    let updatedAct: Activity | undefined;
    setActivity((prev) => {
      if (!prev) return null;
      const totalReceived = (prev.total_received ?? 0) + newPayment.amount;
      const balancePending = Math.max(0, prev.total_value - totalReceived);
      const paymentStatus =
        balancePending === 0 ? 'paid' : totalReceived > 0 ? 'partial' : 'pending';
      updatedAct = {
        ...prev,
        total_received: totalReceived,
        balance_pending: balancePending,
        payment_status: paymentStatus as Activity['payment_status'],
      };
      return updatedAct;
    });
    if (updatedAct) {
      onActivityUpdated(updatedAct);
    }
    // 2. Sincronización con backend con indicador visible
    setSyncing(true);
    try {
      await loadDetails();
    } finally {
      setSyncing(false);
    }
  };

  const isCancelled = activity?.status === 'cancelled';
  const pendingBalance = activity?.balance_pending ?? 0;
  const canAddPayment = !isCancelled && pendingBalance > 0;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title={activity?.title || 'Detalle de la Actividad'}
        description={
          client
            ? `Cliente: ${client.name} · Fecha: ${activity ? formatDateEs(activity.activity_date) : ''}`
            : undefined
        }
        size="lg"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2 w-full">
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPdfDialogOpen(true)}
                iconStart={<IconDownload size={14} />}
              >
                Comprobante PDF
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {!isCancelled ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (activity) onEditActivity(activity);
                    }}
                    iconStart={<IconPencil size={14} />}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setCancelConfirmOpen(true)}
                  >
                    Cancelar Actividad
                  </Button>
                </>
              ) : null}
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

          {loadingDetails && !activity ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <Spinner size={28} label="Cargando detalles de la actividad..." />
              <p className="text-xs text-surface-500 font-medium">Cargando detalles de la actividad…</p>
            </div>
          ) : activity ? (
            <>
              {syncing ? (
                <div className="flex items-center justify-between px-3.5 py-2 bg-surface-100 rounded-md text-xs text-surface-700 border border-rule">
                  <div className="flex items-center gap-2">
                    <Spinner size={13} label="Guardando..." />
                    <span className="font-medium">Guardando cambios…</span>
                  </div>
                  <span className="text-[11px] text-surface-500">Actualizando saldos</span>
                </div>
              ) : null}
              {/* Ejes de Estado: Operativo y Financiero */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface-50 rounded-lg border border-rule">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-surface-500">Estado de trabajo:</span>
                  <StatusChip kind="activity" value={activity.status} size="sm" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-surface-500">Estado de pago:</span>
                  <StatusChip kind="payment" value={activity.payment_status ?? 'pending'} size="sm" />
                </div>
              </div>

              {/* Barra de Saldo Firma «La Libreta» */}
              <div className="p-4 bg-white rounded-lg border border-rule space-y-3">
                <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider block">
                  Balance Financiero
                </span>
                <BalanceRail
                  total={activity.total_value}
                  received={activity.total_received ?? 0}
                  pending={activity.balance_pending ?? 0}
                  cancelled={isCancelled}
                  size="md"
                />
              </div>

              {/* Metadatos Generales */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded border border-rule bg-surface-50">
                  <span className="text-surface-500 block">Tipo:</span>
                  <span className="font-semibold text-surface-900 capitalize">
                    {activity.type === 'service' ? 'Servicio' : 'Venta'}
                  </span>
                </div>
                <div className="p-2.5 rounded border border-rule bg-surface-50">
                  <span className="text-surface-500 block">Categoría:</span>
                  <span className="font-semibold text-surface-900 truncate block">
                    {category?.name || 'General'}
                  </span>
                </div>
                <div className="p-2.5 rounded border border-rule bg-surface-50">
                  <span className="text-surface-500 block">Fecha Pactada:</span>
                  <span className="font-semibold text-surface-900">
                    {formatDateEs(activity.activity_date)}
                  </span>
                </div>
                <div className="p-2.5 rounded border border-rule bg-surface-50">
                  <span className="text-surface-500 block">Identificador:</span>
                  <span className="font-mono text-surface-800 text-[11px] truncate block">
                    {activity.id}
                  </span>
                </div>
              </div>

              {/* Descripción detallada */}
              {activity.description ? (
                <div className="text-xs space-y-1">
                  <span className="font-semibold text-surface-700">Descripción:</span>
                  <p className="text-surface-600 bg-surface-50 p-3 rounded-lg border border-rule leading-relaxed whitespace-pre-wrap">
                    {activity.description}
                  </p>
                </div>
              ) : null}

              {/* Observaciones públicas vs Notas internas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {activity.public_notes ? (
                  <div className="p-3 bg-surface-50 rounded-lg border border-rule space-y-1">
                    <span className="font-semibold text-surface-700 block">
                      Observaciones públicas (en PDF):
                    </span>
                    <p className="text-surface-600 whitespace-pre-wrap">{activity.public_notes}</p>
                  </div>
                ) : null}

                {activity.internal_notes ? (
                  <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200/60 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                      <span>Nota interna privada:</span>
                    </div>
                    <p className="text-amber-800 whitespace-pre-wrap">{activity.internal_notes}</p>
                    <span className="text-[10px] text-amber-700/80 italic block pt-1">
                      Jamás se incluye en el comprobante PDF.
                    </span>
                  </div>
                ) : null}
              </div>

              {/* Sección de Abonos y Pagos */}
              <div className="border-t border-rule pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-surface-800 uppercase tracking-wider">
                    Historial de Abonos ({payments.length})
                  </h4>
                  {canAddPayment ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setPaymentDialogOpen(true)}
                      iconStart={<IconPlus size={14} />}
                    >
                      Registrar Abono
                    </Button>
                  ) : isCancelled ? (
                    <span className="text-xs text-surface-500 italic">
                      Actividad cancelada (no admite nuevos abonos).
                    </span>
                  ) : pendingBalance <= 0 ? (
                    <span className="text-xs font-medium text-received">
                      Completamente pagada
                    </span>
                  ) : null}
                </div>

                {payments.length === 0 ? (
                  <p className="text-xs text-surface-500 italic py-2">
                    Aún no se han registrado abonos para esta actividad.
                  </p>
                ) : (
                  <div className="border border-rule rounded-lg overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-ink border-b border-ink text-white text-[11px] font-semibold">
                        <tr>
                          <th className="py-2 px-3">Fecha</th>
                          <th className="py-2 px-3">Método</th>
                          <th className="py-2 px-3">Referencia / Nota</th>
                          <th className="py-2 px-3 text-right">Monto</th>
                          <th className="py-2 px-3 text-center">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rule-subtle">
                        {payments.map((p) => (
                          <tr key={p.id} className="hover:bg-surface-50/50">
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {formatDateEs(p.payment_date)}
                            </td>
                            <td className="py-2.5 px-3">
                              {PAYMENT_METHOD_LABELS[p.payment_method] || p.payment_method}
                            </td>
                            <td className="py-2.5 px-3 text-surface-500 max-w-xs truncate">
                              {p.notes || '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-semibold tabular-nums text-received">
                              <Money value={p.amount} tone="received" />
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => setPaymentToDelete(p)}
                                title="Eliminar abono registrado por error"
                                className="p-1 text-surface-500 hover:text-owed rounded transition-colors"
                              >
                                <IconTrash size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </Dialog>

      {/* Modal para Registrar Abono */}
      <PaymentFormDialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        activity={activity}
        onPaymentAdded={handlePaymentAdded}
      />

      {/* Modal de Previsualización y Descarga de PDF */}
      <PdfPreviewDialog
        open={pdfDialogOpen}
        onClose={() => setPdfDialogOpen(false)}
        activityId={activity?.id || null}
      />

      {/* Confirmación para Cancelar Actividad */}
      <ConfirmDialog
        open={cancelConfirmOpen}
        onCancel={() => setCancelConfirmOpen(false)}
        onConfirm={handleCancelActivity}
        title="¿Deseas cancelar esta actividad?"
        message={
          <>
            Al cancelar la actividad «{activity?.title}», su saldo pendiente por cobrar se
            establecerá automáticamente en <strong>$ 0</strong> para no distorsionar tu cartera. Los
            abonos ya recibidos ({formatCop(activity?.total_received ?? 0)}) se mantendrán en el
            historial financiero.
          </>
        }
        confirmLabel="Cancelar Actividad"
        cancelLabel="Volver"
        destructive
        loading={cancelling}
      />

      {/* Confirmación para Eliminar Pago */}
      <ConfirmDialog
        open={Boolean(paymentToDelete)}
        onCancel={() => setPaymentToDelete(null)}
        onConfirm={handleDeletePayment}
        title="¿Eliminar este abono?"
        message={
          paymentToDelete ? (
            <>
              Se revertirá el ingreso de{' '}
              <strong>{formatCop(paymentToDelete.amount)}</strong> recibido el{' '}
              {formatDateEs(paymentToDelete.payment_date)}. El saldo pendiente de la actividad se
              recalculará automáticamente.
            </>
          ) : (
            ''
          )
        }
        confirmLabel="Eliminar Abono"
        cancelLabel="Conservar"
        destructive
        loading={deletingPayment}
      />
    </>
  );
}

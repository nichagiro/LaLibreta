import { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { IconDownload } from '@/components/ui/Icon';
import { api } from '@/services/api';
import type { ActivityPdfData } from '@/types';
import { formatCop, formatDateEs, formatReferenceCode } from '@/theme/format';
import { PAYMENT_METHOD_LABELS } from '@/theme/status';

export interface PdfPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  activityId: string | null;
  hasUnsavedChanges?: boolean;
}

export function PdfPreviewDialog({
  open,
  onClose,
  activityId,
  hasUnsavedChanges = false,
}: PdfPreviewDialogProps) {
  const [data, setData] = useState<ActivityPdfData | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !activityId) {
      setData(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    api
      .getActivityPdfData(activityId)
      .then((pdfData) => {
        if (isMounted) {
          setData(pdfData);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError((err as Error)?.message || 'No fue posible cargar los datos del comprobante.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [open, activityId]);

  const displayReferenceCode = data
    ? formatReferenceCode(data.reference_code, data.activity.date)
    : '';

  const handleDownload = async () => {
    if (!data) return;
    setDownloading(true);
    try {
      const { buildActivityPdf, downloadPdfBlob } = await import('./generatePdf');
      const pdfBytes = await buildActivityPdf(data);
      const filename = `Comprobante-${displayReferenceCode || data.reference_code}.pdf`;
      downloadPdfBlob(pdfBytes, filename);
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Error al generar el archivo PDF.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Previsualización del Comprobante"
      description="Documento listo para descargar y adjuntar manualmente por WhatsApp. Excluye cualquier nota interna o datos privados."
      size="lg"
      footer={
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 w-full">
          <p className="text-xs text-surface-500 text-left">
            Sin mención a factura electrónica ni DIAN.
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
            <Button
              variant="primary"
              onClick={handleDownload}
              loading={downloading}
              disabled={loading || !data || hasUnsavedChanges}
              iconStart={<IconDownload size={16} />}
            >
              Descargar PDF
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {hasUnsavedChanges ? (
          <Alert variant="error" title="Cambios sin guardar detectados">
            Existen modificaciones en la actividad que aún no han sido guardadas. Guarda o descarta
            los cambios antes de emitir y descargar el comprobante para asegurar la integridad de los datos.
          </Alert>
        ) : null}

        {error ? (
          <Alert variant="error" title="Error">
            {error}
          </Alert>
        ) : null}

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <Spinner size={24} label="Generando vista previa del documento…" />
          </div>
        ) : data ? (
          /* Hoja de previsualización que replica fielmente el diseño de PdfReferenceSheet */
          <div className="border border-rule bg-white p-6 sm:p-8 text-ink rounded-lg shadow-sm">
            {/* Cabecera */}
            <div className="flex items-start justify-between gap-4 border-b-2 border-ink pb-4">
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-ink text-sm font-semibold text-white"
                >
                  {(data.issuer.name || 'DJ')
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((w) => w[0].toUpperCase())
                    .join('')}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight">{data.issuer.name}</p>
                  {data.issuer.business_name ? (
                    <p className="text-xs text-surface-600 leading-tight">
                      {data.issuer.business_name}
                    </p>
                  ) : null}
                  <p className="mt-1 text-[11px] text-surface-500">
                    {[data.issuer.phone, data.issuer.email].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-[11px] text-surface-500">
                  {data.activity.type === 'service' ? 'Resumen de servicio' : 'Resumen de venta'}
                </p>
                <p className="text-sm font-semibold tabular-nums">
                  {displayReferenceCode || data.reference_code}
                </p>
                <p className="mt-0.5 text-[11px] text-surface-500">
                  Emitido el {formatDateEs(data.generation_date)}
                </p>
              </div>
            </div>

            {/* Destinatario y Fecha */}
            <div className="grid grid-cols-2 gap-4 pt-4 text-xs">
              <div>
                <p className="text-[10px] text-surface-500">Para</p>
                <p className="text-sm font-semibold">{data.client.name}</p>
                <p className="text-[11px] text-surface-600">
                  {[data.client.phone, data.client.email].filter(Boolean).join(' · ') || '—'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-surface-500">Fecha de la actividad</p>
                <p className="text-sm font-semibold">{formatDateEs(data.activity.date)}</p>
                <p className="text-[11px] text-surface-600">
                  {data.activity.type === 'service' ? 'Servicio' : 'Venta'} ·{' '}
                  {data.activity.category_name}
                </p>
              </div>
            </div>

            {/* Título y Descripción libre */}
            <div className="mt-4 border-t border-rule pt-4">
              <h4 className="text-sm font-semibold">{data.activity.title}</h4>
              {data.activity.description ? (
                <p className="mt-1 text-xs text-surface-600 leading-relaxed whitespace-pre-wrap">
                  {data.activity.description}
                </p>
              ) : null}
            </div>

            {/* Resumen Financiero */}
            <dl className="mt-4 rounded-md border border-rule p-3 text-xs">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-surface-600">Valor total</dt>
                <dd className="font-semibold tabular-nums">
                  {formatCop(data.activity.total_value)}
                </dd>
              </div>
              <div className="mt-1.5 flex items-baseline justify-between gap-4">
                <dt className="text-surface-600">Dinero recibido</dt>
                <dd className="font-semibold tabular-nums text-received">
                  {formatCop(data.activity.total_received)}
                </dd>
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-rule pt-2">
                <dt className="text-xs font-semibold">Saldo pendiente</dt>
                <dd
                  className={`text-sm font-semibold tabular-nums ${
                    data.activity.balance_pending > 0 ? 'text-owed' : 'text-surface-500'
                  }`}
                >
                  {formatCop(data.activity.balance_pending)}
                </dd>
              </div>
            </dl>

            {/* Abonos Realizados */}
            <div className="mt-4">
              <p className="text-xs font-semibold">Abonos realizados</p>
              {data.payments.length === 0 ? (
                <p className="mt-1 text-xs text-surface-500 italic">No registra abonos.</p>
              ) : (
                <div className="mt-1.5 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-rule text-surface-500 text-[11px]">
                        <th className="py-1">Fecha</th>
                        <th className="py-1">Método</th>
                        <th className="py-1">Detalle</th>
                        <th className="py-1 text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rule-subtle">
                      {data.payments.map((p, idx) => (
                        <tr key={idx}>
                          <td className="py-1.5">{formatDateEs(p.date)}</td>
                          <td className="py-1.5">{PAYMENT_METHOD_LABELS[p.method] || p.method}</td>
                          <td className="py-1.5 text-surface-500">{p.notes || '—'}</td>
                          <td className="py-1.5 text-right font-medium tabular-nums">
                            {formatCop(p.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-1.5 flex items-baseline justify-between border-t border-ink pt-1.5 text-xs font-semibold">
                    <span>Total recibido</span>
                    <span className="tabular-nums">{formatCop(data.activity.total_received)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Observaciones Públicas */}
            {data.activity.public_notes ? (
              <div className="mt-4 border-t border-rule pt-3 text-xs">
                <p className="font-semibold">Observaciones</p>
                <p className="mt-1 text-surface-600 leading-relaxed whitespace-pre-wrap">
                  {data.activity.public_notes}
                </p>
              </div>
            ) : null}

            {/* Instrucciones de Pago */}
            {data.issuer.payment_instructions ? (
              <div className="mt-3 rounded-md bg-surface-100 p-3 text-xs">
                <p className="font-semibold">Formas de pago</p>
                <p className="mt-1 text-surface-600 leading-relaxed whitespace-pre-wrap">
                  {data.issuer.payment_instructions}
                </p>
              </div>
            ) : null}

            {/* Pie de Página */}
            <div className="mt-5 border-t-2 border-ink pt-3 text-[10px] text-surface-500 leading-relaxed">
              <p>Este documento resume un servicio prestado y los pagos recibidos. No es una factura.</p>
              <p className="mt-0.5">
                Comprobante generado el {formatDateEs(data.generation_date)} ·{' '}
                {data.issuer.business_name || data.issuer.name}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </Dialog>
  );
}

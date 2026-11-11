import { useState, useEffect, type FormEvent } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { DateField } from '@/components/ui/DateField';
import { Select } from '@/components/ui/Select';
import { MoneyField } from '@/components/ui/MoneyField';
import { Alert } from '@/components/ui/Alert';
import { api } from '@/services/api';
import type { Activity, Payment, PaymentMethod } from '@/types';
import { formatCop } from '@/theme/format';
import { cn } from '@/theme/cn';
import { PAYMENT_METHOD_LABELS, PAYMENT_METHOD_ORDER } from '@/theme/status';
import { SELECT_PLACEHOLDERS } from '@/theme/select';

export interface PaymentFormDialogProps {
  open: boolean;
  onClose: () => void;
  activity: Activity | null;
  onPaymentAdded: (payment: Payment) => void;
}

export function PaymentFormDialog({
  open,
  onClose,
  activity,
  onPaymentAdded,
}: PaymentFormDialogProps) {
  const [amount, setAmount] = useState<number | null>(null);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pendingBalance = activity?.balance_pending ?? 0;

  useEffect(() => {
    if (!open) return;
    setError(null);
    setAmount(pendingBalance > 0 ? pendingBalance : null);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    // Sin método preseleccionado: el abono se registra solo si el usuario elige uno.
    setPaymentMethod('');
    setNotes('');
  }, [open, pendingBalance]);

  if (!activity) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (amount === null || amount <= 0 || !Number.isInteger(amount)) {
      setError('El monto del abono debe ser un número entero mayor a cero.');
      return;
    }

    if (amount > pendingBalance) {
      setError(
        `El monto ingresado (${formatCop(amount)}) supera el saldo pendiente (${formatCop(
          pendingBalance
        )}). No se permiten sobrepagos.`
      );
      return;
    }

    if (!paymentDate) {
      setError('La fecha de pago es obligatoria.');
      return;
    }

    if (!paymentMethod) {
      setError('Debes seleccionar un método de pago.');
      return;
    }

    setSaving(true);
    try {
      const createdPayment = await api.addPayment({
        activity_id: activity.id,
        payment_date: paymentDate,
        amount,
        payment_method: paymentMethod,
        notes: notes.trim(),
      });
      onPaymentAdded(createdPayment);
      onClose();
    } catch (err: unknown) {
      setError((err as Error)?.message || 'No fue posible registrar el abono.');
    } finally {
      setSaving(false);
    }
  };

  const methodOptions = PAYMENT_METHOD_ORDER.map((methodKey) => ({
    value: methodKey,
    label: PAYMENT_METHOD_LABELS[methodKey],
  }));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Registrar Abono o Pago"
      description={`Actividad: «${activity.title}»`}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="payment-form"
            loading={saving}
            disabled={pendingBalance <= 0}
          >
            Confirmar Abono
          </Button>
        </div>
      }
    >
      <form id="payment-form" onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <Alert variant="error" title="Error">
            {error}
          </Alert>
        ) : null}

        {/* Resumen del saldo actual */}
        <div className="p-3 bg-surface-50 rounded-lg border border-rule flex items-center justify-between text-xs">
          <div>
            <span className="text-surface-500 block">Saldo pendiente actual:</span>
            <span className="text-sm font-semibold tabular-nums text-owed">
              {formatCop(pendingBalance)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-surface-500 block">Total de la actividad:</span>
            <span className="text-sm font-medium tabular-nums text-surface-800">
              {formatCop(activity.total_value)}
            </span>
          </div>
        </div>

        {/* Monto del abono */}
        <div>
          <MoneyField
            label="Monto a abonar"
            value={amount}
            onValueChange={setAmount}
            showCode
            required
            hint={`Puedes abonar hasta el saldo pendiente (${formatCop(pendingBalance)}).`}
          />
        </div>

        {/* Fecha y Método */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DateField
            label="Fecha del ingreso"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
            hint="Día en que entró el dinero"
          />

          <div>
            <Select
              label="Método de pago / Comprobante"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod | '')}
              options={methodOptions}
              placeholder={SELECT_PLACEHOLDERS.metodoPago}
              required
              hint="Efectivo, transferencia o billetera"
            />
          </div>
        </div>

        {/* Acceso rápido de un clic */}
        <div className="space-y-1.5">
          <span className="block text-[11px] font-medium text-surface-500">
            Selección rápida de método:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {methodOptions.map((opt) => {
              const isSelected = paymentMethod === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPaymentMethod(opt.value as PaymentMethod)}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded border transition-colors cursor-pointer',
                    isSelected
                      ? 'bg-ink text-white border-ink font-semibold'
                      : 'bg-white text-surface-700 border-rule hover:border-surface-400 hover:bg-surface-50'
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Comprobante / Nota opcional adaptada según el método */}
        {paymentMethod === '' ? (
          <p className="text-[11px] text-surface-500">
            Elige un método de pago para indicar el comprobante del abono.
          </p>
        ) : paymentMethod === 'efectivo' ? (
          <TextField
            label="Nota o detalle (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Opcional: ej. Recibido en efectivo (puedes dejarlo vacío)"
            hint="Los pagos en efectivo no requieren número de comprobante."
          />
        ) : paymentMethod === 'transferencia_bancaria' ? (
          <TextField
            label="Número de comprobante / transferencia (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej: #84920, Transferencia Bancolombia, etc."
            hint="Código o soporte bancario para conciliar la transferencia."
          />
        ) : paymentMethod === 'nequi' || paymentMethod === 'daviplata' ? (
          <TextField
            label={`Comprobante de ${paymentMethod === 'nequi' ? 'Nequi' : 'Daviplata'} (opcional)`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej: M049281 o código de confirmación"
            hint="Código de confirmación de la billetera digital (opcional)."
          />
        ) : (
          <TextField
            label="Comprobante o referencia (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej: Voucher #1234, soporte físico, etc."
            hint="Detalle visible en el historial y en el comprobante PDF."
          />
        )}
      </form>
    </Dialog>
  );
}

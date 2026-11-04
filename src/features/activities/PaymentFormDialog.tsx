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
import { PAYMENT_METHOD_LABELS, PAYMENT_METHOD_ORDER } from '@/theme/status';

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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transferencia_bancaria');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pendingBalance = activity?.balance_pending ?? 0;

  useEffect(() => {
    if (!open) return;
    setError(null);
    setAmount(pendingBalance > 0 ? pendingBalance : null);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('transferencia_bancaria');
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

          <Select
            label="Método de pago"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            options={methodOptions}
            required
          />
        </div>

        {/* Comprobante / Nota opcional */}
        <TextField
          label="Comprobante o referencia (opcional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ej: Transferencia #84920, Efectivo en mano, etc."
          hint="Detalle visible en el historial y en el comprobante PDF."
        />
      </form>
    </Dialog>
  );
}

import { useState, useEffect, type FormEvent } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { TextArea } from '@/components/ui/TextArea';
import { DateField } from '@/components/ui/DateField';
import { Select } from '@/components/ui/Select';
import { MoneyField } from '@/components/ui/MoneyField';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Switch } from '@/components/ui/Switch';
import { Alert } from '@/components/ui/Alert';
import { api } from '@/services/api';
import type { Activity, ActivityType, ActivityStatus, Category, Client, PaymentMethod } from '@/types';
import { PAYMENT_METHOD_LABELS, PAYMENT_METHOD_ORDER } from '@/theme/status';
import { SELECT_PLACEHOLDERS } from '@/theme/select';
import { formatCop } from '@/theme/format';
import { cn } from '@/theme/cn';

export interface ActivityFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: (activity: Activity) => void;
  activityToEdit?: Activity | null;
  preselectedClientId?: string | null;
  clients: Client[];
  categories: Category[];
}

export function ActivityFormDialog({
  open,
  onClose,
  onSaved,
  activityToEdit,
  preselectedClientId,
  clients,
  categories,
}: ActivityFormDialogProps) {
  const isEditing = Boolean(activityToEdit);

  const [type, setType] = useState<ActivityType>('service');
  const [clientId, setClientId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [activityDate, setActivityDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalValue, setTotalValue] = useState<number | null>(null);
  const [status, setStatus] = useState<ActivityStatus | ''>('');
  const [publicNotes, setPublicNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  // Cobro o abono inicial al momento de la creación
  const [hasInitialPayment, setHasInitialPayment] = useState(false);
  const [initialPaymentType, setInitialPaymentType] = useState<'full' | 'partial'>('full');
  const [initialPaymentAmount, setInitialPaymentAmount] = useState<number | null>(null);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Comprobar si al editar la actividad tiene abonos
  const hasExistingPayments = Boolean(isEditing && activityToEdit && (activityToEdit.total_received ?? 0) > 0);

  useEffect(() => {
    if (!open) return;

    setError(null);
    if (activityToEdit) {
      setType(activityToEdit.type);
      setClientId(activityToEdit.client_id);
      setCategoryId(activityToEdit.category_id);
      setTitle(activityToEdit.title);
      setDescription(activityToEdit.description || '');
      setActivityDate(activityToEdit.activity_date);
      setTotalValue(activityToEdit.total_value);
      setStatus(activityToEdit.status);
      setPublicNotes(activityToEdit.public_notes || '');
      setInternalNotes(activityToEdit.internal_notes || '');
      setHasInitialPayment(false);
      setInitialPaymentType('full');
      setInitialPaymentAmount(null);
      setPaymentMethod('');
      setPaymentNotes('');
    } else {
      const today = new Date().toISOString().split('T')[0];
      setType('service');
      // Sin preselección: el usuario debe elegir cliente y categoría a propósito.
      // El cliente preseleccionado desde la ficha del cliente sí se respeta.
      setClientId(preselectedClientId || '');
      setCategoryId('');
      setTitle('');
      setDescription('');
      setActivityDate(today);
      setTotalValue(null);
      setStatus('');
      setPublicNotes('');
      setInternalNotes('');
      setHasInitialPayment(false);
      setInitialPaymentType('full');
      setInitialPaymentAmount(null);
      setPaymentDate(today);
      setPaymentMethod('');
      setPaymentNotes('');
    }
  }, [open, activityToEdit, preselectedClientId]);

  const handleActivityDateChange = (newDate: string) => {
    // Si la fecha de pago coincidía con la fecha anterior de la actividad, sincronizar
    if (paymentDate === activityDate) {
      setPaymentDate(newDate);
    }
    setActivityDate(newDate);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!clientId) {
      setError('Debes seleccionar un cliente.');
      return;
    }
    if (!categoryId) {
      setError('Debes seleccionar una categoría.');
      return;
    }
    if (!status) {
      setError('Debes seleccionar el estado operativo del trabajo.');
      return;
    }
    if (!title.trim()) {
      setError('El título de la actividad es obligatorio.');
      return;
    }
    if (!activityDate) {
      setError('La fecha de la actividad es obligatoria.');
      return;
    }
    if (totalValue === null || totalValue < 0 || !Number.isInteger(totalValue)) {
      setError('Debes especificar un valor total válido en COP enteros.');
      return;
    }

    let amountToPay = 0;
    if (!isEditing && hasInitialPayment) {
      if (totalValue <= 0) {
        setError('El valor total debe ser mayor a cero para registrar un cobro o abono inicial.');
        return;
      }
      if (!paymentDate) {
        setError('La fecha del pago es obligatoria.');
        return;
      }
      if (!paymentMethod) {
        setError('Debes seleccionar un método de pago.');
        return;
      }
      amountToPay = initialPaymentType === 'full' ? totalValue : (initialPaymentAmount ?? 0);
      if (amountToPay <= 0 || !Number.isInteger(amountToPay)) {
        setError('El monto del abono inicial debe ser un número entero mayor a cero.');
        return;
      }
      if (amountToPay > totalValue) {
        setError(
          `El abono inicial (${formatCop(amountToPay)}) supera el valor total (${formatCop(
            totalValue
          )}). No se permiten sobrepagos.`
        );
        return;
      }
    }

    setSaving(true);
    try {
      if (isEditing && activityToEdit) {
        const updated = await api.updateActivity({
          id: activityToEdit.id,
          title: title.trim(),
          description: description.trim(),
          category_id: categoryId,
          activity_date: activityDate,
          total_value: totalValue,
          status,
          public_notes: publicNotes.trim(),
          internal_notes: internalNotes.trim(),
        });
        onSaved(updated);
        onClose();
      } else {
        const created = await api.createActivity({
          client_id: clientId,
          type,
          category_id: categoryId,
          title: title.trim(),
          description: description.trim(),
          activity_date: activityDate,
          total_value: totalValue,
          status,
          public_notes: publicNotes.trim(),
          internal_notes: internalNotes.trim(),
        });

        if (hasInitialPayment && totalValue > 0 && amountToPay > 0 && paymentMethod) {
          try {
            await api.addPayment({
              activity_id: created.id,
              payment_date: paymentDate,
              amount: amountToPay,
              payment_method: paymentMethod,
              notes: paymentNotes.trim(),
            });
            const balancePending = Math.max(0, totalValue - amountToPay);
            const paymentStatus: Activity['payment_status'] =
              balancePending === 0 ? 'paid' : 'partial';
            onSaved({
              ...created,
              total_received: amountToPay,
              balance_pending: balancePending,
              payment_status: paymentStatus,
            });
            onClose();
          } catch (payErr: unknown) {
            onSaved(created);
            setError(
              `La actividad fue creada, pero no se pudo registrar el abono inicial: ${
                (payErr as Error)?.message || 'Error desconocido'
              }. Puedes registrar el abono manualmente desde el detalle de la actividad.`
            );
          }
        } else {
          onSaved(created);
          onClose();
        }
      }
    } catch (err: unknown) {
      setError((err as Error)?.message || 'No fue posible guardar la actividad.');
    } finally {
      setSaving(false);
    }
  };

  const clientOptions = clients
    .filter((c) => c.is_active || c.id === clientId)
    .map((c) => ({
      value: c.id,
      label: `${c.name}${!c.is_active ? ' (Inactivo)' : ''}`,
    }));

  const categoryOptions = categories
    .filter((c) => c.is_active || c.id === categoryId)
    .map((c) => ({
      value: c.id,
      label: `${c.name}${!c.is_active ? ' (Desactivada)' : ''}`,
    }));

  const paymentMethodOptions = PAYMENT_METHOD_ORDER.map((methodKey) => ({
    value: methodKey,
    label: PAYMENT_METHOD_LABELS[methodKey],
  }));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEditing ? 'Editar Actividad' : 'Nueva Actividad'}
      description="Registra un servicio prestado o venta acordada con un cliente. Un único valor total."
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="activity-form"
            loading={saving}
          >
            {isEditing ? 'Guardar Cambios' : 'Crear Actividad'}
          </Button>
        </div>
      }
    >
      <form id="activity-form" onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <Alert variant="error" title="Error de validación">
            {error}
          </Alert>
        ) : null}

        {/* Tipo: Servicio o Venta */}
        <div>
          <SegmentedControl
            name="activity_type"
            legend="Tipo de actividad"
            showLegend
            value={type}
            onChange={(val) => setType(val as ActivityType)}
            options={[
              { value: 'service', label: 'Servicio' },
              { value: 'sale', label: 'Venta' },
            ]}
            fullWidth
          />
        </div>

        {/* Cliente y Categoría */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Cliente"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            options={clientOptions}
            placeholder={SELECT_PLACEHOLDERS.cliente}
            required
            hint="Titular al que se le realiza el cobro"
          />

          <Select
            label="Categoría"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            options={categoryOptions}
            placeholder={SELECT_PLACEHOLDERS.categoria}
            required
            hint="Clasificación operativa"
          />
        </div>

        {/* Título de la actividad (escrito libremente) */}
        <TextField
          label="Título de la actividad"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej: Mantenimiento de servidor y backup mensual"
          required
          hint="Descripción corta y concreta (sin catálogo fijo)"
        />

        {/* Descripción libre multilínea */}
        <TextArea
          label="Descripción detallada (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detalle de las tareas realizadas, alcance técnico o artículos entregados..."
          rows={3}
          hint="Visible en el comprobante PDF para el cliente"
        />

        {/* Fecha y Valor Total */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DateField
            label="Fecha de la actividad"
            value={activityDate}
            onChange={(e) => handleActivityDateChange(e.target.value)}
            required
          />

          <div>
            <MoneyField
              label="Valor total acordado"
              value={totalValue}
              onValueChange={setTotalValue}
              showCode
              required
              disabled={hasExistingPayments}
              hint={
                hasExistingPayments
                  ? 'Bloqueado: no se puede alterar el valor total porque ya existen pagos registrados.'
                  : 'Un único valor total en COP enteros.'
              }
            />
          </div>
        </div>

        {/* Estado operativo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Estado operativo del trabajo"
            value={status}
            onChange={(e) => setStatus(e.target.value as ActivityStatus | '')}
            options={[
              { value: 'pending', label: 'Pendiente' },
              { value: 'in_progress', label: 'En proceso' },
              { value: 'completed', label: 'Finalizada' },
            ]}
            placeholder={SELECT_PLACEHOLDERS.estado}
            required
            hint="En qué punto del trabajo queda la actividad"
          />
        </div>

        {/* Pago o abono inicial al momento de la creación */}
        {!isEditing && (
          <div className="border-t border-rule pt-4 space-y-3">
            <Switch
              label="Registrar abono o pago inicial"
              description="Registra un anticipo parcial o el pago total al guardar la actividad."
              checked={hasInitialPayment}
              onChange={(checked) => {
                setHasInitialPayment(checked);
                if (checked && initialPaymentType === 'full' && totalValue) {
                  setInitialPaymentAmount(totalValue);
                }
              }}
            />

            {hasInitialPayment && (
              <div className="bg-surface-50 p-3.5 rounded-lg border border-rule space-y-3 mt-3">
                {/* Modalidad: Pago Total vs Abono Parcial */}
                <div className="space-y-1.5">
                  <span className="block text-xs font-medium text-surface-700">
                    Modalidad del cobro inicial
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setInitialPaymentType('full');
                        setInitialPaymentAmount(totalValue || 0);
                      }}
                      className={cn(
                        'py-2 px-3 rounded text-xs font-medium border text-center transition-colors cursor-pointer',
                        initialPaymentType === 'full'
                          ? 'bg-ink text-white border-ink shadow-xs'
                          : 'bg-white text-surface-700 border-rule hover:bg-surface-100'
                      )}
                    >
                      Pago total completo {totalValue ? `(${formatCop(totalValue)})` : ''}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setInitialPaymentType('partial');
                        if (!initialPaymentAmount && totalValue) {
                          setInitialPaymentAmount(Math.round(totalValue / 2));
                        }
                      }}
                      className={cn(
                        'py-2 px-3 rounded text-xs font-medium border text-center transition-colors cursor-pointer',
                        initialPaymentType === 'partial'
                          ? 'bg-ink text-white border-ink shadow-xs'
                          : 'bg-white text-surface-700 border-rule hover:bg-surface-100'
                      )}
                    >
                      Abono parcial / Anticipo
                    </button>
                  </div>
                </div>

                {/* Monto del abono parcial */}
                {initialPaymentType === 'partial' && (
                  <div>
                    <MoneyField
                      label="Monto del abono inicial"
                      value={initialPaymentAmount}
                      onValueChange={setInitialPaymentAmount}
                      showCode
                      required
                      hint={
                        totalValue && initialPaymentAmount !== null
                          ? initialPaymentAmount > totalValue
                            ? `El abono supera el valor total (${formatCop(totalValue)}). No se permiten sobrepagos.`
                            : `Saldo que quedará pendiente por cobrar: ${formatCop(Math.max(0, totalValue - initialPaymentAmount))}`
                          : 'Ingresa el monto recibido por adelantado.'
                      }
                    />
                  </div>
                )}

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
                      options={paymentMethodOptions}
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
                    {paymentMethodOptions.map((opt) => {
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

                {/* Comprobante adaptado según el método */}
                {paymentMethod === '' ? (
                  <p className="text-[11px] text-surface-500">
                    Elige un método de pago para indicar el comprobante del abono.
                  </p>
                ) : paymentMethod === 'efectivo' ? (
                  <TextField
                    label="Nota o detalle (opcional)"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Opcional: ej. Recibido en efectivo (puedes dejarlo vacío)"
                    hint="Los pagos en efectivo no requieren número de comprobante."
                  />
                ) : paymentMethod === 'transferencia_bancaria' ? (
                  <TextField
                    label="Número de comprobante / transferencia (opcional)"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Ej: #84920, Transferencia Bancolombia, etc."
                    hint="Código o soporte bancario para conciliar la transferencia."
                  />
                ) : paymentMethod === 'nequi' || paymentMethod === 'daviplata' ? (
                  <TextField
                    label={`Comprobante de ${paymentMethod === 'nequi' ? 'Nequi' : 'Daviplata'} (opcional)`}
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Ej: M049281 o código de confirmación"
                    hint="Código de confirmación de la billetera digital (opcional)."
                  />
                ) : (
                  <TextField
                    label="Comprobante o referencia (opcional)"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Ej: Voucher #1234, soporte físico, etc."
                    hint="Detalle visible en el historial y en el comprobante PDF."
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Observaciones públicas vs Notas internas */}
        <div className="border-t border-rule pt-4 space-y-4">
          <TextArea
            label="Observaciones públicas (para el cliente)"
            value={publicNotes}
            onChange={(e) => setPublicNotes(e.target.value)}
            placeholder="Garantía, condiciones de entrega, recomendaciones técnicas..."
            rows={2}
            hint="Este texto SÍ aparecerá en el comprobante PDF."
          />

          <div className="bg-surface-50 p-3 rounded-lg border border-rule space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-surface-800">
              <span className="inline-block w-2 h-2 rounded-full bg-surface-500" />
              <span>Notas internas (Uso privado)</span>
            </div>
            <TextArea
              label="Contenido de notas privadas"
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Recordatorios confidenciales, costos propios, impresiones del cliente..."
              rows={2}
              hint="Estrictamente confidencial: NUNCA se incluye en el PDF ni se comparte."
            />
          </div>
        </div>
      </form>
    </Dialog>
  );
}

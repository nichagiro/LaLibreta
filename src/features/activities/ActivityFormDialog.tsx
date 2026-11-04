import { useState, useEffect, type FormEvent } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { TextArea } from '@/components/ui/TextArea';
import { DateField } from '@/components/ui/DateField';
import { Select } from '@/components/ui/Select';
import { MoneyField } from '@/components/ui/MoneyField';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Alert } from '@/components/ui/Alert';
import { api } from '@/services/api';
import type { Activity, ActivityType, ActivityStatus, Category, Client } from '@/types';

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
  const [status, setStatus] = useState<ActivityStatus>('pending');
  const [publicNotes, setPublicNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

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
    } else {
      setType('service');
      setClientId(preselectedClientId || (clients[0]?.id ?? ''));
      setCategoryId(categories.find((c) => c.is_active)?.id ?? (categories[0]?.id ?? ''));
      setTitle('');
      setDescription('');
      setActivityDate(new Date().toISOString().split('T')[0]);
      setTotalValue(null);
      setStatus('pending');
      setPublicNotes('');
      setInternalNotes('');
    }
  }, [open, activityToEdit, preselectedClientId, clients, categories]);

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
        onSaved(created);
        onClose();
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
            required
            hint="Titular al que se le realiza el cobro"
          />

          <Select
            label="Categoría"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            options={categoryOptions}
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
            onChange={(e) => setActivityDate(e.target.value)}
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
            onChange={(e) => setStatus(e.target.value as ActivityStatus)}
            options={[
              { value: 'pending', label: 'Pendiente' },
              { value: 'in_progress', label: 'En proceso' },
              { value: 'completed', label: 'Finalizada' },
            ]}
          />
        </div>

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

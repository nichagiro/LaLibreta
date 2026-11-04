import { useState, useEffect, type FormEvent } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { TextArea } from '@/components/ui/TextArea';
import { Alert } from '@/components/ui/Alert';
import { api } from '@/services/api';
import type { Client } from '@/types';

export interface ClientFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: (client: Client) => void;
  clientToEdit?: Client | null;
}

export function ClientFormDialog({
  open,
  onClose,
  onSaved,
  clientToEdit,
}: ClientFormDialogProps) {
  const isEditing = Boolean(clientToEdit);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (clientToEdit) {
      setName(clientToEdit.name);
      setPhone(clientToEdit.phone || '');
      setEmail(clientToEdit.email || '');
      setNotes(clientToEdit.notes || '');
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setNotes('');
    }
  }, [open, clientToEdit]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('El nombre o razón social del cliente es obligatorio.');
      return;
    }

    setSaving(true);
    try {
      if (isEditing && clientToEdit) {
        const updated = await api.updateClient({
          id: clientToEdit.id,
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        onSaved(updated);
        onClose();
      } else {
        const created = await api.createClient({
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        onSaved(created);
        onClose();
      }
    } catch (err: unknown) {
      setError((err as Error)?.message || 'No fue posible guardar el cliente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
      description="Registra los datos de contacto y notas del cliente o empresa."
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="client-form"
            loading={saving}
          >
            {isEditing ? 'Guardar Cambios' : 'Crear Cliente'}
          </Button>
        </div>
      }
    >
      <form id="client-form" onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <Alert variant="error" title="Error">
            {error}
          </Alert>
        ) : null}

        <TextField
          label="Nombre o Razón Social"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: María Fernanda Ospina o Acme S.A.S."
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            label="Teléfono o Celular"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Ej: +57 310 123 4567"
            hint="Para contacto y WhatsApp"
          />

          <TextField
            label="Correo Electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="cliente@correo.com"
          />
        </div>

        <TextArea
          label="Notas y Observaciones internas (opcional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Condiciones comerciales, acuerdos de pago, persona de contacto..."
          rows={3}
          hint="Uso privado. No se comparte en el comprobante PDF."
        />
      </form>
    </Dialog>
  );
}

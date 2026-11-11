import { useState, useEffect, type FormEvent } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Alert } from '@/components/ui/Alert';
import { api } from '@/services/api';
import type { Category } from '@/types';

/** Distingue una creación de una actualización para el mensaje de confirmación. */
export type CategorySaveMode = 'create' | 'update';

export interface CategoryFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: (category: Category, mode: CategorySaveMode) => void;
  categoryToEdit?: Category | null;
}

export function CategoryFormDialog({
  open,
  onClose,
  onSaved,
  categoryToEdit,
}: CategoryFormDialogProps) {
  const isEditing = Boolean(categoryToEdit);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (categoryToEdit) {
      setName(categoryToEdit.name);
    } else {
      setName('');
    }
  }, [open, categoryToEdit]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('El nombre de la categoría es obligatorio.');
      return;
    }

    setSaving(true);
    try {
      if (isEditing && categoryToEdit) {
        const updated = await api.updateCategory(categoryToEdit.id, name.trim());
        onSaved(updated, 'update');
        onClose();
      } else {
        const created = await api.createCategory(name.trim());
        onSaved(created, 'create');
        onClose();
      }
    } catch (err: unknown) {
      setError((err as Error)?.message || 'No fue posible guardar la categoría.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEditing ? 'Renombrar Categoría' : 'Nueva Categoría'}
      description="Las categorías permiten clasificar las actividades en reportes y filtros."
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" form="category-form" loading={saving}>
            {isEditing ? 'Guardar Cambios' : 'Crear Categoría'}
          </Button>
        </div>
      }
    >
      <form id="category-form" onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <Alert variant="error" title="Error">
            {error}
          </Alert>
        ) : null}

        <TextField
          label="Nombre de la categoría"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Desarrollo web, Consultoría técnica, Eventos..."
          required
        />
      </form>
    </Dialog>
  );
}

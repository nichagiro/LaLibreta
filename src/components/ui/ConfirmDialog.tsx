import type { ReactNode } from 'react';
import { Button } from './Button';
import { Dialog } from './Dialog';

export interface ConfirmDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  /** Qué se va a hacer, en una frase. */
  title: string;
  /** Consecuencia concreta de confirmar, incluido lo que no se puede deshacer. */
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Acción irreversible: usa el tono de peligro en el botón de confirmar. */
  destructive?: boolean;
  /** Bloquea ambos botones mientras se procesa la confirmación. */
  loading?: boolean;
}

/**
 * Confirmación de una acción con consecuencia.
 *
 * Nombra la acción en el botón ("Cancelar actividad", no "Aceptar"), describe
 * qué pasa y ofrece la salida segura primero. Mientras `loading` sea `true`
 * no se permite ni confirmar ni descartar, para que no se doble la petición.
 */
export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!loading) onCancel();
      }}
      title={title}
      size="md"
      dismissOnBackdrop={!loading}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm leading-relaxed text-surface-600">{message}</div>
    </Dialog>
  );
}

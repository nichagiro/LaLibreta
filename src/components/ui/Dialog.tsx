import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/theme/cn';
import { IconClose } from './Icon';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Aclaración breve bajo el título. */
  description?: string;
  children?: ReactNode;
  /** Acciones del pie. Se pegan al fondo en móvil para alcanzarlas con el pulgar. */
  footer?: ReactNode;
  /** `md` hasta 560 px, `lg` hasta 800 px. */
  size?: 'md' | 'lg';
  /**
   * Cierra al pulsar fuera del contenido. Desactívalo cuando el formulario
   * tenga cambios sin guardar.
   */
  dismissOnBackdrop?: boolean;
  className?: string;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), ' +
  'input:not([disabled]):not([type="hidden"]), select:not([disabled]), ' +
  'summary, [tabindex]:not([tabindex="-1"])';

/**
 * Diálogo modal.
 *
 * En móvil se abre como hoja inferior de hasta el 92 % de la altura, donde el
 * pie queda al alcance del pulgar; en escritorio se centra. Gestiona por su
 * cuenta el foco (recaptura al abrir y lo devuelve al cerrar), el ciclo de
 * `Tab`, `Escape` y el bloqueo del desplazamiento de la página.
 *
 * Usa `createPortal` de `react-dom`, que ya es dependencia: no se añade nada.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  dismissOnBackdrop = true,
  className,
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusTo = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  // Foco inicial, bloqueo de scroll y devolución del foco al cerrar.
  useEffect(() => {
    if (!open) return undefined;

    restoreFocusTo.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const node = dialogRef.current;
    if (node) {
      const first = node.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (first ?? node).focus();
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      restoreFocusTo.current?.focus();
    };
  }, [open]);

  // Escape y ciclo de foco dentro del diálogo.
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const node = dialogRef.current;
      if (!node) return;

      const focusables = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === node)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleBackdropClick = () => {
    if (dismissOnBackdrop) onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-ink/45" onClick={handleBackdropClick} aria-hidden="true" />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-lg bg-panel shadow-sheet sm:rounded-lg sm:shadow-dialog',
          size === 'md' ? 'sm:max-w-lg' : 'sm:max-w-2xl',
          className,
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-rule px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold text-ink">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-0.5 text-xs leading-snug text-surface-500">
                {description}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="-mr-1.5 -mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded text-surface-500 transition-colors hover:bg-surface-100 hover:text-ink"
          >
            <IconClose size={16} />
          </button>
        </header>

        <div className="scrollbar-thin flex-1 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>

        {footer ? (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-rule bg-panel px-4 py-3.5 sm:px-5">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

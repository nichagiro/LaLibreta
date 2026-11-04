import type { ReactNode } from 'react';
import { cn } from '@/theme/cn';
import { IconAlert, IconCheck, IconClose, IconInfo } from './Icon';

export type AlertVariant = 'success' | 'error' | 'info';

export interface AlertProps {
  variant?: AlertVariant;
  /** Frase corta que dice qué pasó. */
  title?: string;
  children?: ReactNode;
  /** Acción de recuperación, por ejemplo "Reintentar". */
  action?: ReactNode;
  /** Muestra un botón de cierre. */
  onDismiss?: () => void;
  /** `inline` va en el flujo de la página; `floating` se ancla arriba. */
  placement?: 'inline' | 'floating';
  /** `alert` interrumpe a los lectores de pantalla; `status` los avisa sin cortar. */
  role?: 'alert' | 'status';
  className?: string;
}

const variantClasses: Record<AlertVariant, { shell: string; icon: string; Icon: typeof IconInfo }> =
  {
    success: {
      shell: 'border-received/30 bg-received-tint',
      icon: 'text-received',
      Icon: IconCheck,
    },
    error: { shell: 'border-owed/40 bg-owed-tint', icon: 'text-owed', Icon: IconAlert },
    info: { shell: 'border-rule-strong bg-panel', icon: 'text-accent', Icon: IconInfo },
};

const defaultRole: Record<AlertVariant, 'alert' | 'status'> = {
  success: 'status',
  error: 'alert',
  info: 'status',
};

/**
 * Mensaje de éxito, error o información.
 *
 * En móvil, `placement="floating"` se ancla bajo la barra superior para que un
 * guardado se vea sin desplazar la página. El texto siempre está presente: el
 * color solo refuerza el mensaje, nunca lo sustituye.
 */
export function Alert({
  variant = 'info',
  title,
  children,
  action,
  onDismiss,
  placement = 'inline',
  role,
  className,
}: AlertProps) {
  const config = variantClasses[variant];
  const Icon = config.Icon;

  return (
    <div
      role={role ?? defaultRole[variant]}
      className={cn(
        'flex items-start gap-3 rounded-lg border px-4 py-3',
        config.shell,
        placement === 'floating' && 'fixed inset-x-4 top-4 z-50 mx-auto max-w-lg shadow-dialog',
        className,
      )}
    >
      <Icon size={17} className={cn('mt-0.5 shrink-0', config.icon)} />

      <div className="min-w-0 flex-1">
        {title ? <p className="text-sm font-medium text-ink">{title}</p> : null}
        {children ? (
          <div className={cn('text-sm leading-relaxed text-surface-600', title && 'mt-1')}>
            {children}
          </div>
        ) : null}
        {action ? <div className="mt-2.5 flex flex-wrap gap-2">{action}</div> : null}
      </div>

      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar mensaje"
          className="-mr-1.5 -mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded text-surface-500 transition-colors hover:bg-white/60 hover:text-ink"
        >
          <IconClose size={15} />
        </button>
      ) : null}
    </div>
  );
}

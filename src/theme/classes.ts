/**
 * Clases compartidas de los controles de formulario.
 *
 * Están en un módulo `.ts` (no `.tsx`) para que Tailwind pueda leer los
 * literales completos y para mantener una sola fuente de verdad: si cambia el
 * borde de un campo, cambia en texto, textarea, select y dinero a la vez.
 */

/** Estado base de todo control editable: papel blanco, borde hairline. */
export const controlBase =
  'block w-full rounded-md border bg-panel text-ink ' +
  'placeholder:text-surface-500 transition-colors duration-150 ' +
  'disabled:cursor-not-allowed disabled:bg-surface-100 disabled:text-surface-500';

/**
 * Altura 44 px (target táctil) y 16 px en móvil para que iOS no haga zoom
 * automático al enfocar; vuelve a 14 px en escritorio para mantener densidad.
 */
export const controlSize = 'h-11 px-3.5 text-base md:text-sm';

/** Borde en reposo y al pasar el puntero. El foco lo dibuja el anillo global. */
export const controlIdle = 'border-rule hover:border-rule-strong';

/** Borde de error. Siempre acompañado de mensaje: el color nunca actúa solo. */
export const controlInvalid = 'border-owed';

/** Etiqueta sobre un campo. Sentence case, nunca versalitas. */
export const fieldLabel = 'block text-xs font-medium text-surface-600';

/** Texto auxiliar o de error bajo un campo. */
export const fieldMessage = 'flex items-start gap-1.5 text-xs leading-snug';

/**
 * Concatena los ids de los mensajes asociados a un control, para
 * `aria-describedby`. Prefiere el error al auxiliar: cuando hay error, el
 * mensaje de error es el que debe anunciarse.
 */
export function fieldDescribedBy(id: string, hint?: string, error?: string): string | undefined {
  const ids: string[] = [];
  if (error) ids.push(`${id}-error`);
  else if (hint) ids.push(`${id}-hint`);
  return ids.length > 0 ? ids.join(' ') : undefined;
}

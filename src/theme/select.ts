/**
 * Textos de la opción de entrada de los selectores.
 *
 * Regla: un selector que se guarda en la base de datos **no** debe llegar
 * con un valor preseleccionado. Si el usuario no elige, se guarda la opción
 * de entrada (valor vacío) y el formulario bloquea el guardado explicando qué
 * falta. Así nunca queda registrado un valor que el usuario no eligió.
 *
 * Los filtros de los listados son la excepción: ahí la primera opción es
 * "Todos", que es un valor real y no una ausencia de elección.
 */

/** Texto genérico para selectores sin contexto particular. */
export const SELECT_PLACEHOLDER = 'Selecciona…';

/** Placeholders con contexto según el campo. */
export const SELECT_PLACEHOLDERS = {
  cliente: 'Selecciona un cliente',
  categoria: 'Selecciona una categoría',
  estado: 'Selecciona un estado',
  metodoPago: 'Selecciona un método de pago',
} as const;

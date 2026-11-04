import type { ReactNode } from 'react';
import { cn } from '@/theme/cn';
import { EmptyState } from './EmptyState';
import { Skeleton } from './Skeleton';

export type DataTableAlign = 'left' | 'right' | 'center';

export interface DataColumn<T> {
  /** Identificador estable de la columna. */
  key: string;
  /** Cabecera visible en la vista de tabla. */
  header: string;
  /** Contenido de la celda. */
  cell: (row: T, index: number) => ReactNode;
  align?: DataTableAlign;
  /** Clases de ancho o alineación para la celda. */
  className?: string;
  /** Etiqueta en la vista apilada de móvil. Por defecto usa `header`. */
  mobileLabel?: string;
  /** Omite la etiqueta en móvil, cuando la celda ya trae su propio rótulo. */
  hideMobileLabel?: boolean;
  /** Columna título de la fila apilada. Si ninguna se marca, es la primera. */
  primary?: boolean;
}

export interface DataTableProps<T> {
  columns: ReadonlyArray<DataColumn<T>>;
  rows: readonly T[];
  getRowKey: (row: T, index: number) => string;
  /**
   * Nodo de "todavía no hay registros". Si el vacío viene de un filtro, el
   * llamador debe pasar un estado que ofrezca limpiar los filtros.
   */
  emptyState?: ReactNode;
  /**
   * Activa la navegación por fila. La celda título se envuelve en un botón
   * real para que teclado y lector de pantalla puedan activarla; el resto de
   * la fila responde al puntero.
   */
  onRowClick?: (row: T, index: number) => void;
  /** Clases por fila, por ejemplo para atenuar una cancelada. */
  rowClassName?: (row: T, index: number) => string | undefined;
  /** Muestra filas de esqueleto en lugar de datos. */
  loading?: boolean;
  /** Nº de filas de esqueleto. */
  loadingRows?: number;
  /** Descripción accesible de la tabla. */
  caption?: string;
  className?: string;
}

const alignClasses: Record<DataTableAlign, string> = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
};

const headerAlignClasses: Record<DataTableAlign, string> = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
};

/**
 * Listado tabular responsivo.
 *
 * En escritorio (`md` en adelante) renderiza una tabla real con cabeceras y
 * `scope="col"`. En móvil apila cada registro: la columna título arriba, las
 * columnas alineadas a la derecha a su lado y el resto como metadatos debajo.
 *
 * El estado vacío es distinto del "sin resultados": quien filtra decide qué
 * nodo pasar, porque limpiar filtros y crear el primer registro no son la
 * misma acción.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  emptyState,
  onRowClick,
  rowClassName,
  loading = false,
  loadingRows = 5,
  caption,
  className,
}: DataTableProps<T>) {
  const primaryColumn = columns.find((column) => column.primary) ?? columns[0];
  const metaColumns = columns.filter(
    (column) => column !== primaryColumn && column.align !== 'right',
  );
  const trailingColumns = columns.filter(
    (column) => column !== primaryColumn && column.align === 'right',
  );

  if (loading) {
    return (
      <div className={cn('space-y-3 p-4', className)} role="status" aria-label="Cargando registros">
        {Array.from({ length: loadingRows }, (_, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-5 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className={className}>
        {emptyState ?? <EmptyState title="Todavía no hay registros" />}
      </div>
    );
  }

  const cellAlign = (column: DataColumn<T>) => alignClasses[column.align ?? 'left'];

  return (
    <div className={className}>
      {/* ----------------------------------------------
          Escritorio: tabla real
      ---------------------------------------------- */}
      <table className="hidden w-full border-collapse md:table">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr className="border-b border-rule">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  'px-4 py-2.5 text-xs font-medium text-surface-500',
                  headerAlignClasses[column.align ?? 'left'],
                  column.className,
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-rule-subtle">
          {rows.map((row, index) => (
            <tr
              key={getRowKey(row, index)}
              onClick={onRowClick ? () => onRowClick(row, index) : undefined}
              className={cn(
                'transition-colors',
                onRowClick && 'cursor-pointer hover:bg-surface-50',
                rowClassName?.(row, index),
              )}
            >
              {columns.map((column) => {
                const content = column.cell(row, index);
                const isPrimary = column === primaryColumn && onRowClick !== undefined;

                return (
                  <td
                    key={column.key}
                    className={cn(
                      'px-4 py-3 align-middle text-sm text-ink',
                      cellAlign(column),
                      column.className,
                    )}
                  >
                    {isPrimary ? (
                      <button
                        type="button"
                        className="rounded text-left font-medium focus-visible:underline"
                      >
                        {content}
                      </button>
                    ) : (
                      content
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* ----------------------------------------------
          Móvil: registros apilados
      ---------------------------------------------- */}
      <ul className="divide-y divide-rule md:hidden">
        {rows.map((row, index) => {
          const primaryContent = primaryColumn.cell(row, index);
          const isClickable = onRowClick !== undefined;

          return (
            <li
              key={getRowKey(row, index)}
              className={cn('px-4 py-3', rowClassName?.(row, index))}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {isClickable ? (
                    <button
                      type="button"
                      onClick={() => onRowClick(row, index)}
                      className="block rounded text-left text-sm font-medium text-ink"
                    >
                      {primaryContent}
                    </button>
                  ) : (
                    <div className="text-sm font-medium text-ink">{primaryContent}</div>
                  )}

                  {metaColumns.length > 0 ? (
                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-surface-500">
                      {metaColumns.map((column) => (
                        <span key={column.key} className="flex items-baseline gap-1">
                          {column.hideMobileLabel ? null : (
                            <span>{column.mobileLabel ?? column.header}</span>
                          )}
                          <span className="text-surface-600">{column.cell(row, index)}</span>
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                {trailingColumns.length > 0 ? (
                  <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                    {trailingColumns.map((column) => (
                      <span key={column.key} className="text-sm">
                        {column.cell(row, index)}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

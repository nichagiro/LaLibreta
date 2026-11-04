import { SectionHeading, Example } from './parts';

/**
 * Diseño de referencia del comprobante en PDF.
 *
 * Es una representación en HTML/CSS de cómo debe verse la página A4, con el
 * mismo contenido y el mismo orden que tendrá el documento real. No descarga
 * nada: la generación y la descarga las implementa Frontend.
 *
 * Exclusiones verificadas en este diseño:
 * - Nunca aparecen las notas internas.
 * - No hay tabla de conceptos ni desglose de ítems.
 * - No hay leyendas ni formato de factura electrónica ni mención de validación
 *   ante la DIAN.
 */
export function PdfReferenceSheet() {
  return (
    <>
      <SectionHeading
        title="Referencia del comprobante PDF"
        description="Resumen de servicio o venta para enviar manualmente por WhatsApp. La página se renderiza en blanco sobre A4 con márgenes de 40 px y tipografía de 10 a 16 px."
      />

      <div className="rounded-lg border border-rule bg-panel p-4">
        <p className="text-sm leading-relaxed text-surface-600">
          Este diseño es <strong>solo referencia visual</strong>. La descarga se implementa en la
          sesión de Frontend con <code className="rounded bg-surface-100 px-1 py-0.5 text-xs">
          @react-pdf/renderer</code> u otro motor ligero; aquí no se genera ningún archivo.
        </p>
      </div>

      {/* ----------------------------------------------------------
          Hoja A4 de referencia
      ---------------------------------------------------------- */}
      <div className="mx-auto w-full max-w-[560px] border border-rule bg-white p-8 text-ink shadow-dialog sm:min-h-[792px]">
        {/* Encabezado */}
        <header className="flex items-start justify-between gap-4 border-b-2 border-ink pb-4">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-ink text-sm font-semibold text-white"
            >
              DJ
            </span>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold leading-tight">David Chávez</p>
              <p className="text-[12px] leading-tight text-surface-600">DJ Soluciones Tech</p>
              <p className="mt-1.5 text-[11px] text-surface-500">
                +57 300 123 4567 · propietario@correo.com
              </p>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[11px] text-surface-500">Resumen de servicio</p>
            <p className="text-[13px] font-semibold tabular-nums">ACT-2026-0042</p>
            <p className="mt-1 text-[11px] text-surface-500">Emitido el 4 nov 2026</p>
          </div>
        </header>

        {/* Destinatario y fecha */}
        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className="min-w-0">
            <p className="text-[10px] text-surface-500">Para</p>
            <p className="text-[13px] font-semibold">María Fernanda Ospina</p>
            <p className="text-[11px] text-surface-600">+57 310 482 1190</p>
          </div>
          <div className="min-w-0 text-right">
            <p className="text-[10px] text-surface-500">Fecha de la actividad</p>
            <p className="text-[13px] font-semibold">4 nov 2026</p>
            <p className="text-[11px] text-surface-600">Servicio · Sistemas</p>
          </div>
        </div>

        {/* Título y descripción libre */}
        <div className="mt-4 border-t border-rule pt-4">
          <h3 className="text-[16px] font-semibold leading-snug">
            Mantenimiento mensual del servidor y backup
          </h3>
          <p className="mt-1.5 text-[12px] leading-relaxed text-surface-600">
            Depuración de logs, actualización de paquetes y configuración de snapshot diario en el
            servidor de la panadería.
          </p>
        </div>

        {/* Valor, recibido y saldo */}
        <dl className="mt-4 rounded-md border border-rule p-3 text-[12px]">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-surface-600">Valor total</dt>
            <dd className="font-semibold tabular-nums">$ 350.000</dd>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-4">
            <dt className="text-surface-600">Dinero recibido</dt>
            <dd className="font-semibold tabular-nums text-received">$ 150.000</dd>
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-rule pt-2">
            <dt className="text-[13px] font-semibold">Saldo pendiente</dt>
            <dd className="text-[16px] font-semibold tabular-nums text-owed">$ 200.000</dd>
          </div>
        </dl>

        {/* Abonos */}
        <div className="mt-4">
          <p className="text-[12px] font-semibold">Abonos realizados</p>
          <table className="mt-1.5 w-full text-[11px]">
            <thead>
              <tr className="border-b border-rule text-surface-500">
                <th scope="col" className="py-1 text-left font-medium">Fecha</th>
                <th scope="col" className="py-1 text-left font-medium">Método</th>
                <th scope="col" className="py-1 text-right font-medium">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule-subtle">
              <tr>
                <td className="py-1.5">30 oct 2026</td>
                <td className="py-1.5">Efectivo</td>
                <td className="py-1.5 text-right tabular-nums">$ 100.000</td>
              </tr>
              <tr>
                <td className="py-1.5">4 nov 2026</td>
                <td className="py-1.5">Nequi</td>
                <td className="py-1.5 text-right tabular-nums">$ 50.000</td>
              </tr>
            </tbody>
          </table>
          <div className="mt-1.5 flex items-baseline justify-between gap-4 border-t border-ink pt-1.5 text-[12px] font-semibold">
            <span>Total recibido</span>
            <span className="tabular-nums">$ 150.000</span>
          </div>
        </div>

        {/* Observaciones públicas */}
        <div className="mt-4 border-t border-rule pt-3">
          <p className="text-[11px] font-semibold">Observaciones</p>
          <p className="mt-1 text-[11px] leading-relaxed text-surface-600">
            Garantía de 30 días sobre la configuración realizada.
          </p>
        </div>

        {/* Instrucciones de pago */}
        <div className="mt-3 rounded-md bg-surface-100 p-3">
          <p className="text-[11px] font-semibold">Formas de pago</p>
          <p className="mt-1 text-[11px] leading-relaxed text-surface-600">
            Bancolombia Ahorros 123-456-789 a nombre de David Chávez · Nequi / Daviplata 3001234567
          </p>
        </div>

        {/* Pie con leyenda aclaratoria */}
        <footer className="mt-5 border-t-2 border-ink pt-3">
          <p className="text-[10px] leading-relaxed text-surface-500">
            Este documento resume un servicio prestado y los pagos recibidos. No es una factura.
          </p>
          <p className="mt-1 text-[10px] text-surface-500">
            Comprobante generado el 4 nov 2026 · DJ Soluciones Tech
          </p>
        </footer>
      </div>

      {/* ----------------------------------------------------------
          Especificación
      ---------------------------------------------------------- */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Example title="Va en el comprobante">
          <ul className="space-y-1.5 text-sm text-surface-600">
            {[
              'Logo, nombre y datos de contacto del emisor',
              'Código de referencia y fecha de emisión',
              'Nombre y contacto del cliente',
              'Fecha, tipo y categoría de la actividad',
              'Título y descripción libre',
              'Valor total, dinero recibido y saldo pendiente',
              'Lista de abonos con fecha y método',
              'Observaciones públicas',
              'Instrucciones de pago del emisor',
              'Leyenda aclaratoria de pie',
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-received" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Example>

        <Example title="Nunca va en el comprobante">
          <ul className="space-y-1.5 text-sm text-surface-600">
            {[
              'Notas internas de la actividad o del cliente',
              'Tabla de conceptos, ítems, cantidades ni precios unitarios',
              'Notas de margen o costos del trabajador',
              'Etiquetas ni formato de factura electrónica',
              'Cualquier mención de validación ante la DIAN',
              'Identificadores internos tipo act_… o cli_…',
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cancelled" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Example>
      </div>

      <div className="mt-4">
        <Example
          title="Tipografía y medidas"
          note="Valores en puntos para el motor de PDF. La hoja usa la misma familia Archivo."
        >
          <dl className="divide-y divide-rule-subtle text-sm">
            {[
              ['Tamaño de página', 'A4 (210 × 297 mm) con márgenes de 40 px'],
              ['Título de la actividad', '16 px · peso 600'],
              ['Nombre del emisor', '15 px · peso 600'],
              ['Cifras destacadas', '16 px · peso 600 · numerales tabulares'],
              ['Cuerpo y descripción', '12 px · interlínea 1.6'],
              ['Metadatos y pie', '10–11 px · color atenuado'],
              ['Separadores', 'Reglas de 1 px; pie y total con 2 px'],
              ['Moneda', 'Siempre enteros COP: $ 180.000'],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-wrap items-baseline justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <dt className="text-xs text-surface-500">{label}</dt>
                <dd className="text-right text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </Example>
      </div>
    </>
  );
}

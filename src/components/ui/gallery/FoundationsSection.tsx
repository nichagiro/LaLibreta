import { cn } from '@/theme/cn';
import { formatCop } from '@/theme/format';
import { colors, radii, spacing, swatches, typography } from '@/theme/tokens';
import {
  ACTIVITY_STATUS_META,
  ACTIVITY_STATUS_ORDER,
  PAYMENT_STATUS_META,
  PAYMENT_STATUS_ORDER,
} from '@/theme/status';
import { StatusChip } from '../StatusChip';
import { Example, SectionHeading } from './parts';

const RADIUS_SAMPLES: ReadonlyArray<{ label: string; className: string; usage: string }> = [
  { label: 'Fila', className: 'rounded-none', usage: 'Filas de lista y separadores' },
  { label: 'Sello', className: 'rounded-sm', usage: 'Chips de estado, marcas' },
  { label: 'Control', className: 'rounded-md', usage: 'Botones, campos, selectores' },
  { label: 'Panel', className: 'rounded-lg', usage: 'Paneles y diálogos' },
];

export function FoundationsSection() {
  return (
    <>
      <section>
        <SectionHeading
          title="Principio rector"
          description="La aplicación es un cuaderno de cuentas: el cromo es papel y tinta, y el color tiene significado financiero, nada más."
        />

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-rule bg-panel p-4">
            <p className="text-xs font-medium text-surface-500">Eje de color 1</p>
            <p className="mt-1 text-sm font-semibold text-ink">Azul y tinta</p>
            <p className="mt-1 text-xs leading-relaxed text-surface-600">
              Estado de actividad, foco y navegación activa. Describe el progreso del trabajo.
            </p>
          </div>
          <div className="rounded-lg border border-rule bg-panel p-4">
            <p className="text-xs font-medium text-surface-500">Eje de color 2</p>
            <p className="mt-1 text-sm font-semibold text-ink">Verde y naranja</p>
            <p className="mt-1 text-xs leading-relaxed text-surface-600">
              Estado de pago: lo cobrado y lo que falta por cobrar. Describe dinero.
            </p>
          </div>
          <div className="rounded-lg border border-rule bg-panel p-4">
            <p className="text-xs font-medium text-surface-500">Eje neutro</p>
            <p className="mt-1 text-sm font-semibold text-ink">Gris</p>
            <p className="mt-1 text-xs leading-relaxed text-surface-600">
              Cancelado o archivado. Nunca se usa para estados activos.
            </p>
          </div>
        </div>
      </section>

      <section>
        <SectionHeading
          title="Color"
          description="Los valores viven en tailwind.config.js y en src/theme/tokens.ts. No se repiten en los componentes."
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {swatches.map((swatch) => (
            <div key={swatch.key} className="overflow-hidden rounded-md border border-rule bg-panel">
              <div
                className="h-14 border-b border-rule-subtle"
                style={{ backgroundColor: colors[swatch.key] }}
              />
              <div className="px-3 py-2">
                <p className="text-xs font-semibold text-ink">{swatch.label}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-surface-500">{swatch.role}</p>
                <code className="mt-1 block text-[11px] text-surface-500">{colors[swatch.key]}</code>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionHeading
          title="Tipografía"
          description="Archivo para todo. La jerarquía la dan el peso y el tamaño, no una segunda familia. Las cifras usan numerales tabulares, no una fuente monoespaciada."
        />

        <Example title="Escala" note="Todas las clases se aplican directamente en el componente.">
          <dl className="divide-y divide-rule-subtle">
            {typography.scale.map((step) => (
              <div key={step.token} className="py-3 first:pt-0 last:pb-0">
                <p className={cn(step.css, 'truncate text-ink')}>
                  {step.token === 'display' ? formatCop(1800000) : 'Mantenimiento del servidor'}
                </p>
                <p className="mt-1.5 text-[11px] text-surface-500">
                  <code>{step.css}</code> · {step.size} · peso {step.weight} · {step.usage}
                </p>
              </div>
            ))}
          </dl>
        </Example>

        <div className="mt-4">
          <Example
            title="Cifras en columna"
            note="tabular-nums alinea las decenas y las centenas al leer un listado de saldos."
          >
            <div className="space-y-1.5 text-sm">
              {[
                { label: 'Tienda en línea con catálogo', value: 1800000, tone: 'text-ink' },
                { label: 'Venta de 3 audífonos', value: 540000, tone: 'text-ink' },
                { label: 'Mantenimiento mensual', value: 350000, tone: 'text-ink' },
              ].map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-4">
                  <span className="truncate text-surface-600">{row.label}</span>
                  <span className={cn('shrink-0 font-semibold tabular-nums', row.tone)}>
                    {formatCop(row.value)}
                  </span>
                </div>
              ))}
            </div>
          </Example>
        </div>
      </section>

      <section>
        <SectionHeading
          title="Espaciado y radios"
          description="Grilla de 4 px. Los radios son jerárquicos: no hay un único radio para todo."
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Example title="Espaciado fijo del sistema">
            <dl className="divide-y divide-rule-subtle text-sm">
              <div className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0">
                <dt className="text-xs text-surface-500">Margen de página</dt>
                <dd className="text-right text-ink">
                  <code className="text-xs">{spacing.pageGutter}</code>
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-2.5">
                <dt className="text-xs text-surface-500">Separación de sección</dt>
                <dd className="text-right text-ink">
                  <code className="text-xs">{spacing.sectionGap}</code>
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-2.5">
                <dt className="text-xs text-surface-500">Ancho de contenido</dt>
                <dd className="text-right text-ink">
                  <code className="text-xs">{spacing.contentWidth}</code>
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-2.5 last:pb-0">
                <dt className="text-xs text-surface-500">Fila de lista</dt>
                <dd className="text-right text-ink">
                  <code className="text-xs">{spacing.row}</code>
                </dd>
              </div>
            </dl>
          </Example>

          <Example title="Radios">
            <div className="grid grid-cols-2 gap-3">
              {RADIUS_SAMPLES.map((sample) => (
                <div key={sample.label} className="text-center">
                  <div
                    className={cn(
                      'mb-1.5 h-12 w-full border border-rule-strong bg-surface-100',
                      sample.className,
                    )}
                  />
                  <p className="text-xs font-medium text-ink">{sample.label}</p>
                  <p className="text-[11px] leading-snug text-surface-500">{sample.usage}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-surface-500">
              Radios declarados: <code>{radii.row}</code>, <code>{radii.chip}</code>,{' '}
              <code>{radii.control}</code>, <code>{radii.panel}</code>
            </p>
          </Example>
        </div>
      </section>

      <section>
        <SectionHeading
          title="Vocabulario de estados"
          description="Estado de actividad y estado de pago nunca se confunden: contorno contra relleno, cuadrado contra círculo, azul contra verde y naranja, y siempre la etiqueta en español."
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Example
            title="Estado de actividad · chip contorneado"
            note="Progreso del trabajo. El cuadrado se va rellenando a medida que avanza."
          >
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_STATUS_ORDER.map((status) => (
                <StatusChip key={status} kind="activity" value={status} />
              ))}
            </div>
            <dl className="mt-4 divide-y divide-rule-subtle">
              {ACTIVITY_STATUS_ORDER.map((status) => (
                <div key={status} className="flex items-center justify-between gap-3 py-2 first:pt-0">
                  <dt className="text-xs text-surface-500">
                    <code>{status}</code>
                  </dt>
                  <dd className="text-xs text-ink">{ACTIVITY_STATUS_META[status].label}</dd>
                </div>
              ))}
            </dl>
          </Example>

          <Example
            title="Estado de pago · chip relleno"
            note="Dinero. El círculo se va llenando según lo abonado."
          >
            <div className="flex flex-wrap gap-2">
              {PAYMENT_STATUS_ORDER.map((status) => (
                <StatusChip key={status} kind="payment" value={status} />
              ))}
            </div>
            <dl className="mt-4 divide-y divide-rule-subtle">
              {PAYMENT_STATUS_ORDER.map((status) => (
                <div key={status} className="flex items-center justify-between gap-3 py-2 first:pt-0">
                  <dt className="text-xs text-surface-500">
                    <code>{status}</code>
                  </dt>
                  <dd className="text-xs text-ink">{PAYMENT_STATUS_META[status].label}</dd>
                </div>
              ))}
            </dl>
          </Example>
        </div>

        <div className="mt-4 rounded-lg border border-rule bg-panel p-4">
          <p className="text-xs font-semibold text-ink">Mismo registro, dos estados</p>
          <p className="mt-1 max-w-prose text-xs leading-relaxed text-surface-600">
            Una actividad puede estar <strong>finalizada</strong> y todavía tener saldo por cobrar;
            o estar <strong>en proceso</strong> y ya estar pagada. Por eso se muestran los dos chips
            juntos en todo listado.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <StatusChip kind="activity" value="completed" />
            <StatusChip kind="payment" value="partial" />
            <span className="text-xs text-surface-500">Finalizada · Abono parcial</span>
          </div>
        </div>
      </section>
    </>
  );
}

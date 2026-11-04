import { useState } from 'react';
import { Button } from '../Button';
import { DateField } from '../DateField';
import { MoneyField } from '../MoneyField';
import { SearchField, TextField } from '../TextField';
import { SegmentedControl } from '../SegmentedControl';
import { Select } from '../Select';
import { Switch } from '../Switch';
import { TextArea } from '../TextArea';
import { IconDownload, IconPlus } from '../Icon';
import { ACTIVITY_TYPE_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_METHOD_ORDER } from '@/theme/status';
import { Example, SectionHeading, SpecimenRow } from './parts';

const VARIANTS = ['primary', 'secondary', 'ghost', 'danger'] as const;
const SIZES = ['sm', 'md', 'lg'] as const;

export function ControlsSection() {
  const [search, setSearch] = useState('María');
  const [money, setMoney] = useState<number | null>(350000);
  const [activityType, setActivityType] = useState<'service' | 'sale'>('service');
  const [isCategoryActive, setIsCategoryActive] = useState(true);

  return (
    <>
      <section>
        <SectionHeading
          title="Botones"
          description="Una sola acción primaria por pantalla. El estado de carga reemplaza el icono y conserva la etiqueta, para que el ancho no salte."
        />

        <div className="space-y-4">
          <Example title="Variantes">
            <SpecimenRow>
              {VARIANTS.map((variant) => (
                <Button key={variant} variant={variant}>
                  {variant === 'primary' ? 'Guardar actividad' : variant}
                </Button>
              ))}
            </SpecimenRow>
          </Example>

          <Example title="Tamaños" note="sm 36 px en filas densas · md 44 px · lg 48 px en móvil">
            <SpecimenRow>
              {SIZES.map((size) => (
                <Button key={size} size={size} variant="primary">
                  Registrar abono
                </Button>
              ))}
            </SpecimenRow>
          </Example>

          <Example title="Con icono, cargando y deshabilitado">
            <SpecimenRow>
              <Button variant="primary" iconStart={<IconPlus size={16} />}>
                Nueva actividad
              </Button>
              <Button variant="secondary" iconEnd={<IconDownload size={16} />}>
                Descargar comprobante
              </Button>
              <Button variant="primary" loading>
                Guardando…
              </Button>
              <Button variant="secondary" disabled>
                Cancelar actividad
              </Button>
            </SpecimenRow>
          </Example>

          <Example title="Ancho completo" note="En móvil el botón principal ocupa todo el ancho.">
            <Button variant="primary" size="lg" fullWidth>
              Guardar actividad
            </Button>
          </Example>
        </div>
      </section>

      <section>
        <SectionHeading
          title="Campos de texto"
          description="Etiqueta visible siempre, auxiliar o error debajo, y foco por anillo global. En móvil los campos miden 16 px para que iOS no haga zoom al enfocar."
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Example title="Con auxiliar">
            <TextField
              label="Nombre completo"
              defaultValue="María Fernanda Ospina"
              hint="Cómo se llama la persona o el negocio."
              required
            />
          </Example>

          <Example title="Con error" note="El error sustituye al auxiliar y se asocia por aria-describedby.">
            <TextField
              label="Correo electrónico"
              defaultValue="maria.ospina@"
              error="Escribe un correo completo, por ejemplo nombre@dominio.com"
              required
            />
          </Example>

          <Example title="Con prefijo y sufijo">
            <TextField
              label="Teléfono"
              defaultValue="+57 310 482 1190"
              prefix="+57"
              hint="Aparece tal cual en el comprobante."
            />
          </Example>

          <Example title="Búsqueda con botón de limpiar">
            <SearchField
              label="Buscar cliente"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onClear={() => setSearch('')}
              clearable
              placeholder="Nombre, teléfono o correo"
            />
          </Example>

          <Example title="Deshabilitado">
            <TextField
              label="Identificador"
              defaultValue="cli_9c41b7e2-0001"
              disabled
              hint="Lo genera el sistema y no se puede editar."
            />
          </Example>

          <Example title="Multilínea">
            <TextArea
              label="Descripción libre"
              defaultValue="Se realiza depuración de logs y configuración de snapshot diario."
              hint="Aquí puedes desglosar los detalles si lo deseas."
              rows={3}
            />
          </Example>
        </div>
      </section>

      <section>
        <SectionHeading
          title="Selectores"
          description="El selector es nativo: en celular abre el picker del sistema, que es más rápido y accesible que cualquier lista construida a mano."
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Example title="Selector de categoría">
            <Select
              label="Categoría"
              placeholder="Elige una categoría"
              defaultValue="cat_5f21a0d4-0001"
              options={[
                { value: 'cat_5f21a0d4-0001', label: 'Sistemas' },
                { value: 'cat_5f21a0d4-0002', label: 'Desarrollo web' },
                { value: 'cat_5f21a0d4-0003', label: 'Recreación y eventos' },
                { value: 'cat_5f21a0d4-0004', label: 'Venta de artículos' },
                { value: 'cat_5f21a0d4-0005', label: 'Otros' },
                { value: 'cat_5f21a0d4-0006', label: 'Asesorías (desactivada)', disabled: true },
              ]}
              hint="Las categorías desactivadas siguen en el historial."
            />
          </Example>

          <Example title="Selector de método de pago">
            <Select
              label="Método de pago"
              defaultValue="nequi"
              options={PAYMENT_METHOD_ORDER.map((method) => ({
                value: method,
                label: PAYMENT_METHOD_LABELS[method],
              }))}
              required
            />
          </Example>

          <Example title="Segmentado" note="Radios nativos: las flechas del teclado ya navegan.">
            <SegmentedControl
              name="gallery-activity-type"
              legend="Tipo de actividad"
              showLegend
              value={activityType}
              onChange={setActivityType}
              options={[
                { value: 'service', label: ACTIVITY_TYPE_LABELS.service },
                { value: 'sale', label: ACTIVITY_TYPE_LABELS.sale },
              ]}
            />
          </Example>

          <Example title="Interruptor" note="Para activar o desactivar clientes y categorías.">
            <Switch
              checked={isCategoryActive}
              onChange={setIsCategoryActive}
              label="Categoría activa"
              description="Al desactivarla deja de aparecer en los formularios, pero no altera el historial."
            />
          </Example>
        </div>
      </section>

      <section>
        <SectionHeading
          title="Fechas y dinero"
          description="El campo de dinero muestra el símbolo fijo y solo cifras agrupadas dentro, para que el cursor no salte al escribir. Sale siempre un entero COP."
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Example title="Valor total">
            <MoneyField
              label="Valor total"
              value={money}
              onValueChange={setMoney}
              showCode
              hint="Un único valor total por actividad."
              required
            />
          </Example>

          <Example title="Monto de un abono">
            <MoneyField
              label="Monto del abono"
              value={50000}
              onValueChange={() => undefined}
              hint="No puede superar el saldo pendiente."
            />
          </Example>

          <Example title="Fecha de negocio">
            <DateField
              label="Fecha de la actividad"
              defaultValue="2026-11-04"
              hint="Se guarda como YYYY-MM-DD."
              required
            />
          </Example>
        </div>
      </section>
    </>
  );
}

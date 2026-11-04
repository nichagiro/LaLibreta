import { useState } from 'react';
import { Alert } from '../Alert';
import { Button } from '../Button';
import { ConfirmDialog } from '../ConfirmDialog';
import { Dialog } from '../Dialog';
import { EmptyState } from '../EmptyState';
import { MoneyField } from '../MoneyField';
import { DateField } from '../DateField';
import { Select } from '../Select';
import { Skeleton } from '../Skeleton';
import { Spinner } from '../Spinner';
import { IconPencil, IconSearch, IconTrash } from '../Icon';
import { Example, SectionHeading, SpecimenRow } from './parts';

export function FeedbackSection() {
  const [notice, setNotice] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleConfirm = () => {
    setConfirmOpen(false);
    setSaved(true);
  };

  return (
    <>
      <section>
        <SectionHeading
          title="Mensajes de éxito y error"
          description="El texto siempre está presente: el color solo refuerza el mensaje. En formulario se usa el flujo normal; en móvil, el anclado evita perder el mensaje sin desplazar."
        />

        <div className="space-y-4">
          {saved ? (
            <Alert
              variant="success"
              title="Abono registrado"
              onDismiss={() => setSaved(false)}
              action={
                <Button size="sm" variant="secondary">
                  Ver actividad
                </Button>
              }
            >
              Se abonaron $ 50.000. El saldo pendiente quedó en $ 200.000.
            </Alert>
          ) : null}

          <Alert variant="error" title="No se pudo registrar el abono">
            El monto supera el saldo pendiente de la actividad. Puedes abonar hasta $ 200.000.
          </Alert>

          <Alert variant="info" title="Sin conexión">
            Revisa tu internet y vuelve a intentar. Los cambios no se guardaron.
          </Alert>

          {notice ? (
            <Alert
              variant="success"
              title="Cliente guardado"
              onDismiss={() => setNotice(false)}
              placement="inline"
            >
              María Fernanda Ospina ya está en tu lista de clientes.
            </Alert>
          ) : null}
        </div>
      </section>

      <section>
        <SectionHeading
          title="Estados vacíos"
          description="Nombra qué falta y ofrece la salida. El vacío por filtro no es el mismo que el de no tener registros: limpiar filtros y crear el primer registro son acciones distintas."
        />

        <div className="grid gap-4 md:grid-cols-2">
          <EmptyState
            title="Todavía no tienes clientes"
            description="Crea el primer cliente para poder registrar servicios y ventas a su nombre."
            action={
              <Button variant="primary" iconStart={<IconPencil size={16} />}>
                Crear cliente
              </Button>
            }
          />

          <EmptyState
            title="Ningún cliente coincide con la búsqueda"
            description="Prueba con otro nombre, teléfono o correo, o limpia el filtro para ver todos."
            icon={<IconSearch size={20} />}
            action={
              <Button variant="secondary">Limpiar búsqueda</Button>
            }
          />
        </div>
      </section>

      <section>
        <SectionHeading
          title="Carga"
          description="Toda espera se hace visible: botón en estado de carga, spinner con etiqueta accesible y filas de esqueleto mientras llegan los datos."
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Example title="Botón y spinner">
            <SpecimenRow>
              <Button variant="primary" loading>
                Guardando…
              </Button>
              <Button variant="secondary" loading>
                Cargando clientes
              </Button>
              <span className="inline-flex items-center gap-2 text-sm text-surface-600">
                <Spinner size={16} label="Cargando resumen" />
                Cargando resumen…
              </span>
            </SpecimenRow>
            <p className="mt-3 text-[11px] text-surface-500">
              Con movimiento reducido el spinner se detiene; la etiqueta accesible es la que
              comunica el estado.
            </p>
          </Example>

          <Example title="Filas de esqueleto" note="Respeta el alto final para que la página no salte.">
            <div className="space-y-3" role="status" aria-label="Cargando actividades">
              {[0, 1, 2].map((row) => (
                <div key={row} className="flex items-center justify-between gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-52" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
          </Example>
        </div>
      </section>

      <section>
        <SectionHeading
          title="Diálogos y confirmaciones"
          description="En móvil se abren como hoja inferior hasta el 92 % de la altura, con el pie al alcance del pulgar. Gestionan foco, Escape, ciclo de Tab y bloqueo del desplazamiento."
        />

        <SpecimenRow>
          <Button variant="secondary" onClick={() => setFormOpen(true)}>
            Abrir formulario de abono
          </Button>
          <Button variant="danger" iconStart={<IconTrash size={16} />} onClick={() => setConfirmOpen(true)}>
            Cancelar actividad
          </Button>
        </SpecimenRow>

        <div className="mt-4">
          <Example title="Confirmación destructiva" note="El botón nombra la acción; no dice «Aceptar».">
            <ConfirmDialog
              open={confirmOpen}
              onCancel={() => setConfirmOpen(false)}
              onConfirm={handleConfirm}
              title="¿Cancelar esta actividad?"
              destructive
              confirmLabel="Cancelar actividad"
              cancelLabel="Volver"
              message={
                <>
                  El saldo pendiente de <strong>«Mantenimiento mensual del servidor»</strong> quedará
                  en $ 0 y dejará de contar en la cartera por cobrar. Los abonos ya recibidos se
                  conservan en el historial.
                </>
              }
            />
            <p className="text-sm text-surface-600">
              Pulsa el botón para ver la confirmación.
            </p>
          </Example>
        </div>

        <Dialog
          open={formOpen}
          onClose={() => setFormOpen(false)}
          title="Registrar abono"
          description="Mantenimiento mensual del servidor y backup · saldo pendiente $ 200.000"
          footer={
            <>
              <Button variant="secondary" onClick={() => setFormOpen(false)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={() => setFormOpen(false)}>
                Registrar abono
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <DateField label="Fecha del pago" defaultValue="2026-11-04" required />
              <Select
                label="Método de pago"
                defaultValue="nequi"
                options={[
                  { value: 'transferencia_bancaria', label: 'Transferencia bancaria' },
                  { value: 'nequi', label: 'Nequi' },
                  { value: 'daviplata', label: 'Daviplata' },
                  { value: 'efectivo', label: 'Efectivo' },
                  { value: 'tarjeta', label: 'Tarjeta' },
                  { value: 'otro', label: 'Otro' },
                ]}
                required
              />
            </div>

            <MoneyField
              label="Monto del abono"
              value={50000}
              onValueChange={() => undefined}
              showCode
              hint="No puede superar los $ 200.000 pendientes."
              required
            />

            <TextFieldNote />
          </div>
        </Dialog>
      </section>
    </>
  );
}

/** Nota auxiliar dentro del diálogo, sin necesidad de un componente extra. */
function TextFieldNote() {
  return (
    <p className="rounded-md border border-rule bg-surface-100 px-3 py-2.5 text-xs leading-relaxed text-surface-600">
      El saldo se calcula del lado del servidor. Si el monto supera lo pendiente, la aplicación
      responde con <code>OVERPAYMENT_NOT_ALLOWED</code> y el error se muestra aquí mismo.
    </p>
  );
}

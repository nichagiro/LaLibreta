# Documento de Traspaso (Handoff) de Diseño y Sistema UI

> [!NOTE]
> **DOCUMENTO HISTÓRICO - FASE DE CONSTRUCCIÓN INICIAL (Sesión 2)**  
> Este documento registra la entrega de diseño, tokens y componentes UI («La Libreta») de la fase inicial. Para la especificación activa del sistema de diseño, consulta [docs/design-system.md](file:///C:/Users/djcha/Documents/Code/Ingresos/docs/design-system.md) y [AGENTS.md](file:///C:/Users/djcha/Documents/Code/Ingresos/AGENTS.md).

> **Emitido por**: Sesión 2 (Diseño y Sistema UI)
> **Fecha**: 2026-11-04
> **Destinatarios**: Sesión 4 (Frontend e Integración), Sesión 1 (Arquitectura y Coordinación)
> **Compañero de lectura**: [docs/design-system.md](../design-system.md) — tokens, paleta, tipografía, responsividad y especificación del PDF.

---

## 1. Qué se entregó

### 1.1 Tokens y estilo (`src/theme/`)

| Archivo | Contenido |
| :--- | :--- |
| `tokens.ts` | Fuente tipada de la paleta, escala tipográfica, espaciado, radios y elevación |
| `status.ts` | Etiquetas y metadatos de estados, tipos de actividad y métodos de pago |
| `format.ts` | `formatCop`, `parseCopInput`, `formatDateEs`, `formatDateLongEs`, `formatTimestampEs` |
| `cn.ts` | `cn(...classes)` — sin librería externa, solo literales legibles por Tailwind |
| `classes.ts` | Clases compartidas de campos (`controlBase`, `controlSize`, `fieldDescribedBy`, …) |

### 1.2 Componentes (`src/components/ui/`) — 28 archivos

**Acciones y feedback**: `Button`, `Alert`, `EmptyState`, `Spinner`, `Skeleton`, `StatusChip`, `Icon` (22 iconos SVG propios).

**Formulario**: `Field`, `TextField` (+ `SearchField`), `TextArea`, `Select`, `MoneyField`, `DateField`, `SegmentedControl`, `Switch`.

**Superficie y datos**: `Panel`, `MetricCard`, `Money`, `BalanceRail`, `KeyValue`, `DataTable`, `Tabs`.

**Overlays**: `Dialog`, `ConfirmDialog`.

**Armazón**: `AppShell`, `SideNav`, `BottomNav`, `PageHeader`, `nav.ts` (`NavItem`).

### 1.3 Muestra visual (`src/components/ui/gallery/`)

10 archivos: `UiGallery` + 6 secciones (`Foundations`, `Controls`, `Feedback`, `Data`, `Screens`, `PdfReferenceSheet`) + `parts.tsx` + `fixtures.ts`.

Se abre en **`?ui=1`**. Las 7 composiciones de pantalla son referencia de estructura, no pantallas funcionales.

### 1.4 Documentación

- `docs/design-system.md` — el documento rector del sistema.
- `docs/handoffs/design.md` — este archivo.

---

## 2. Excepciones de zona (documentadas según AGENTS.md)

| Archivo | Zona normal | Motivo de la excepción |
| :--- | :--- | :--- |
| `index.html` | Sesión 1 | Carga tipográfica de Archivo (`<link>` con pesos 400/500/600/700 y `display=swap`), `theme-color #F4F6F5` y `lang="es"` ya existente. **No se tocaron scripts ni meta de sesión.** |
| `src/App.tsx` | Sesión 4 | Montaje mínimo de la galería: rama `?ui=1` con `React.lazy` + `Suspense`, y un enlace en la cabecera. **El resto del archivo quedó intacto.** Se puede revertir borrando la rama y el enlace sin efecto en el resto. |

Archivos **en mi zona**, modificados por diseño: `tailwind.config.js` (solo tokens de color, familia y sombras) y `src/index.css` (base, foco global, movimiento reducido, barra de desplazamiento).

Archivos que **no** toqué: `package.json`, `tsconfig*`, `vite.config.ts`, `.env*`, `src/types/index.ts`, `src/services/*`, `apps-script/*`, `src/features/*`.

**No se instaló ninguna dependencia nueva.** No hay librería de UI ni de iconos: todo se construyó sobre Tailwind y `react-dom` (ya presentes).

---

## 3. Decisiones visuales que Frontend debe respetar

1. **Dirección «La Libreta»**: papel y tinta, libro mayor. Sin sombras en paneles, sin degradados, sin tarjetas idénticas con sombra suave.
2. **Una sola acción primaria por pantalla** (`Button variant="primary"`), en tinta sólida.
3. **Nunca el color solo**: todo estado lleva etiqueta en español y, además, forma distinta (cuadrado = actividad, círculo = pago).
4. **`StatusChip kind="activity"` y `kind="payment"` conviven en cada fila.** No se muestran ni se filtran mezclados.
5. **Dinero siempre por `Money` / `MoneyField`**: enteros COP, `tabular-nums`, formato `es-CO`. Jamás `toLocaleString` suelto en una vista.
6. **Fechas siempre `YYYY-MM-DD` en datos y `formatDateEs` en pantalla.**
7. **Sin la palabra «Ganancia»** para cobros brutos: «Dinero Recibido» / «Total Cobrado».
8. **Sombras solo en overlays** (`Dialog`, `Alert placement="floating"`).
9. **Campos con `text-base` en móvil** para evitar el zoom de iOS: no se cambia a `text-sm` en pantallas chicas.
10. **Nada de lores de negocio en la UI**: `BalanceRail` y `Money` solo presentan lo que reciben; los saldos los calcula la capa de datos.

---

## 4. Catálogo de componentes

### 4.1 Armazón y navegación

```tsx
<AppShell
  items={navItems}          // NavItem[]: { key, label, icon, badge? }
  activeKey="activities"
  onNavigate={setActiveKey} // no hay router: quien monta decide
  brand={<div>…</div>}      // opcional
  navFooter={<span>David Chávez</span>}
>
  <PageHeader
    title="Actividades"
    description="Resumen del 1 al 30 de noviembre de 2026."
    onBack={() => navigate('home')}   // opcional
    actions={<Button variant="primary">Nueva actividad</Button>}
  >
    {/* filtros, pestañas o resumen */}
  </PageHeader>
  …
</AppShell>
```

| Componente | Props principales |
| :--- | :--- |
| `AppShell` | `items`, `activeKey`, `onNavigate`, `brand?`, `navFooter?`, `children`, `mainClassName?` |
| `SideNav` | igual que `AppShell` (se renderiza solo en `lg+`) |
| `BottomNav` | `items`, `activeKey`, `onNavigate` (área segura reservada) |
| `PageHeader` | `title`, `description?`, `onBack?`, `actions?`, `children?` |
| `Tabs` | `items: {key,label,count?,tabId?,panelId?}[]`, `value`, `onChange`, `label` |

### 4.2 Acciones y estados

| Componente | Props principales |
| :--- | :--- |
| `Button` | `variant` (`primary|secondary|ghost|danger`, por defecto `secondary`), `size` (`sm|md|lg`), `loading`, `iconStart?`, `iconEnd?`, `fullWidth?` + todas las de `<button>` |
| `StatusChip` | `kind` (`activity|payment`), `value` (`ActivityStatus | PaymentStatus`), `size` (`sm|md`) |
| `Alert` | `variant` (`success|error|info`), `title?`, `children`, `action?`, `onDismiss?`, `placement` (`inline|floating`), `role?` |
| `EmptyState` | `title`, `description?`, `action?`, `icon?` |
| `Spinner` | `size?`, `label?` (con `label` queda en `role="status"`) |
| `Skeleton` | `className?` (el contenedor padre pone `role="status"`) |

```tsx
<StatusChip kind="activity" value="completed" size="sm" />  {/* Finalizada */}
<StatusChip kind="payment"  value="partial"  size="sm" />   {/* Abono parcial */}

<Button variant="primary" loading={saving} iconStart={<IconPlus size={16} />}>
  Guardar actividad
</Button>

<Alert variant="error" title="No se pudo registrar el abono">
  El monto supera el saldo pendiente de la actividad. Puedes abonar hasta $ 200.000.
</Alert>
```

### 4.3 Formulario

| Componente | Props principales |
| :--- | :--- |
| `TextField` | `label` (obligatorio), `hint?`, `error?`, `prefix?`, `suffix?`, `iconStart?`, `clearable?`, `onClear?` + `<input>` |
| `SearchField` | mismas, con el icono de búsqueda ya puesto |
| `TextArea` | `label`, `hint?`, `error?`, `rows` (4), + `<textarea>` |
| `Select` | `label`, `hint?`, `error?`, `options: {value,label,disabled?}[]`, `placeholder?`, + `<select>` nativo |
| `MoneyField` | `label`, `value: number | null`, `onValueChange(v)`, `hint?`, `error?`, `showCode?` |
| `DateField` | `label`, `hint?`, `error?` + `<input type="date">` |
| `SegmentedControl` | `name`, `value`, `options: {value,label,icon?}[]`, `onChange`, `legend`, `showLegend?`, `size?`, `fullWidth?` |
| `Switch` | `checked`, `onChange(bool)`, `label`, `description?` |
| `Field` | `id`, `label`, `hint?`, `error?`, `required?`, `children` — solo si se compone un control a mano |

```tsx
<MoneyField
  label="Valor total"
  value={totalValue}              // number | null
  onValueChange={setTotalValue}   // siempre entero COP o null
  showCode
  hint="Un único valor total por actividad."
  required
/>

<SegmentedControl
  name="activity-type"
  legend="Tipo de actividad"
  showLegend
  value={type}
  onChange={setType}
  options={[
    { value: 'service', label: 'Servicio' },
    { value: 'sale', label: 'Venta' },
  ]}
/>
```

> `SearchField` solo muestra el botón de limpiar si recibe `value` controlado **y** `onClear`.

### 4.4 Datos e indicadores

| Componente | Props principales |
| :--- | :--- |
| `Money` | `value: number | null`, `tone` (`default|received|owed|muted`), `emphasis` (`hero|display|strong|normal`), `showCode?`, `fallback?` |
| `MetricCard` | `label`, `value`, `tone?`, `detail?`, `footer?` |
| `BalanceRail` | `total`, `received`, `pending`, `cancelled?`, `receivedLabel?`, `pendingLabel?`, `size?`, `showAmounts?` |
| `Panel` | `title?`, `description?`, `actions?`, `padding` (`default|flush`), `children` |
| `KeyValue` | `items: {label,value}[]`, `layout` (`inline|stacked`) |
| `DataTable` | ver abajo |

`DataTable<T>`:

```tsx
interface DataColumn<T> {
  key: string;
  header: string;
  cell: (row: T, index: number) => ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
  mobileLabel?: string;      // etiqueta en la vista apilada
  hideMobileLabel?: boolean; // cuando la celda ya trae su rótulo
  primary?: boolean;         // columna título de la fila apilada
}

<DataTable
  columns={columns}
  rows={rows}
  getRowKey={(row) => row.id}
  caption="Listado de actividades"
  onRowClick={(row) => openDetail(row.id)}
  rowClassName={(row) => (row.status === 'cancelled' ? 'opacity-60' : undefined)}
  loading={loading}
  emptyState={<EmptyState title="…" action={…} />}
/>
```

En `md+` renderiza tabla real; por debajo apila cada registro. Si hay `onRowClick`, la celda título se envuelve en un **botón real** para teclado y lector de pantalla.

### 4.5 Overlays

| Componente | Props principales |
| :--- | :--- |
| `Dialog` | `open`, `onClose`, `title`, `description?`, `footer?`, `size` (`md|lg`), `dismissOnBackdrop?` (true), `children` |
| `ConfirmDialog` | `open`, `onCancel`, `onConfirm`, `title`, `message`, `confirmLabel?`, `cancelLabel?`, `destructive?`, `loading?` |

```tsx
<ConfirmDialog
  open={confirmOpen}
  onCancel={() => setConfirmOpen(false)}
  onConfirm={handleCancelActivity}
  title="¿Cancelar esta actividad?"
  message={<>El saldo pendiente de «{activity.title}» quedará en $ 0 …</>}
  confirmLabel="Cancelar actividad"   // nombra la acción, nunca «Aceptar»
  cancelLabel="Volver"
  destructive
  loading={mutating}
/>
```

> `Dialog` ya gestiona foco, `Escape`, ciclo de `Tab` y bloqueo de scroll. Si el formulario tiene cambios sin guardar, pasa `dismissOnBackdrop={false}`.

### 4.6 Utilidades de `src/theme/`

```ts
import { cn } from '@/theme/cn';
import { formatCop, parseCopInput, formatDateEs } from '@/theme/format';
import {
  ACTIVITY_STATUS_META, ACTIVITY_STATUS_ORDER,
  PAYMENT_STATUS_META,  PAYMENT_STATUS_ORDER,
  ACTIVITY_TYPE_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_METHOD_ORDER,
} from '@/theme/status';
import { colors, typography, spacing, radii, elevation } from '@/theme/tokens';
```

- **No** replicar etiquetas de estado en las vistas: siempre salen de `status.ts`.
- `PAYMENT_METHOD_ORDER` da el orden del selector de método de pago.
- `ACTIVITY_STATUS_ORDER` / `PAYMENT_STATUS_ORDER` dan el orden de filtros (no alfabético).

---

## 5. Verificaciones ejecutadas

Se corrieron los tres comandos mandatorios de `AGENTS.md` **antes y después** de los cambios:

| Paso | `npm run typecheck` | `npm run lint` | `npm run build` |
| :--- | :--- | :--- | :--- |
| Baseline (sin cambios) | ✅ | ✅ | — |
| Después de tokens, componentes y galería | ✅ | ✅ | ✅ |
| Después del montaje en `App.tsx` | ✅ | ✅ | ✅ |

Resultado final del build:

```
dist/index.html                 1.17 kB
dist/assets/index-*.css        26.14 kB │ gzip 5.65 kB
dist/assets/index-*.js        149.96 kB │ gzip 48.49 kB   ← app
dist/assets/UiGallery-*.js     89.64 kB │ gzip 23.25 kB   ← solo con ?ui=1
```

La galería queda en un chunk aparte por `React.lazy`: **no pesa en el bundle de producción de la app**.

### Verificado vs. pendiente de revisión visual

**Verificado automáticamente**: tipos, reglas de ESLint (con `--max-warnings 0`), compilación estática, URL de la fuente Archivo (respuesta 200 con los 4 pesos).

**Pendiente de revisión visual humana** (no se pudo comprobar ejecutando un navegador en esta sesión):

- Contraste real de los pares de color en pantalla (especialmente `surface-500` sobre `panel` en texto de 11–12 px).
- Comportamiento de zoom de iOS al enfocar campos.
- Navegación por teclado completa de la galería y de `Dialog`.
- Renderizado de la hoja A4 en el motor de PDF que elija Frontend.
- Ajuste fino de densidad en listados con 20+ registros.

La galería está diseñada exactamente para esa revisión: ábrela en `?ui=1` y pasa las 6 secciones.

---

## 6. Pendientes para la Sesión 4 (Frontend)

1. **Construir las pantallas** en `src/features/*` componiendo estos elementos. Las 7 composiciones de `ScreensSection` son la referencia de estructura.
2. **Generar el PDF**: la especificación visual está en `docs/design-system.md` §9 y la maqueta en `PdfReferenceSheet`. Aquí no se creó ni se descargó ningún archivo. Restricciones: sin `internal_notes`, sin tabla de conceptos, sin mención a la DIAN.
3. **Montar el host de mensajes** de la app: `Alert placement="floating"` está listo, pero quién lo gestiona (estado global, cola) es decisión de Frontend.
4. **Conectar datos**: `fixtures.ts` es solo presentación; los datos reales vienen de `sheets-api`.
5. **Reglas de negocio** (saldos, sobrepagos, saldo 0 en canceladas): ninguna vive en la UI. Los componentes solo presentan lo que reciben.

---

## 7. Notas y observaciones fuera de mi zona

- **No tocado, pero conviene revisar**: en la raíz del repositorio hay `vite.config.js` y `vite.config.d.ts` compilados junto a `vite.config.ts`. Parecen artefactos de una ejecución previa de `tsc` y están en la zona de la Sesión 1. No los modifiqué.
- `AGENTS.md` referencia las skills en `.agents/skills/`, pero en este entorno las skills `frontend-design` y `vercel-react-best-practices` estaban disponibles directamente en el entorno de OpenCode y se consultaron desde ahí. No se instaló ni se modificó nada para ello.
- La rama `?ui=1` de `App.tsx` es prescindible: si la Sesión 4 preiere quitarla, basta con eliminar la constante `UiGallery`, la función `galleryRequested`, el bloque `if` y el enlace de la cabecera.

---

## 8. Convocatoria

- Cualquier cambio en `tailwind.config.js`, `src/index.css` o `src/theme/*` debe pasar por la Sesión 2: son la fuente de verdad del sistema.
- Cualquier nuevo componente de UI se agrega a `src/components/ui/` y se documenta en `docs/design-system.md` y aquí.
- Nueva dependencia o cambio en `src/types/index.ts`: coordinar con la Sesión 1.

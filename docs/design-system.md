# Sistema de Diseño «La Libreta»

> **Emitido por**: Sesión 2 (Diseño y Sistema UI)
> **Fecha**: 2026-11-04
> **Destinatarios**: Sesión 4 (Frontend e Integración) y cualquier sesión que necesite construir interfaz.
> **Fuente de verdad de los valores**: `src/theme/tokens.ts` (tipado) y `tailwind.config.js` (clases).

---

## 1. Principio rector

La aplicación es **un cuaderno de cuentas**: el análogo físico del talonario de recibos del trabajador independiente. Papel frío, tinta casi negra, reglas finas que ordenan la información y cifras alineadas en columna.

De ese análogo salen tres reglas:

1. **El cromo es papel y tinta.** Ningún color se usa decorativamente, sin importar cuánto "embellezca" un bloque.
2. **El color tiene significado financiero, nada más.** Verde/naranja hablan de dinero; azul/tinta hablan del progreso del trabajo; gris habla de algo cancelado o archivado.
3. **La jerarquía la dan el borde y el espacio, no la sombra.** Los paneles llevan borde hairline y ninguna sombra. La sombra existe únicamente en los overlays (diálogos y hojas).

Esto descarta explícitamente la estética genérica de "tarjetas con la misma sombra suave, esquinas muy redondeadas y degradados".

---

## 2. Color

### 2.1 Paleta base

| Token Tailwind | Hex | Rol |
| :--- | :--- | :--- |
| `paper` | `#F4F6F5` | Fondo de página. Papel frío, deliberadamente no crema. |
| `panel` | `#FFFFFF` | Superficie elevada. Borde hairline, sin sombra. |
| `ink` | `#121716` | Texto primario **y acción primaria sólida**. |
| `accent` | `#2C5C8F` | Foco, enlaces y navegación activa. |

### 2.2 Reglas (estructura informativa, no decoración)

| Token | Hex | Uso |
| :--- | :--- | :--- |
| `rule-subtle` | `#EAEFED` | Separadores internos de una lista (`divide-y`). |
| `rule` | `#DBE2E0` | Borde de panel, borde de tabla, separadores de fila. |
| `rule-strong` | `#C2CCC9` | Borde en reposo de botones secundarios y campos. |

### 2.3 Ejes semánticos

**Eje 1 · Estado de actividad (progreso del trabajo) → azul/tinta**

| Token | Hex | Uso |
| :--- | :--- | :--- |
| `activity-pending` | `#5F6C67` | Pendiente |
| `activity-progress` | `#2C5C8F` | En proceso |
| `activity-done` | `#16406B` | Finalizada |
| `activity-cancelled` | `#6B7280` | Cancelada |

**Eje 2 · Estado de pago (dinero) → verde/naranja**

| Token | Hex | Uso |
| :--- | :--- | :--- |
| `received` | `#0E6E58` | Dinero recibido / actividad pagada |
| `received-tint` | `#E3F1ED` | Fondo de chip y mensaje de dinero recibido |
| `received-hover` | `#0A5A46` | Hover del botón de peligro secundario y enlaces de dinero |
| `owed` | `#A6511C` | Saldo pendiente / abono parcial |
| `owed-tint` | `#FAEBE0` | Fondo de chip pendiente y mensajes de error |
| `owed-hover` | `#8A4316` | Hover del botón destructivo |

**Eje neutro · Cancelado / archivado**

| Token | Hex | Uso |
| :--- | :--- | :--- |
| `cancelled` | `#6B7280` | Estado cancelado o registro archivado |
| `cancelled-tint` | `#ECEFEE` | Su fondo |

### 2.4 Escala neutra (texto y superficies)

`surface-50 #F4F6F5` · `surface-100 #EAEFED` · `surface-200 #DBE2E0` · `surface-300 #C2CCC9` · `surface-500 #5F6C67` · `surface-600 #4A5652` · `surface-800 #262E2C` · `surface-900 #121716`

- `surface-500`: metadatos, etiquetas y texto atenuado.
- `surface-600`: texto secundario de cuerpo.
- `surface-800` / `surface-900`: estados hover y active de la acción primaria.

### 2.5 Aliases de compatibilidad

Se mantienen para no romper la base técnica existente (`App.tsx`, `index.html`):

- `brand` = `#121716` (hover `#262E2C`, subtle `#EAEFED`)
- `finance.received` = `#0E6E58` · `finance.pending` = `#A6511C` · `finance.cancelled` = `#6B7280`
- `surface.50 … surface.900` con los mismos valores de la escala neutra

### 2.6 Variables CSS

Para CSS fuera de Tailwind (hoja de referencia del PDF, estilos propios), `src/index.css` expone:

```css
--ui-paper, --ui-panel, --ui-ink, --ui-accent, --ui-rule,
--ui-received, --ui-owed, --ui-cancelled
```

Deben mantenerse en sincronía con `tailwind.config.js` y `src/theme/tokens.ts` si cambia algún valor.

---

## 3. Tipografía

**Familia única: Archivo** (Omnibus-Type), cargada por `<link>` en `index.html` con `display=swap` y pesos 400/500/600/700. Sin segunda tipografía: la jerarquía la dan el peso y el tamaño.

- Base de `body`: **14 px / 1.5 rem**, `font-synthesis-weight: none`, antialiasing.
- **No** se usa fuente monoespaciada para las cifras: se usa `tabular-nums` (`font-variant-numeric`), activado además en `input[inputmode='numeric']` e `input[type='date']`.

### Escala

| Token | Clase | Tamaño | Peso | Uso |
| :--- | :--- | :--- | :--- | :--- |
| `display` | `text-3xl md:text-4xl` | 30 / 36 px | 600 | Saldo o cifra principal |
| `h1` | `text-2xl md:text-3xl` | 24 / 30 px | 600 | Título de página |
| `h2` | `text-base md:text-lg` | 16 / 18 px | 600 | Título de sección |
| `h3` | `text-sm md:text-base` | 14 / 16 px | 600 | Título de fila o bloque |
| `body` | `text-sm` | 14 px | 400 | Cuerpo, máximo 80 caracteres |
| `meta` | `text-xs` | 12 px | 500 | Metadatos y etiquetas en *sentence case* |

### Cifras (`Money`)

| `emphasis` | Clase | Uso |
| :--- | :--- | :--- |
| `hero` | `text-3xl md:text-4xl` 600 | Cifra de pantalla de resumen |
| `display` | `text-2xl md:text-3xl` 600 | Cifra dentro de una tarjeta de indicador |
| `strong` | `text-sm md:text-base` 600 | Cifra en fila, bajo la barra de saldo |
| `normal` | `text-sm` 500 | Cifra en columna de tabla |

Todas llevan `tabular-nums` y el formato `es-CO` sin decimales: `$ 180.000`.

### Reglas de texto

- Etiquetas y encabezados en *sentence case*; **nunca** versalitas decorativas.
- Los títulos de sección no usan color: solo peso y tamaño.
- Texto corrido limitado a `max-w-prose` (≈ 80 caracteres).

---

## 4. Espaciado, radios y elevación

Grilla de **4 px** (escala Tailwind). Ningún valor fuera de esa grilla.

| Concepto | Valor |
| :--- | :--- |
| Margen de página | `px-4 md:px-6 lg:px-8` |
| Separación de sección | `space-y-6 lg:space-y-8` |
| Ancho de contenido | `max-w-6xl` |
| Fila de lista | `py-3` (densa, pero target táctil ≥ 44 px) |

### Radios jerárquicos (no hay un único radio)

| Nivel | Valor | Uso |
| :--- | :--- | :--- |
| Fila | `rounded-none` (0) | Filas de lista y separadores: el aspecto de libro mayor |
| Sello | `rounded-sm` (2 px) | Chips de estado y marcas (aspecto de sello) |
| Control | `rounded-md` (6 px) | Botones, campos, selectores, segmentados |
| Panel | `rounded-lg` (8 px) | Paneles, tarjetas de indicador, diálogos |

### Elevación

| Token | Valor | Uso |
| :--- | :--- | :--- |
| `shadow-dialog` | `0 20px 48px rgba(18,23,22,0.18)` | Diálogo centrado en escritorio |
| `shadow-sheet` | `0 -8px 28px rgba(18,23,22,0.14)` | Hoja inferior en móvil, alerta flotante |

**Los paneles jamás usan sombra.** Si un bloque necesita resaltarse, se usa borde `rule-strong`, no sombra.

---

## 5. Estados interactivos

### 5.1 Foco (global)

```css
:where(a, button, input, select, textarea, summary, [tabindex]):focus-visible {
  outline: 2px solid var(--ui-accent);
  outline-offset: 2px;
}
```

`:where()` deja la especificidad en cero, así que cualquier utilidad de Tailwind puede sobreescribirlo sin pelear. Los componentes construidos sobre inputs nativos heredan este anillo sin código adicional; `SegmentedControl`, `Switch` y `Tabs` lo replican con `peer-focus-visible:ring-2 ring-accent`.

### 5.2 Movimiento reducido

Bloque global en `src/index.css`: con `prefers-reduced-motion: reduce` se anulan animaciones y transiciones. Por eso:

- `Spinner` **necesita** `label` cuando informa un estado: con movimiento reducido se detiene y solo el texto comunica la carga.
- `Skeleton` queda como superficie plana pero conserva su hueco de diseño (la página no salta).

### 5.3 Botones

| Variante | Aspecto | Uso |
| :--- | :--- | :--- |
| `primary` | Sólido `ink`, texto blanco | **Una sola por pantalla.** Acción principal |
| `secondary` | Panel + borde `rule-strong` | Acciones secundarias |
| `ghost` | Sin borde, texto `surface-600` | Acciones de baja prioridad |
| `danger` | Sólido `owed` | Acciones con consecuencia (cancelar actividad) |

| Tamaño | Alto | Uso |
| :--- | :--- | :--- |
| `sm` | 36 px | Filas densas de escritorio |
| `md` | 44 px | Uso general (target táctil mínimo) |
| `lg` | 48 px | Acciones primarias en móvil, `fullWidth` |

- `type` por defecto `button`: en un formulario hay que declarar `type="submit"` explícito.
- `loading` reemplaza el icono inicial, conserva la etiqueta (el ancho no salta) y pone `aria-busy`.
- Hover/active bajan un paso dentro de la misma familia (`bg-surface-800` → `bg-surface-900`), nunca cambian de color.

### 5.4 Campos

- Contenedor: `h-11` (44 px), borde `rule` en reposo, `rule-strong` en hover, `panel` de fondo.
- **`text-base` (16 px) en móvil, `md:text-sm` (14 px) en escritorio**: evita el zoom automático de iOS al enfocar y mantiene densidad en escritorio.
- El foco lo dibuja el anillo global; no hay anillo propio para no duplicarlo.
- Error: borde `owed` **+ mensaje con icono asociado por `aria-describedby`**. El color nunca actúa solo.
- Etiqueta visible siempre, asociada por `htmlFor`/`id`. El `*` obligatorio se anuncia como «(obligatorio)» mediante `sr-only`.
- `MoneyField`: el `$` es un adorno fijo fuera del `input`; dentro solo hay cifras agrupadas, así el cursor nunca salta. Sale siempre `number | null` en enteros COP.
- `Select`: **nativo** por decisión. En celular abre el picker del sistema, más rápido y accesible que cualquier lista construida a mano.

### 5.5 Superficies

| Componente | Aspecto |
| :--- | :--- |
| `Panel` | `bg-panel` + `border-rule` + `rounded-lg`, **sin sombra**. `padding="flush"` para listas y tablas |
| `MetricCard` | Igual que `Panel`, con rótulo atenuado arriba y cifra `display` |
| `EmptyState` | `Panel` centrado, icono en cuadro `surface-100`, título + salida concreta |
| `Alert` | Tinte del eje correspondiente + icono + **texto siempre presente** |
| `Dialog` | Sombra reservada a overlays |

---

## 6. Vocabulario de estados (la distinción crítica)

**El estado de actividad y el estado de pago nunca se confunden.** Son dos ejes, y se distinguen por cuatro canales a la vez:

| | Estado de **actividad** | Estado de **pago** |
| :--- | :--- | :--- |
| Significado | Progreso del trabajo | Dinero |
| Contorno vs. relleno | **Contorneado** (transparente) | **Relleno** (tinte) |
| Marcador | **Cuadrado** ● cuadrado | **Círculo** ● círculo |
| Familia | Azul / tinta | Verde / naranja |

Etiquetas en español (`src/theme/status.ts`):

| `ActivityStatus` | Chip | `PaymentStatus` | Chip |
| :--- | :--- | :--- | :--- |
| `pending` | Pendiente | `pending` | Sin abonos |
| `in_progress` | En proceso | `partial` | Abono parcial |
| `completed` | Finalizada | `paid` | Pagado |
| `cancelled` | Cancelada | — | — |

Reglas derivadas:

- Un listado de actividades muestra **los dos chips juntos**: una actividad puede estar *Finalizada* y con *Abono parcial*.
- Nunca se usa solo color: cada chip lleva etiqueta y forma distintas, legibles en escala de grises.
- Los dos ejes se filtran **por separado** en los filtros de listado.
- Los textos de UI jamás usan la palabra «Ganancia» para cobros brutos: se usa **Dinero Recibido** o **Total Cobrado**.

---

## 7. Estructura de pantalla y comportamiento responsivo

Breakpoints de Tailwind: `sm 640` · `md 768` · `lg 1024`.

### 7.1 Navegación (`AppShell`)

- **`lg` en adelante**: `SideNav` fijo de 240 px (`w-60`) a la izquierda. Destino activo con regla de acento a la izquierda **y** `aria-current="page"`.
- **Por debajo de `lg`**: `BottomNav` fijo con `pb-[env(safe-area-inset-bottom)]`, para que el último ítem no quede bajo la barra del teléfono. Activo con regla superior y `aria-current="page"`.
- No hay router dentro del shell: la navegación se pasa como `activeKey` / `onNavigate`. Quien monta el shell decide cómo cambiar de vista. La aplicación monta `src/router.ts`, un ruteo por hash sin dependencias (`#/inicio`, `#/actividades`, `#/clientes`, `#/configuracion`), de modo que `AppShell` permanece agnóstico.

### 7.2 Cabecera de página (`PageHeader`)

- `h1` a la izquierda, acciones a la derecha en escritorio; en móvil las acciones caen a una segunda línea (`flex-wrap`) para no comprimir el título.
- Bajada limitada a `max-w-prose`.
- `onBack` muestra un botón de 36 px con `aria-label="Volver"`.

### 7.3 Listados (`DataTable`)

- **`md` en adelante**: tabla real con `<thead>`, `scope="col"` y `caption` accesible.
- **Por debajo de `md`**: cada registro se apila en una `<ul>`: columna título arriba, columnas `align: 'right'` a la derecha, metadatos debajo en `text-xs`.
- `primary: true` marca la columna título; si hay `onRowClick`, esa celda se envuelve en un **botón real** para que teclado y lector de pantalla puedan activar la fila.
- Tres estados distintos: `loading` (esqueletos), vacío por falta de registros (`emptyState` con acción de crear) y vacío por filtro (que el llamador resuelve con «limpiar filtros»).

### 7.4 Overlays (`Dialog`)

- **Móvil**: hoja inferior, `max-h-[92vh]`, `rounded-t-lg`, sombra `sheet`; el pie queda al alcance del pulgar.
- **`sm` en adelante**: centrado, `shadow-dialog`, `max-w-lg` (`size="md"`) o `max-w-2xl` (`size="lg"`).
- Gestiona foco inicial, devolución del foco al cerrar, ciclo de `Tab`, `Escape` y bloqueo del desplazamiento del `body`.
- `dismissOnBackdrop={false}` cuando el formulario tiene cambios sin guardar.

### 7.5 Barra de saldo (`BalanceRail`) — elemento firma

- Proporción calculada **solo** a partir de los montos que recibe; nunca deriva saldos.
- Bajo la barra siempre están las dos cifras etiquetadas y con punto de color: el dato se lee aunque no se distingan los colores.
- En actividad cancelada el resto se pinta en **gris**, no en ámbar.
- El contenedor es `role="img"` con `aria-label` que enuncia las tres cifras.

### 7.6 Accesibilidad transversal

- Target táctil mínimo 44 px en todo control interactivo principal.
- Foco visible siempre (anillo global), nunca `outline: none`.
- `role="status"` para avisos no urgentes, `role="alert"` para errores.
- `aria-invalid` + `aria-describedby` en campos con error.
- `Tabs` implementa el patrón ARIA completo: `tablist`/`tab`, `aria-selected`, flechas + `Home`/`End`.
- `SegmentedControl` son radios nativos dentro de `fieldset`: el teclado ya navega con flechas.
- Toda espera es visible: `Button loading`, `Spinner` con etiqueta, `Skeleton` con `role="status"` en el contenedor.
- Selección de texto con `background: #cfe0f3`.

---

## 8. Contenido de muestra

La galería usa datos realistas en español (nada de *lorem ipsum*) en `src/components/ui/gallery/fixtures.ts`: clientes como «María Fernanda Ospina» y «Panadería La Esquina S.A.S.», actividades como «Tienda en línea con catálogo de 12 artículos», montos en enteros COP y fechas `YYYY-MM-DD` del período 1–30 de noviembre de 2026.

Son datos de **presentación exclusivamente**: no se leen de Sheets ni alimentan reglas de negocio.

---

## 9. Referencia del comprobante PDF

Especificación visual entregada a Frontend (la generación real es suya; aquí no se descarga nada):

| Elemento | Especificación |
| :--- | :--- |
| Página | A4 (210 × 297 mm), fondo blanco, márgenes de 40 px |
| Título de la actividad | 16 px · peso 600 |
| Nombre del emisor | 15 px · peso 600 |
| Cifras destacadas | 16 px · peso 600 · numerales tabulares |
| Cuerpo y descripción | 12 px · interlínea 1.6 |
| Metadatos y pie | 10–11 px · color atenuado |
| Separadores | Reglas de 1 px; pie y total con 2 px |
| Moneda | Siempre enteros COP: `$ 180.000` |

**Va**: datos del emisor, código de referencia y fecha, cliente, fecha/tipo/categoría, título y descripción libre, valor total + dinero recibido + saldo pendiente, lista de abonos con fecha y método, observaciones públicas, instrucciones de pago y leyenda de pie.

**Nunca va**: notas internas, tabla de conceptos ni desglose de ítems, notas de margen, etiquetas o formato de factura electrónica, cualquier mención de validación ante la DIAN, identificadores internos (`act_…`, `cli_…`).

Leyenda de pie, sin mención de la DIAN:

> Este documento resume un servicio prestado y los pagos recibidos. No es una factura.

La representación en HTML/CSS está en `src/components/ui/gallery/PdfReferenceSheet.tsx`.

---

## 10. Cómo consultar este sistema en vivo

```bash
npm run dev
# abrir http://localhost:5173/?ui=1
```

La galería (`src/components/ui/gallery/`) tiene seis secciones: Fundamentos, Controles, Estados y mensajes, Datos e indicadores, Pantallas (las siete composiciones de referencia) y Referencia PDF. Se carga con `React.lazy`, así que su código no entra al bundle de la aplicación.

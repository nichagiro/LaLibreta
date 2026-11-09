# Control de Ingresos para Trabajador Independiente

Aplicación web personal y ligera para registrar y controlar las actividades económicas de un trabajador independiente (servicios y ventas), sus clientes, pagos, saldos pendientes y emisión de comprobantes en PDF para envío manual vía WhatsApp.

---

## Características Principales

- **Frontend Estático (SPA)**: Desarrollado con **React 18 + Vite 5 + TypeScript 5 + Tailwind CSS**.
- **Persistencia Flexible (Dual-Mode)**:
  - **Modo Demostración / Pruebas (En Memoria)**: Permite evaluar todos los flujos de la aplicación al instante sin requerir configuración previa en Google.
  - **Modo Producción (Google Sheets)**: Persistencia en una hoja de cálculo privada mediante una Web App en **Google Apps Script** sin servidores intermedios.
- **Finanzas Claras y Rigurosas**:
  - Moneda única en pesos colombianos (**COP**) representada como números enteros.
  - Cálculo autoritativo de saldos pendientes y abonos recibidos.
  - Validación de no-sobrepagos y ajuste de saldo a $0 COP en actividades canceladas (conservando abonos históricos).
  - Prohibición estricta del término "Ganancia" en la interfaz: se usa "Dinero Recibido" o "Total Cobrado".
- **Emisión de Comprobantes PDF**:
  - Generación 100% en el navegador con `pdf-lib` (sin librerías pesadas en el bundle inicial gracias a *code splitting*).
  - Exclusión garantizada de notas internas y datos privados del trabajador independiente.
  - Formato A4 multipágina listo para descargar y compartir manualmente.
- **Sistema de Diseño «La Libreta»**: Estética inspirada en un libro mayor contable (papel frío `#F4F6F5`, tinta sólida `#121716`, bordes finos, chips de estado diferenciados y numerales tabulares). Galería visual accesible en `?ui=1`.

---

## Requisitos Previos

- **Node.js**: Versión `>= 20.0.0` (verificado en Node `24.x`).
- **NPM**: Versión `>= 10.x`.
- Una cuenta de Google con acceso a Google Drive y Google Sheets (requerida únicamente para el modo de persistencia real).

---

## Configuración y Puesta en Marcha

### 1. Clonar o acceder al repositorio
```bash
cd C:\Users\djcha\Documents\Code\Ingresos
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno (Opcional para modo demostración)
Copia la plantilla de entorno:
```bash
# En Windows PowerShell:
Copy-Item .env.example .env

# O en Bash / Linux / macOS:
cp .env.example .env
```

El archivo [`.env.example`](file:///C:/Users/djcha/Documents/Code/Ingresos/.env.example) contiene la estructura requerida:
```env
VITE_DATA_SOURCE=sheets
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/TU_SCRIPT_ID/exec
VITE_APP_AUTH_TOKEN=tu_clave_de_acceso_personal_aqui
VITE_APP_TITLE="Control de Ingresos"
VITE_DEFAULT_CURRENCY=COP
VITE_TIMEZONE=America/Bogota
```

> [!NOTE]
> El origen de datos lo decide únicamente `VITE_DATA_SOURCE`: `sheets` (o cualquier valor omitido/desconocido) usa la Web App de Google Apps Script real, y `mock` usa el adaptador en memoria con datos de muestra. No existe detección ni conmutación automática en runtime: si eliges `sheets` sin URL/token válidos verás errores de configuración, nunca datos de prueba. El valor se compila en el bundle; cambiarlo exige reconstruir la aplicación.

### 4. Iniciar en modo desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:5173`. Para explorar el catálogo visual de componentes, ingresa a `http://localhost:5173/?ui=1`.

---

## Comandos Disponibles

Todos los comandos han sido verificados y son ejecutables en el entorno:

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo local de Vite. |
| `npm run build` | Compila TypeScript y genera el bundle estático de producción en `dist/`. |
| `npm run preview` | Sirve localmente los archivos compilados en `dist/` para validación previa. |
| `npm run typecheck` | Ejecuta la comprobación estricta de tipos con `tsc --noEmit`. |
| `npm run lint` | Ejecuta el análisis estático de código con ESLint (`--max-warnings 0`). |
| `npm run test` | Ejecuta la suite completa de pruebas automatizadas (backend y frontend). |
| `npm run test:backend` | Ejecuta las pruebas del script de Apps Script con dobles de Google Sheets. |
| `npm run test:frontend` | Ejecuta las pruebas de integración del frontend y generación de PDF. |

---

## Estructura de Documentación Técnica

La documentación del proyecto se encuentra en la carpeta [`docs/`](file:///C:/Users/djcha/Documents/Code/Ingresos/docs/):

- **Gobernanza y Mantenimiento**:
  - [AGENTS.md](file:///C:/Users/djcha/Documents/Code/Ingresos/AGENTS.md): Guía de mantenimiento, convenciones, seguridad y reglas de evolución.
  - [docs/scope.md](file:///C:/Users/djcha/Documents/Code/Ingresos/docs/scope.md): Alcance funcional detallado y límites explícitos (Out of Scope).
- **Arquitectura y Persistencia**:
  - [docs/architecture.md](file:///C:/Users/djcha/Documents/Code/Ingresos/docs/architecture.md): Arquitectura de software, flujo de datos, límites y seguridad.
  - [docs/api-contract.md](file:///C:/Users/djcha/Documents/Code/Ingresos/docs/api-contract.md): Contrato canónico de acciones, payloads y respuestas JSON.
  - [docs/data-model.md](file:///C:/Users/djcha/Documents/Code/Ingresos/docs/data-model.md): Esquema de pestañas, columnas y reglas de modificación de Google Sheets.
  - [docs/backend-setup.md](file:///C:/Users/djcha/Documents/Code/Ingresos/docs/backend-setup.md): Instrucciones para desplegar Google Apps Script en la hoja privada del propietario.
  - [apps-script/README.md](file:///C:/Users/djcha/Documents/Code/Ingresos/apps-script/README.md): Guía rápida de publicación del script en Apps Script.
- **Diseño**:
  - [docs/design-system.md](file:///C:/Users/djcha/Documents/Code/Ingresos/docs/design-system.md): Sistema de diseño «La Libreta», tokens, paleta y tipografía.
- **Historial de Construcción (Handoffs)**:
  - Los documentos en [`docs/handoffs/`](file:///C:/Users/djcha/Documents/Code/Ingresos/docs/handoffs/) contienen el registro histórico de las sesiones de construcción inicial.

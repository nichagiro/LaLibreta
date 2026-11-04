# Control de Ingresos para Trabajador Independiente

Aplicación web personal y ligera para registrar y controlar las actividades económicas de un trabajador independiente (servicios y ventas), sus clientes, pagos, saldos pendientes y emisión de comprobantes en PDF para envío manual vía WhatsApp.

---

## Características Principales

- **Frontend Estático (SPA)**: Desarrollado con **React 18 + Vite + TypeScript + Tailwind CSS**.
- **Persistencia Directa y Privada**: Conexión a **Google Sheets** a través de una Web App de Google Apps Script.
- **Seguridad**: La hoja de cálculo permanece privada y no se exponen credenciales privadas de Google en el cliente. El token de `VITE_*` sí es visible en el bundle y no constituye un secreto robusto; consulta la limitación en [docs/backend-setup.md](file:///C:/Users/djcha/Documents/Code/Ingresos/docs/backend-setup.md).
- **Finanzas Claras**: Moneda COP (en números enteros sin coma flotante), cálculo autoritativo de saldos, control de sobrepagos y gestión de cancelaciones sin generar cobros futuros.
- **Generación de PDF**: Creación en el navegador del resumen para envío manual.

---

## Requisitos Previos

- **Node.js**: Versión `>= 20.0.0` (recomendado Node `22.x` o `24.x`).
- **NPM**: Versión `>= 10.x`.
- Una cuenta de Google con acceso a Google Drive y Google Sheets.

---

## Configuración y Puesta en Marcha

### 1. Clonar o ingresar al proyecto
```bash
cd C:\Users\djcha\Documents\Code\Ingresos
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env` a partir de `.env.example`:
```bash
cp .env.example .env
```
Edita `.env` con los valores de tu Web App de Google Apps Script:
```env
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/TU_SCRIPT_ID/exec
VITE_APP_AUTH_TOKEN=tu_clave_de_acceso_personal_aqui
VITE_APP_TITLE="Control de Ingresos"
VITE_DEFAULT_CURRENCY=COP
VITE_TIMEZONE=America/Bogota
```

*(Consulta la [Guía de Google Apps Script](file:///C:/Users/djcha/Documents/Code/Ingresos/apps-script/README.md) para publicar la Web App en tu hoja de Google Sheets).*

### 4. Iniciar en modo desarrollo
```bash
npm run dev
```
La aplicación abrirá en `http://localhost:5173`.

---

## Comandos Disponibles

- `npm run dev`: Inicia el servidor local de desarrollo de Vite.
- `npm run build`: Comprueba tipos y compila la aplicación estática en `dist/`.
- `npm run typecheck`: Ejecuta la verificación estricta de tipos de TypeScript sin emitir archivos.
- `npm run lint`: Ejecuta el linter con ESLint.
- `npm run preview`: Sirve localmente los archivos compilados de `dist/`.

---

## Documentación Técnica y Gobernanza

- [AGENTS.md](file:///C:/Users/djcha/Documents/Code/Ingresos/AGENTS.md): Reglas de colaboración entre las 4 sesiones de desarrollo.
- [docs/scope.md](file:///C:/Users/djcha/Documents/Code/Ingresos/docs/scope.md): Alcance funcional detallado y exclusiones (Out of Scope).
- [docs/architecture.md](file:///C:/Users/djcha/Documents/Code/Ingresos/docs/architecture.md): Arquitectura de software, flujo de datos y seguridad.
- [docs/api-contract.md](file:///C:/Users/djcha/Documents/Code/Ingresos/docs/api-contract.md): Contrato de acciones y respuestas de la API.
- [docs/data-model.md](file:///C:/Users/djcha/Documents/Code/Ingresos/docs/data-model.md): Esquema de pestañas y columnas de Google Sheets.
- [docs/handoffs/architecture.md](file:///C:/Users/djcha/Documents/Code/Ingresos/docs/handoffs/architecture.md): Documento de entrega para las sesiones de Diseño y Backend.
- [docs/backend-setup.md](file:///C:/Users/djcha/Documents/Code/Ingresos/docs/backend-setup.md): Preparación privada de la hoja, token, permisos, despliegue y límites de seguridad.
- [docs/handoffs/backend.md](file:///C:/Users/djcha/Documents/Code/Ingresos/docs/handoffs/backend.md): Acciones implementadas, ejemplos, pruebas y verificación real pendiente.

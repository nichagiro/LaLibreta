# Guía de Mantenimiento y Gobernanza (AGENTS.md)

Este documento define las directrices y estándares para el **mantenimiento, evolución y soporte** de la aplicación **Control de Ingresos para Trabajador Independiente**. La primera versión de la aplicación ya se encuentra construida y verificada.

---

## 1. Arquitectura Real y Límites del Sistema

El sistema opera bajo un modelo desacoplado y sin servidor propio en producción:

1. **Frontend SPA Estático**:
   - Desarrollado en **React 18 + Vite 5 + TypeScript 5 + Tailwind CSS**.
   - Se compila a archivos estáticos (HTML/CSS/JS) en el directorio `dist/` mediante `npm run build`.
   - Cero servidores Node.js en producción y cero SSR.
2. **Capa de Persistencia Dual**:
   - Orquestada por [`src/services/api.ts`](file:///C:/Users/djcha/Documents/Code/Ingresos/src/services/api.ts).
   - **Modo Producción**: Conexión a un Google Spreadsheet privado a través de una Web App de Google Apps Script ([`apps-script/Code.gs`](file:///C:/Users/djcha/Documents/Code/Ingresos/apps-script/Code.gs)) invocada por [`src/services/sheets-api.ts`](file:///C:/Users/djcha/Documents/Code/Ingresos/src/services/sheets-api.ts).
   - **Modo de Prueba / Desarrollo**: Si `VITE_DATA_SOURCE=mock`, el cliente usa el adaptador en memoria ([`src/services/mock-adapter.ts`](file:///C:/Users/djcha/Documents/Code/Ingresos/src/services/mock-adapter.ts)). Cualquier otro valor (incluida la omisión) activa el modo Sheets de forma estricta, sin conmutación automática ni respaldo en runtime.
3. **Generación de Comprobantes PDF**:
   - Generación 100% en el cliente mediante `pdf-lib` ([`src/features/pdf/generatePdf.ts`](file:///C:/Users/djcha/Documents/Code/Ingresos/src/features/pdf/generatePdf.ts)), con carga dinámica (`dynamic import`) para no penalizar el bundle inicial.
4. **Límites Técnicos Críticos**:
   - **Sin transacciones ACID**: Google Sheets no ofrece atomicidad transaccional ni rollback general. Apps Script usa `LockService` (bloqueo exclusivo hasta 10 segundos) y deduplicación por `request_id` en `Clientes`, `Actividades` y `Pagos`.
   - **Autenticación personal vs OAuth**: El proyecto no utiliza un flujo de login OAuth desde el navegador. La seguridad se basa en un token de acceso personal (`VITE_APP_AUTH_TOKEN`) validado por Apps Script contra `Script Properties.AUTH_TOKEN`.
   - **Exposición en bundle estático**: Toda variable `VITE_*` queda incorporada en el JavaScript compilado. Este mecanismo es adecuado únicamente para uso privado y personal; no debe usarse como autenticación robusta frente a terceros en aplicaciones compartidas.

---

## 2. Ubicación de Responsabilidades en el Repositorio

| Directorio / Archivo | Responsabilidad Principal |
| :--- | :--- |
| [`src/types/index.ts`](file:///C:/Users/djcha/Documents/Code/Ingresos/src/types/index.ts) | Contrato canónico de tipos TypeScript, entidades de dominio y acciones de la API. |
| [`src/services/`](file:///C:/Users/djcha/Documents/Code/Ingresos/src/services/) | Servicios de persistencia (`api.ts`, `sheets-api.ts`, `mock-adapter.ts`). |
| [`src/theme/`](file:///C:/Users/djcha/Documents/Code/Ingresos/src/theme/) | Tokens visuales (`tokens.ts`), metadatos de estado (`status.ts`), utilidades de formato COP/fechas (`format.ts`). |
| [`src/components/ui/`](file:///C:/Users/djcha/Documents/Code/Ingresos/src/components/ui/) | Componentes atómicos de interfaz bajo el sistema de diseño «La Libreta», y galería (`?ui=1`). |
| [`src/features/`](file:///C:/Users/djcha/Documents/Code/Ingresos/src/features/) | Vistas y flujos de negocio: `dashboard`, `clients`, `activities`, `settings`, `pdf`. |
| [`apps-script/Code.gs`](file:///C:/Users/djcha/Documents/Code/Ingresos/apps-script/Code.gs) | Backend en Google Apps Script que ejecuta la lógica autoritativa y escribe en Google Sheets. |
| [`apps-script/tests/`](file:///C:/Users/djcha/Documents/Code/Ingresos/apps-script/tests/) | Pruebas unitarias del script de Apps Script con dobles de Google Sheets. |
| [`tests/`](file:///C:/Users/djcha/Documents/Code/Ingresos/tests/) | Pruebas de integración automatizadas del frontend y generación de PDF. |
| [`docs/`](file:///C:/Users/djcha/Documents/Code/Ingresos/docs/) | Especificaciones detalladas de arquitectura, modelo de datos, diseño, API y entregas históricas. |

---

## 3. Convenciones que Sí Utiliza el Proyecto

1. **Moneda y Finanzas**:
   - Moneda única: **COP** (Pesos Colombianos).
   - Representación estricta: **Enteros** (sin decimales ni coma flotante). Ejemplo: `$ 180.000 COP` -> `180000`.
   - **Regla terminológica obligatoria**: **Prohibido usar la palabra "Ganancia"** para cobros brutos o ingresos recibidos. Usar "Dinero Recibido" o "Total Cobrado".
2. **Fechas y Tiempos**:
   - Fechas de negocio (`activity_date`, `payment_date`): formato ISO estricto `YYYY-MM-DD`.
   - Zona horaria de referencia: `America/Bogota` (UTC-5).
   - Timestamps de auditoría (`created_at`, `updated_at`): ISO 8601 UTC completo `YYYY-MM-DDTHH:mm:ss.sssZ`.
3. **Identificadores Estables**:
   - Los registros usan prefijos semánticos generados (`cli_...`, `cat_...`, `act_...`, `pay_...`). Jamás se utiliza la posición física de la fila como ID o clave foránea.
4. **Idioma**:
   - Código, nombres de variables y tipos en inglés técnico (`total_value`, `balance_pending`, `payment_method`).
   - Interfaz de usuario, mensajes de error y documentación en **Español**.
5. **Estética y UI («La Libreta»)**:
   - Fondo papel frío (`#F4F6F5`), texto y acción primaria en tinta sólida (`#121716`).
   - Paneles con bordes finos (*hairline*), sin sombras decorativas ni degradados.
   - Estados de actividad (azul/progreso) y estados de pago (verde/naranja) con chips y formas diferenciadas (cuadrado vs círculo).
   - Cifras monetarias siempre con fuentes tabulares (`tabular-nums`) y formato colombiano (`es-CO`).

---

## 4. Separación entre Notas Internas y Datos del PDF

- **Notas Internas (`internal_notes` en actividades y `notes` en clientes)**:
  - Son de carácter confidencial para el trabajador independiente.
  - **Jamás deben incluirse en el PDF** ni exponerse en respuestas orientadas al cliente.
  - La función `getActivityPdfData` y el motor `buildActivityPdf` filtran estrictamente cualquier nota privada.
- **Observaciones Públicas (`public_notes`)**:
  - Información acordada con el cliente (garantías, condiciones de entrega) destinada a ser impresa en el PDF.
- **Leyenda del Comprobante**:
  - El PDF no es una factura electrónica. Incluye obligatoriamente la leyenda: *«Este documento resume un servicio prestado y los pagos recibidos. No es una factura.»* y no debe hacer mención de validación DIAN ni CUFE.

---

## 5. Reglas para Modificar el Esquema de Google Sheets

El esquema canónico consta de 5 pestañas: `Clientes`, `Categorias`, `Actividades`, `Pagos` y `Configuracion` (ver detalle en [`docs/data-model.md`](file:///C:/Users/djcha/Documents/Code/Ingresos/docs/data-model.md)).

Al realizar cambios sobre el esquema:
1. **Política Estricta Append-Only**: Columnas nuevas solo pueden agregarse al **final** de las cabeceras existentes.
2. **Prohibido Reordenar o Eliminar**: Nunca alteres el orden, nombre ni posición de las columnas existentes. `getOrCreateSheet` valida la correspondencia de cabeceras; si detecta diferencias devolverá `SCHEMA_MISMATCH`.
3. **Columnas de Idempotencia**: En `Clientes`, `Actividades` y `Pagos` existen las columnas `request_id`, `request_action` y `request_fingerprint`. No deben removerse.
4. **Respaldo Previo**: Antes de cualquier modificación manual sobre la hoja de cálculo de Google, realiza una copia de seguridad íntegra de la misma.

---

## 6. Protección de Datos Personales y Credenciales

1. **Sin Secretos en el Repositorio**:
   - El archivo `.env` está en `.gitignore` y **nunca debe ser versionado**.
   - Solo se versiona [`.env.example`](file:///C:/Users/djcha/Documents/Code/Ingresos/.env.example) con valores de muestra (`TU_SCRIPT_ID`, etc.).
   - No incluir tokens reales, URLs de despliegues privados ni datos de clientes en ejemplos, capturas de pantalla o mensajes de commit.
2. **Privacidad de la Hoja de Cálculo**:
   - La hoja de cálculo debe mantenerse siempre como recurso privado en Google Drive (no compartida con el público ni con enlace abierto de edición).

---

## 7. Uso de Skills Instaladas

Durante tareas de desarrollo o mantenimiento, consulta las siguientes skills instaladas en `.agents/skills/`:

- **[`frontend-design`](file:///C:/Users/djcha/Documents/Code/Ingresos/.agents/skills/frontend-design/SKILL.md)**:
  - Usar al crear, corregir o extender componentes visuales o pantallas.
  - Asegura fidelidad a los principios de «La Libreta», tipografía intencional y contraste equilibrado.
- **[`vercel-react-best-practices`](file:///C:/Users/djcha/Documents/Code/Ingresos/.agents/skills/vercel-react-best-practices/SKILL.md)**:
  - Usar al refactorizar o agregar hooks, llamadas a la API o lógica de estado.
  - Enfocarse en reglas aplicables a React SPA + Vite: eliminación de cascadas asíncronas, estado derivado en render sin `useEffect` innecesarios, y división de código (*code splitting*) para binarios pesados.

---

## 8. Comandos de Verificación Obligatorios

Antes de dar por concluida cualquier sesión o entregar cambios, es mandatorio ejecutar y aprobar la suite completa de verificación:

```bash
# 1. Comprobación estricta de tipos de TypeScript (0 errores)
npm run typecheck

# 2. Análisis estático de código y reglas de React (0 advertencias, 0 errores)
npm run lint

# 3. Suite completa de pruebas automatizadas (21 pruebas: 12 backend + 9 frontend)
npm run test

# 4. Compilación de producción (verifica build estático SPA limpio en dist/)
npm run build
```

---

## 9. Cambios que Requieren Aprobación Previa del Usuario

Ningún agente o sesión debe realizar las siguientes acciones sin aprobación explícita:
1. Instalar nuevas dependencias en `package.json`.
2. Modificar contratos en [`src/types/index.ts`](file:///C:/Users/djcha/Documents/Code/Ingresos/src/types/index.ts) o la estructura de pestañas/columnas de Google Sheets.
3. Ejecutar peticiones de escritura o migraciones contra la hoja de cálculo de Google real del usuario.
4. Alterar la arquitectura base (migrar a SSR, introducir servidores Node intermedios o cambiar el motor de persistencia).
5. Ejecutar `git commit`, `git push` o comandos de despliegue en producción.

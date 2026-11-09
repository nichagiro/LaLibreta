# Índice Histórico de Construcción y Pendientes Reales

Este directorio contiene la bitácora y registros de traspaso (*handoffs*) generados durante la fase inicial de desarrollo modular de la aplicación **Control de Ingresos para Trabajador Independiente**.

---

## 1. Bitácora de Sesiones de Construcción

| Documento | Sesión Emisora | Alcance Entregado |
| :--- | :--- | :--- |
| [`architecture.md`](file:///C:/Users/djcha/Documents/Code/Ingresos/docs/handoffs/architecture.md) | **Sesión 1**: Arquitectura y Coordinación | Contratos TypeScript (`src/types/index.ts`), configuración Vite/Tailwind, lineamientos de gobernanza en `AGENTS.md`. |
| [`design.md`](file:///C:/Users/djcha/Documents/Code/Ingresos/docs/handoffs/design.md) | **Sesión 2**: Diseño y Sistema UI | Tokens de diseño, 28 componentes atómicos de UI («La Libreta»), formato COP, y catálogo visual interactivo (`?ui=1`). |
| [`backend.md`](file:///C:/Users/djcha/Documents/Code/Ingresos/docs/handoffs/backend.md) | **Sesión 3**: Persistencia y Backend | Script `apps-script/Code.gs` para Google Sheets, lógica autoritativa, deduplicación con `request_id`, 12 pruebas unitarias con dobles. |
| [`frontend.md`](file:///C:/Users/djcha/Documents/Code/Ingresos/docs/handoffs/frontend.md) | **Sesión 4**: Frontend e Integración | Pantallas (`dashboard`, `clients`, `activities`, `settings`), adaptador dual (mock + sheets), motor de PDF con `pdf-lib` y 9 pruebas de integración. |

---

## 2. Estado de Funcionalidades: Completadas vs Pendientes Reales

### A. Funcionalidades 100% Completadas y Verificadas
- ✅ **Frontend SPA**: React 18 + Vite 5 + Tailwind CSS compilando limpiamente a `dist/`.
- ✅ **Gestión de Clientes**: Creación, edición, borrado lógico, ficha detallada con métricas históricas de facturación y pagos.
- ✅ **Gestión de Actividades**: Servicios y ventas, descripción libre, valor total único en COP enteros, filtros independientes por cliente, categoría, rango de fechas, estado operativo y estado de pago.
- ✅ **Gestión de Pagos**: Registro de abonos, prevención de sobrepagos (`OVERPAYMENT_NOT_ALLOWED`), bloqueo de cobro en canceladas, y eliminación reversible de pagos.
- ✅ **Regla de Cancelación**: El saldo pendiente pasa a $0 COP sin afectar los pagos recibidos con anterioridad.
- ✅ **Integridad de Modificación**: Bloqueo del cambio de `total_value` en actividades que ya posean abonos (`PAYMENT_CONFLICT`).
- ✅ **Gestión de Categorías**: Creación, renombrado y desactivación lógica preservando el historial.
- ✅ **Emisión de PDF**: Generación local nativa con `pdf-lib`, previsualización visual, exclusión estricta de notas internas y formato A4 listo para compartir manualmente.
- ✅ **Adaptador Dual**: Modo de prueba en memoria completamente autónomo que permite utilizar la aplicación sin conexión previa a Google.
- ✅ **Pruebas Automatizadas**: 21/21 pruebas automatizadas aprobadas (12 backend con dobles + 9 frontend de integración, incluyendo reintentos de red).

### B. Pendientes Reales (Requieren Acción del Usuario / Entorno Operativo)
1. **Despliegue y Autorización del Web App en Google Apps Script**:
   - Copiar [`apps-script/Code.gs`](file:///C:/Users/djcha/Documents/Code/Ingresos/apps-script/Code.gs) a la hoja de Google Sheets privada del propietario.
   - Configurar `AUTH_TOKEN` en *Script Properties* de Google Apps Script.
   - Publicar el despliegue como Web App ("Ejecutar como: Yo", "Acceso: Cualquier usuario") y autorizar permisos en la cuenta Google.
   - Configurar `VITE_APPS_SCRIPT_URL` y `VITE_APP_AUTH_TOKEN` en el `.env` local.
2. **Validación de Ping y Persistencia Real contra Google**:
   - Ejecutar la prueba de salud (*Ping*) desde la pantalla de Configuración contra el endpoint real desplegado para confirmar que Google no devuelva error 401 por permisos de cuenta.
3. **Prueba de Ergonomía Táctil en Dispositivos Móviles Físicos**:
   - Inspeccionar el comportamiento táctil de los modales inferiores y teclados numéricos en iOS Safari y Android Chrome reales.
4. **Limpieza de Artefactos de Build en Raíz**:
   - Los archivos `tsconfig.tsbuildinfo`, `tsconfig.node.tsbuildinfo`, `vite.config.js` y `vite.config.d.ts` están sin seguimiento en el repositorio git; pueden ser ignorados en `.gitignore` o depurados si el usuario lo dispone.

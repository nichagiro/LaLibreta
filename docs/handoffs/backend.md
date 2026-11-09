# Handoff de Backend y Persistencia

> [!NOTE]
> **DOCUMENTO HISTÓRICO - FASE DE CONSTRUCCIÓN INICIAL (Sesión 3)**  
> Este documento registra las decisiones y pruebas de persistencia entregadas durante la fase de construcción modular inicial. Para las directrices activas de mantenimiento del backend, consulta [docs/backend-setup.md](file:///C:/Users/djcha/Documents/Code/Ingresos/docs/backend-setup.md), [apps-script/README.md](file:///C:/Users/djcha/Documents/Code/Ingresos/apps-script/README.md) y [AGENTS.md](file:///C:/Users/djcha/Documents/Code/Ingresos/AGENTS.md).

## Alcance implementado

Web App de Google Apps Script en `apps-script/Code.gs`, con persistencia en la hoja vinculada. No se implementaron pantallas ni estilos. La hoja permanece privada; ninguna prueba accedió a Google.

## Endpoints disponibles

Todas las acciones usan `POST` con `{ "token": "...", "action": "...", "payload": {} }` y devuelven un sobre JSON `success/data` o `success/error`.

| Acción | Ejemplo de payload |
|---|---|
| `ping` | `{}` |
| `getConfig`, `getClients`, `getCategories`, `getActivities` | `{}` |
| `updateConfig` | `{ "owner_name": "Nombre" }` |
| `createClient` | `{ "name": "Cliente", "request_id": "client_2026_0001" }` |
| `updateClient` | `{ "id": "cli_...", "phone": "+57..." }` |
| `toggleClientStatus` | `{ "id": "cli_...", "is_active": false }` |
| `createCategory` | `{ "name": "Sistemas" }` |
| `updateCategory` | `{ "id": "cat_...", "name": "Desarrollo" }` |
| `toggleCategoryStatus` | `{ "id": "cat_...", "is_active": false }` |
| `createActivity` | `{ "client_id": "cli_...", "category_id": "cat_...", "type": "service", "title": "Trabajo", "activity_date": "2026-11-04", "total_value": 100000, "request_id": "activity_2026_0001" }` |
| `updateActivity` | `{ "id": "act_...", "title": "Título nuevo" }` |
| `cancelActivity` | `{ "id": "act_..." }` |
| `getPayments` | `{ "activity_id": "act_..." }` (opcional) |
| `addPayment` | `{ "activity_id": "act_...", "payment_date": "2026-11-04", "amount": 50000, "payment_method": "nequi", "request_id": "payment_2026_0001" }` |
| `deletePayment` | `{ "id": "pay_..." }` |
| `getActivityPdfData` | `{ "id": "act_..." }` |
| `getSummary` | `{ "from": "2026-11-01", "to": "2026-11-30" }` o `{}` |

El contrato completo está en [api-contract.md](../api-contract.md). Fechas de negocio requieren `YYYY-MM-DD`; valores COP son enteros. `getActivityPdfData` solo compone datos públicos y nunca incluye `internal_notes`.

## Reglas y límites

- Los saldos y estados de pago derivan de pagos persistidos; no se permiten sobrepagos ni pagos después de cancelar.
- Cancelar mantiene los pagos históricos, elimina saldo pendiente y produce estado de pago `pending` sin abonos o `partial` con abonos.
- No se cambia `total_value` cuando ya hay pagos. La actualización valida todo el payload antes de persistir la fila.
- Categorías desactivadas conservan el historial, pero no se aceptan como referencia en nuevas/actualizadas actividades.
- `request_id` con huella se guarda en la misma fila para `createClient`, `createActivity` y `addPayment`; las demás acciones no tienen deduplicación.
- En el cliente, `src/services/sheets-api.ts` reenvía una sola vez las fallas de transporte de las lecturas y de esas tres escrituras, siempre con el mismo cuerpo, y `src/services/api.ts` conserva el `request_id` de una creación fallida para que el reintento del usuario no duplique registros. Un `success: false` nunca se reenvía.
- Google Sheets no ofrece transacciones. El bloqueo serializa llamadas de la misma Apps Script Web App; no se promete rollback ni atomicidad transaccional.
- Apps Script `ContentService` no permite asignar un estado HTTP personalizado: se interpreta el sobre JSON.
- `VITE_APP_AUTH_TOKEN` queda visible en el bundle estático. Es una limitación explícita de la arquitectura elegida, no una credencial privada ni una autenticación robusta.

## Variables requeridas

- `VITE_APPS_SCRIPT_URL`: URL `/exec` de la Web App.
- `VITE_APP_AUTH_TOKEN`: token coincidente con Script Property `AUTH_TOKEN`; es público una vez construido el frontend.

No añadir credenciales privadas de Google ni secretos reales al `.env.example`.

## Pruebas ejecutadas

`npm run test:backend` usa dobles de Google Apps Script/Sheets y cubre creación/consulta de cliente, actividad, pagos parciales/completos, validación de montos/referencias, cancelación/sobrepago, desactivación de categoría, cobros por fecha de pago, reintentos, datos PDF sin notas privadas, autorización y fallos simulados de Sheets.

`npm run test:frontend` incluye la prueba **9. Reintentos**, que simula la red con un `fetch` sustituto y verifica: reenvío con cuerpo idéntico ante una falla de transporte, reutilización del mismo `request_id` cuando el usuario reintenta una creación fallida, y ausencia total de reintentos ante un `success: false`.

Resultados:

- `npm run test:backend`: **12/12 pruebas aprobadas** con dobles; no son pruebas contra Google.
- `npm run test:frontend`: **9/9 pruebas aprobadas** con dobles de red; no son pruebas contra Google.
- `npm run lint`: **aprobado**.
- `npm run typecheck`: **aprobado**.
- `npm run build`: **aprobado**, compilación estática SPA generada en `dist/`.

Para desbloquear la verificación global se coordinó un ajuste mínimo fuera de la zona backend en `src/components/ui/TextField.tsx`: clases condicionales usan ternarios para que un `ReactNode` numérico como `0` no se pase al helper `cn`. La condición que añade padding es la misma; no cambia el estilo esperado.

## Verificación con Google

No se configuró ni ejecutó una hoja real. No se verificaron permisos, cuotas, CORS ni despliegue contra un endpoint Google real; hace falta una hoja de desarrollo autorizada. No se alteró ningún dato ni se creó recurso externo.

Instrucciones para configurar y desplegar: [backend-setup.md](../backend-setup.md).

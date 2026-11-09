# Contrato de API y Persistencia (Google Apps Script & Mock Adapter)

Este documento especifica el protocolo canónico de comunicación entre el frontend estático y la capa de persistencia. El contrato está implementado tanto de forma remota en **Google Apps Script** ([`apps-script/Code.gs`](file:///C:/Users/djcha/Documents/Code/Ingresos/apps-script/Code.gs)) como de forma local en el **Adaptador en Memoria** ([`src/services/mock-adapter.ts`](file:///C:/Users/djcha/Documents/Code/Ingresos/src/services/mock-adapter.ts)).

---

## 1. Protocolo de Transporte y Estructura Base

- **Método HTTP**: `POST`
- **URL**: `VITE_APPS_SCRIPT_URL` (obtenida al publicar la Web App en Google Apps Script)
- **Header**: `Content-Type: text/plain;charset=utf-8` *(usar text/plain evita el handshake OPTIONS preflight de CORS en Google Apps Script)*
- Apps Script `ContentService` no permite establecer un código HTTP de respuesta personalizado. El cliente debe interpretar `success` y `error.code` del sobre JSON, no inferir el resultado por el estado HTTP.
- El token `VITE_APP_AUTH_TOKEN` se incluye en el JavaScript publicado. Es un control de acceso para uso personal, **no es un secreto robusto**; CORS no reemplaza autenticación.

### Formato de Solicitud (Request Payload)
```json
{
  "token": "string (clave maestra configurada en Script Properties)",
  "action": "string (nombre de la acción a ejecutar)",
  "payload": {}
}
```

Las operaciones `createClient`, `createActivity` y `addPayment` requieren `payload.request_id`, un identificador estable (8–100 caracteres `[A-Za-z0-9_-]`) que el cliente genera una vez por intento lógico y reutiliza en reintentos. Apps Script guarda dicho identificador y una huella del contenido en la misma fila, bajo `LockService`: el mismo ID y contenido para el mismo tipo de operación devuelve el registro persistido; el mismo ID y contenido diferente en esa pestaña devuelve `IDEMPOTENCY_CONFLICT`. El espacio de claves está separado por tipo de registro (clientes, actividades y pagos).

### Formato de Respuesta Exitosa (Response Success)
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-11-04T16:30:00.000Z"
}
```

### Formato de Respuesta de Error (Response Error)
```json
{
  "success": false,
  "error": {
    "code": "CODIGO_DE_ERROR",
    "message": "Mensaje legible en español",
    "details": { ... }
  },
  "timestamp": "2026-11-04T16:30:00.000Z"
}
```

---

## 2. Códigos de Error Estandarizados

| Código de Error | Descripción |
| :--- | :--- |
| `UNAUTHORIZED` | Token de acceso personal ausente o incorrecto. |
| `CONCURRENCY_TIMEOUT` | El script no pudo adquirir el bloqueo exclusivo en 10 segundos. |
| `OVERPAYMENT_NOT_ALLOWED` | El abono ingresado supera el saldo pendiente de la actividad. |
| `CANNOT_PAY_CANCELLED` | No se pueden registrar pagos en una actividad cancelada. |
| `PAYMENT_CONFLICT` | Cambio del valor total (`total_value`) rechazado porque la actividad ya tiene pagos. |
| `ENTITY_NOT_FOUND` | La actividad, cliente, categoría o pago solicitado no existe. |
| `INVALID_MONETARY_VALUE` | El monto no es un entero COP válido; `amount` de pago debe ser mayor que cero. |
| `VALIDATION_ERROR` | Campo, fecha, referencia, estado o método de pago inválido. |
| `IDEMPOTENCY_CONFLICT` | `request_id` reutilizado con acción o contenido distintos. |
| `INVALID_REQUEST` | JSON, payload o identificador de reintento inválido. |
| `SCHEMA_MISMATCH` | Cabeceras existentes en la hoja no coinciden con el modelo canónico. |
| `SCHEMA_MIGRATION_REQUIRED` | A la pestaña le faltan las columnas de idempotencia (`request_id`, `request_action`, `request_fingerprint`). |
| `SHEETS_FAILURE` | Fallo interno de Apps Script/Google Sheets (la respuesta oculta detalles internos). |
| `INTERNAL_ERROR` | Fallo inesperado del script; no expone stack trace ni detalle interno. |
| `NETWORK_FAILURE` | Falla de conexión a internet o endpoint inalcanzable. |
| `UNSUPPORTED_ACTION` | Acción solicitada desconocida. |

### 2.1 Códigos generados por el cliente (`src/services/sheets-api.ts`)

Estos códigos no viajan desde Google: los produce el adaptador del navegador antes o después de recibir la respuesta.

| Código de Error | Descripción |
| :--- | :--- |
| `MISSING_ENDPOINT` | Falta `VITE_APPS_SCRIPT_URL`. |
| `MISSING_AUTH_TOKEN` | Falta `VITE_APP_AUTH_TOKEN`. |
| `HTTP_ERROR` | El endpoint devolvió un estado HTTP distinto de 2xx. |
| `REMOTE_ERROR` | Sobre JSON sin objeto `error`. |
| `NETWORK_FAILURE` | `fetch` falló o la respuesta no era JSON utilizable. |

**Reintentos del cliente**: solo se reenvía la petición cuando el fallo es de transporte (`NETWORK_FAILURE` o `HTTP_ERROR`) y la acción es segura para repetir — lecturas puras (`ping`, `get*`) y las tres escrituras con `request_id` (`createClient`, `createActivity`, `addPayment`). Se reenvía **el mismo cuerpo byte a byte** para conservar la huella de idempotencia. Los errores de la aplicación (`success: false`) nunca se reintentan. Además, `src/services/api.ts` conserva el `request_id` de una creación fallida y lo reutiliza si el usuario vuelve a intentar la misma operación.

---

## 3. Catálogo Canónico de Acciones

### 3.1 Diagnóstico y Configuración

#### `ping`
Comprueba la salud del endpoint remoto.
- **Payload**: Opcional / `{}`
- **Respuesta `data`**:
  ```json
  {
    "message": "Conexión exitosa con Google Apps Script",
    "version": "1.0.0"
  }
  ```

#### `getConfig`
Obtiene los datos del propietario y preferencias de comprobante.
- **Payload**: `{}`
- **Respuesta `data`**: Objeto `AppConfig` con `owner_name`, `business_name`, `owner_phone`, `owner_email`, `payment_instructions`, `logo_url_or_base64`.

#### `updateConfig`
Actualiza la configuración del propietario.
- **Payload**: Objeto clave-valor con campos a modificar (ej: `{ "owner_name": "Nombre Actualizado" }`).
- **Respuesta `data`**: Objeto `AppConfig` actualizado.

---

### 3.2 Clientes

#### `getClients`
Retorna todos los clientes registrados.
- **Payload**: `{}`
- **Respuesta `data`**: `Client[]`

#### `createClient`
Crea un nuevo cliente. Requiere clave de idempotencia.
- **Payload**:
  ```json
  {
    "name": "Juan Pérez",
    "phone": "+57 300 0000000",
    "email": "juan@correo.com",
    "notes": "Referido de Andrés",
    "request_id": "client_2026_0001"
  }
  ```
- **Respuesta `data`**: Objeto `Client` con su `id` generado (`cli_...`).

#### `updateClient`
Actualiza datos de un cliente existente.
- **Payload**:
  ```json
  {
    "id": "cli_a8f9-4b21-...",
    "name": "Juan Pérez Modificado",
    "phone": "+57 311 0000000",
    "email": "nuevo@correo.com",
    "notes": "Notas actualizadas"
  }
  ```
- **Respuesta `data`**: Objeto `Client` actualizado.

#### `toggleClientStatus`
Desactiva o activa un cliente (borrado lógico).
- **Payload**: `{ "id": "cli_...", "is_active": false }`
- **Respuesta `data`**: `{ "id": "cli_...", "is_active": false }`

---

### 3.3 Categorías

#### `getCategories`
- **Payload**: `{}`
- **Respuesta `data`**: `Category[]`

#### `createCategory`
- **Payload**: `{ "name": "Desarrollo web" }`
- **Respuesta `data`**: Objeto `Category` creado con su `id` (`cat_...`).

#### `updateCategory`
Renombra una categoría existente.
- **Payload**: `{ "id": "cat_...", "name": "Nuevo Nombre" }`
- **Respuesta `data`**: Objeto `Category` renombrado.

#### `toggleCategoryStatus`
Desactiva o reactiva una categoría. No altera el historial de actividades asociadas.
- **Payload**: `{ "id": "cat_...", "is_active": false }`
- **Respuesta `data`**: `{ "id": "cat_...", "is_active": false }`

---

### 3.4 Actividades

#### `getActivities`
Devuelve el listado completo de actividades con sus cálculos autoritativos de saldo y abonos acumulados.
- **Payload**: `{}`
- **Respuesta `data`**: `Activity[]`

#### `createActivity`
Crea una actividad (servicio o venta). Requiere clave de idempotencia.
- **Payload**:
  ```json
  {
    "client_id": "cli_...",
    "type": "service",
    "category_id": "cat_...",
    "title": "Consultoría Técnica",
    "description": "Sesión de 4 horas de arquitectura",
    "activity_date": "2026-11-04",
    "total_value": 400000,
    "status": "pending",
    "internal_notes": "Cobro regular",
    "public_notes": "Servicio prestado de forma remota",
    "request_id": "activity_2026_0001"
  }
  ```
- **Respuesta `data`**: Objeto `Activity` creado con `id: "act_..."`, `total_received: 0`, `balance_pending: 400000`, `payment_status: "pending"`.

#### `updateActivity`
Actualiza campos descriptivos o de estado de la actividad.
- **Payload**: `{ "id": "act_...", "title": "Título actualizado" }`
- **Regla financiera de integridad**: Si la actividad ya tiene pagos registrados, la modificación de `total_value` se rechaza devolviendo el error `PAYMENT_CONFLICT`.

#### `cancelActivity`
Cancela la actividad.
- **Payload**: `{ "id": "act_..." }`
- **Efecto de negocio**: El `status` pasa a `cancelled` y el `balance_pending` pasa inmediatamente a `0` COP para no distorsionar la cartera de cobros pendientes. Los abonos previos se conservan en el histórico; el `payment_status` derivado es `pending` sin pagos o `partial` si los hubo. No se permiten nuevos pagos.

---

### 3.5 Pagos / Abonos

#### `getPayments`
Consulta el listado de abonos.
- **Payload**: `{}` para todos los pagos, o `{ "activity_id": "act_..." }` para filtrar por actividad.
- **Respuesta `data`**: `Payment[]`.

#### `addPayment`
Registra un nuevo abono o pago completo para una actividad. Requiere clave de idempotencia.
- **Payload**:
  ```json
  {
    "activity_id": "act_823e-90ab-...",
    "payment_date": "2026-11-04",
    "amount": 200000,
    "payment_method": "transferencia_bancaria",
    "notes": "Transferencia comprobante #7849",
    "request_id": "payment_2026_0001"
  }
  ```
- **Reglas de validación**:
  - Si `amount > activity.balance_pending`, responde con error `OVERPAYMENT_NOT_ALLOWED`.
  - Si la actividad está en estado `cancelled`, responde con error `CANNOT_PAY_CANCELLED`.
- **Respuesta `data`**: Objeto `Payment` creado con `id: "pay_..."`.

#### `deletePayment`
Elimina un abono registrado por error, recalculando el saldo pendiente.
- **Payload**: `{ "id": "pay_..." }`
- **Respuesta `data`**: `{ "id": "pay_...", "deleted": true }`

---

### 3.6 Comprobante PDF y Resumen Financiero

#### `getActivityPdfData`
Retorna los datos públicos y estructurados necesarios para generar el comprobante PDF en el cliente.
- **Payload**: `{ "id": "act_..." }`
- **Respuesta `data`**: Objeto `ActivityPdfData` (datos del emisor, cliente, actividad, pagos y notas públicas). **Estrictamente excluye `internal_notes` y notas privadas del cliente.**

#### `getSummary`
Calcula los indicadores financieros del período.
- **Payload**: `{ "from": "YYYY-MM-DD", "to": "YYYY-MM-DD" }` (o `{}` para histórico total).
- **Respuesta `data`**:
  ```json
  {
    "period_from": "2026-11-01",
    "period_to": "2026-11-30",
    "total_activities_value": 1500000,
    "total_money_received": 950000,
    "total_balance_pending": 550000,
    "activities_count": {
      "total": 5,
      "pending": 1,
      "in_progress": 2,
      "completed": 2,
      "cancelled": 0
    }
  }
  ```

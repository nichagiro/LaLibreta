# Contrato de API y Persistencia (Google Apps Script Web App)

Este documento especifica el protocolo de comunicación entre el frontend estático y la Web App de Google Apps Script.

---

## 1. Protocolo de Transporte y Estructura Base

- **Método HTTP**: `POST`
- **URL**: `VITE_APPS_SCRIPT_URL` (obtenida al publicar la Web App en Google Apps Script)
- **Header**: `Content-Type: text/plain;charset=utf-8` *(usar text/plain evita el handshake OPTIONS preflight de CORS en Google Apps Script)*
- Apps Script `ContentService` no permite establecer un código HTTP de respuesta personalizado. El cliente debe interpretar `success` y `error.code` del sobre JSON, no inferir el resultado por el estado HTTP.
- El token `VITE_APP_AUTH_TOKEN` se incluye en el JavaScript publicado. Es control de acceso de uso personal, **no es un secreto robusto**; CORS no reemplaza autenticación.

### Formato de Solicitud (Request Payload)
```json
{
  "token": "string (clave maestra configurada en Script Properties)",
  "action": "string (nombre de la acción a ejecutar)",
  "payload": {}
}
```

Las operaciones `createClient`, `createActivity` y `addPayment` requieren `payload.request_id`, identificador estable (8–100 caracteres `[A-Za-z0-9_-]`) que el cliente debe generar una vez por intento lógico y reutilizar en reintentos. Apps Script guarda dicho identificador y una huella del contenido en la misma fila, bajo `LockService`: el mismo ID y contenido para el mismo tipo de operación devuelve el registro persistido; el mismo ID y contenido diferente en esa pestaña devuelve `IDEMPOTENCY_CONFLICT`. El espacio de claves está separado por tipo de registro (clientes, actividades y pagos). No se garantiza atomicidad transaccional de Google Sheets ni deduplicación para otras acciones.

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
| `ENTITY_NOT_FOUND` | La actividad, cliente, categoría o pago solicitado no existe. |
| `INVALID_MONETARY_VALUE` | El monto no es un entero COP válido; `amount` de pago debe ser mayor que cero. |
| `NETWORK_FAILURE` | Falla física de conexión a internet o endpoint inalcanzable. |
| `INVALID_REQUEST` | JSON, payload o identificador de reintento inválido. |
| `VALIDATION_ERROR` | Campo, fecha, referencia, estado o método de pago inválido. |
| `IDEMPOTENCY_CONFLICT` | `request_id` reutilizado con acción o contenido distintos. |
| `SCHEMA_MISMATCH` | Cabeceras existentes no coinciden con el modelo canónico. |
| `SHEETS_FAILURE` | Fallo de Apps Script/Google Sheets; la respuesta no expone detalles internos. |
| `PAYMENT_CONFLICT` | Cambio del valor total rechazado porque la actividad ya tiene pagos. |
| `UNSUPPORTED_ACTION` | Acción desconocida. |

Los errores son sobres JSON. Por limitación de `ContentService`, no se asigna HTTP 4xx/5xx. No se devuelven trazas ni valores de configuración sensible.

---

## 3. Catálogo Canónico de Acciones

### 3.1 Diagnóstico y Configuración

#### `ping`
Comprueba la salud del endpoint.
- **Payload**: Opcional / `{}`
- **Respuesta `data`**:
  ```json
  {
    "message": "Conexión exitosa con Google Apps Script",
    "version": "1.0.0"
  }
  ```

#### `getConfig`
Obtiene los datos del propietario y preferencias.
- **Payload**: Opcional / `{}`
- **Respuesta `data`**:
  ```json
  {
    "owner_name": "David Chávez",
    "business_name": "DJ Soluciones Tech",
    "owner_phone": "+57 300 1234567",
    "owner_email": "propietario@correo.com",
    "payment_instructions": "Bancolombia Ahorros 123-456-789 | Nequi/Daviplata 3001234567",
    "logo_url_or_base64": "",
    "updated_at": "2026-11-04T12:00:00.000Z"
  }
  ```

#### `updateConfig`
Actualiza la configuración del propietario.
- **Payload**: Objeto clave-valor con los campos a modificar.
- **Respuesta `data`**: Objeto de configuración actualizado.

---

### 3.2 Clientes

#### `getClients`
Retorna todos los clientes registrados.
- **Payload**: `{}`
- **Respuesta `data`**: `Client[]`
  ```json
  [
    {
      "id": "cli_a8f9-4b21-...",
      "name": "Acme Corp",
      "phone": "+57 310 9876543",
      "email": "contacto@acme.co",
      "notes": "Cliente corporativo",
      "is_active": true,
      "created_at": "2026-11-04T12:00:00.000Z",
      "updated_at": "2026-11-04T12:00:00.000Z"
    }
  ]
  ```

#### `createClient`
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
- **Respuesta `data`**: Objeto `Client` creado con su `id` generado (`cli_...`).

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
- **Respuesta `data`**: Objeto `Category` con su `id` (`cat_...`).

#### `toggleCategoryStatus`
- **Payload**: `{ "id": "cat_...", "is_active": false }`

---

### 3.4 Actividades

#### `getActivities`
Devuelve el listado completo de actividades con sus cálculos autoritativos de saldo y abonos acumulados.
- **Payload**: `{}`
- **Respuesta `data`**: `Activity[]`
  ```json
  [
    {
      "id": "act_823e-90ab-...",
      "client_id": "cli_a8f9-4b21-...",
      "type": "service",
      "category_id": "cat_71e0-...",
      "title": "Mantenimiento Servidor y Backup",
      "description": "Se realizó depuración de logs y configuración de snapshot diario.",
      "activity_date": "2026-11-04",
      "total_value": 350000,
      "status": "completed",
      "internal_notes": "El cliente demoró en entregar accesos root.",
      "public_notes": "Garantía de 30 días sobre la configuración.",
      "total_received": 150000,
      "balance_pending": 200000,
      "payment_status": "partial",
      "created_at": "2026-11-04T10:00:00.000Z",
      "updated_at": "2026-11-04T10:00:00.000Z"
    }
  ]
  ```

#### `createActivity`
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

#### `cancelActivity`
Cancela la actividad.
- **Payload**: `{ "id": "act_..." }`
- **Efecto de negocio**: El `status` pasa a `cancelled` y el `balance_pending` pasa a `0`. Abonos previos se conservan en histórico; el `payment_status` derivado es `pending` sin pagos o `partial` si los hubo. No se permiten nuevos pagos.

#### `updateActivity`
- **Payload**: `{ "id": "act_...", "title": "Título actualizado" }`; admite cambios parciales de campos de actividad.
- **Regla financiera**: No permite cambiar `total_value` cuando existen pagos asociados. Para una edición con validación fallida no se escriben los cambios.

#### `getPayments`
- **Payload**: `{}` para todos los pagos o `{ "activity_id": "act_..." }` para filtrar.
- **Respuesta `data`**: `Payment[]`.

#### `getActivityPdfData`
- **Payload**: `{ "id": "act_..." }`.
- **Respuesta `data`**: `ActivityPdfData` con datos de emisor, cliente, actividad, pagos y campos públicos. No contiene `internal_notes` ni notas internas del cliente.

---

### 3.5 Pagos / Abonos

#### `addPayment`
Registra un nuevo abono o pago completo para una actividad.
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
- **Regla de validación**: Si `amount > activity.balance_pending`, responde con error `OVERPAYMENT_NOT_ALLOWED`.
- **Respuesta `data`**: Objeto `Payment` creado con `id: "pay_..."`.

#### `deletePayment`
Elimina un abono registrado por error.
- **Payload**: `{ "id": "pay_..." }`
- **Respuesta `data`**: `{ "id": "pay_...", "deleted": true }`

---

### 3.6 Resumen Financiero

#### `getSummary`
- **Payload**:
  ```json
  {
    "from": "2026-11-01",
    "to": "2026-11-30"
  }
  ```
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

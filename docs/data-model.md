# Modelo de Datos y Estructura en Google Sheets

La persistencia del sistema reside en un Google Spreadsheet privado compuesto por **5 pestañas canónicas**. Este documento define la estructura de columnas, los tipos de datos admitidos y las reglas para el mantenimiento y evolución del esquema.

---

## 1. Convenciones Generales de Datos

1. **Fila 1 (Cabecera congelada)**: Contiene los nombres exactos de los campos en minúsculas con guiones bajos (`snake_case`).
2. **Identificadores (Columna A)**:
   - Cadena de texto única con prefijo semántico + UUID v4 (`cli_...`, `cat_...`, `act_...`, `pay_...`).
   - Jamás se utiliza la posición física de la fila como identificador foráneo.
3. **Moneda (COP)**:
   - Todo monto (`total_value`, `amount`, `balance_pending`, `total_received`) se almacena como **número entero** en pesos colombianos.
   - No se almacenan símbolos de moneda ni separadores de miles en la columna de datos crudos (el formateo visual `$ 150.000 COP` lo realiza la capa de presentación).
4. **Fechas y Tiempos**:
   - Fechas de negocio (`activity_date`, `payment_date`): Cadena estricta `YYYY-MM-DD`.
   - Timestamps de auditoría (`created_at`, `updated_at`): Cadena ISO 8601 UTC `YYYY-MM-DDTHH:mm:ss.sssZ`.

---

## 2. Esquema Detallado de Pestañas

### Pestaña 1: `Clientes`
Almacena el directorio de clientes del trabajador independiente.

| Columna | Nombre de Campo | Tipo | Requerido | Descripción |
| :---: | :--- | :--- | :---: | :--- |
| **A** | `id` | String (`cli_...`) | Sí | Clave primaria generada por el sistema. |
| **B** | `name` | String (máx 200) | Sí | Nombre o razón social del cliente. |
| **C** | `phone` | String (máx 80) | No | Teléfono o celular de contacto. |
| **D** | `email` | String | No | Correo electrónico de contacto. |
| **E** | `notes` | String (máx 5000) | No | Observaciones internas (confidenciales, nunca al PDF). |
| **F** | `is_active` | Boolean | Sí | `TRUE` (activo) / `FALSE` (archivado). |
| **G** | `created_at` | String (ISO UTC) | Sí | Timestamp de creación. |
| **H** | `updated_at` | String (ISO UTC) | Sí | Timestamp de última modificación. |
| **I** | `request_id` | String | No | Clave de idempotencia para `createClient`. |
| **J** | `request_action` | String | No | Acción asociada al reintento (`createClient`). |
| **K** | `request_fingerprint` | String | No | Huella SHA-256 en Base64 del payload original. |

---

### Pestaña 2: `Categorias`
Permite clasificar las actividades en grupos editables.

| Columna | Nombre de Campo | Tipo | Requerido | Descripción |
| :---: | :--- | :--- | :---: | :--- |
| **A** | `id` | String (`cat_...`) | Sí | Clave primaria generada por el sistema. |
| **B** | `name` | String (máx 100) | Sí | Nombre de la categoría (ej: "Desarrollo web"). |
| **C** | `is_active` | Boolean | Sí | `TRUE` (activa) / `FALSE` (desactivada). |
| **D** | `created_at` | String (ISO UTC) | Sí | Timestamp de creación. |
| **E** | `updated_at` | String (ISO UTC) | Sí | Timestamp de modificación. |

---

### Pestaña 3: `Actividades`
Registra cada servicio o venta acordado con un cliente.

| Columna | Nombre de Campo | Tipo | Requerido | Descripción |
| :---: | :--- | :--- | :---: | :--- |
| **A** | `id` | String (`act_...`) | Sí | Clave primaria de la actividad. |
| **B** | `client_id` | String (`cli_...`) | Sí | Clave foránea al cliente. |
| **C** | `type` | String (`service`\|`sale`) | Sí | Tipo de actividad. |
| **D** | `category_id` | String (`cat_...`) | Sí | Clave foránea a la categoría. |
| **E** | `title` | String (máx 200) | Sí | Título libre descriptivo. |
| **F** | `description` | String (máx 10000) | No | Detalle del servicio prestado o artículos vendidos. |
| **G** | `activity_date` | String (`YYYY-MM-DD`) | Sí | Fecha en que se realizó o pactó la actividad. |
| **H** | `total_value` | Entero (COP) | Sí | Valor total acordado (ej: `250000`). |
| **I** | `status` | String | Sí | `pending`, `in_progress`, `completed`, `cancelled`. |
| **J** | `internal_notes` | String (máx 5000) | No | Notas privadas (estrictamente excluidas del PDF). |
| **K** | `public_notes` | String (máx 5000) | No | Observaciones públicas para el cliente (impresas en PDF). |
| **L** | `created_at` | String (ISO UTC) | Sí | Timestamp de creación. |
| **M** | `updated_at` | String (ISO UTC) | Sí | Timestamp de modificación. |
| **N** | `request_id` | String | No | Clave de idempotencia para `createActivity`. |
| **O** | `request_action` | String | No | Acción asociada al reintento (`createActivity`). |
| **P** | `request_fingerprint` | String | No | Huella SHA-256 en Base64 del payload original. |

---

### Pestaña 4: `Pagos`
Registra los abonos y pagos completos recibidos para las actividades.

| Columna | Nombre de Campo | Tipo | Requerido | Descripción |
| :---: | :--- | :--- | :---: | :--- |
| **A** | `id` | String (`pay_...`) | Sí | Clave primaria del pago. |
| **B** | `activity_id` | String (`act_...`) | Sí | Clave foránea a la actividad correspondiente. |
| **C** | `payment_date` | String (`YYYY-MM-DD`) | Sí | Fecha en que ingresó el dinero. |
| **D** | `amount` | Entero (COP > 0) | Sí | Monto abonado (mayor a cero). |
| **E** | `payment_method` | String | Sí | `transferencia_bancaria`, `nequi`, `daviplata`, `efectivo`, `tarjeta`, `otro`. |
| **F** | `notes` | String (máx 5000) | No | Comprobante, referencia o detalle del pago. |
| **G** | `created_at` | String (ISO UTC) | Sí | Timestamp de registro. |
| **H** | `request_id` | String | No | Clave de idempotencia para `addPayment`. |
| **I** | `request_action` | String | No | Acción asociada al reintento (`addPayment`). |
| **J** | `request_fingerprint` | String | No | Huella SHA-256 en Base64 del payload original. |

---

### Pestaña 5: `Configuracion`
Almacena pares clave-valor para los datos del emisor y el comprobante PDF.

| Columna | Nombre de Campo | Tipo | Descripción |
| :---: | :--- | :--- | :--- |
| **A** | `key` | String | Clave única (`owner_name`, `business_name`, `owner_phone`, `owner_email`, `payment_instructions`, `logo_url_or_base64`). |
| **B** | `value` | String | Valor asociado. |
| **C** | `updated_at` | String (ISO UTC) | Timestamp de actualización. |

---

## 3. Lógica Autoritativa de Saldos y Estados Derivados

Para asegurar la coherencia financiera, los saldos se calculan autoritativamente a partir del histórico de pagos:

1. **Dinero Recibido por Actividad**:
   $$\text{total\_received} = \sum_{\text{pago} \in \text{Pagos}(\text{actividad})} \text{pago.amount}$$

2. **Saldo Pendiente por Cobrar**:
   $$\text{balance\_pending} = 
   \begin{cases} 
   0 & \text{si } \text{status} = \text{'cancelled'} \\
   \max(0, \text{total\_value} - \text{total\_received}) & \text{en otro caso}
   \end{cases}$$

3. **Estado Derivado de Pago (`payment_status`)**:
   $$\text{payment\_status} = 
   \begin{cases} 
   \text{'pending'} & \text{si status = 'cancelled' y total\_received = 0} \\
   \text{'partial'} & \text{si status = 'cancelled' y total\_received > 0} \\
   \text{'paid'} & \text{si status} \neq \text{'cancelled' y total\_received} \ge \text{total\_value} \\
   \text{'partial'} & \text{si status} \neq \text{'cancelled' y total\_received > 0 y balance\_pending > 0} \\
   \text{'pending'} & \text{si total\_received = 0}
   \end{cases}$$

---

## 4. Reglas Estrictas para Modificar el Esquema de Sheets

Al evolucionar o realizar tareas de mantenimiento en el modelo de datos:

1. **Política Estricta Append-Only**:
   - Nuevos campos solo pueden agregarse al **final** de la lista de cabeceras de cada pestaña.
   - El script de Apps Script (`getOrCreateSheet`) añade automáticamente las columnas que falten al final sin alterar las filas existentes.
2. **Prohibición de Reordenar, Renombrar o Eliminar**:
   - Nunca cambies de orden las columnas existentes ni las renombres.
   - Si `getOrCreateSheet` encuentra cabeceras en un orden diferente, lanzará el error `SCHEMA_MISMATCH`.
3. **Manejo de Idempotencia**:
   - Las columnas `request_id`, `request_action` y `request_fingerprint` deben permanecer en las pestañas `Clientes`, `Actividades` y `Pagos`.
4. **Respaldo Obligatorio**:
   - Antes de realizar cualquier cambio manual de estructura en el archivo de Google Sheets, crea una copia de respaldo completa de la hoja de cálculo.

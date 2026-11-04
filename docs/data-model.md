# Modelo de Datos y Estructura en Google Sheets

La persistencia del sistema reside en un Google Spreadsheet privado compuesto por **5 pestañas canónicas**. Las tres pestañas que contienen escrituras deduplicables tienen columnas de idempotencia adicionales, descritas abajo.

---

## 1. Convenciones Generales de Datos

1. **Fila 1 (Cabecera congelada)**: Contiene los nombres exactos de los campos en minúsculas con guiones bajos (`snake_case`).
2. **Identificadores (Columna A)**:
   - Cadena de texto única con prefijo semántico + UUID v4.
   - Jamás se utiliza la posición física de la fila como identificador foráneo.
3. **Moneda (COP)**:
   - Todo monto (`total_value`, `amount`, `balance_pending`, `total_received`) se almacena como **número entero** en pesos colombianos.
   - No se almacenan símbolos de moneda ni separadores de miles en la columna de datos crudos (el formateo visual `$ 150.000` lo realiza la capa de presentación).
4. **Fechas**:
   - Fechas de negocio (`activity_date`, `payment_date`): Cadena estricta `YYYY-MM-DD`.
   - Timestamps de auditoría (`created_at`, `updated_at`): Cadena ISO 8601 UTC `YYYY-MM-DDTHH:mm:ss.sssZ`.

---

## 2. Esquema Detallado de Pestañas

### Pestaña 1: `Clientes`
Almacena el directorio de clientes del trabajador independiente.

| Columna | Nombre de Campo | Tipo | Requerido | Descripción |
| :---: | :--- | :--- | :---: | :--- |
| **A** | `id` | String (`cli_...`) | Sí | Clave primaria generada por el sistema. |
| **B** | `name` | String | Sí | Nombre o razón social del cliente. |
| **C** | `phone` | String | No | Teléfono o celular de contacto. |
| **D** | `email` | String | No | Correo electrónico de contacto. |
| **E** | `notes` | String | No | Observaciones internas sobre el cliente. |
| **F** | `is_active` | Boolean | Sí | `TRUE` (activo) / `FALSE` (archivado). |
| **G** | `created_at` | String (ISO UTC) | Sí | Fecha/hora de creación. |
| **H** | `updated_at` | String (ISO UTC) | Sí | Fecha/hora de última modificación. |
| **I** | `request_id` | String | No | Clave de idempotencia para `createClient`; vacía en registros anteriores o no idempotentes. |
| **J** | `request_action` | String | No | Acción asociada al identificador de reintento. |
| **K** | `request_fingerprint` | String | No | Huella SHA-256 codificada en Base64 del payload (sin `request_id`). |

---

### Pestaña 2: `Categorias`
Permite clasificar las actividades en grupos editables.

| Columna | Nombre de Campo | Tipo | Requerido | Descripción |
| :---: | :--- | :--- | :---: | :--- |
| **A** | `id` | String (`cat_...`) | Sí | Clave primaria generada. |
| **B** | `name` | String | Sí | Nombre de la categoría (ej: "Desarrollo web"). |
| **C** | `is_active` | Boolean | Sí | `TRUE` (activa) / `FALSE` (desactivada). |
| **D** | `created_at` | String (ISO UTC) | Sí | Fecha/hora de creación. |
| **E** | `updated_at` | String (ISO UTC) | Sí | Fecha/hora de modificación. |

---

### Pestaña 3: `Actividades`
Registra cada servicio o venta acordado con un cliente.

| Columna | Nombre de Campo | Tipo | Requerido | Descripción |
| :---: | :--- | :--- | :---: | :--- |
| **A** | `id` | String (`act_...`) | Sí | Clave primaria de la actividad. |
| **B** | `client_id` | String (`cli_...`) | Sí | Clave foránea al cliente. |
| **C** | `type` | String (`service`\|`sale`) | Sí | Tipo de actividad. |
| **D** | `category_id` | String (`cat_...`) | Sí | Clave foránea a la categoría. |
| **E** | `title` | String | Sí | Título libre descriptivo. |
| **F** | `description` | String (Texto largo) | No | Detalle del servicio o artículos vendidos. |
| **G** | `activity_date` | String (`YYYY-MM-DD`) | Sí | Fecha en que se realizó o pactó la actividad. |
| **H** | `total_value` | Entero (COP) | Sí | Valor total acordado (ej: `250000`). |
| **I** | `status` | String | Sí | `pending`, `in_progress`, `completed`, `cancelled`. |
| **J** | `internal_notes` | String | No | Notas privadas (NUNCA van al PDF). |
| **K** | `public_notes` | String | No | Observaciones públicas para el PDF. |
| **L** | `created_at` | String (ISO UTC) | Sí | Fecha/hora de creación. |
| **M** | `updated_at` | String (ISO UTC) | Sí | Fecha/hora de modificación. |
| **N** | `request_id` | String | No | Clave de idempotencia para `createActivity`. |
| **O** | `request_action` | String | No | Acción asociada al identificador de reintento. |
| **P** | `request_fingerprint` | String | No | Huella SHA-256 codificada en Base64 del payload (sin `request_id`). |

---

### Pestaña 4: `Pagos`
Registra los abonos y pagos completos recibidos para las actividades.

| Columna | Nombre de Campo | Tipo | Requerido | Descripción |
| :---: | :--- | :--- | :---: | :--- |
| **A** | `id` | String (`pay_...`) | Sí | Clave primaria del pago. |
| **B** | `activity_id` | String (`act_...`) | Sí | Clave foránea a la actividad correspondiente. |
| **C** | `payment_date` | String (`YYYY-MM-DD`) | Sí | Fecha en que ingresó el dinero. |
| **D** | `amount` | Entero (COP) | Sí | Monto abonado (mayor a cero). |
| **E** | `payment_method` | String | Sí | `transferencia_bancaria`, `nequi`, `daviplata`, `efectivo`, `tarjeta`, `otro`. |
| **F** | `notes` | String | No | Comprobante, referencia o detalle del pago. |
| **G** | `created_at` | String (ISO UTC) | Sí | Fecha/hora de registro. |
| **H** | `request_id` | String | No | Clave de idempotencia para `addPayment`. |
| **I** | `request_action` | String | No | Acción asociada al identificador de reintento. |
| **J** | `request_fingerprint` | String | No | Huella SHA-256 codificada en Base64 del payload (sin `request_id`). |

---

### Pestaña 5: `Configuracion`
Almacena pares clave-valor para los datos del emisor y el comprobante PDF.

| Columna | Nombre de Campo | Tipo | Descripción |
| :---: | :--- | :--- | :--- |
| **A** | `key` | String | Clave única (`owner_name`, `business_name`, `owner_phone`, `owner_email`, `payment_instructions`, `logo_url_or_base64`). |
| **B** | `value` | String | Valor asociado. |
| **C** | `updated_at` | String (ISO UTC) | Fecha/hora de actualización. |

---

## 3. Lógica Autoritativa de Saldos y Estados Derivados

Para garantizar que no existan discrepancias entre pestañas o cálculos erróneos en el cliente, la autoridad de cálculo se define así:

$$\text{total\_received} = \sum_{\text{pago} \in \text{Pagos}(\text{actividad})} \text{pago.amount}$$

$$\text{balance\_pending} = 
\begin{cases} 
0 & \text{si status} = \text{'cancelled'} \\
\max(0, \text{total\_value} - \text{total\_received}) & \text{en otro caso}
\end{cases}$$

$$\text{payment\_status} = 
\begin{cases} 
\text{'pending'} & \text{si status = 'cancelled' y total\_received = 0} \\
\text{'partial'} & \text{si status = 'cancelled' y total\_received > 0} \\
\text{'paid'} & \text{si status} \neq \text{'cancelled' y total\_received} \ge \text{total\_value} \\
\text{'partial'} & \text{si status} \neq \text{'cancelled' y total\_received > 0 y balance\_pending > 0} \\
\text{'pending'} & \text{si total\_received = 0}
\end{cases}$$

## 4. Compatibilidad e idempotencia

- Al utilizar una hoja existente, Apps Script conserva todas las filas y columnas y agrega al final las columnas faltantes, sin borrar datos. Las cabeceras existentes deben coincidir con el orden canónico; ante una discrepancia se devuelve `SCHEMA_MISMATCH`.
- Antes de volver a ejecutar tras un fallo de estructura, realiza una copia de seguridad. La actualización automática solo añade cabeceras; no cambia ni elimina registros personales.
- La deduplicación se aplica a `createClient`, `createActivity` y `addPayment`. Clave y registro quedan juntos en la misma fila para sobrevivir reinicios/instancias del runtime. Se toma `ScriptLock` antes de buscar la clave y escribir.
- Google Sheets no ofrece transacciones. Si una operación falla antes de guardar una fila completa, no hay garantía general de rollback; ante respuesta incierta, reintenta con el mismo `request_id` y contenido. No prometemos exactly-once ni atomicidad transaccional.

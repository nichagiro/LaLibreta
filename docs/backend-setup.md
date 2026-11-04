# Preparación y Despliegue del Backend (Google Apps Script)

## 1. Arquitectura de Persistencia y Seguridad

La aplicación es una SPA estática que utiliza **Google Apps Script** como puente de persistencia hacia un Google Spreadsheet privado:

- **Sin servidores propios**: Se aloja y ejecuta enteramente en la infraestructura serverless de Google.
- **Acceso por Token Personal**: Cada petición `POST` se autentica comparando el campo `token` recibido en el cuerpo JSON con la propiedad `AUTH_TOKEN` configurada en las *Script Properties* de Apps Script.
- **Diferencia con el planteamiento inicial de OAuth**: No se implementó autorización OAuth/GIS desde el navegador debido a la complejidad de gestión de pantallas de consentimiento en Google Cloud Console para uso individual. La Web App se ejecuta con la identidad del propietario ("Ejecutar como: Yo") y acceso "Cualquier usuario" para recibir los POST de la SPA.

> [!WARNING]
> **Límite de Seguridad del Token en el Frontend**:
> El valor `VITE_APP_AUTH_TOKEN` se compila directamente en los archivos estáticos de la SPA. Cualquiera que acceda al bundle puede extraer el token. Este modelo está diseñado y aceptado exclusivamente para **uso personal y privado**. No debe usarse para aplicaciones compartidas con múltiples usuarios o expuestas al público.

---

## 2. Estado Actual de la Integración

| Componente | Estado Actual | Verificación Realizada |
| :--- | :---: | :--- |
| **Código Apps Script (`Code.gs`)** | ✅ Completo | Implementa las 15 acciones de la API, bloqueo con `LockService` y deduplicación. |
| **Pruebas Automatizadas Backend** | ✅ Aprobado | 12/12 pruebas unitarias aprobadas con dobles locales de Apps Script (`npm run test:backend`). |
| **Despliegue Real en Google** | ⏳ Pendiente | Requiere que el propietario cree la hoja privada, copie el código y genere la URL `/exec`. |
| **Pruebas contra Google Real** | ⏳ Pendiente | No se ejecutaron escrituras contra endpoints de Google para proteger datos y privacidad. |

---

## 3. Guía Paso a Paso para el Despliegue en Google

### Paso 1: Crear la Hoja de Cálculo Privada
1. En Google Drive, crea una nueva hoja de cálculo llamada `Control de Ingresos`.
2. Mantenla **100% privada** (no compartir mediante enlace público). No es necesario crear pestañas: el script las creará automáticamente en su primera ejecución.

### Paso 2: Abrir el Editor de Apps Script
1. En la hoja de cálculo, abre el menú superior **Extensiones → Apps Script**.
2. Borra el código de ejemplo y copia íntegramente el contenido del archivo [`apps-script/Code.gs`](file:///C:/Users/djcha/Documents/Code/Ingresos/apps-script/Code.gs).

### Paso 3: Configurar el Token Secreto
1. En el menú lateral izquierdo de Apps Script, haz clic en ⚙️ **Configuración del proyecto**.
2. En la sección **Propiedades de la secuencia de comandos**, haz clic en **Agregar propiedad de la secuencia de comandos**:
   - **Propiedad**: `AUTH_TOKEN`
   - **Valor**: Un token aleatorio y seguro (ejemplo: cadena aleatoria de más de 20 caracteres).
3. Guarda los cambios.

### Paso 4: Implementar como Aplicación Web (Web App)
1. En la esquina superior derecha, haz clic en **Implementar → Nueva implementación**.
2. Selecciona el tipo ⚙️ **Aplicación web**.
3. Configuración obligatoria:
   - **Descripción**: `API v1 Control de Ingresos`
   - **Ejecutar como**: `Yo (tu_cuenta@gmail.com)` *(garantiza que el script acceda a tu hoja privada)*.
   - **Quién tiene acceso**: `Cualquier usuario` *(permite que la SPA envíe peticiones POST autenticadas por el token)*.
4. Haz clic en **Implementar** y autoriza los permisos solicitados en la ventana emergente de Google.
5. Copia la **URL de la aplicación web** generada (termina en `/exec`).

### Paso 5: Configurar el Entorno Local
1. En la raíz del proyecto local, crea un archivo `.env` a partir de `.env.example`:
   ```env
   VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/TU_SCRIPT_ID/exec
   VITE_APP_AUTH_TOKEN=el_mismo_token_que_configuraste_en_apps_script
   VITE_APP_TITLE="Control de Ingresos"
   VITE_DEFAULT_CURRENCY=COP
   VITE_TIMEZONE=America/Bogota
   ```
2. Inicia la aplicación con `npm run dev`.
3. Ve a **Configuración → Persistencia y Conectividad** y pulsa **Probar Conexión con Apps Script (Ping)** para validar la comunicación.

---

## 4. Manejo de Reintentos e Idempotencia

Las operaciones de creación (`createClient`, `createActivity` y `addPayment`) requieren un `request_id` generado por el cliente:
- El script guarda dicho `request_id`, la acción y una huella SHA-256 del payload en la fila persistida.
- Si una petición de red se interrumpe y la SPA reintenta con el mismo `request_id` y mismo payload, Apps Script devuelve el registro ya creado sin duplicarlo.
- Si se envía el mismo `request_id` con datos diferentes, la API responde con error `IDEMPOTENCY_CONFLICT`.

---

## 5. Reglas de Seguridad en Tareas de Mantenimiento

- **Nunca** ejecutes pruebas automatizadas de escritura contra la hoja real del usuario.
- **Nunca** expongas tokens ni URLs de producción en el repositorio público ni en `.env.example`.
- Si necesitas probar cambios de lógica en `Code.gs`, hazlo con los tests de dobles en `apps-script/tests/backend.test.cjs` o sobre una hoja de prueba aislada.

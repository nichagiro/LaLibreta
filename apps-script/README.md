# Despliegue de Google Apps Script (Persistencia Directa)

Este proyecto utiliza Google Sheets como base de datos privada a través de una **Web App de Google Apps Script**, sin necesidad de servidores intermedios ni exposición de claves privadas de Google Cloud en el cliente.

> **Seguridad:** `VITE_APP_AUTH_TOKEN` se publica en el bundle estático y no es un secreto robusto. Mantén el despliegue privado/de uso personal. No compartas la hoja y no pongas credenciales privadas de Google en `VITE_*`. Consulta la guía completa en [docs/backend-setup.md](../docs/backend-setup.md).

---

## Pasos para la Configuración

1. **Crear o Abrir la Hoja de Google Sheets**:
   - Crea una hoja de cálculo nueva en Google Drive (ej: `Control de Ingresos - DJCHA`).
   - Mantenla **100% privada** (no compartir públicamente).

2. **Abrir el Editor de Apps Script**:
   - En la hoja de cálculo, ve al menú superior: `Extensiones` > `Apps Script`.

3. **Copiar el Código**:
   - Reemplaza todo el contenido del archivo `Código.gs` con el código presente en [Code.gs](file:///C:/Users/djcha/Documents/Code/Ingresos/apps-script/Code.gs).

4. **Configurar el Token de Seguridad**:
   - En el menú lateral izquierdo de Apps Script, haz clic en el ícono de engranaje ⚙️ **Configuración del proyecto**.
   - Baja a la sección **Propiedades de la secuencia de comandos**.
   - Haz clic en **Agregar propiedad**:
     - **Propiedad**: `AUTH_TOKEN`
     - **Valor**: Una contraseña o token largo y seguro que tú elijas (ej: `clave_secreta_ingresos_2026`).
   - Guarda los cambios.

5. **Implementar como Aplicación Web (Web App)**:
   - En la esquina superior derecha, haz clic en **Implementar** > **Nueva implementación**.
   - Selecciona el tipo: ⚙️ **Aplicación web**.
   - Configura:
     - **Descripción**: `API v1 Control de Ingresos`
     - **Ejecutar como**: `Yo (tu_cuenta@gmail.com)` *(Fundamental: así el script usa tus permisos privados de acceso a la hoja)*.
     - **Quién tiene acceso**: `Cualquier usuario` *(Permite que el frontend envíe peticiones POST; el script filtrará el acceso validando el `AUTH_TOKEN`)*.
   - Haz clic en **Implementar** y autoriza los permisos solicitados en la ventana emergente.

6. **Copiar la URL Web App a `.env`**:
   - Copia la **URL de la aplicación web** generada (termina en `/exec`).
   - En el proyecto frontend, crea un archivo `.env` basado en `.env.example`:
     ```env
     VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/TU_SCRIPT_ID/exec
     VITE_APP_AUTH_TOKEN=la_misma_clave_que_pusiste_en_script_properties
     ```

7. **Probar la Conexión**:
   - Ejecuta `npm run dev` en el frontend y haz clic en el botón **"Probar conexión (Ping)"** en la pantalla principal.
   - El sobre JSON, no el estado HTTP, comunica el resultado. Apps Script `ContentService` no permite fijar estados HTTP 4xx/5xx.

> No despliegues ni ejecutes operaciones contra una hoja con datos reales durante pruebas. Usa una hoja de desarrollo autorizada.

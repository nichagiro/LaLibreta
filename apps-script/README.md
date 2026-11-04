# Despliegue de Google Apps Script (Persistencia Directa)

Este proyecto utiliza **Google Sheets** como base de datos privada mediante una **Web App en Google Apps Script**, prescindiendo de servidores propios.

> [!WARNING]
> **Seguridad y Acceso**: `VITE_APP_AUTH_TOKEN` se compila en el bundle estático y es visible en el navegador. Mantén la hoja privada y utiliza este mecanismo exclusivamente para uso personal. Para mayores detalles de arquitectura, consulta [`docs/backend-setup.md`](file:///C:/Users/djcha/Documents/Code/Ingresos/docs/backend-setup.md).

---

## Estado Actual de la Integración

- **Backend (`Code.gs`)**: 100% implementado y validado mediante 12 pruebas automatizadas locales (`npm run test:backend`).
- **Despliegue en Google**: Pendiente de realización por parte del propietario en su cuenta personal de Google Drive.

---

## Pasos Rápidos de Despliegue

1. **Crear la Hoja de Google Sheets**:
   - En Google Drive, crea una hoja de cálculo nueva y mantenla privada (sin compartir con terceros).
2. **Abrir el Editor**:
   - Menú superior: **Extensiones → Apps Script**.
3. **Copiar el Código**:
   - Pega todo el contenido de [`Code.gs`](file:///C:/Users/djcha/Documents/Code/Ingresos/apps-script/Code.gs) en el archivo principal del editor.
4. **Configurar el Token en Script Properties**:
   - ⚙️ **Configuración del proyecto → Propiedades de la secuencia de comandos**.
   - Agrega la propiedad `AUTH_TOKEN` con un valor aleatorio y seguro.
5. **Implementar como Web App**:
   - **Implementar → Nueva implementación → Aplicación web**.
   - **Ejecutar como**: `Yo (tu_cuenta@gmail.com)`.
   - **Quién tiene acceso**: `Cualquier usuario`.
   - Haz clic en **Implementar** y autoriza los permisos requeridos.
6. **Configurar en el Frontend**:
   - En tu archivo `.env` local, asigna la URL `/exec` generada a `VITE_APPS_SCRIPT_URL` y tu token a `VITE_APP_AUTH_TOKEN`.
7. **Probar la Conexión**:
   - Abre la aplicación, navega a **Configuración** y haz clic en **Probar Conexión con Apps Script (Ping)**.

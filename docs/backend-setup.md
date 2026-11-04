# Preparación y despliegue del backend

## Arquitectura y seguridad

La aplicación continúa siendo una SPA estática. La API se ejecuta en Google Apps Script vinculado a una hoja privada y se despliega como Web App ejecutada como propietario. No se requiere ni se añade un servidor Node en producción.

El acceso se valida en cada `POST` comparando el token con `Script Properties.AUTH_TOKEN`. **El token `VITE_APP_AUTH_TOKEN` se publica en el bundle de la SPA** y puede extraerse desde el navegador o los archivos estáticos. No es una clave privada ni una autenticación robusta; CORS tampoco autentica. El diseño mantiene esta decisión personal existente, así que debe usarse solo en un despliegue privado y no compartido. Si se requiere protección frente a terceros, hay que revisar la arquitectura para introducir identidad autenticada en servidor antes de publicar datos personales. No almacenar credenciales de servicio o claves privadas en `VITE_*`.

La hoja no debe publicarse ni compartirse con el público. El script debe ejecutarse con la cuenta propietaria y recibir solo el permiso de Google Sheets que solicite Apps Script para operar en la hoja vinculada. No otorgues permisos de edición a usuarios no autorizados.

## Preparar el Spreadsheet

1. Crea una hoja de cálculo exclusiva para desarrollo/pruebas manuales y mantenla privada. No se requiere crear pestañas manualmente: el script crea las pestañas canónicas al utilizarlas por primera vez.
2. Desde la hoja, abre **Extensiones → Apps Script** y copia el contenido de `apps-script/Code.gs`.
3. En **Configuración del proyecto → Propiedades de la secuencia de comandos**, agrega `AUTH_TOKEN` con un valor aleatorio largo. No lo compartas ni lo pongas en archivos versionados.
4. Ejecuta el despliegue como **Aplicación web**, **Ejecutar como: yo**. La política de acceso debe permitir las llamadas de la SPA y depende de las opciones que Google muestre para la cuenta; no publiques la hoja.
5. Autoriza los permisos solicitados, confirma que el propietario es la cuenta esperada y copia la URL `/exec`.
6. Copia `.env.example` a `.env` local y configura `VITE_APPS_SCRIPT_URL` y `VITE_APP_AUTH_TOKEN`. No envíes el `.env` ni incluyas tokens reales en capturas, logs o commits. Todo `VITE_*` queda expuesto al navegador.
7. Usa `ping` desde la SPA para comprobar el endpoint. Para pruebas con datos, utiliza solamente una hoja de desarrollo autorizada.

## Cambios de esquema existentes

Se conservan las cinco pestañas existentes (`Clientes`, `Categorias`, `Actividades`, `Pagos`, `Configuracion`). Al ejecutar una acción, el script comprueba las cabeceras y agrega las columnas faltantes al final, sin modificar ni borrar filas. En `Clientes`, `Actividades` y `Pagos` se agregan `request_id`, `request_action` y `request_fingerprint` para idempotencia. Una cabecera no coincidente produce `SCHEMA_MISMATCH`; corrige el esquema manualmente después de hacer una copia de seguridad, no renombres ni elimines columnas con datos.

No se ejecutó una migración ni se modificó ninguna hoja Google durante esta implementación.

## Reintentos y garantías

Para `createClient`, `createActivity` y `addPayment`, genera un `request_id` aleatorio y persistente por operación lógica y reutiliza exactamente el mismo ID y payload si la respuesta se pierde o queda incierta. No generes uno nuevo al reintentar. El backend guarda ID y huella del payload en la fila de la entidad bajo `LockService`; reutilizar el ID con otro contenido da `IDEMPOTENCY_CONFLICT`.

`LockService` serializa la ejecución del script, pero Google Sheets no ofrece transacciones. No se garantiza rollback ni exactly-once ante todos los fallos externos. Ante un resultado incierto, consulta los registros y/o reintenta con la misma clave. El contrato de `ContentService` devuelve los errores en el sobre JSON y no permite asignar códigos HTTP de error a la respuesta.

## Pruebas y comandos

Las pruebas automatizadas simulan Apps Script y Google Sheets, sin enviar peticiones a Google:

```bash
npm run test:backend
npm run typecheck
npm run lint
npm run build
```

Las pruebas reales contra Google no se ejecutaron: no se proporcionaron credenciales, despliegue ni hoja de desarrollo autorizada. No se deben probar contra hojas con datos personales.

## Límites

- Token en cliente estático expuesto a cualquiera que obtenga el bundle.
- Sin transacciones de base de datos, rollback garantizado ni códigos HTTP personalizados en `ContentService`.
- La aplicación debe tratar `success` y `error.code` del JSON como resultado autoritativo.
- No crear recursos Google, desplegar Apps Script ni modificar datos reales sin autorización explícita.

# Documento de Traspaso (Handoff) de Arquitectura y Coordinación

> **Emitido por**: Sesión 1 (Arquitectura y Coordinación Técnica)  
> **Fecha**: 2026-11-04  
> **Destinatarios**: Sesión 2 (Diseño y Sistema UI), Sesión 3 (Persistencia y Google Sheets), Sesión 4 (Frontend e Integración).

---

## 1. Estado Actual de la Base del Proyecto

1. **Entorno y Repositorio**:
   - Ruta física: `C:\Users\djcha\Documents\Code\Ingresos`
   - Repositorio Git local inicializado.
   - Node.js fijado en **`v24.22.0`** (con soporte LTS moderno).
2. **Build Estático SPA**:
   - React 18 + Vite 5 + TypeScript 5 + Tailwind CSS configurados.
   - Compilación estática comprobada en `dist/` (sin SSR, sin servidor Node en producción).
3. **Contratos y Persistencia**:
   - Contratos de tipos TypeScript completos en [index.ts](file:///C:/Users/djcha/Documents/Code/Ingresos/src/types/index.ts).
   - Adaptador cliente de persistencia en [sheets-api.ts](file:///C:/Users/djcha/Documents/Code/Ingresos/src/services/sheets-api.ts).
   - Script para Google Apps Script en [Code.gs](file:///C:/Users/djcha/Documents/Code/Ingresos/apps-script/Code.gs), que usa peticiones `text/plain` para evitar preflight. El comportamiento CORS requiere validación con una Web App desplegada; no se considera sustituible por autenticación.
   - Documentación técnica rectora en `docs/` y gobernanza en `AGENTS.md`.

---

## 2. Instrucciones de Inicio para la Sesión 2: Diseño y Sistema UI

### Misión
Crear el sistema de diseño visual, paleta de colores intencional, tipografía y componentes atómicos de UI en Tailwind CSS, evitando componentes genéricos de IA.

### Pasos Iniciales
1. Lee obligatoriamente la skill: [SKILL.md](file:///C:/Users/djcha/Documents/Code/Ingresos/.agents/skills/frontend-design/SKILL.md).
2. Zona autorizada de trabajo:
   - `src/components/ui/` (Botones, Inputs, Modales, Tablas, Badges de estado, Selectores).
   - `src/theme/` (Constantes de diseño o tokens).
   - `tailwind.config.js` y `src/index.css`.
3. Estados visuales a contemplar:
   - Badges para estados operativos de actividad (`pending`, `in_progress`, `completed`, `cancelled`).
   - Badges para estados de pago (`pending`, `partial`, `paid`).
   - Tipografía clara para valores numéricos en COP (resaltando montos y saldos).
4. No toques archivos de persistencia (`apps-script/`) ni lógica de negocio profunda (`src/features/`).

---

## 3. Instrucciones de Inicio para la Sesión 3: Persistencia y Google Sheets

### Misión
Validar, desplegar y refinar la capa de almacenamiento en Google Sheets mediante el script de Google Apps Script y su adaptador de llamadas.

### Pasos Iniciales
1. Consulta la guía de despliegue en [README.md](file:///C:/Users/djcha/Documents/Code/Ingresos/apps-script/README.md).
2. Revisa el código del script en [Code.gs](file:///C:/Users/djcha/Documents/Code/Ingresos/apps-script/Code.gs) y el modelo de datos en [data-model.md](file:///C:/Users/djcha/Documents/Code/Ingresos/docs/data-model.md).
3. Zona autorizada de trabajo:
   - `apps-script/Code.gs`
   - `src/services/sheets-api.ts`
4. Asegurar que el cálculo autoritativo de saldos no permita sobrepagos y que las actividades canceladas mantengan saldo pendiente igual a 0.

---

## 4. Instrucciones de Inicio para la Sesión 4: Frontend e Integración

### Misión
Construir las vistas de negocio, formularios, filtros por período, historial de clientes y la generación del comprobante PDF en el navegador.

### Pasos Iniciales
1. Lee obligatoriamente la skill: [SKILL.md](file:///C:/Users/djcha/Documents/Code/Ingresos/.agents/skills/vercel-react-best-practices/SKILL.md) (aplicando las reglas para React SPA / Vite).
2. Zona autorizada de trabajo:
   - `src/features/` (clientes, actividades, pagos, categorías, resumen).
   - Módulo de generación de PDF en cliente (utilizando `@react-pdf/renderer` o motor similar ligero).
3. Asegurar que el PDF nunca incluya `internal_notes` y no use terminología de factura electrónica de la DIAN.

---

## 5. Verificaciones Mandatorias
Antes de entregar cualquier cambio:
- `npm run typecheck`
- `npm run lint`
- `npm run build`

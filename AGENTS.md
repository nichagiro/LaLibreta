# Guía de Coordinación y Gobernanza de Agentes (AGENTS.md)

Este documento define el marco de colaboración estricto para el desarrollo modular de la aplicación **Control de Ingresos para Trabajador Independiente**, ejecutado mediante **cuatro sesiones independientes de OpenCode**.

---

## 1. Mapa de Responsabilidades por Sesión

| Sesión | Rol Principal | Zonas Autorizadas de Archivos | Skills a Consultar |
| :--- | :--- | :--- | :--- |
| **Sesión 1** | **Arquitectura y Coordinación** *(Sesión activa)* | Raíz (`package.json`, `tsconfig*`, `vite.config.ts`, `.env.example`, `.gitignore`), `docs/*`, `AGENTS.md`, `README.md`, `src/types/index.ts`. | `find-skills`, `agy-customizations` |
| **Sesión 2** | **Diseño y Sistema UI** | `src/components/ui/*`, `src/theme/*`, `tailwind.config.js` (solo tokens de diseño/colores/fuentes), `src/index.css`. | `frontend-design` |
| **Sesión 3** | **Persistencia y Google Sheets** | `apps-script/*`, `src/services/sheets-api.ts`. | Directrices de Sheets API / Google Apps Script |
| **Sesión 4** | **Frontend e Integración** | `src/features/*`, componentes de integración de negocio, generación de PDF, orquestación de llamadas a servicios. | `vercel-react-best-practices` |

> [!CAUTION]
> **Aislamiento de Zonas**: Ninguna sesión debe modificar archivos fuera de sus zonas asignadas sin documentarlo formalmente en `docs/handoffs/`. Si se requieren nuevas dependencias en `package.json` o cambios en contratos de tipos compartidos (`src/types/index.ts`), deben coordinarse a través de la Sesión 1.

---

## 2. Convenciones Globales del Proyecto

1. **Build Estático Puro (SPA)**:
   - El proyecto se compila a HTML/CSS/JS estático mediante `npm run build` en el directorio `dist/`.
   - Cero servidores Node en producción y cero SSR. No migrar a Next.js.
2. **Moneda y Finanzas**:
   - Moneda única: **COP** (Pesos Colombianos).
   - Representación: **Enteros** (sin decimales, sin coma flotante). Ejemplo: `$ 180.000 COP` -> `180000`.
   - **Prohibido usar el término "Ganancia"** para cobros brutos o ingresos recibidos. Usar "Dinero Recibido" o "Total Cobrado".
3. **Fechas y Tiempos**:
   - Fechas de negocio (`activity_date`, `payment_date`): formato ISO estricto `YYYY-MM-DD`.
   - Zona horaria de referencia: `America/Bogota` (UTC-5).
   - Timestamps de auditoría (`created_at`, `updated_at`): ISO 8601 UTC completo `YYYY-MM-DDTHH:mm:ss.sssZ`.
4. **Identificadores Estables**:
   - Los registros de Sheets no usan el número de fila como ID. Usan prefijos semánticos generados:
     - `cli_...` (Clientes)
     - `cat_...` (Categorías)
     - `act_...` (Actividades)
     - `pay_...` (Pagos)
5. **Idioma**:
   - Código, nombres de variables y tipos en inglés técnico conciso (`total_value`, `balance_pending`, `payment_method`).
   - Textos de interfaz, mensajes de error y documentación en **Español** para el usuario.

---

## 3. Protocolo de Consulta de Skills

### Para la Sesión 2: `frontend-design`
- **Ubicación**: `.agents/skills/frontend-design/SKILL.md`.
- **Momento de consulta**: Antes de implementar cualquier componente visual o layout.
- **Enfoque**: Diseñar una interfaz con personalidad propia, tipografía intencional y contraste equilibrado. Evitar la estética genérica de "tarjetas con sombras idénticas" o botones redondeados con gradientes predeterminados de IA.

### Para la Sesión 4: `vercel-react-best-practices`
- **Ubicación**: `.agents/skills/vercel-react-best-practices/SKILL.md`.
- **Momento de consulta**: Al crear hooks, formularios y componentes de datos.
- **Enfoque (solo reglas aplicables a React + Vite)**:
  - Eliminar cascadas asíncronas (`async-parallel`, `async-defer-await`).
  - Optimizar re-renderizados innecesarios (`rerender-functional-setstate`, `rerender-derived-state-no-effect`).
  - Reducción de bundle y dependencias redundantes (`bundle-barrel-imports`).
  - *Descartar reglas exclusivas de Next.js* (Server Components, Server Actions o `next/image`).

---

## 4. Comandos de Verificación Obligatorios

Antes de dar por concluida cualquier sesión, es mandatorio ejecutar:

```bash
# 1. Comprobación estricta de tipos de TypeScript
npm run typecheck

# 2. Análisis estático de código y reglas de React
npm run lint

# 3. Compilación de producción (verifica que el build estático sea limpio)
npm run build
```

---

## 5. Instrucciones de Handoff entre Sesiones

1. Toda decisión relevante tomada por una sesión debe registrarse en `docs/handoffs/<nombre-sesion>.md`.
2. Las sesiones no comparten historial de chat; el repositorio es la única fuente de verdad.
3. No hacer `git commit`, `git push` ni despliegues automáticos a menos que el usuario lo solicite expresamente.

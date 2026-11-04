/**
 * Tokens de diseño del sistema UI — dirección visual «La Libreta».
 *
 * Solo se registran valores de presentación (color, tipografía, radios,
 * elevación). Aquí no viven reglas de negocio ni lógica de componentes.
 *
 * Fuente tipada de la misma paleta: `src/theme/tokens.ts`.
 *
 * Principio rector: el cromo es papel y tinta; el color se reserva para
 * significado financiero y de estado.
 *
 * Ejes cromáticos, para no mezclarlos nunca:
 * - Azul / tinta  → estado de actividad (progreso del trabajo), foco, nav activa.
 * - Verde / naranja → estado de pago (dinero recibido vs. pendiente).
 * - Gris          → cancelado o archivado.
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ---------------------------------------------------------------
        // Sistema «La Libreta»
        // ---------------------------------------------------------------
        paper: '#F4F6F5',          // Fondo de página (papel frío, no crema)
        panel: '#FFFFFF',          // Superficie elevada: borde hairline, sin sombra
        ink: '#121716',            // Texto primario y acción primaria sólida
        accent: '#2C5C8F',         // Foco, enlaces y navegación activa

        rule: {                    // Estructura informativa, no decoración
          subtle: '#EAEFED',
          DEFAULT: '#DBE2E0',
          strong: '#C2CCC9',
        },

        received: {                // Dinero recibido / pagado
          DEFAULT: '#0E6E58',
          tint: '#E3F1ED',
          hover: '#0A5A46',
        },
        owed: {                    // Saldo pendiente / abono parcial
          DEFAULT: '#A6511C',
          tint: '#FAEBE0',
          hover: '#8A4316',
        },
        cancelled: {               // Cancelado / archivado
          DEFAULT: '#6B7280',
          tint: '#ECEFEE',
        },

        activity: {                // Eje del estado de actividad
          pending: '#5F6C67',
          progress: '#2C5C8F',
          done: '#16406B',
          cancelled: '#6B7280',
        },

        // ---------------------------------------------------------------
        // Compatibilidad con la base existente (App.tsx e index.html)
        // ---------------------------------------------------------------
        surface: {
          50: '#F4F6F5',
          100: '#EAEFED',
          200: '#DBE2E0',
          300: '#C2CCC9',
          500: '#5F6C67',
          600: '#4A5652',
          800: '#262E2C',
          900: '#121716',
        },
        brand: {
          DEFAULT: '#121716',      // La acción primaria es tinta sólida
          hover: '#262E2C',
          subtle: '#EAEFED',
        },
        finance: {
          received: '#0E6E58',
          pending: '#A6511C',
          cancelled: '#6B7280',
        },
      },
      fontFamily: {
        sans: [
          'Archivo',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        // Reservadas a overlays. Los paneles jamás usan sombra.
        dialog: '0 20px 48px rgba(18, 23, 22, 0.18)',
        sheet: '0 -8px 28px rgba(18, 23, 22, 0.14)',
      },
    },
  },
  plugins: [],
};

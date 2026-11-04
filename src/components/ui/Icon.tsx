import type { ReactNode, SVGProps } from 'react';

/**
 * Set de iconos propio: trazos de 24 px con grosor 1.75, dibujados en
 * `currentColor` para heredar el color del texto que los rodea.
 *
 * No se añade una librería de iconos: el set es pequeño y sus piezas son
 * exactamente las que la interfaz necesita.
 *
 * Todos los iconos son decorativos (`aria-hidden`). Cuando un icono es el
 * único contenido de un control, el componente padre declara `aria-label`.
 */

export type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'> & {
  /** Lado del icono en píxeles. Por defecto 16. */
  size?: number;
};

function IconBase({ size = 16, children, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

// ------------------------------------------
// Navegación
// ------------------------------------------

export function IconHome(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.25 9.75V20a1 1 0 0 0 1 1H9.5v-5.5h5V21h3.25a1 1 0 0 0 1-1V9.75" />
    </IconBase>
  );
}

export function IconClients(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M16 20.5v-1.75a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20.5" />
      <circle cx="9.5" cy="7.5" r="3.5" />
      <path d="M17 4.6a3.5 3.5 0 0 1 0 6.6" />
      <path d="M21 20.5v-1.75a4 4 0 0 0-3-3.87" />
    </IconBase>
  );
}

export function IconActivities(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M9 6h12M9 12h12M9 18h12" />
      <circle cx="4.25" cy="6" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="4.25" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="4.25" cy="18" r="1.1" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function IconSettings(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 8h9M17 8h3M4 16h3M11 16h9" />
      <circle cx="15" cy="8" r="2.25" />
      <circle cx="9" cy="16" r="2.25" />
    </IconBase>
  );
}

// ------------------------------------------
// Acciones
// ------------------------------------------

export function IconPlus(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 5v14M5 12h14" />
    </IconBase>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4.5 4.5" />
    </IconBase>
  );
}

export function IconClose(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </IconBase>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m5 12.5 5 5 9-10.5" />
    </IconBase>
  );
}

export function IconPencil(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 20h4L19.4 8.6a2.12 2.12 0 0 0-3-3L5 17v3z" />
      <path d="m14.5 7 3 3" />
    </IconBase>
  );
}

export function IconTrash(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 7h16" />
      <path d="M9 7V5.2A1.2 1.2 0 0 1 10.2 4h3.6A1.2 1.2 0 0 1 15 5.2V7" />
      <path d="M6.6 7 7.4 19.1a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4L17.4 7" />
      <path d="M10.5 11v6M13.5 11v6" />
    </IconBase>
  );
}

export function IconDownload(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 4v11" />
      <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
      <path d="M4.5 19.5h15" />
    </IconBase>
  );
}

export function IconArrowLeft(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </IconBase>
  );
}

export function IconChevronLeft(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m14.5 6-6 6 6 6" />
    </IconBase>
  );
}

export function IconChevronRight(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m9.5 6 6 6-6 6" />
    </IconBase>
  );
}

export function IconChevronDown(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m6 9.5 6 6 6-6" />
    </IconBase>
  );
}

// ------------------------------------------
// Estados y campos
// ------------------------------------------

export function IconAlert(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 4.5 21 19.5H3L12 4.5z" />
      <path d="M12 10v4" />
      <path d="M12 17.2h.01" />
    </IconBase>
  );
}

export function IconInfo(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11.25v5" />
      <path d="M12 8h.01" />
    </IconBase>
  );
}

export function IconInbox(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 13.5V19a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5.5" />
      <path d="M4 13.5 7.2 5.9a1 1 0 0 1 .95-.7h7.7a1 1 0 0 1 .95.7L20 13.5" />
      <path d="M4 13.5h4.6l1.2 2.2h6.4l1.2-2.2H20" />
    </IconBase>
  );
}

export function IconCalendar(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3.5" y="5.5" width="17" height="15" rx="1.5" />
      <path d="M8 3.5v4M16 3.5v4M3.5 10.5h17" />
    </IconBase>
  );
}

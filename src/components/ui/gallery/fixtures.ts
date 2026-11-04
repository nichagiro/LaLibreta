import type { Activity, AppConfig, Category, Client, Payment } from '@/types';

/**
 * Datos de ejemplo para la muestra visual.
 *
 * Son de presentación exclusivamente: no se leen de Sheets ni alimentan
 * ninguna regla de negocio. Los montos están en enteros COP y las fechas en
 * `YYYY-MM-DD`, igual que en producción, para que la revisión visual refleje
 * el tamaño real de las cifras.
 */

export const categories: Category[] = [
  {
    id: 'cat_5f21a0d4-0001',
    name: 'Sistemas',
    is_active: true,
    created_at: '2026-08-14T15:02:00.000Z',
    updated_at: '2026-08-14T15:02:00.000Z',
  },
  {
    id: 'cat_5f21a0d4-0002',
    name: 'Desarrollo web',
    is_active: true,
    created_at: '2026-08-14T15:03:00.000Z',
    updated_at: '2026-08-14T15:03:00.000Z',
  },
  {
    id: 'cat_5f21a0d4-0003',
    name: 'Recreación y eventos',
    is_active: true,
    created_at: '2026-08-14T15:03:00.000Z',
    updated_at: '2026-08-14T15:03:00.000Z',
  },
  {
    id: 'cat_5f21a0d4-0004',
    name: 'Venta de artículos',
    is_active: true,
    created_at: '2026-08-14T15:04:00.000Z',
    updated_at: '2026-08-14T15:04:00.000Z',
  },
  {
    id: 'cat_5f21a0d4-0005',
    name: 'Otros',
    is_active: true,
    created_at: '2026-08-14T15:04:00.000Z',
    updated_at: '2026-08-14T15:04:00.000Z',
  },
  {
    id: 'cat_5f21a0d4-0006',
    name: 'Asesorías',
    is_active: false,
    created_at: '2026-08-14T15:05:00.000Z',
    updated_at: '2026-09-30T18:20:00.000Z',
  },
];

export const clients: Client[] = [
  {
    id: 'cli_9c41b7e2-0001',
    name: 'María Fernanda Ospina',
    phone: '+57 310 482 1190',
    email: 'maria.ospina@correo.com',
    notes: 'Referida por Andrés Gómez. Prefiere que le escriban por WhatsApp.',
    is_active: true,
    created_at: '2026-08-20T14:10:00.000Z',
    updated_at: '2026-11-04T10:05:00.000Z',
  },
  {
    id: 'cli_9c41b7e2-0002',
    name: 'Panadería La Esquina S.A.S.',
    phone: '+57 301 556 7742',
    email: 'contacto@panaderialaesquina.co',
    is_active: true,
    created_at: '2026-09-02T09:45:00.000Z',
    updated_at: '2026-11-02T16:30:00.000Z',
  },
  {
    id: 'cli_9c41b7e2-0003',
    name: 'Andrés Gómez',
    phone: '+57 300 918 4425',
    notes: 'Amigo del colegio. Cobra tarifa preferencial.',
    is_active: true,
    created_at: '2026-09-11T11:20:00.000Z',
    updated_at: '2026-10-25T20:15:00.000Z',
  },
  {
    id: 'cli_9c41b7e2-0004',
    name: 'Café Altamar SAS',
    phone: '+57 304 220 6613',
    is_active: false,
    created_at: '2026-07-05T17:00:00.000Z',
    updated_at: '2026-10-10T12:00:00.000Z',
  },
];

export const activities: Activity[] = [
  {
    id: 'act_3d77c91a-0001',
    client_id: 'cli_9c41b7e2-0002',
    type: 'service',
    category_id: 'cat_5f21a0d4-0001',
    title: 'Mantenimiento mensual del servidor y backup',
    description:
      'Depuración de logs, actualización de paquetes y configuración de snapshot diario en el servidor de la panadería.',
    activity_date: '2026-11-04',
    total_value: 350000,
    status: 'completed',
    internal_notes: 'El cliente demoró tres días en entregar los accesos root.',
    public_notes: 'Garantía de 30 días sobre la configuración realizada.',
    total_received: 150000,
    balance_pending: 200000,
    payment_status: 'partial',
    created_at: '2026-11-04T10:00:00.000Z',
    updated_at: '2026-11-04T15:40:00.000Z',
  },
  {
    id: 'act_3d77c91a-0002',
    client_id: 'cli_9c41b7e2-0003',
    type: 'sale',
    category_id: 'cat_5f21a0d4-0004',
    title: 'Venta de 3 audífonos inalámbricos',
    description: '3 unidades del modelo TWS-450 con estuche de carga. Entrega en mano.',
    activity_date: '2026-11-02',
    total_value: 540000,
    status: 'completed',
    internal_notes: 'Margen de $60.000 por unidad.',
    total_received: 540000,
    balance_pending: 0,
    payment_status: 'paid',
    created_at: '2026-11-02T16:25:00.000Z',
    updated_at: '2026-11-02T16:28:00.000Z',
  },
  {
    id: 'act_3d77c91a-0003',
    client_id: 'cli_9c41b7e2-0001',
    type: 'service',
    category_id: 'cat_5f21a0d4-0002',
    title: 'Tienda en línea con catálogo de 12 artículos',
    description:
      'Diseño, montaje en hosting y carga inicial del catálogo. Incluye pasarela de pago deshabilitada y conexión con WhatsApp.',
    activity_date: '2026-10-28',
    total_value: 1800000,
    status: 'in_progress',
    internal_notes: 'Cobrar el saldo antes de entregar accesos al panel.',
    public_notes: 'El pago final se liquida contra entrega.',
    total_received: 900000,
    balance_pending: 900000,
    payment_status: 'partial',
    created_at: '2026-10-28T13:15:00.000Z',
    updated_at: '2026-11-03T09:12:00.000Z',
  },
  {
    id: 'act_3d77c91a-0004',
    client_id: 'cli_9c41b7e2-0003',
    type: 'service',
    category_id: 'cat_5f21a0d4-0003',
    title: 'Recreación infantil — cumpleaños de Sam',
    description: 'Animación de 3 horas para 18 niños, con sonido y juegos guiados.',
    activity_date: '2026-10-25',
    total_value: 420000,
    status: 'completed',
    total_received: 420000,
    balance_pending: 0,
    payment_status: 'paid',
    created_at: '2026-10-25T21:05:00.000Z',
    updated_at: '2026-10-25T21:06:00.000Z',
  },
  {
    id: 'act_3d77c91a-0005',
    client_id: 'cli_9c41b7e2-0002',
    type: 'service',
    category_id: 'cat_5f21a0d4-0001',
    title: 'Instalación de cámaras y configuración de la aplicación',
    description: 'Montaje de 4 cámaras, configuración de la app móvil y capacitación al personal.',
    activity_date: '2026-11-05',
    total_value: 280000,
    status: 'pending',
    total_received: 0,
    balance_pending: 280000,
    payment_status: 'pending',
    created_at: '2026-11-04T17:45:00.000Z',
    updated_at: '2026-11-04T17:45:00.000Z',
  },
  {
    id: 'act_3d77c91a-0006',
    client_id: 'cli_9c41b7e2-0004',
    type: 'service',
    category_id: 'cat_5f21a0d4-0005',
    title: 'Consultoría de arquitectura (4 horas)',
    description: 'Sesión de revisión técnica y recomendaciones de escalabilidad.',
    activity_date: '2026-10-20',
    total_value: 400000,
    status: 'cancelled',
    internal_notes: 'Cancelada por el cliente antes de iniciar. No se generó saldo.',
    total_received: 0,
    balance_pending: 0,
    payment_status: 'pending',
    created_at: '2026-10-20T08:30:00.000Z',
    updated_at: '2026-10-21T10:00:00.000Z',
  },
];

export const payments: Payment[] = [
  {
    id: 'pay_88f0e3bb-0001',
    activity_id: 'act_3d77c91a-0001',
    payment_date: '2026-10-30',
    amount: 100000,
    payment_method: 'efectivo',
    notes: 'Abono en efectivo en oficina',
    created_at: '2026-10-30T11:20:00.000Z',
  },
  {
    id: 'pay_88f0e3bb-0002',
    activity_id: 'act_3d77c91a-0001',
    payment_date: '2026-11-04',
    amount: 50000,
    payment_method: 'nequi',
    notes: 'Nequi comprobante 7849',
    created_at: '2026-11-04T15:38:00.000Z',
  },
  {
    id: 'pay_88f0e3bb-0003',
    activity_id: 'act_3d77c91a-0002',
    payment_date: '2026-11-02',
    amount: 540000,
    payment_method: 'efectivo',
    created_at: '2026-11-02T16:27:00.000Z',
  },
  {
    id: 'pay_88f0e3bb-0004',
    activity_id: 'act_3d77c91a-0003',
    payment_date: '2026-10-28',
    amount: 900000,
    payment_method: 'nequi',
    notes: 'Anticipo del 50 %',
    created_at: '2026-10-28T18:00:00.000Z',
  },
  {
    id: 'pay_88f0e3bb-0005',
    activity_id: 'act_3d77c91a-0004',
    payment_date: '2026-10-25',
    amount: 420000,
    payment_method: 'daviplata',
    notes: 'Pago completo',
    created_at: '2026-10-25T22:10:00.000Z',
  },
];

/** Resumen del período 1–30 de noviembre de 2026. */
export const summary = {
  period_from: '2026-11-01',
  period_to: '2026-11-30',
  total_activities_value: 3390000,
  total_money_received: 2010000,
  total_balance_pending: 1380000,
  activities_count: {
    total: 6,
    pending: 1,
    in_progress: 1,
    completed: 3,
    cancelled: 1,
  },
};

export const config: AppConfig = {
  owner_name: 'David Chávez',
  business_name: 'DJ Soluciones Tech',
  owner_phone: '+57 300 123 4567',
  owner_email: 'propietario@correo.com',
  payment_instructions:
    'Bancolombia Ahorros 123-456-789 a nombre de David Chávez | Nequi / Daviplata 3001234567',
  updated_at: '2026-11-01T14:00:00.000Z',
};

/** Actividad seleccionada para la ficha de detalle y para la referencia de PDF. */
export const featuredActivity = activities[0];

/**
 * Contratos de Tipos de Dominio y API
 * Arquitectura: Control de Ingresos para Trabajador Independiente
 * Moneda base: COP (pesos colombianos representados como enteros, sin decimales).
 * Zona horaria de referencia: America/Bogota (UTC-5).
 */

// ==========================================
// 1. Identificadores y Enums Fundamentales
// ==========================================

export type ClientId = string;    // Prefijo: cli_
export type CategoryId = string;  // Prefijo: cat_
export type ActivityId = string;  // Prefijo: act_
export type PaymentId = string;   // Prefijo: pay_

/**
 * Fecha en formato ISO calendario: YYYY-MM-DD (ej: "2026-11-04")
 * Representa el día comercial local en America/Bogota, independiente de la hora.
 */
export type IsoDateString = string;

/**
 * Timestamp completo en formato ISO UTC: YYYY-MM-DDTHH:mm:ss.sssZ
 */
export type IsoTimestampString = string;

/**
 * Dinero en COP representado siempre como número entero sin coma flotante.
 * Ej: $ 150.000 COP -> 150000
 */
export type CopAmount = number;

/**
 * Tipo de actividad: servicio o venta.
 */
export type ActivityType = 'service' | 'sale';

/**
 * Estado operativo de la actividad.
 */
export type ActivityStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

/**
 * Estado financiero derivado del balance de la actividad.
 * - 'pending': balance_pending == total_value (sin abonos o abonos = 0)
 * - 'partial': 0 < balance_pending < total_value
 * - 'paid': balance_pending <= 0
 */
export type PaymentStatus = 'pending' | 'partial' | 'paid';

/**
 * Métodos de pago soportados comúnmente en Colombia.
 */
export type PaymentMethod = 
  | 'transferencia_bancaria'
  | 'nequi'
  | 'daviplata'
  | 'efectivo'
  | 'tarjeta'
  | 'otro';

// ==========================================
// 2. Entidades del Dominio
// ==========================================

export interface Client {
  id: ClientId;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  is_active: boolean;
  created_at: IsoTimestampString;
  updated_at: IsoTimestampString;
}

export interface Category {
  id: CategoryId;
  name: string;
  is_active: boolean;
  created_at: IsoTimestampString;
  updated_at: IsoTimestampString;
}

export interface Activity {
  id: ActivityId;
  client_id: ClientId;
  type: ActivityType;
  category_id: CategoryId;
  title: string;
  description: string;
  activity_date: IsoDateString;
  total_value: CopAmount;
  status: ActivityStatus;
  internal_notes?: string;      // Privado: NUNCA se incluye en el PDF
  public_notes?: string;        // Público: Se incluye en el PDF
  created_at: IsoTimestampString;
  updated_at: IsoTimestampString;

  // Campos calculados autoritativamente (derivados de los pagos)
  total_received?: CopAmount;
  balance_pending?: CopAmount;
  payment_status?: PaymentStatus;
}

export interface Payment {
  id: PaymentId;
  activity_id: ActivityId;
  payment_date: IsoDateString;
  amount: CopAmount;
  payment_method: PaymentMethod;
  notes?: string;
  created_at: IsoTimestampString;
}

export interface AppConfig {
  owner_name: string;
  business_name?: string;
  owner_phone?: string;
  owner_email?: string;
  payment_instructions?: string; // Cuentas bancarias, llaves Nequi/Daviplata para el PDF
  logo_url_or_base64?: string;
  updated_at?: IsoTimestampString;
}

// ==========================================
// 3. Resumen y Reportes Financieros
// ==========================================

export interface FinancialSummary {
  period_from: IsoDateString;
  period_to: IsoDateString;
  
  /** Suma de total_value de actividades no canceladas cuya activity_date esté en el rango */
  total_activities_value: CopAmount;

  /** Suma de montos de pagos cuya payment_date esté en el rango (dinero efectivamente recibido) */
  total_money_received: CopAmount;

  /** Saldo pendiente por cobrar de actividades activas generadas en el período */
  total_balance_pending: CopAmount;

  /** Conteo operativo de actividades */
  activities_count: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
}

// ==========================================
// 4. Datos Públicos para Generación de PDF
// ==========================================

export interface ActivityPdfData {
  reference_code: string;       // Ej: ACT-2026-001 o el ID legible
  generation_date: IsoDateString;
  
  // Propietario
  issuer: {
    name: string;
    business_name?: string;
    phone?: string;
    email?: string;
    payment_instructions?: string;
    logo?: string;
  };

  // Cliente
  client: {
    name: string;
    phone?: string;
    email?: string;
  };

  // Actividad
  activity: {
    id: ActivityId;
    type: ActivityType;
    category_name: string;
    title: string;
    description: string;
    date: IsoDateString;
    total_value: CopAmount;
    total_received: CopAmount;
    balance_pending: CopAmount;
    public_notes?: string;
  };

  // Desglose de abonos realizados
  payments: Array<{
    date: IsoDateString;
    amount: CopAmount;
    method: PaymentMethod;
    notes?: string;
  }>;
}

// ==========================================
// 5. Contratos de Comunicación con Apps Script
// ==========================================

export type ApiAction =
  | 'ping'
  | 'getConfig'
  | 'updateConfig'
  | 'getClients'
  | 'createClient'
  | 'updateClient'
  | 'toggleClientStatus'
  | 'getCategories'
  | 'createCategory'
  | 'updateCategory'
  | 'toggleCategoryStatus'
  | 'getActivities'
  | 'getPayments'
  | 'createActivity'
  | 'updateActivity'
  | 'cancelActivity'
  | 'addPayment'
  | 'deletePayment'
  | 'getActivityPdfData'
  | 'getSummary';

export interface ApiRequest<T = unknown> {
  token: string;
  action: ApiAction;
  payload?: T;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: IsoTimestampString;
}

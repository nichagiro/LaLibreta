import type {
  Activity,
  ActivityId,
  ActivityPdfData,
  AppConfig,
  Category,
  CategoryId,
  Client,
  ClientId,
  FinancialSummary,
  Payment,
  PaymentId,
  PaymentStatus,
} from '@/types';
import {
  activities as fixtureActivities,
  categories as fixtureCategories,
  clients as fixtureClients,
  config as fixtureConfig,
  payments as fixturePayments,
} from '@/components/ui/gallery/fixtures';

/**
 * Adaptador de Pruebas en Memoria (Mock Adapter)
 *
 * Implementa 100% de la semántica del contrato de Google Apps Script:
 * - Cálculos autoritativos de total_received, balance_pending y payment_status.
 * - Validación de no-sobrepagos (OVERPAYMENT_NOT_ALLOWED).
 * - Restricción de pagos en actividades canceladas (CANNOT_PAY_CANCELLED).
 * - Protección de total_value si ya existen pagos (PAYMENT_CONFLICT).
 * - Saldo 0 en actividades canceladas, manteniendo abonos en histórico.
 * - getActivityPdfData sin notas internas ni notas de cliente.
 * - Resumen financiero con fechas ISO y términos canónicos.
 *
 * Cero almacenamiento en localStorage (cumpliendo AGENTS.md y requerimientos).
 * Los datos se reinician al recargar la página.
 */
class MockApiAdapter {
  private clients: Client[] = [];
  private categories: Category[] = [];
  private activities: Activity[] = [];
  private payments: Payment[] = [];
  private config: AppConfig = { ...fixtureConfig };

  constructor() {
    this.resetData();
  }

  public resetData(): void {
    // Clones profundos para evitar mutar las fixtures de presentación
    this.categories = JSON.parse(JSON.stringify(fixtureCategories));
    this.clients = JSON.parse(JSON.stringify(fixtureClients));
    this.payments = JSON.parse(JSON.stringify(fixturePayments));
    this.activities = JSON.parse(JSON.stringify(fixtureActivities));
    this.config = JSON.parse(JSON.stringify(fixtureConfig));
    this.recalculateAllActivities();
  }

  private recalculateAllActivities(): void {
    for (const activity of this.activities) {
      this.applyAuthoritativeCalculations(activity);
    }
  }

  private applyAuthoritativeCalculations(activity: Activity): void {
    const actPayments = this.payments.filter((p) => p.activity_id === activity.id);
    const totalReceived = actPayments.reduce((sum, p) => sum + p.amount, 0);
    activity.total_received = totalReceived;

    if (activity.status === 'cancelled') {
      activity.balance_pending = 0;
      activity.payment_status = totalReceived > 0 ? 'partial' : 'pending';
    } else {
      const balance = Math.max(0, activity.total_value - totalReceived);
      activity.balance_pending = balance;

      let paymentStatus: PaymentStatus = 'pending';
      if (totalReceived >= activity.total_value) {
        paymentStatus = 'paid';
      } else if (totalReceived > 0) {
        paymentStatus = 'partial';
      }
      activity.payment_status = paymentStatus;
    }
  }

  // --- Ping y Configuración ---

  public async ping(): Promise<{ message: string; version: string; mode: string }> {
    return {
      message: 'Conexión activa con Adaptador en Memoria (Modo de prueba)',
      version: '1.0.0-mock',
      mode: 'mock',
    };
  }

  public async getConfig(): Promise<AppConfig> {
    return { ...this.config };
  }

  public async updateConfig(payload: Partial<AppConfig>): Promise<AppConfig> {
    this.config = {
      ...this.config,
      ...payload,
      updated_at: new Date().toISOString(),
    };
    return { ...this.config };
  }

  // --- Clientes ---

  public async getClients(): Promise<Client[]> {
    return JSON.parse(JSON.stringify(this.clients));
  }

  public async createClient(payload: {
    name: string;
    phone?: string;
    email?: string;
    notes?: string;
    request_id?: string;
  }): Promise<Client> {
    if (!payload.name || !payload.name.trim()) {
      throw { code: 'VALIDATION_ERROR', message: 'El nombre del cliente es obligatorio.' };
    }
    const now = new Date().toISOString();
    const newClient: Client = {
      id: `cli_${crypto.randomUUID().slice(0, 8)}`,
      name: payload.name.trim(),
      phone: payload.phone?.trim() || undefined,
      email: payload.email?.trim() || undefined,
      notes: payload.notes?.trim() || undefined,
      is_active: true,
      created_at: now,
      updated_at: now,
    };
    this.clients.unshift(newClient);
    return { ...newClient };
  }

  public async updateClient(payload: {
    id: ClientId;
    name?: string;
    phone?: string;
    email?: string;
    notes?: string;
  }): Promise<Client> {
    const client = this.clients.find((c) => c.id === payload.id);
    if (!client) {
      throw { code: 'ENTITY_NOT_FOUND', message: 'Cliente no encontrado.' };
    }
    if (payload.name !== undefined) {
      if (!payload.name.trim()) {
        throw { code: 'VALIDATION_ERROR', message: 'El nombre no puede estar vacío.' };
      }
      client.name = payload.name.trim();
    }
    if (payload.phone !== undefined) client.phone = payload.phone.trim() || undefined;
    if (payload.email !== undefined) client.email = payload.email.trim() || undefined;
    if (payload.notes !== undefined) client.notes = payload.notes.trim() || undefined;
    client.updated_at = new Date().toISOString();
    return { ...client };
  }

  public async toggleClientStatus(payload: { id: ClientId; is_active: boolean }): Promise<{ id: ClientId; is_active: boolean }> {
    const client = this.clients.find((c) => c.id === payload.id);
    if (!client) {
      throw { code: 'ENTITY_NOT_FOUND', message: 'Cliente no encontrado.' };
    }
    client.is_active = payload.is_active;
    client.updated_at = new Date().toISOString();
    return { id: client.id, is_active: client.is_active };
  }

  // --- Categorías ---

  public async getCategories(): Promise<Category[]> {
    return JSON.parse(JSON.stringify(this.categories));
  }

  public async createCategory(payload: { name: string }): Promise<Category> {
    if (!payload.name || !payload.name.trim()) {
      throw { code: 'VALIDATION_ERROR', message: 'El nombre de la categoría es obligatorio.' };
    }
    const now = new Date().toISOString();
    const newCategory: Category = {
      id: `cat_${crypto.randomUUID().slice(0, 8)}`,
      name: payload.name.trim(),
      is_active: true,
      created_at: now,
      updated_at: now,
    };
    this.categories.push(newCategory);
    return { ...newCategory };
  }

  public async updateCategory(payload: { id: CategoryId; name: string }): Promise<Category> {
    const cat = this.categories.find((c) => c.id === payload.id);
    if (!cat) {
      throw { code: 'ENTITY_NOT_FOUND', message: 'Categoría no encontrada.' };
    }
    if (!payload.name || !payload.name.trim()) {
      throw { code: 'VALIDATION_ERROR', message: 'El nombre de la categoría no puede estar vacío.' };
    }
    cat.name = payload.name.trim();
    cat.updated_at = new Date().toISOString();
    return { ...cat };
  }

  public async toggleCategoryStatus(payload: { id: CategoryId; is_active: boolean }): Promise<{ id: CategoryId; is_active: boolean }> {
    const cat = this.categories.find((c) => c.id === payload.id);
    if (!cat) {
      throw { code: 'ENTITY_NOT_FOUND', message: 'Categoría no encontrada.' };
    }
    cat.is_active = payload.is_active;
    cat.updated_at = new Date().toISOString();
    return { id: cat.id, is_active: cat.is_active };
  }

  // --- Actividades ---

  public async getActivities(): Promise<Activity[]> {
    this.recalculateAllActivities();
    return JSON.parse(JSON.stringify(this.activities));
  }

  public async createActivity(payload: {
    client_id: ClientId;
    type: 'service' | 'sale';
    category_id: CategoryId;
    title: string;
    description?: string;
    activity_date: string;
    total_value: number;
    status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    internal_notes?: string;
    public_notes?: string;
    request_id?: string;
  }): Promise<Activity> {
    if (!payload.client_id) throw { code: 'VALIDATION_ERROR', message: 'El cliente es obligatorio.' };
    if (!payload.category_id) throw { code: 'VALIDATION_ERROR', message: 'La categoría es obligatoria.' };
    if (!payload.title || !payload.title.trim()) throw { code: 'VALIDATION_ERROR', message: 'El título es obligatorio.' };
    if (!payload.activity_date) throw { code: 'VALIDATION_ERROR', message: 'La fecha es obligatoria.' };
    if (typeof payload.total_value !== 'number' || payload.total_value < 0 || !Number.isInteger(payload.total_value)) {
      throw { code: 'INVALID_MONETARY_VALUE', message: 'El valor total debe ser un entero positivo en COP.' };
    }

    const category = this.categories.find((c) => c.id === payload.category_id);
    if (!category || !category.is_active) {
      throw { code: 'VALIDATION_ERROR', message: 'La categoría seleccionada no existe o está inactiva.' };
    }

    const client = this.clients.find((c) => c.id === payload.client_id);
    if (!client) {
      throw { code: 'ENTITY_NOT_FOUND', message: 'El cliente seleccionado no existe.' };
    }

    const now = new Date().toISOString();
    const newActivity: Activity = {
      id: `act_${crypto.randomUUID().slice(0, 8)}`,
      client_id: payload.client_id,
      type: payload.type,
      category_id: payload.category_id,
      title: payload.title.trim(),
      description: payload.description?.trim() || '',
      activity_date: payload.activity_date,
      total_value: payload.total_value,
      status: payload.status || 'pending',
      internal_notes: payload.internal_notes?.trim() || undefined,
      public_notes: payload.public_notes?.trim() || undefined,
      created_at: now,
      updated_at: now,
      total_received: 0,
      balance_pending: payload.total_value,
      payment_status: 'pending',
    };

    this.activities.unshift(newActivity);
    return { ...newActivity };
  }

  public async updateActivity(payload: {
    id: ActivityId;
    title?: string;
    description?: string;
    category_id?: CategoryId;
    activity_date?: string;
    total_value?: number;
    status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    internal_notes?: string;
    public_notes?: string;
  }): Promise<Activity> {
    const activity = this.activities.find((a) => a.id === payload.id);
    if (!activity) {
      throw { code: 'ENTITY_NOT_FOUND', message: 'Actividad no encontrada.' };
    }

    if (payload.total_value !== undefined && payload.total_value !== activity.total_value) {
      const hasPayments = this.payments.some((p) => p.activity_id === activity.id);
      if (hasPayments) {
        throw {
          code: 'PAYMENT_CONFLICT',
          message: 'No se puede modificar el valor total de una actividad que ya tiene pagos registrados.',
        };
      }
      if (typeof payload.total_value !== 'number' || payload.total_value < 0 || !Number.isInteger(payload.total_value)) {
        throw { code: 'INVALID_MONETARY_VALUE', message: 'El valor total debe ser un número entero en COP.' };
      }
      activity.total_value = payload.total_value;
    }

    if (payload.title !== undefined) {
      if (!payload.title.trim()) throw { code: 'VALIDATION_ERROR', message: 'El título no puede estar vacío.' };
      activity.title = payload.title.trim();
    }
    if (payload.description !== undefined) activity.description = payload.description.trim();
    if (payload.category_id !== undefined) activity.category_id = payload.category_id;
    if (payload.activity_date !== undefined) activity.activity_date = payload.activity_date;
    if (payload.status !== undefined) activity.status = payload.status;
    if (payload.internal_notes !== undefined) activity.internal_notes = payload.internal_notes.trim() || undefined;
    if (payload.public_notes !== undefined) activity.public_notes = payload.public_notes.trim() || undefined;

    activity.updated_at = new Date().toISOString();
    this.applyAuthoritativeCalculations(activity);
    return { ...activity };
  }

  public async cancelActivity(payload: { id: ActivityId }): Promise<Activity> {
    const activity = this.activities.find((a) => a.id === payload.id);
    if (!activity) {
      throw { code: 'ENTITY_NOT_FOUND', message: 'Actividad no encontrada.' };
    }

    activity.status = 'cancelled';
    activity.updated_at = new Date().toISOString();
    this.applyAuthoritativeCalculations(activity);
    return { ...activity };
  }

  // --- Pagos ---

  public async getPayments(payload?: { activity_id?: ActivityId }): Promise<Payment[]> {
    if (payload?.activity_id) {
      return JSON.parse(JSON.stringify(this.payments.filter((p) => p.activity_id === payload.activity_id)));
    }
    return JSON.parse(JSON.stringify(this.payments));
  }

  public async addPayment(payload: {
    activity_id: ActivityId;
    payment_date: string;
    amount: number;
    payment_method: Payment['payment_method'];
    notes?: string;
    request_id?: string;
  }): Promise<Payment> {
    const activity = this.activities.find((a) => a.id === payload.activity_id);
    if (!activity) {
      throw { code: 'ENTITY_NOT_FOUND', message: 'La actividad no existe.' };
    }

    if (activity.status === 'cancelled') {
      throw { code: 'CANNOT_PAY_CANCELLED', message: 'No se pueden registrar pagos en una actividad cancelada.' };
    }

    if (typeof payload.amount !== 'number' || payload.amount <= 0 || !Number.isInteger(payload.amount)) {
      throw { code: 'INVALID_MONETARY_VALUE', message: 'El monto del abono debe ser un número entero mayor a cero.' };
    }

    this.applyAuthoritativeCalculations(activity);
    const pendingBalance = activity.balance_pending ?? 0;

    if (payload.amount > pendingBalance) {
      throw {
        code: 'OVERPAYMENT_NOT_ALLOWED',
        message: `El abono ingresado ($ ${payload.amount.toLocaleString('es-CO')}) supera el saldo pendiente ($ ${pendingBalance.toLocaleString('es-CO')}).`,
      };
    }

    const now = new Date().toISOString();
    const newPayment: Payment = {
      id: `pay_${crypto.randomUUID().slice(0, 8)}`,
      activity_id: payload.activity_id,
      payment_date: payload.payment_date,
      amount: payload.amount,
      payment_method: payload.payment_method,
      notes: payload.notes?.trim() || undefined,
      created_at: now,
    };

    this.payments.unshift(newPayment);
    this.applyAuthoritativeCalculations(activity);
    return { ...newPayment };
  }

  public async deletePayment(payload: { id: PaymentId }): Promise<{ id: PaymentId; deleted: boolean }> {
    const index = this.payments.findIndex((p) => p.id === payload.id);
    if (index === -1) {
      throw { code: 'ENTITY_NOT_FOUND', message: 'El pago no existe.' };
    }
    const payment = this.payments[index];
    this.payments.splice(index, 1);

    const activity = this.activities.find((a) => a.id === payment.activity_id);
    if (activity) {
      this.applyAuthoritativeCalculations(activity);
    }
    return { id: payload.id, deleted: true };
  }

  // --- Datos PDF (Públicos) ---

  public async getActivityPdfData(payload: { id: ActivityId }): Promise<ActivityPdfData> {
    const activity = this.activities.find((a) => a.id === payload.id);
    if (!activity) {
      throw { code: 'ENTITY_NOT_FOUND', message: 'Actividad no encontrada.' };
    }
    this.applyAuthoritativeCalculations(activity);

    const client = this.clients.find((c) => c.id === activity.client_id);
    const category = this.categories.find((c) => c.id === activity.category_id);
    const activityPayments = this.payments
      .filter((p) => p.activity_id === activity.id)
      .map((p) => ({
        date: p.payment_date,
        amount: p.amount,
        method: p.payment_method,
        notes: p.notes,
      }));

    // El código de referencia no usa prefijo crudo de BD
    const seq = activity.id.replace('act_', '').slice(0, 4).toUpperCase();
    const referenceCode = `ACT-2026-${seq}`;

    // Construcción de datos 100% públicos: internal_notes NUNCA se incluye
    return {
      reference_code: referenceCode,
      generation_date: new Date().toISOString().split('T')[0],
      issuer: {
        name: this.config.owner_name,
        business_name: this.config.business_name,
        phone: this.config.owner_phone,
        email: this.config.owner_email,
        payment_instructions: this.config.payment_instructions,
        logo: this.config.logo_url_or_base64,
      },
      client: {
        name: client?.name || 'Cliente no identificado',
        phone: client?.phone,
        email: client?.email,
      },
      activity: {
        id: activity.id,
        type: activity.type,
        category_name: category?.name || 'General',
        title: activity.title,
        description: activity.description,
        date: activity.activity_date,
        total_value: activity.total_value,
        total_received: activity.total_received ?? 0,
        balance_pending: activity.balance_pending ?? 0,
        public_notes: activity.public_notes,
      },
      payments: activityPayments,
    };
  }

  // --- Resumen Financiero ---

  public async getSummary(payload?: { from?: string; to?: string }): Promise<FinancialSummary> {
    this.recalculateAllActivities();

    const from = payload?.from || '1970-01-01';
    const to = payload?.to || '2099-12-31';

    // Actividades con fecha dentro del rango
    const activitiesInRange = this.activities.filter(
      (a) => a.activity_date >= from && a.activity_date <= to
    );

    // Suma de total_value de actividades NO canceladas en el período
    const totalActivitiesValue = activitiesInRange
      .filter((a) => a.status !== 'cancelled')
      .reduce((sum, a) => sum + a.total_value, 0);

    // Suma de dinero recibido en pagos con payment_date en el período (independiente de la actividad)
    const paymentsInRange = this.payments.filter(
      (p) => p.payment_date >= from && p.payment_date <= to
    );
    const totalMoneyReceived = paymentsInRange.reduce((sum, p) => sum + p.amount, 0);

    // Saldo pendiente por cobrar de actividades no canceladas generadas en el período
    const totalBalancePending = activitiesInRange
      .filter((a) => a.status !== 'cancelled')
      .reduce((sum, a) => sum + (a.balance_pending ?? 0), 0);

    const counts = {
      total: activitiesInRange.length,
      pending: activitiesInRange.filter((a) => a.status === 'pending').length,
      in_progress: activitiesInRange.filter((a) => a.status === 'in_progress').length,
      completed: activitiesInRange.filter((a) => a.status === 'completed').length,
      cancelled: activitiesInRange.filter((a) => a.status === 'cancelled').length,
    };

    return {
      period_from: from,
      period_to: to,
      total_activities_value: totalActivitiesValue,
      total_money_received: totalMoneyReceived,
      total_balance_pending: totalBalancePending,
      activities_count: counts,
    };
  }
}

export const mockAdapter = new MockApiAdapter();

/**
 * Servicio Centralizado de API e Integración
 *
 * Conecta el frontend con la persistencia en Google Sheets mediante Apps Script,
 * o con el Mock Adapter en memoria según la variable de entorno `VITE_DATA_SOURCE`
 * (`sheets` | `mock`). El modo se define en compilación: no hay detección ni
 * conmutación en tiempo de ejecución.
 */

import { sheetsApi } from '@/services/sheets-api';
import { mockAdapter } from '@/services/mock-adapter';
import type {
  Activity,
  ActivityId,
  ActivityPdfData,
  ActivityType,
  ActivityStatus,
  AppConfig,
  Category,
  CategoryId,
  Client,
  ClientId,
  FinancialSummary,
  Payment,
  PaymentId,
  PaymentMethod,
} from '@/types';

/**
 * Lee `VITE_DATA_SOURCE` preservando el acceso textual que Vite reemplaza en
 * compilación. Fuera de Vite (por ejemplo, pruebas en Node) `import.meta.env`
 * no existe y se asume el modo "sheets" (estricto), igual que con un valor
 * no reconocido u omitido.
 */
function readDataSource(): 'sheets' | 'mock' {
  try {
    return import.meta.env.VITE_DATA_SOURCE === 'mock' ? 'mock' : 'sheets';
  } catch {
    return 'sheets';
  }
}

class ApiService {
  private useMock: boolean = readDataSource() === 'mock';

  /** Modo fijo en compilación según `VITE_DATA_SOURCE`. */
  public isMockMode(): boolean {
    return this.useMock;
  }

  /**
   * Genera un identificador de idempotencia estable de 8 a 100 caracteres.
   */
  private generateRequestId(prefix: string): string {
    const randomHex = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
      : Math.random().toString(36).substring(2, 18);
    return `${prefix}_${Date.now()}_${randomHex}`;
  }

  /**
   * Claves de idempotencia pendientes por operación lógica.
   * Mientras una creación no termina, un reintento con los mismos datos
   * reutiliza el mismo `request_id`: el backend devuelve el registro ya
   * persistido en lugar de duplicarlo.
   */
  private pendingRequestIds: Map<string, string> = new Map();

  private requestKey(prefix: string, data: object): string {
    return `${prefix}:${JSON.stringify(data)}`;
  }

  private requestIdFor(prefix: string, data: object): string {
    const key = this.requestKey(prefix, data);
    const pending = this.pendingRequestIds.get(key);
    if (pending) return pending;

    const generated = this.generateRequestId(prefix);
    this.pendingRequestIds.set(key, generated);
    if (this.pendingRequestIds.size > 50) {
      const oldest = this.pendingRequestIds.keys().next();
      if (!oldest.done) this.pendingRequestIds.delete(oldest.value);
    }
    return generated;
  }

  private releaseRequestId(prefix: string, data: object): void {
    this.pendingRequestIds.delete(this.requestKey(prefix, data));
  }

  // ==========================================
  // Operaciones de Negocio
  // ==========================================

  public async getConfig(): Promise<AppConfig> {
    if (this.useMock) return mockAdapter.getConfig();
    return sheetsApi.execute<AppConfig>('getConfig');
  }

  public async updateConfig(data: Partial<AppConfig>): Promise<AppConfig> {
    if (this.useMock) return mockAdapter.updateConfig(data);
    return sheetsApi.execute<AppConfig, Partial<AppConfig>>('updateConfig', data);
  }

  public async getClients(): Promise<Client[]> {
    if (this.useMock) return mockAdapter.getClients();
    return sheetsApi.execute<Client[]>('getClients');
  }

  public async createClient(data: {
    name: string;
    phone?: string;
    email?: string;
    notes?: string;
  }): Promise<Client> {
    const payload = {
      ...data,
      request_id: this.requestIdFor('client', data),
    };
    const created = this.useMock
      ? await mockAdapter.createClient(payload)
      : await sheetsApi.execute<Client, typeof payload>('createClient', payload);
    this.releaseRequestId('client', data);
    return created;
  }

  public async updateClient(data: {
    id: ClientId;
    name?: string;
    phone?: string;
    email?: string;
    notes?: string;
  }): Promise<Client> {
    if (this.useMock) return mockAdapter.updateClient(data);
    return sheetsApi.execute<Client, typeof data>('updateClient', data);
  }

  public async toggleClientStatus(id: ClientId, isActive: boolean): Promise<{ id: ClientId; is_active: boolean }> {
    const payload = { id, is_active: isActive };
    if (this.useMock) return mockAdapter.toggleClientStatus(payload);
    return sheetsApi.execute<{ id: ClientId; is_active: boolean }, typeof payload>('toggleClientStatus', payload);
  }

  public async getCategories(): Promise<Category[]> {
    if (this.useMock) return mockAdapter.getCategories();
    return sheetsApi.execute<Category[]>('getCategories');
  }

  public async createCategory(name: string): Promise<Category> {
    const payload = { name };
    if (this.useMock) return mockAdapter.createCategory(payload);
    return sheetsApi.execute<Category, typeof payload>('createCategory', payload);
  }

  public async updateCategory(id: CategoryId, name: string): Promise<Category> {
    const payload = { id, name };
    if (this.useMock) return mockAdapter.updateCategory(payload);
    return sheetsApi.execute<Category, typeof payload>('updateCategory', payload);
  }

  public async toggleCategoryStatus(id: CategoryId, isActive: boolean): Promise<{ id: CategoryId; is_active: boolean }> {
    const payload = { id, is_active: isActive };
    if (this.useMock) return mockAdapter.toggleCategoryStatus(payload);
    return sheetsApi.execute<{ id: CategoryId; is_active: boolean }, typeof payload>('toggleCategoryStatus', payload);
  }

  public async getActivities(): Promise<Activity[]> {
    if (this.useMock) return mockAdapter.getActivities();
    return sheetsApi.execute<Activity[]>('getActivities');
  }

  public async createActivity(data: {
    client_id: ClientId;
    type: ActivityType;
    category_id: CategoryId;
    title: string;
    description?: string;
    activity_date: string;
    total_value: number;
    status?: ActivityStatus;
    internal_notes?: string;
    public_notes?: string;
  }): Promise<Activity> {
    const payload = {
      ...data,
      request_id: this.requestIdFor('act', data),
    };
    const created = this.useMock
      ? await mockAdapter.createActivity(payload)
      : await sheetsApi.execute<Activity, typeof payload>('createActivity', payload);
    this.releaseRequestId('act', data);
    return created;
  }

  public async updateActivity(data: {
    id: ActivityId;
    title?: string;
    description?: string;
    category_id?: CategoryId;
    activity_date?: string;
    total_value?: number;
    status?: ActivityStatus;
    internal_notes?: string;
    public_notes?: string;
  }): Promise<Activity> {
    if (this.useMock) return mockAdapter.updateActivity(data);
    return sheetsApi.execute<Activity, typeof data>('updateActivity', data);
  }

  public async cancelActivity(id: ActivityId): Promise<Activity> {
    const payload = { id };
    if (this.useMock) return mockAdapter.cancelActivity(payload);
    return sheetsApi.execute<Activity, typeof payload>('cancelActivity', payload);
  }

  public async getPayments(activityId?: ActivityId): Promise<Payment[]> {
    const payload = activityId ? { activity_id: activityId } : {};
    if (this.useMock) return mockAdapter.getPayments(payload);
    return sheetsApi.execute<Payment[], typeof payload>('getPayments', payload);
  }

  public async addPayment(data: {
    activity_id: ActivityId;
    payment_date: string;
    amount: number;
    payment_method: PaymentMethod;
    notes?: string;
  }): Promise<Payment> {
    const payload = {
      ...data,
      request_id: this.requestIdFor('pay', data),
    };
    const created = this.useMock
      ? await mockAdapter.addPayment(payload)
      : await sheetsApi.execute<Payment, typeof payload>('addPayment', payload);
    this.releaseRequestId('pay', data);
    return created;
  }

  public async deletePayment(id: PaymentId): Promise<{ id: PaymentId; deleted: boolean }> {
    const payload = { id };
    if (this.useMock) return mockAdapter.deletePayment(payload);
    return sheetsApi.execute<{ id: PaymentId; deleted: boolean }, typeof payload>('deletePayment', payload);
  }

  public async getActivityPdfData(id: ActivityId): Promise<ActivityPdfData> {
    const payload = { id };
    if (this.useMock) return mockAdapter.getActivityPdfData(payload);
    return sheetsApi.execute<ActivityPdfData, typeof payload>('getActivityPdfData', payload);
  }

  public async getSummary(from?: string, to?: string): Promise<FinancialSummary> {
    const payload = from && to ? { from, to } : {};
    if (this.useMock) return mockAdapter.getSummary(payload);
    return sheetsApi.execute<FinancialSummary, typeof payload>('getSummary', payload);
  }

  public resetMockData(): void {
    mockAdapter.resetData();
  }
}

export const api = new ApiService();

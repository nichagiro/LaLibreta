/**
 * Servicio Centralizado de API e Integración
 *
 * Conecta el frontend con la persistencia en Google Sheets mediante Apps Script,
 * o conmuta transparentemente al Mock Adapter en memoria si el endpoint
 * remoto aún no está disponible o accesible.
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

class ApiService {
  private useMock: boolean = true;
  private connectionChecked: boolean = false;
  private connectionError: string | null = null;
  private listeners: Set<(mock: boolean) => void> = new Set();

  constructor() {
    // Si no hay configuración de entorno, inicia directamente en modo mock
    if (!sheetsApi.isConfigured()) {
      this.useMock = true;
      this.connectionChecked = true;
      this.connectionError = 'Variables de entorno no configuradas.';
    }
  }

  public subscribeModeChange(listener: (mock: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyModeChange(): void {
    for (const listener of this.listeners) {
      listener(this.useMock);
    }
  }

  public isMockMode(): boolean {
    return this.useMock;
  }

  public isConnectionChecked(): boolean {
    return this.connectionChecked;
  }

  public setMockMode(enabled: boolean): void {
    this.useMock = enabled;
    this.notifyModeChange();
  }

  public getConnectionError(): string | null {
    return this.connectionError;
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
   * Comprueba si el backend real de Google Apps Script responde.
   */
  public async checkBackendHealth(): Promise<{ success: boolean; message: string; version?: string }> {
    if (!sheetsApi.isConfigured()) {
      this.useMock = true;
      this.connectionChecked = true;
      this.connectionError = 'Configuración pendiente: VITE_APPS_SCRIPT_URL y VITE_APP_AUTH_TOKEN no definidas.';
      this.notifyModeChange();
      return { success: false, message: this.connectionError };
    }

    try {
      const res = await sheetsApi.execute<{ message: string; version: string }>('ping');
      this.useMock = false;
      this.connectionChecked = true;
      this.connectionError = null;
      this.notifyModeChange();
      return { success: true, message: res.message, version: res.version };
    } catch (err: unknown) {
      this.useMock = true;
      this.connectionChecked = true;
      const errorMsg = (err as Error)?.message || 'No fue posible conectar con Google Apps Script.';
      this.connectionError = errorMsg;
      this.notifyModeChange();
      return { success: false, message: errorMsg };
    }
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
      request_id: this.generateRequestId('client'),
    };
    if (this.useMock) return mockAdapter.createClient(payload);
    return sheetsApi.execute<Client, typeof payload>('createClient', payload);
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
      request_id: this.generateRequestId('act'),
    };
    if (this.useMock) return mockAdapter.createActivity(payload);
    return sheetsApi.execute<Activity, typeof payload>('createActivity', payload);
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
      request_id: this.generateRequestId('pay'),
    };
    if (this.useMock) return mockAdapter.addPayment(payload);
    return sheetsApi.execute<Payment, typeof payload>('addPayment', payload);
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

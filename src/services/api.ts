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
import { normalizeDate } from '@/theme/format';
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

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class ApiService {
  private useMock: boolean = readDataSource() === 'mock';

  /**
   * Almacén de caché en memoria y mapa de peticiones en vuelo (deduplicación).
   */
  private cache = new Map<string, CacheEntry<unknown>>();
  private inFlight = new Map<string, Promise<unknown>>();
  private defaultTtlMs = 2 * 60 * 1000; // 2 minutos

  /**
   * Consulta con caché en memoria y reutilización de promesas concurrentes.
   */
  private async fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number = this.defaultTtlMs,
    forceRefresh: boolean = false
  ): Promise<T> {
    if (!forceRefresh) {
      const cached = this.cache.get(key);
      if (cached && Date.now() - cached.timestamp < ttlMs) {
        return cached.data as T;
      }
    }

    const pending = this.inFlight.get(key);
    if (pending) {
      return pending as Promise<T>;
    }

    const promise = (async () => {
      try {
        const data = await fetcher();
        this.cache.set(key, { data, timestamp: Date.now() });
        return data;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, promise);
    return promise;
  }

  /**
   * Invalida entradas de caché por coincidencia exacta o por prefijo (ej. 'summary').
   */
  public invalidate(keys?: string | string[]): void {
    if (!keys) {
      this.cache.clear();
      return;
    }
    const list = Array.isArray(keys) ? keys : [keys];
    for (const prefix of list) {
      for (const cacheKey of this.cache.keys()) {
        if (cacheKey === prefix || cacheKey.startsWith(`${prefix}:`)) {
          this.cache.delete(cacheKey);
        }
      }
    }
  }

  /** Modo fijo en compilación según `VITE_DATA_SOURCE`. */
  public isMockMode(): boolean {
    return this.useMock;
  }

  /**
   * Permite activar el modo mock en pruebas automatizadas de integración.
   */
  public setMockMode(useMock: boolean): void {
    this.useMock = useMock;
    this.invalidate();
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

  public async getConfig(options?: { forceRefresh?: boolean }): Promise<AppConfig> {
    return this.fetchWithCache(
      'config',
      async () => {
        if (this.useMock) return mockAdapter.getConfig();
        return sheetsApi.execute<AppConfig>('getConfig');
      },
      5 * 60 * 1000,
      options?.forceRefresh,
    );
  }

  public async updateConfig(data: Partial<AppConfig>): Promise<AppConfig> {
    const updated = this.useMock
      ? await mockAdapter.updateConfig(data)
      : await sheetsApi.execute<AppConfig, Partial<AppConfig>>('updateConfig', data);
    this.invalidate('config');
    return updated;
  }

  public async getClients(options?: { forceRefresh?: boolean }): Promise<Client[]> {
    return this.fetchWithCache(
      'clients',
      async () => {
        if (this.useMock) return mockAdapter.getClients();
        return sheetsApi.execute<Client[]>('getClients');
      },
      this.defaultTtlMs,
      options?.forceRefresh,
    );
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
    this.invalidate('clients');
    return created;
  }

  public async updateClient(data: {
    id: ClientId;
    name?: string;
    phone?: string;
    email?: string;
    notes?: string;
  }): Promise<Client> {
    const updated = this.useMock
      ? await mockAdapter.updateClient(data)
      : await sheetsApi.execute<Client, typeof data>('updateClient', data);
    this.invalidate('clients');
    return updated;
  }

  public async toggleClientStatus(id: ClientId, isActive: boolean): Promise<{ id: ClientId; is_active: boolean }> {
    const payload = { id, is_active: isActive };
    const toggled = this.useMock
      ? await mockAdapter.toggleClientStatus(payload)
      : await sheetsApi.execute<{ id: ClientId; is_active: boolean }, typeof payload>('toggleClientStatus', payload);
    this.invalidate('clients');
    return toggled;
  }

  public async getCategories(options?: { forceRefresh?: boolean }): Promise<Category[]> {
    return this.fetchWithCache(
      'categories',
      async () => {
        if (this.useMock) return mockAdapter.getCategories();
        return sheetsApi.execute<Category[]>('getCategories');
      },
      5 * 60 * 1000,
      options?.forceRefresh,
    );
  }

  public async createCategory(name: string): Promise<Category> {
    const payload = { name };
    const created = this.useMock
      ? await mockAdapter.createCategory(payload)
      : await sheetsApi.execute<Category, typeof payload>('createCategory', payload);
    this.invalidate('categories');
    return created;
  }

  public async updateCategory(id: CategoryId, name: string): Promise<Category> {
    const payload = { id, name };
    const updated = this.useMock
      ? await mockAdapter.updateCategory(payload)
      : await sheetsApi.execute<Category, typeof payload>('updateCategory', payload);
    this.invalidate('categories');
    return updated;
  }

  public async toggleCategoryStatus(id: CategoryId, isActive: boolean): Promise<{ id: CategoryId; is_active: boolean }> {
    const payload = { id, is_active: isActive };
    const toggled = this.useMock
      ? await mockAdapter.toggleCategoryStatus(payload)
      : await sheetsApi.execute<{ id: CategoryId; is_active: boolean }, typeof payload>('toggleCategoryStatus', payload);
    this.invalidate('categories');
    return toggled;
  }

  private normalizeActivity(activity: Activity): Activity {
    return {
      ...activity,
      activity_date: normalizeDate(activity.activity_date),
    };
  }

  private normalizePayment(payment: Payment): Payment {
    return {
      ...payment,
      payment_date: normalizeDate(payment.payment_date),
    };
  }

  private normalizeActivityPdfData(data: ActivityPdfData): ActivityPdfData {
    return {
      ...data,
      generation_date: normalizeDate(data.generation_date),
      activity: {
        ...data.activity,
        date: normalizeDate(data.activity.date),
      },
      payments: (data.payments || []).map((p) => ({
        ...p,
        date: normalizeDate(p.date),
      })),
    };
  }

  public async getActivities(options?: { forceRefresh?: boolean }): Promise<Activity[]> {
    return this.fetchWithCache(
      'activities',
      async () => {
        const raw = this.useMock
          ? await mockAdapter.getActivities()
          : await sheetsApi.execute<Activity[]>('getActivities');
        return raw.map((a) => this.normalizeActivity(a));
      },
      this.defaultTtlMs,
      options?.forceRefresh,
    );
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
      activity_date: normalizeDate(data.activity_date),
      request_id: this.requestIdFor('act', data),
    };
    const created = this.useMock
      ? await mockAdapter.createActivity(payload)
      : await sheetsApi.execute<Activity, typeof payload>('createActivity', payload);
    this.releaseRequestId('act', data);
    this.invalidate(['activities', 'summary', 'pdf']);
    return this.normalizeActivity(created);
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
    const payload = {
      ...data,
      ...(data.activity_date !== undefined
        ? { activity_date: normalizeDate(data.activity_date) }
        : {}),
    };
    const updated = this.useMock
      ? await mockAdapter.updateActivity(payload)
      : await sheetsApi.execute<Activity, typeof payload>('updateActivity', payload);
    this.invalidate(['activities', 'summary', 'pdf']);
    return this.normalizeActivity(updated);
  }

  public async cancelActivity(id: ActivityId): Promise<Activity> {
    const payload = { id };
    const cancelled = this.useMock
      ? await mockAdapter.cancelActivity(payload)
      : await sheetsApi.execute<Activity, typeof payload>('cancelActivity', payload);
    this.invalidate(['activities', 'summary', 'pdf']);
    return this.normalizeActivity(cancelled);
  }

  public async getPayments(activityId?: ActivityId, options?: { forceRefresh?: boolean }): Promise<Payment[]> {
    const key = activityId ? `payments:${activityId}` : 'payments:all';
    return this.fetchWithCache(
      key,
      async () => {
        const payload = activityId ? { activity_id: activityId } : {};
        const payments = this.useMock
          ? await mockAdapter.getPayments(payload)
          : await sheetsApi.execute<Payment[], typeof payload>('getPayments', payload);
        return payments.map((p) => this.normalizePayment(p));
      },
      this.defaultTtlMs,
      options?.forceRefresh,
    );
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
      payment_date: normalizeDate(data.payment_date),
      request_id: this.requestIdFor('pay', data),
    };
    const created = this.useMock
      ? await mockAdapter.addPayment(payload)
      : await sheetsApi.execute<Payment, typeof payload>('addPayment', payload);
    this.releaseRequestId('pay', data);
    this.invalidate(['activities', 'payments', 'summary', 'pdf']);
    return this.normalizePayment(created);
  }

  public async deletePayment(id: PaymentId): Promise<{ id: PaymentId; deleted: boolean }> {
    const payload = { id };
    const deleted = this.useMock
      ? await mockAdapter.deletePayment(payload)
      : await sheetsApi.execute<{ id: PaymentId; deleted: boolean }, typeof payload>('deletePayment', payload);
    this.invalidate(['activities', 'payments', 'summary', 'pdf']);
    return deleted;
  }

  public async getActivityPdfData(id: ActivityId, options?: { forceRefresh?: boolean }): Promise<ActivityPdfData> {
    return this.fetchWithCache(
      `pdf:${id}`,
      async () => {
        const payload = { id };
        const data = this.useMock
          ? await mockAdapter.getActivityPdfData(payload)
          : await sheetsApi.execute<ActivityPdfData, typeof payload>('getActivityPdfData', payload);
        return this.normalizeActivityPdfData(data);
      },
      this.defaultTtlMs,
      options?.forceRefresh,
    );
  }

  public async getSummary(from?: string, to?: string, options?: { forceRefresh?: boolean }): Promise<FinancialSummary> {
    const normFrom = from ? normalizeDate(from) : '';
    const normTo = to ? normalizeDate(to) : '';
    const key = `summary:${normFrom}:${normTo}`;
    return this.fetchWithCache(
      key,
      async () => {
        const payload = normFrom && normTo ? { from: normFrom, to: normTo } : {};
        if (this.useMock) return mockAdapter.getSummary(payload);
        return sheetsApi.execute<FinancialSummary, typeof payload>('getSummary', payload);
      },
      60 * 1000,
      options?.forceRefresh,
    );
  }

  public resetMockData(): void {
    this.invalidate();
    mockAdapter.resetData();
  }
}

export const api = new ApiService();

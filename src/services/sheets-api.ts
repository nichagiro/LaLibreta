/**
 * Cliente de Conexión a Google Sheets (mediante Google Apps Script Web App)
 *
 * Permite que el frontend estático SPA invoque acciones de persistencia
 * sin requerir un servidor propio y sin exponer credenciales de Google Cloud.
 *
 * Reintentos: solo se reenvía una petición cuando la falla es de transporte
 * (no hubo sobre JSON utilizable) y la acción es segura para repetir:
 * lecturas puras y las tres escrituras con `request_id` (`createClient`,
 * `createActivity`, `addPayment`). El cuerpo se reenvía idéntico para que la
 * clave de idempotencia conserve su huella y el backend no duplique registros.
 */

import type { ApiAction, ApiResponse, ApiError } from '@/types';

/** Acciones que pueden reenviarse de forma segura tras una falla de transporte. */
const RETRYABLE_ACTIONS: ReadonlySet<ApiAction> = new Set<ApiAction>([
  'ping',
  'getConfig',
  'getClients',
  'getCategories',
  'getActivities',
  'getPayments',
  'getActivityPdfData',
  'getSummary',
  'createClient',
  'createActivity',
  'addPayment',
]);

/** Códigos que indican que la petición no produjo una respuesta de la aplicación. */
const TRANSPORT_ERROR_CODES: readonly string[] = ['NETWORK_FAILURE', 'HTTP_ERROR'];

/**
 * Traduce los códigos de error técnicos a un mensaje comprensible para el
 * usuario final, que no necesita conocer la tecnología de persistencia.
 */
const USER_MESSAGES: Readonly<Record<string, string>> = {
  SHEETS_FAILURE: 'No fue posible completar la operación. Intenta de nuevo.',
  NETWORK_FAILURE: 'No fue posible conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
  HTTP_ERROR: 'El servidor no pudo procesar la solicitud. Intenta de nuevo.',
  REMOTE_ERROR: 'No fue posible completar la operación. Intenta de nuevo.',
  INTERNAL_ERROR: 'Ocurrió un error inesperado. Intenta de nuevo.',
  CONCURRENCY_TIMEOUT: 'El servidor está ocupado. Verifica el resultado antes de reintentar.',
};

/**
 * Devuelve el mensaje apto para mostrar en la interfaz, sin filtrar detalles
 * de la infraestructura (hoja de cálculo, Web App, formato de respuesta).
 */
function toUserMessage(code: string, fallback: string): string {
  return USER_MESSAGES[code] || fallback;
}

const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 250;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Lee una variable `VITE_*` preservando el acceso textual que Vite reemplaza
 * en compilación. Fuora de Vite (por ejemplo, pruebas en Node) `import.meta.env`
 * no existe y se asume que la aplicación está sin configurar.
 */
function readEnvValue(name: 'VITE_APPS_SCRIPT_URL' | 'VITE_APP_AUTH_TOKEN'): string {
  try {
    if (name === 'VITE_APPS_SCRIPT_URL') return import.meta.env.VITE_APPS_SCRIPT_URL || '';
    return import.meta.env.VITE_APP_AUTH_TOKEN || '';
  } catch {
    return '';
  }
}

class SheetsApiClient {
  private endpointUrl: string;
  private authToken: string;

  constructor() {
    this.endpointUrl = readEnvValue('VITE_APPS_SCRIPT_URL');
    this.authToken = readEnvValue('VITE_APP_AUTH_TOKEN');
  }

  /**
   * Configura o actualiza el endpoint y token en tiempo de ejecución
   * (por ejemplo, si el usuario los ingresa en un modal de configuración inicial).
   */
  public configure(url: string, token: string): void {
    this.endpointUrl = url;
    this.authToken = token;
  }

  public isConfigured(): boolean {
    return Boolean(this.endpointUrl && this.authToken);
  }

  /**
   * Ejecuta una acción remota contra el Web App de Google Apps Script.
   *
   * Los errores de la aplicación (`success: false`) nunca se reintentan: solo
   * las fallas de transporte de las acciones listadas en `RETRYABLE_ACTIONS`.
   */
  public async execute<TResponse = unknown, TPayload = unknown>(
    action: ApiAction,
    payload?: TPayload
  ): Promise<TResponse> {
    if (!this.endpointUrl) {
      throw this.buildError(
        'MISSING_ENDPOINT',
        'El servicio de guardado no está configurado en esta instalación.'
      );
    }

    if (!this.authToken) {
      throw this.buildError(
        'MISSING_AUTH_TOKEN',
        'No se pudo verificar el acceso al servicio de guardado.'
      );
    }

    const body = JSON.stringify({
      token: this.authToken,
      action,
      payload,
    });

    const attempts = RETRYABLE_ACTIONS.has(action) ? MAX_ATTEMPTS : 1;
    let lastError: ApiError = this.buildError(
      'NETWORK_FAILURE',
      toUserMessage(
        'NETWORK_FAILURE',
        'No fue posible conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.'
      )
    );

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        return await this.send<TResponse>(body);
      } catch (err: unknown) {
        lastError = this.normalizeError(err);
        const isTransport = TRANSPORT_ERROR_CODES.indexOf(lastError.code) >= 0;
        if (!isTransport || attempt >= attempts) throw lastError;
        await delay(RETRY_DELAY_MS);
      }
    }

    throw lastError;
  }

  /** Envía el cuerpo exacto recibido: conservar byte a byte preserva el `request_id`. */
  private async send<TResponse>(body: string): Promise<TResponse> {
    let response: Response;
    try {
      response = await fetch(this.endpointUrl, {
        method: 'POST',
        // Se usa text/plain para evitar preflight OPTIONS innecesario en Apps Script Web Apps
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body,
      });
    } catch {
      throw this.buildError(
        'NETWORK_FAILURE',
        toUserMessage(
          'NETWORK_FAILURE',
          'No fue posible conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.'
        )
      );
    }

    if (!response.ok) {
      throw this.buildError(
        'HTTP_ERROR',
        toUserMessage(
          'HTTP_ERROR',
          `El servidor no pudo procesar la solicitud. Intenta de nuevo.`
        )
      );
    }

    let jsonResult: ApiResponse<TResponse>;
    try {
      jsonResult = (await response.json()) as ApiResponse<TResponse>;
    } catch {
      throw this.buildError(
        'NETWORK_FAILURE',
        toUserMessage(
          'NETWORK_FAILURE',
          'El servidor devolvió una respuesta no válida. Intenta de nuevo.'
        )
      );
    }

    if (!jsonResult.success) {
      const remoteError = jsonResult.error;
      if (remoteError) {
        throw {
          ...remoteError,
          message: toUserMessage(remoteError.code, remoteError.message),
        };
      }
      throw this.buildError(
        'REMOTE_ERROR',
        toUserMessage('REMOTE_ERROR', 'No fue posible completar la operación. Intenta de nuevo.')
      );
    }

    return jsonResult.data as TResponse;
  }

  private normalizeError(err: unknown): ApiError {
    if ((err as ApiError)?.code) return err as ApiError;
    return this.buildError(
      'NETWORK_FAILURE',
      toUserMessage(
        'NETWORK_FAILURE',
        'No fue posible conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.'
      )
    );
  }

  private buildError(code: string, message: string): ApiError {
    return { code, message };
  }
}

export const sheetsApi = new SheetsApiClient();

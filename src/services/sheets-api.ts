/**
 * Cliente de Conexión a Google Sheets (mediante Google Apps Script Web App)
 * 
 * Permite que el frontend estático SPA invoque acciones de persistencia
 * sin requerir un servidor propio y sin exponer credenciales de Google Cloud.
 */

import { ApiAction, ApiResponse, ApiError } from '@/types';

class SheetsApiClient {
  private endpointUrl: string;
  private authToken: string;

  constructor() {
    this.endpointUrl = import.meta.env.VITE_APPS_SCRIPT_URL || '';
    this.authToken = import.meta.env.VITE_APP_AUTH_TOKEN || '';
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
   */
  public async execute<TResponse = unknown, TPayload = unknown>(
    action: ApiAction,
    payload?: TPayload
  ): Promise<TResponse> {
    if (!this.endpointUrl) {
      throw this.buildError(
        'MISSING_ENDPOINT',
        'La URL del Web App de Google Apps Script no está configurada.'
      );
    }

    if (!this.authToken) {
      throw this.buildError(
        'MISSING_AUTH_TOKEN',
        'El token de acceso personal no ha sido configurado.'
      );
    }

    try {
      const response = await fetch(this.endpointUrl, {
        method: 'POST',
        // Se usa text/plain para evitar preflight OPTIONS innecesario en Apps Script Web Apps
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          token: this.authToken,
          action,
          payload,
        }),
      });

      if (!response.ok) {
        throw this.buildError(
          'HTTP_ERROR',
          `Error de red al consultar Google Sheets: HTTP ${response.status}`
        );
      }

      const jsonResult: ApiResponse<TResponse> = await response.json();

      if (!jsonResult.success) {
        throw (
          jsonResult.error ||
          this.buildError('REMOTE_ERROR', 'La operación en Google Sheets falló.')
        );
      }

      return jsonResult.data as TResponse;
    } catch (err: unknown) {
      if ((err as ApiError)?.code) {
        throw err;
      }
      throw this.buildError(
        'NETWORK_FAILURE',
        (err as Error)?.message || 'No fue posible comunicarse con Google Sheets.'
      );
    }
  }

  private buildError(code: string, message: string): ApiError {
    return { code, message };
  }
}

export const sheetsApi = new SheetsApiClient();

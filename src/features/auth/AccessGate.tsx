import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { IconLock, IconEye, IconEyeOff } from '@/components/ui/Icon';
import { sheetsApi } from '@/services/sheets-api';

interface AccessGateProps {
  onAuthenticated: () => void;
}

export const AccessGate: React.FC<AccessGateProps> = ({ onAuthenticated }) => {
  const [tokenInput, setTokenInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanToken = tokenInput.trim();
    if (!cleanToken) {
      setError('Por favor ingresa tu clave de acceso.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await sheetsApi.testConnection(cleanToken);
      // Conexión exitosa: guardar y desbloquear
      sheetsApi.saveAuthToken(cleanToken, remember);
      onAuthenticated();
    } catch (err: unknown) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'Clave de acceso no válida. Intenta de nuevo.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Cabecera / Marca */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-ink text-white font-bold text-base shadow-sm mb-3">
            LI
          </div>
          <h1 className="text-xl font-bold tracking-tight text-ink">La Libreta</h1>
          <p className="text-xs text-surface-500 mt-1">Control de Ingresos</p>
        </div>

        {/* Tarjeta de Acceso */}
        <div className="bg-white border border-rule rounded-xl p-6 sm:p-7 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-xs font-semibold text-ink uppercase tracking-wider">
            <IconLock size={15} />
            <span>Iniciar Sesión</span>
          </div>

          <p className="text-xs text-surface-600 mb-5 leading-relaxed">
            Ingresa tu clave de acceso para continuar.
          </p>

          {error ? (
            <div className="mb-5">
              <Alert variant="error" title="No fue posible acceder">
                {error}
              </Alert>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="access-token"
                className="block text-xs font-medium text-surface-700 mb-1.5"
              >
                Clave de acceso
              </label>
              <div className="relative">
                <input
                  id="access-token"
                  type={showPassword ? 'text' : 'password'}
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Ingresa tu clave..."
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full h-11 px-3.5 pr-10 text-xs rounded-lg border border-rule bg-white text-ink placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-ink focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar clave' : 'Mostrar clave'}
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-ink transition p-1"
                >
                  {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 text-xs text-surface-600 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  disabled={loading}
                  className="h-4 w-4 rounded border-rule text-ink focus:ring-ink"
                />
                <span>Recordar sesión</span>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              loading={loading}
              className="mt-2"
            >
              {loading ? 'Verificando…' : 'Iniciar Sesión'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

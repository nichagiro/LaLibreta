import { useState, useEffect, type FormEvent } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { TextArea } from '@/components/ui/TextArea';
import { Tabs } from '@/components/ui/Tabs';
import { Alert } from '@/components/ui/Alert';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { IconPlus, IconPencil } from '@/components/ui/Icon';
import { api } from '@/services/api';
import type { AppConfig, Category } from '@/types';
import { CategoryFormDialog } from './CategoryFormDialog';

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<'profile' | 'categories' | 'backend'>('profile');

  // Configuración del propietario
  const [config, setConfig] = useState<AppConfig>({
    owner_name: '',
    business_name: '',
    owner_phone: '',
    owner_email: '',
    payment_instructions: '',
    logo_url_or_base64: '',
  });
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  // Categorías
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [catToToggle, setCatToToggle] = useState<Category | null>(null);
  const [togglingCat, setTogglingCat] = useState(false);

  // Conectividad Backend
  const [isMock, setIsMock] = useState(api.isMockMode());
  const [testingPing, setTestingPing] = useState(false);
  const [pingResult, setPingResult] = useState<{ success: boolean; message: string } | null>(null);

  const loadSettings = async () => {
    try {
      const [cfg, cats] = await Promise.all([api.getConfig(), api.getCategories()]);
      setConfig(cfg);
      setCategories(cats);
    } catch {
      // Ignorar
    }
  };

  useEffect(() => {
    loadSettings();
    const unsubscribe = api.subscribeModeChange((mock) => setIsMock(mock));
    return () => unsubscribe();
  }, []);

  const handleSaveConfig = async (e: FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setConfigSuccess(false);
    setConfigError(null);

    try {
      const updated = await api.updateConfig({
        owner_name: config.owner_name.trim(),
        business_name: config.business_name?.trim() || undefined,
        owner_phone: config.owner_phone?.trim() || undefined,
        owner_email: config.owner_email?.trim() || undefined,
        payment_instructions: config.payment_instructions?.trim() || undefined,
        logo_url_or_base64: config.logo_url_or_base64?.trim() || undefined,
      });
      setConfig(updated);
      setConfigSuccess(true);
      setTimeout(() => setConfigSuccess(false), 4000);
    } catch (err: unknown) {
      setConfigError((err as Error)?.message || 'No fue posible guardar la configuración.');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleToggleCategory = async () => {
    if (!catToToggle) return;
    setTogglingCat(true);
    try {
      await api.toggleCategoryStatus(catToToggle.id, !catToToggle.is_active);
      setCatToToggle(null);
      await loadSettings();
    } catch {
      // Manejar
    } finally {
      setTogglingCat(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingPing(true);
    setPingResult(null);
    const result = await api.checkBackendHealth();
    setTestingPing(false);
    setPingResult(result);
    setIsMock(api.isMockMode());
  };

  const handleResetDemoData = () => {
    api.resetMockData();
    loadSettings();
    setPingResult({
      success: true,
      message: 'Datos en memoria reiniciados a los valores de muestra originales.',
    });
  };

  const tabsItems = [
    { key: 'profile', label: 'Datos del Emisor y PDF' },
    { key: 'categories', label: `Categorías (${categories.length})` },
    { key: 'backend', label: 'Persistencia y Conectividad' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración"
        description="Datos del trabajador independiente, instrucciones de pago, categorías y conectividad."
      />

      <div className="bg-white border border-rule rounded-lg p-4 sm:p-6 space-y-6">
        <Tabs
          items={tabsItems}
          value={activeTab}
          onChange={(key) => setActiveTab(key as 'profile' | 'categories' | 'backend')}
          label="Secciones de configuración"
        />

        {/* ------------------------------------------
            Pestaña 1: Datos del Emisor y PDF
        ------------------------------------------ */}
        {activeTab === 'profile' ? (
          <form onSubmit={handleSaveConfig} className="space-y-4 max-w-2xl">
            {configSuccess ? (
              <Alert variant="success" title="Cambios guardados">
                Los datos del emisor y las instrucciones de pago han sido actualizados con éxito.
              </Alert>
            ) : null}

            {configError ? (
              <Alert variant="error" title="Error">
                {configError}
              </Alert>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                label="Nombre completo del titular"
                value={config.owner_name}
                onChange={(e) => setConfig({ ...config, owner_name: e.target.value })}
                placeholder="Ej: David Chávez"
                required
                hint="Aparece como emisor en el PDF"
              />

              <TextField
                label="Nombre comercial (opcional)"
                value={config.business_name || ''}
                onChange={(e) => setConfig({ ...config, business_name: e.target.value })}
                placeholder="Ej: DJ Soluciones Tech"
                hint="Marca o razón comercial secundaria"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                label="Teléfono o Celular"
                value={config.owner_phone || ''}
                onChange={(e) => setConfig({ ...config, owner_phone: e.target.value })}
                placeholder="Ej: +57 300 123 4567"
              />

              <TextField
                label="Correo Electrónico"
                type="email"
                value={config.owner_email || ''}
                onChange={(e) => setConfig({ ...config, owner_email: e.target.value })}
                placeholder="propietario@correo.com"
              />
            </div>

            <TextArea
              label="Instrucciones y Formas de Pago"
              value={config.payment_instructions || ''}
              onChange={(e) => setConfig({ ...config, payment_instructions: e.target.value })}
              placeholder="Bancolombia Ahorros 123-456-789 a nombre de David Chávez | Nequi / Daviplata 3001234567"
              rows={3}
              hint="Texto impreso en el recuadro de pago del comprobante PDF para el cliente."
            />

            <TextField
              label="URL del Logo (opcional)"
              value={config.logo_url_or_base64 || ''}
              onChange={(e) => setConfig({ ...config, logo_url_or_base64: e.target.value })}
              placeholder="https://... o data:image/png;base64,..."
              hint="Estrategia aprobada: URL pública segura o cadena Base64 liviana."
            />

            <div className="pt-2">
              <Button variant="primary" type="submit" loading={savingConfig}>
                Guardar Configuración
              </Button>
            </div>
          </form>
        ) : null}

        {/* ------------------------------------------
            Pestaña 2: Categorías
        ------------------------------------------ */}
        {activeTab === 'categories' ? (
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-surface-900">
                  Categorías de Actividades
                </h3>
                <p className="text-xs text-surface-500">
                  Crea, renombra o desactiva clasificaciones sin perder el historial.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setCategoryToEdit(null);
                  setCategoryFormOpen(true);
                }}
                iconStart={<IconPlus size={14} />}
              >
                Nueva Categoría
              </Button>
            </div>

            <div className="border border-rule rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-50 border-b border-rule text-surface-500 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Nombre</th>
                    <th className="py-2.5 px-3">Estado</th>
                    <th className="py-2.5 px-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule-subtle">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-surface-50/50">
                      <td className="py-2.5 px-3 font-medium text-ink">{cat.name}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block text-[11px] px-2 py-0.5 rounded font-medium ${
                            cat.is_active
                              ? 'bg-received-tint text-received'
                              : 'bg-surface-200 text-surface-600'
                          }`}
                        >
                          {cat.is_active ? 'Activa' : 'Desactivada'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCategoryToEdit(cat);
                            setCategoryFormOpen(true);
                          }}
                          iconStart={<IconPencil size={12} />}
                        >
                          Renombrar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCatToToggle(cat)}
                        >
                          {cat.is_active ? 'Desactivar' : 'Activar'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {/* ------------------------------------------
            Pestaña 3: Persistencia y Conectividad
        ------------------------------------------ */}
        {activeTab === 'backend' ? (
          <div className="space-y-6 max-w-2xl">
            <div className="p-4 rounded-lg border border-rule bg-surface-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-surface-600 uppercase tracking-wider">
                  Modo de Persistencia Activo
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                    isMock
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-received-tint text-received border border-received'
                  }`}
                >
                  {isMock
                    ? 'Modo de Prueba (Adaptador en Memoria)'
                    : 'Google Apps Script (Producción)'}
                </span>
              </div>

              <p className="text-xs text-surface-600 leading-relaxed">
                {isMock
                  ? 'Actualmente estás usando el Adaptador en Memoria con los datos de muestra de «La Libreta». Los cambios se mantienen mientras no recargues la página y no se persisten en Google Sheets.'
                  : 'Conexión activa con tu Web App privada de Google Apps Script. Las escrituras se guardan directamente en las pestañas de tu Google Spreadsheet.'}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleTestConnection}
                  loading={testingPing}
                >
                  Probar Conexión con Apps Script (Ping)
                </Button>

                {isMock ? (
                  <Button variant="ghost" size="sm" onClick={handleResetDemoData}>
                    Restablecer Datos de Muestra
                  </Button>
                ) : null}
              </div>

              {pingResult ? (
                <div
                  className={`mt-3 p-3 rounded text-xs border ${
                    pingResult.success
                      ? 'bg-received-tint border-received text-received'
                      : 'bg-amber-50 border-amber-300 text-amber-900'
                  }`}
                >
                  <strong>{pingResult.success ? 'Conexión exitosa' : 'Diagnóstico de conexión'}:</strong>{' '}
                  {pingResult.message}
                </div>
              ) : null}
            </div>

            <div className="space-y-3 text-xs text-surface-600">
              <h4 className="font-semibold text-surface-800 text-sm">
                Arquitectura de Persistencia Indirecta
              </h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  El frontend estático nunca accede de forma directa a la hoja de cálculo ni almacena
                  credenciales de Google Cloud Console.
                </li>
                <li>
                  Toda consulta o registro pasa por el manejador <code>doPost</code> del Google Apps
                  Script con token de acceso personal.
                </li>
                <li>
                  Las actividades canceladas conservan sus pagos en histórico y su saldo pendiente
                  queda en $ 0 COP de forma autoritativa.
                </li>
              </ul>
            </div>
          </div>
        ) : null}
      </div>

      {/* Modal Crear / Renombrar Categoría */}
      <CategoryFormDialog
        open={categoryFormOpen}
        onClose={() => setCategoryFormOpen(false)}
        onSaved={loadSettings}
        categoryToEdit={categoryToEdit}
      />

      {/* Confirmación Desactivar/Activar Categoría */}
      <ConfirmDialog
        open={Boolean(catToToggle)}
        onCancel={() => setCatToToggle(null)}
        onConfirm={handleToggleCategory}
        title={
          catToToggle?.is_active
            ? `¿Desactivar la categoría «${catToToggle?.name}»?`
            : `¿Activar la categoría «${catToToggle?.name}»?`
        }
        message={
          catToToggle?.is_active ? (
            <>
              Al desactivar esta categoría, ya no aparecerá como opción al crear nuevas
              actividades. <strong>El historial de actividades pasadas asociadas a ella se conservará íntegro.</strong>
            </>
          ) : (
            <>
              La categoría volverá a estar disponible en el selector de nuevas actividades.
            </>
          )
        }
        confirmLabel={catToToggle?.is_active ? 'Desactivar Categoría' : 'Activar Categoría'}
        cancelLabel="Volver"
        destructive={catToToggle?.is_active}
        loading={togglingCat}
      />
    </div>
  );
}

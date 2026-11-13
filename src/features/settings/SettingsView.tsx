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
import { CategoryFormDialog, type CategorySaveMode } from './CategoryFormDialog';

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<'profile' | 'categories'>('profile');

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
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [catNotice, setCatNotice] = useState<{ title: string; detail: string } | null>(null);

  const loadSettings = async () => {
    setLoadingSettings(true);
    try {
      const [cfg, cats] = await Promise.all([api.getConfig(), api.getCategories()]);
      setConfig(cfg);
      setCategories(cats);
    } catch {
      // Ignorar
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    loadSettings();
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

  const showCategoryNotice = (title: string, detail: string) => {
    const notice = { title, detail };
    setCatNotice(notice);
    window.setTimeout(
      () => setCatNotice((current) => (current === notice ? null : current)),
      4000
    );
  };

  /**
   * Actualiza el listado local con el registro ya persistido: evita recargar
   * configuración + categorías tras cada guardado.
   */
  const handleCategorySaved = (saved: Category, mode: CategorySaveMode) => {
    setCategories((prev) => {
      const exists = prev.some((c) => c.id === saved.id);
      return exists
        ? prev.map((c) => (c.id === saved.id ? saved : c))
        : [...prev, saved];
    });
    showCategoryNotice(
      mode === 'create' ? 'Categoría Creada' : 'Categoría Actualizada',
      mode === 'create'
        ? `«${saved.name}» ya está disponible en la lista.`
        : `«${saved.name}» se guardó correctamente.`
    );
  };

  const handleToggleCategory = async () => {
    if (!catToToggle) return;
    setTogglingCat(true);
    try {
      const result = await api.toggleCategoryStatus(
        catToToggle.id,
        !catToToggle.is_active
      );
      setCategories((prev) =>
        prev.map((c) =>
          c.id === result.id ? { ...c, is_active: result.is_active } : c
        )
      );
      setCatToToggle(null);
      showCategoryNotice(
        result.is_active ? 'Categoría Activada' : 'Categoría Desactivada',
        result.is_active
          ? `«${catToToggle.name}» vuelve a estar disponible para clasificar actividades.`
          : `«${catToToggle.name}» ya no aparece en el selector de nuevas actividades.`
      );
    } catch {
      // Manejar
    } finally {
      setTogglingCat(false);
    }
  };

  const tabsItems = [
    { key: 'profile', label: 'Datos del Emisor y PDF' },
    { key: 'categories', label: `Categorías (${categories.length})` },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración"
        description="Datos del trabajador independiente, instrucciones de pago y categorías."
      />

      <div className="bg-white border border-rule rounded-lg p-4 sm:p-6 space-y-6">
        <Tabs
          items={tabsItems}
          value={activeTab}
          onChange={(key) => setActiveTab(key as 'profile' | 'categories')}
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

            {catNotice ? (
              <Alert variant="success" title={catNotice.title}>
                {catNotice.detail}
              </Alert>
            ) : null}

            {loadingSettings ? (
              <div className="border border-rule rounded-lg p-6 text-center text-xs text-surface-500">
                Cargando categorías…
              </div>
            ) : (
            <div className="border border-rule rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-ink border-b border-ink text-white text-[11px] font-semibold">
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
            )}
          </div>
        ) : null}
      </div>

      {/* Modal Crear / Renombrar Categoría */}
      <CategoryFormDialog
        open={categoryFormOpen}
        onClose={() => setCategoryFormOpen(false)}
        onSaved={handleCategorySaved}
        categoryToEdit={categoryToEdit}
        existingCategories={categories}
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

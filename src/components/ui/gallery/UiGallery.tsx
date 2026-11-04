import { useState } from 'react';
import { cn } from '@/theme/cn';
import { Tabs } from '../Tabs';
import { ControlsSection } from './ControlsSection';
import { DataSection } from './DataSection';
import { FeedbackSection } from './FeedbackSection';
import { FoundationsSection } from './FoundationsSection';
import { PdfReferenceSheet } from './PdfReferenceSheet';
import { ScreensSection } from './ScreensSection';

type SectionKey = 'foundations' | 'controls' | 'feedback' | 'data' | 'screens' | 'pdf';

const SECTIONS: ReadonlyArray<{ key: SectionKey; label: string }> = [
  { key: 'foundations', label: 'Fundamentos' },
  { key: 'controls', label: 'Controles' },
  { key: 'feedback', label: 'Estados y mensajes' },
  { key: 'data', label: 'Datos e indicadores' },
  { key: 'screens', label: 'Pantallas' },
  { key: 'pdf', label: 'Referencia PDF' },
];

/**
 * Muestra visual del sistema de diseño.
 *
 * No es Storybook: es una página del propio bundle, con contenido real en
 * español, que Frontend puede abrir en `?ui=1` para verificar cómo se ve el
 * sistema antes de construir encima. No contiene lógica de negocio ni llama a
 * la API.
 */
export function UiGallery() {
  const [section, setSection] = useState<SectionKey>('foundations');

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-rule bg-panel">
        <div className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-surface-500">
                Sesión 2 · Diseño y sistema UI
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
                Sistema de diseño «La Libreta»
              </h1>
              <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-surface-600">
                Componentes, tokens y composiciones de referencia. El cromo es papel y tinta; el
                color se reserva para el dinero y los estados. Abierto en{' '}
                <code className="rounded bg-surface-100 px-1 py-0.5 text-xs">?ui=1</code>.
              </p>
            </div>

            <a
              href="./"
              className="shrink-0 rounded-md border border-rule-strong bg-panel px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-100"
            >
              Volver a la aplicación
            </a>
          </div>

          <div className="mt-4">
            <Tabs
              items={SECTIONS}
              value={section}
              onChange={(key) => setSection(key as SectionKey)}
              label="Secciones del sistema de diseño"
            />
          </div>
        </div>
      </header>

      <main
        className={cn(
          'mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10',
          section === 'pdf' && 'max-w-4xl',
        )}
      >
        {section === 'foundations' ? <FoundationsSection /> : null}
        {section === 'controls' ? <ControlsSection /> : null}
        {section === 'feedback' ? <FeedbackSection /> : null}
        {section === 'data' ? <DataSection /> : null}
        {section === 'screens' ? <ScreensSection /> : null}
        {section === 'pdf' ? <PdfReferenceSheet /> : null}
      </main>
    </div>
  );
}

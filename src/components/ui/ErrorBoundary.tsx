import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './Button';
import { IconAlert } from './Icon';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary capturó un error no controlado:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 bg-white border border-rule rounded-lg space-y-4 max-w-lg mx-auto my-8 text-center">
          <div className="flex justify-center text-owed">
            <IconAlert size={36} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-ink">Ocurrió un error inesperado</h3>
            <p className="text-xs text-surface-600">
              No fue posible mostrar esta sección. Los datos en la hoja de cálculo no se han visto afectados.
            </p>
            {this.state.error?.message ? (
              <p className="text-[11px] font-mono text-owed mt-2 bg-owed/5 p-2 rounded border border-owed/15 text-left break-all">
                {this.state.error.message}
              </p>
            ) : null}
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="secondary" onClick={this.handleReset}>
              Reintentar
            </Button>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Recargar aplicación
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

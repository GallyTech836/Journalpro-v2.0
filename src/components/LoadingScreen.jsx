import { Zap, TriangleAlert as AlertTriangle } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-canvas flex flex-col items-center justify-center gap-3">
      <Zap className="text-brand animate-pulse" size={32} />
      <span className="text-sm font-medium text-muted">Sincronizando datos…</span>
    </div>
  );
}

export function ErrorScreen({ message }) {
  return (
    <div className="fixed inset-0 bg-canvas flex flex-col items-center justify-center gap-3 px-6 text-center">
      <AlertTriangle className="text-neg" size={32} />
      <span className="text-sm font-medium text-ink">{message}</span>
      <button
        onClick={() => window.location.reload()}
        className="mt-2 px-4 py-2 bg-surface-hi border border-border rounded-xl text-xs font-medium text-muted hover:text-ink"
      >
        Reintentar
      </button>
    </div>
  );
}

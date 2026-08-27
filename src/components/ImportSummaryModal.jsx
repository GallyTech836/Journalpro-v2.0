import { CircleCheck as CheckCircle2, CircleAlert as AlertCircle, X } from 'lucide-react';
import { Button } from './ui';

export default function ImportSummaryModal({ summary, onClose }) {
  const { imported, duplicates, errors } = summary;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm anim-fade">
      <div className="bg-surface w-full max-w-sm rounded-2xl border border-border shadow-2xl anim-slide-up">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h3 className="text-[15px] font-semibold flex items-center gap-2">
            <CheckCircle2 size={18} className="text-pos" /> Importación completada
          </h3>
          <button onClick={onClose} className="text-muted hover:text-ink"><X size={20} /></button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Operaciones importadas</span>
            <span className="font-semibold text-pos tabular">{imported}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Duplicadas (omitidas)</span>
            <span className="font-semibold text-warn tabular">{duplicates}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Con errores (omitidas)</span>
            <span className="font-semibold text-neg tabular">{errors.length}</span>
          </div>
          {errors.length > 0 && (
            <div className="bg-canvas border border-border rounded-xl p-3 max-h-40 overflow-y-auto custom-scrollbar space-y-1.5 mt-2">
              {errors.map((e, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[11px] text-muted">
                  <AlertCircle size={12} className="text-neg mt-0.5 shrink-0" />
                  <span>{e}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-4 border-t border-border">
          <Button variant="primary" className="w-full" onClick={onClose}>Entendido</Button>
        </div>
      </div>
    </div>
  );
}

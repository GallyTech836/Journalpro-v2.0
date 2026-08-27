import { useState } from 'react';
import { X, CreditCard as Edit2, Trash2 } from 'lucide-react';
import { useApp } from '../context/useApp';
import { RValue, PnlValue, ResultPill, DirectionPill } from './ui';

function Row({ label, value }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/60 last:border-0">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-sm font-medium text-ink tabular">{value}</span>
    </div>
  );
}

export default function TradeDetailModal({ trade, onClose, onEdit }) {
  const { deleteTrade } = useApp();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteTrade(trade.id);
      onClose();
    } catch (err) {
      console.error(err);
      setDeleting(false);
    }
  };

  const dateLabel = new Date(trade.date + 'T12:00:00').toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm anim-fade">
      <div className="bg-surface w-full max-w-md rounded-2xl border border-border shadow-2xl my-auto max-h-[90vh] flex flex-col anim-slide-up">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-ink tracking-tight">{trade.asset}</span>
              <DirectionPill side={trade.side} />
            </div>
            <span className="text-xs text-muted">{dateLabel} · {trade.session}</span>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink transition-colors"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto custom-scrollbar px-6 py-5 space-y-6">
          <div className="flex items-end justify-between bg-canvas rounded-xl border border-border p-4">
            <div>
              <div className="text-[11px] text-muted uppercase tracking-wide mb-1">Resultado</div>
              <RValue value={trade.rResult} className="text-2xl" />
            </div>
            <div className="text-right">
              <div className="text-[11px] text-muted uppercase tracking-wide mb-1">P&L</div>
              <PnlValue value={trade.pnl} className="text-lg" />
            </div>
            <ResultPill type={trade.type} />
          </div>

          {(trade.entry || trade.stopLoss || trade.takeProfit) && (
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-1.5">Entrada</h4>
              <Row label="Entry" value={trade.entry} />
              <Row label="Stop Loss" value={trade.stopLoss} />
              <Row label="Take Profit" value={trade.takeProfit} />
              <Row label="Tamaño" value={trade.size} />
              <Row label="Riesgo" value={trade.riskAmount ? `$${trade.riskAmount}` : ''} />
            </div>
          )}

          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-1.5">Contexto</h4>
            <Row label="Setup" value={trade.setup} />
            <Row label="Sesión" value={trade.session} />
            <Row label="Cuenta" value={trade.accountType} />
            <Row label="Hora" value={trade.time} />
          </div>

          {trade.notes && (
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-1.5">Notas</h4>
              <p className="text-sm text-ink/90 bg-canvas rounded-xl border border-border p-3.5 whitespace-pre-wrap">{trade.notes}</p>
            </div>
          )}

          {trade.screenshotUrl && (
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-1.5">Screenshot</h4>
              <img src={trade.screenshotUrl} alt="Trade screenshot" className="rounded-xl border border-border w-full object-cover" />
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border shrink-0">
          {confirmingDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted flex-1">¿Eliminar esta operación?</span>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-muted hover:text-ink border border-border"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-white bg-neg hover:bg-neg/90 disabled:opacity-50"
              >
                {deleting ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onEdit(trade)}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border border-border text-muted hover:text-ink"
              >
                <Edit2 size={15} /> Editar
              </button>
              <button
                onClick={() => setConfirmingDelete(true)}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-neg-dim border border-neg/20 text-neg hover:bg-neg/20"
              >
                <Trash2 size={15} /> Eliminar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

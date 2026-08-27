import { X } from 'lucide-react';
import { RValue, PnlValue, ResultPill, DirectionPill } from './ui';

export default function DayTradesModal({ date, trades, summary, onClose, onSelectTrade }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm anim-fade">
      <div className="bg-surface w-full max-w-lg rounded-2xl border border-border shadow-2xl my-auto max-h-[90vh] flex flex-col anim-slide-up">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <div>
            <h2 className="text-[15px] font-semibold capitalize">{date}</h2>
            {summary && (
              <div className="flex items-center gap-3 text-xs text-muted mt-1">
                <RValue value={summary.netR} />
                <PnlValue value={summary.netPnl} />
                <span>{summary.count} trades</span>
                <span>{summary.wins}W / {summary.losses}L{summary.be ? ` / ${summary.be}BE` : ''}</span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink transition-colors shrink-0"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto custom-scrollbar px-6 py-5 space-y-2">
          {trades.length === 0 ? (
            <p className="text-sm text-faint text-center py-6">No hay operaciones este día.</p>
          ) : (
            trades.map(t => (
              <button
                key={t.id}
                onClick={() => onSelectTrade(t)}
                className="w-full flex items-center justify-between bg-canvas border border-border rounded-xl px-4 py-3 hover:border-brand/30 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-ink">{t.asset}</span>
                  <DirectionPill side={t.side} />
                  <span className="hidden sm:inline text-xs text-muted">{t.setup}</span>
                </div>
                <div className="flex items-center gap-3">
                  <ResultPill type={t.type} />
                  <RValue value={t.rResult} />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
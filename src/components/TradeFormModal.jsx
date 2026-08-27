import { useState } from 'react';
import { X, ChevronDown, Layers, Zap } from 'lucide-react';
import { useApp } from '../context/useApp';
import { detectSession, initialTradeState, normalizeDateString, calculateTimestamp } from '../shared/tradeModel';
import { Field, inputClass, Button } from './ui';

export default function TradeFormModal({ trade, onClose }) {
  const { settings, addTrade, updateTrade } = useApp();
  const isEditing = !!trade;
  const [formData, setFormData] = useState(() =>
    isEditing ? { ...initialTradeState, ...trade } : { ...initialTradeState, session: detectSession(initialTradeState.time) }
  );
  const [showMore, setShowMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const computedRResult = (() => {
    if (formData.hasPartial) {
      const res = (Number(formData.partialTP) * 0.5) + (Number(formData.finalTP) * 0.5);
      return parseFloat(res.toFixed(2));
    }
    if (!isEditing || formData._typeTouched) {
      return formData.type === 'Win' ? 1.0 : formData.type === 'Loss' ? -1.0 : 0.0;
    }
    return null;
  })();

  const set = (patch) => setFormData(prev => ({ ...prev, ...patch }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.date || !formData.asset) {
      setError('Fecha y activo son obligatorios.');
      return;
    }
    setSaving(true);
    const normDate = normalizeDateString(formData.date);
    const ts = calculateTimestamp(normDate, formData.time);
    const payload = {
      ...formData,
      date: normDate,
      timestamp: ts,
      rResult: computedRResult !== null ? computedRResult : (Number(formData.rResult) || 0),
      pnl: formData.pnl === '' || formData.pnl === null ? null : Number(formData.pnl),
    };
    delete payload._typeTouched;
    try {
      if (isEditing) {
        await updateTrade(trade.id, payload);
      } else {
        await addTrade(payload);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError('No se pudo guardar la operación. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm anim-fade">
      <div className="bg-surface w-full max-w-lg rounded-2xl border border-border shadow-2xl my-auto max-h-[90vh] flex flex-col anim-slide-up">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <h2 className="text-[15px] font-semibold flex items-center gap-2">
            <Zap size={16} className="text-brand" /> {isEditing ? 'Editar operación' : 'Nueva operación'}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-ink transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto custom-scrollbar px-6 py-5 space-y-4">
          {error && (
            <div className="text-xs text-neg bg-neg-dim border border-neg/20 rounded-xl px-3.5 py-2.5">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha">
              <input type="date" value={formData.date} onChange={e => set({ date: e.target.value })} className={inputClass} required />
            </Field>
            <Field label="Hora">
              <input type="time" value={formData.time} onChange={e => {
                const t = e.target.value;
                set({ time: t, session: detectSession(t) });
              }} className={inputClass} required />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Activo">
              <select value={formData.asset} onChange={e => set({ asset: e.target.value })} className={inputClass}>
                {settings.assets.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </Field>
            <Field label="Cuenta">
              <select value={formData.accountType} onChange={e => set({ accountType: e.target.value })} className={inputClass}>
                {settings.accounts.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Dirección">
              <select value={formData.side} onChange={e => set({ side: e.target.value })} className={inputClass}>
                <option value="Buy">Long</option>
                <option value="Sell">Short</option>
              </select>
            </Field>
            <Field label="Resultado">
              <select
                value={formData.type}
                onChange={e => set({ type: e.target.value, _typeTouched: true })}
                disabled={formData.hasPartial}
                className={`${inputClass} disabled:opacity-50`}
              >
                <option value="Win">Win</option>
                <option value="Loss">Loss</option>
                <option value="BE">Break Even</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Setup">
              <select value={formData.setup} onChange={e => set({ setup: e.target.value })} className={inputClass}>
                {settings.setups.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Sesión">
              <select value={formData.session} onChange={e => set({ session: e.target.value })} className={inputClass}>
                {settings.sessions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          <div className="bg-canvas rounded-xl border border-border p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Layers size={16} className={formData.hasPartial ? 'text-brand' : 'text-faint'} />
              <span className="text-xs font-medium text-ink">Cierre parcial 50/50</span>
            </div>
            <button
              type="button"
              onClick={() => set({ hasPartial: !formData.hasPartial })}
              className={`rounded-full transition-colors relative ${formData.hasPartial ? 'bg-brand' : 'bg-border'}`}
              style={{ height: 22, width: 40 }}
            >
              <div
                className="absolute rounded-full bg-white transition-all"
                style={{ width: 18, height: 18, top: 2, left: formData.hasPartial ? 19 : 3 }}
              />
            </button>
          </div>

          {formData.hasPartial && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="TP parcial (%)">
                <input type="number" step="0.1" value={formData.partialTP} onChange={e => set({ partialTP: Number(e.target.value) })} className={inputClass} />
              </Field>
              <Field label="TP runner (%)">
                <input type="number" step="0.1" value={formData.finalTP} onChange={e => set({ finalTP: Number(e.target.value) })} className={inputClass} />
              </Field>
            </div>
          )}

            <Field label="Resultado neto (%)">
            <input
              type="number" step="0.01" value={computedRResult !== null ? computedRResult : formData.rResult}
              onChange={e => set({ rResult: Number(e.target.value) })}
              disabled={formData.hasPartial}
              className={`${inputClass} font-semibold text-brand disabled:opacity-60`}
              required
              placeholder="0.30"
            />
            </Field>
             {settings.startingBalance > 0 && (
             <p className="text-[11px] text-faint -mt-2.5">
              = ${((Number(settings.startingBalance) || 0) * ((Number(computedRResult !== null ? computedRResult : formData.rResult) || 0) / 100)).toFixed(2)} sobre tu balance de {Number(settings.startingBalance).toLocaleString('es-ES')}
            </p>
          )}

          <button
            type="button"
            onClick={() => setShowMore(s => !s)}
            className="flex items-center justify-between w-full text-xs font-medium text-muted hover:text-ink py-1 transition-colors"
          >
            Más detalles (opcional)
            <ChevronDown size={16} className={`transition-transform ${showMore ? 'rotate-180' : ''}`} />
          </button>

          {showMore && (
            <div className="space-y-4 anim-fade">
              <div className="grid grid-cols-3 gap-3">
                <Field label="Entrada">
                  <input type="text" value={formData.entry} onChange={e => set({ entry: e.target.value })} className={inputClass} placeholder="0.00" />
                </Field>
                <Field label="Stop Loss">
                  <input type="text" value={formData.stopLoss} onChange={e => set({ stopLoss: e.target.value })} className={inputClass} placeholder="0.00" />
                </Field>
                <Field label="Take Profit">
                  <input type="text" value={formData.takeProfit} onChange={e => set({ takeProfit: e.target.value })} className={inputClass} placeholder="0.00" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tamaño / lotaje">
                  <input type="text" value={formData.size} onChange={e => set({ size: e.target.value })} className={inputClass} placeholder="0.10" />
                </Field>
              </div>
              <Field label="P&L ($)">
                <input type="number" step="0.01" value={formData.pnl ?? ''} onChange={e => set({ pnl: e.target.value })} className={inputClass} placeholder="Opcional" />
              </Field>
              <Field label="Notas">
                <textarea
                  value={formData.notes} onChange={e => set({ notes: e.target.value })}
                  rows={3} className={`${inputClass} resize-none`} placeholder="¿Qué salió bien o mal en esta operación?"
                />
              </Field>
              <Field label="Screenshot (URL)">
                <input type="text" value={formData.screenshotUrl} onChange={e => set({ screenshotUrl: e.target.value })} className={inputClass} placeholder="https://..." />
              </Field>
            </div>
          )}

          <div className="pt-2 pb-1 sticky bottom-0 bg-surface">
            <Button type="submit" variant="primary" className="w-full" disabled={saving}>
              {saving ? 'Guardando…' : isEditing ? 'Actualizar operación' : 'Guardar operación'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { X, Wallet } from 'lucide-react';
import { useApp } from '../context/useApp';
import {
  ACCOUNT_TYPES, ACCOUNT_STATUS, FUNDING_PHASES, DRAWDOWN_MODES,
  emptyAccount, accountPayload,
} from '../shared/accounts';
import { Field, inputClass, Button } from './ui';

// account: cuenta a editar (con id) o null.
// initial: valores para precargar una cuenta nueva (recompra, siguiente fase…).
export default function AccountFormModal({ account, initial, title, onClose, onCreated }) {
  const { addAccount, updateAccount } = useApp();
  const isEditing = !!account?.id;
  const [form, setForm] = useState(() => {
    const base = account || initial || {};
    const merged = { ...emptyAccount(), ...base };
    // Los null del modelo se muestran como inputs vacíos
    Object.keys(merged).forEach(k => { if (merged[k] === null) merged[k] = ''; });
    return merged;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (patch) => setForm(prev => ({ ...prev, ...patch }));
  const isFunded = form.type === 'fondeo';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!String(form.name).trim()) { setError('Ponle un nombre a la cuenta.'); return; }
    if (!(Number(form.initialBalance) > 0)) { setError('El balance inicial debe ser mayor que 0.'); return; }
    setSaving(true);
    try {
      const payload = accountPayload(form);
      if (isEditing) {
        await updateAccount(account.id, payload);
      } else {
        const { data } = await addAccount(payload);
        if (onCreated) await onCreated(data);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError('No se pudo guardar la cuenta. Revisa la conexión o las reglas de Firestore.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm anim-fade">
      <div className="bg-surface w-full max-w-lg rounded-2xl border border-border shadow-2xl my-auto max-h-[90vh] flex flex-col anim-slide-up">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <h2 className="text-[15px] font-semibold flex items-center gap-2">
            <Wallet size={16} className="text-brand" /> {title || (isEditing ? 'Editar cuenta' : 'Nueva cuenta')}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-ink transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto custom-scrollbar px-6 py-5 space-y-4">
          {error && (
            <div className="text-xs text-neg bg-neg-dim border border-neg/20 rounded-xl px-3.5 py-2.5">{error}</div>
          )}

          <Field label="Nombre">
            <input
              value={form.name} onChange={e => set({ name: e.target.value })}
              className={inputClass} placeholder={isFunded ? 'FTMO 100k Fase 1' : 'Cuenta real'} autoFocus
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo">
              <select value={form.type} onChange={e => set({ type: e.target.value })} className={inputClass}>
                {ACCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="Estado">
              <select value={form.status} onChange={e => set({ status: e.target.value })} className={inputClass}>
                {ACCOUNT_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
          </div>

          {isFunded && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Empresa">
                <input value={form.firm} onChange={e => set({ firm: e.target.value })} className={inputClass} placeholder="FTMO, FundingPips…" />
              </Field>
              <Field label="Fase">
                <select value={form.phase} onChange={e => set({ phase: e.target.value })} className={inputClass}>
                  {FUNDING_PHASES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Balance inicial ($)">
              <input type="number" step="0.01" value={form.initialBalance} onChange={e => set({ initialBalance: e.target.value })} className={inputClass} placeholder="100000" />
            </Field>
            {isFunded && (
              <Field label="Costo de la cuenta ($)">
                <input type="number" step="0.01" value={form.cost} onChange={e => set({ cost: e.target.value })} className={inputClass} placeholder="Opcional" />
              </Field>
            )}
          </div>

          <div>
            <div className="text-[11px] font-medium uppercase tracking-wide text-muted ml-0.5 mb-1.5">Reglas (opcional, en %)</div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Objetivo">
                <input type="number" step="0.01" value={form.profitTarget} onChange={e => set({ profitTarget: e.target.value })} className={inputClass} placeholder="10" />
              </Field>
              <Field label="Pérdida diaria">
                <input type="number" step="0.01" value={form.maxDailyLoss} onChange={e => set({ maxDailyLoss: e.target.value })} className={inputClass} placeholder="5" />
              </Field>
              <Field label="Drawdown máx.">
                <input type="number" step="0.01" value={form.maxDrawdown} onChange={e => set({ maxDrawdown: e.target.value })} className={inputClass} placeholder="10" />
              </Field>
            </div>
          </div>

          {form.maxDrawdown !== '' && (
            <Field label="Tipo de drawdown">
              <select value={form.drawdownMode} onChange={e => set({ drawdownMode: e.target.value })} className={inputClass}>
                {DRAWDOWN_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Inicio">
              <input type="date" value={form.startDate} onChange={e => set({ startDate: e.target.value })} className={inputClass} />
            </Field>
            {form.status !== 'activa' && (
              <Field label="Fin">
                <input type="date" value={form.endDate} onChange={e => set({ endDate: e.target.value })} className={inputClass} />
              </Field>
            )}
          </div>

          <Field label="Notas">
            <textarea value={form.notes} onChange={e => set({ notes: e.target.value })} rows={2} className={`${inputClass} resize-none`} placeholder="Opcional" />
          </Field>

          <div className="pt-2 pb-1 sticky bottom-0 bg-surface">
            <Button type="submit" variant="primary" className="w-full" disabled={saving}>
              {saving ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear cuenta'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

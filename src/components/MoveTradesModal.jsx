import { useMemo, useState } from 'react';
import { X, ArrowRightLeft } from 'lucide-react';
import { useApp } from '../context/useApp';
import { Field, inputClass, Button } from './ui';

// Mueve trades de una cuenta (o nombre antiguo sin configurar) a otra.
// Guarda accountId en cada trade, así el enlace queda fijo aunque
// después se renombre la cuenta.
export default function MoveTradesModal({ initialSource = '', onClose }) {
  const { trades, accounts, legacyAccountNames, bulkUpdateTrades } = useApp();
  const [source, setSource] = useState(initialSource);
  const [target, setTarget] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  const selected = useMemo(() => trades.filter(t => {
    if (!source || t._accountId !== source) return false;
    if (from && t.date < from) return false;
    if (to && t.date > to) return false;
    return true;
  }), [trades, source, from, to]);

  const range = useMemo(() => {
    if (selected.length === 0) return null;
    const dates = selected.map(t => t.date).sort();
    return [dates[0], dates[dates.length - 1]];
  }, [selected]);

  const targetAccount = accounts.find(a => a.id === target);

  const handleMove = async () => {
    setError('');
    if (!targetAccount) { setError('Elige la cuenta de destino.'); return; }
    if (selected.length === 0) { setError('No hay trades para mover con esos filtros.'); return; }
    setSaving(true);
    try {
      await bulkUpdateTrades(selected.map(t => t.id), { accountId: targetAccount.id, accountType: targetAccount.name });
      setDone({ count: selected.length, name: targetAccount.name });
    } catch (err) {
      console.error(err);
      setError('No se pudieron mover los trades. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm anim-fade">
      <div className="bg-surface w-full max-w-md rounded-2xl border border-border shadow-2xl my-auto max-h-[90vh] flex flex-col anim-slide-up">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <h2 className="text-[15px] font-semibold flex items-center gap-2">
            <ArrowRightLeft size={16} className="text-brand" /> Mover trades
          </h2>
          <button onClick={onClose} className="text-muted hover:text-ink transition-colors"><X size={20} /></button>
        </div>

        {done ? (
          <div className="px-6 py-6 space-y-4">
            <p className="text-sm text-ink">
              Se movieron <span className="font-semibold text-pos">{done.count}</span> trades a <span className="font-semibold">{done.name}</span>.
            </p>
            <Button variant="primary" className="w-full" onClick={onClose}>Listo</Button>
          </div>
        ) : (
          <div className="overflow-y-auto custom-scrollbar px-6 py-5 space-y-4">
            {error && (
              <div className="text-xs text-neg bg-neg-dim border border-neg/20 rounded-xl px-3.5 py-2.5">{error}</div>
            )}

            <Field label="Desde">
              <select value={source} onChange={e => setSource(e.target.value)} className={inputClass}>
                <option value="">Elegir…</option>
                {legacyAccountNames.length > 0 && (
                  <optgroup label="Sin configurar">
                    {legacyAccountNames.map(n => <option key={n} value={`legacy:${n}`}>{n}</option>)}
                  </optgroup>
                )}
                {accounts.length > 0 && (
                  <optgroup label="Cuentas">
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </optgroup>
                )}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha desde (opcional)">
                <input type="date" value={from} onChange={e => setFrom(e.target.value)} className={inputClass} />
              </Field>
              <Field label="Fecha hasta (opcional)">
                <input type="date" value={to} onChange={e => setTo(e.target.value)} className={inputClass} />
              </Field>
            </div>

            <Field label="Hacia">
              <select value={target} onChange={e => setTarget(e.target.value)} className={inputClass}>
                <option value="">Elegir…</option>
                {accounts.filter(a => a.id !== source).map(a => (
                  <option key={a.id} value={a.id}>{a.name}{a.status !== 'activa' ? ` (${a.status})` : ''}</option>
                ))}
              </select>
            </Field>

            <div className="bg-canvas border border-border rounded-xl px-4 py-3 text-xs text-muted">
              {source ? (
                selected.length > 0 ? (
                  <>Se moverán <span className="font-semibold text-ink">{selected.length}</span> trades, del {range[0]} al {range[1]}.</>
                ) : 'No hay trades con esos filtros.'
              ) : 'Elige de qué cuenta quieres mover los trades.'}
            </div>

            <Button variant="primary" className="w-full" onClick={handleMove} disabled={saving || selected.length === 0 || !target}>
              {saving ? 'Moviendo…' : `Mover ${selected.length || ''} trades`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

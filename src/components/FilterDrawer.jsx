import { useMemo } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../context/useApp';
import { Field, inputClass, Button } from './ui';

export default function FilterDrawer({ onClose }) {
  const { trades, settings, filters, setFilters, clearFilters } = useApp();

  const availableYears = useMemo(() => {
    const years = trades.map(t => {
      const d = new Date(t.date + 'T12:00:00');
      return isNaN(d.getTime()) ? null : d.getFullYear().toString();
    }).filter(Boolean);
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [trades]);

  const availableMonths = useMemo(() => {
    const months = trades.map(t => {
      const d = new Date(t.date + 'T12:00:00');
      if (isNaN(d.getTime())) return null;
      return { label: d.toLocaleString('es-ES', { month: 'long', year: 'numeric' }), ts: d.getTime() };
    }).filter(Boolean);
    return Array.from(new Map(months.map(m => [m.label, m])).values()).sort((a, b) => b.ts - a.ts).map(m => m.label);
  }, [trades]);

  const set = (patch) => setFilters(prev => ({ ...prev, ...patch }));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm anim-fade">
      <div className="w-full max-w-sm bg-surface border-l border-border h-full flex flex-col anim-slide-up">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <h3 className="text-[15px] font-semibold">Filtros</h3>
          <button onClick={onClose} className="text-muted hover:text-ink transition-colors"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5 space-y-4">
          <Field label="Activo">
            <select value={filters.asset} onChange={e => set({ asset: e.target.value })} className={inputClass}>
              <option value="All">Todos</option>
              {settings.assets.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </Field>
          <Field label="Setup">
            <select value={filters.setup} onChange={e => set({ setup: e.target.value })} className={inputClass}>
              <option value="All">Todos</option>
              {settings.setups.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Sesión">
            <select value={filters.session} onChange={e => set({ session: e.target.value })} className={inputClass}>
              <option value="All">Todas</option>
              {settings.sessions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Cuenta">
            <select value={filters.account} onChange={e => set({ account: e.target.value })} className={inputClass}>
              <option value="All">Todas</option>
              {settings.accounts.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </Field>
          <Field label="Dirección">
            <select value={filters.direction} onChange={e => set({ direction: e.target.value })} className={inputClass}>
              <option value="All">Todas</option>
              <option value="Buy">Long</option>
              <option value="Sell">Short</option>
            </select>
          </Field>
          <Field label="Resultado">
            <select value={filters.result} onChange={e => set({ result: e.target.value })} className={inputClass}>
              <option value="All">Todos</option>
              <option value="Win">Win</option>
              <option value="Loss">Loss</option>
              <option value="BE">Break Even</option>
            </select>
          </Field>
          <Field label="Año">
            <select value={filters.year} onChange={e => set({ year: e.target.value })} className={inputClass}>
              <option value="All">Todos</option>
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </Field>
          <Field label="Mes">
            <select value={filters.month} onChange={e => set({ month: e.target.value })} className={inputClass}>
              <option value="All">Todos</option>
              {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
        </div>

        <div className="p-4 border-t border-border grid grid-cols-2 gap-3 shrink-0">
          <Button onClick={clearFilters}>Limpiar filtros</Button>
          <Button variant="primary" onClick={onClose}>Aplicar</Button>
        </div>
      </div>
    </div>
  );
}

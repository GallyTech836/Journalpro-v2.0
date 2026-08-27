import { useState } from 'react';
import { Plus, X, Check, Settings as SettingsIcon, Wallet } from 'lucide-react';
import { useApp } from '../context/useApp';
import { Field, inputClass, Button } from '../components/ui';

function TagListEditor({ label, items, onChange }) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const v = draft.trim();
    if (!v || items.includes(v)) { setDraft(''); return; }
    onChange([...items, v]);
    setDraft('');
  };

  const remove = (v) => onChange(items.filter(i => i !== v));

  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-4">{label}</h3>
      <div className="flex flex-wrap gap-2 mb-4">
        {items.map(item => (
          <span key={item} className="inline-flex items-center gap-1.5 bg-canvas border border-border rounded-lg pl-3 pr-1.5 py-1.5 text-xs text-ink">
            {item}
            <button onClick={() => remove(item)} className="text-faint hover:text-neg p-0.5"><X size={12} /></button>
          </span>
        ))}
        {items.length === 0 && <span className="text-xs text-faint">Sin elementos</span>}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder="Añadir nuevo…"
          className={`${inputClass} flex-1`}
        />
        <button onClick={add} className="px-3.5 rounded-xl bg-surface-hi border border-border text-muted hover:text-ink">
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { settings, saveSettings } = useApp();
  return <SettingsForm key={JSON.stringify(settings)} settings={settings} saveSettings={saveSettings} />;
}

function SettingsForm({ settings, saveSettings }) {
  const [local, setLocal] = useState(settings);
  const [saved, setSaved] = useState(false);

  const update = (patch) => { setLocal(prev => ({ ...prev, ...patch })); setSaved(false); };

  const handleSave = async () => {
    await saveSettings(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-5 anim-fade">
      <div>
        <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <SettingsIcon size={18} className="text-muted" /> Settings
        </h1>
        <p className="text-sm text-muted mt-0.5">Configura activos, setups, sesiones y cuentas</p>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-4 flex items-center gap-1.5">
          <Wallet size={13} /> Balance inicial
        </h3>
        <Field label="Balance de referencia ($)">
          <input
            type="number" step="0.01"
            value={local.startingBalance}
            onChange={e => update({ startingBalance: Number(e.target.value) })}
            className={inputClass}
          />
        </Field>
        <p className="text-[11px] text-faint mt-2">Se usa para calcular el balance mostrado en el Dashboard (balance inicial + P&L acumulado). El resultado (%) de cada operación se calcula sobre este balance.</p>
      </div>

      <TagListEditor label="Activos" items={local.assets} onChange={(v) => update({ assets: v })} />
      <TagListEditor label="Setups" items={local.setups} onChange={(v) => update({ setups: v })} />
      <TagListEditor label="Sesiones" items={local.sessions} onChange={(v) => update({ sessions: v })} />
      <TagListEditor label="Cuentas" items={local.accounts} onChange={(v) => update({ accounts: v })} />

      <div className="sticky bottom-4">
        <Button variant="primary" className="w-full" onClick={handleSave}>
          {saved ? <><Check size={16} /> Guardado</> : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  );
}

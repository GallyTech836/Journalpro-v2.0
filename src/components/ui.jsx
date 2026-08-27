import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function StatCard({ label, value, icon: Icon, tone = 'default', hint }) {
  const toneClass = {
    default: 'text-ink',
    pos: 'text-pos',
    neg: 'text-neg',
    brand: 'text-brand',
  }[tone];
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</span>
        {Icon && <Icon size={14} className="text-faint" />}
      </div>
      <div className={`text-xl sm:text-2xl font-semibold tabular ${toneClass}`}>{value}</div>
      {hint && <div className="text-[11px] text-faint mt-1">{hint}</div>}
    </div>
  );
}

export function ResultPill({ type }) {
  const map = {
    Win: 'text-pos bg-pos-dim border-pos/20',
    Loss: 'text-neg bg-neg-dim border-neg/20',
    BE: 'text-warn bg-warn-dim border-warn/20',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide border ${map[type] || map.BE}`}>
      {type}
    </span>
  );
}

export function DirectionPill({ side }) {
  const isShort = side === 'Sell';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide border ${
      isShort ? 'text-warn bg-warn-dim border-warn/20' : 'text-brand bg-brand-dim border-brand/20'
    }`}>
      {isShort ? <ArrowDownRight size={10} /> : <ArrowUpRight size={10} />}
      {isShort ? 'Short' : 'Long'}
    </span>
  );
}

export function RValue({ value, className = '' }) {
  const n = Number(value) || 0;
  const tone = n > 0 ? 'text-pos' : n < 0 ? 'text-neg' : 'text-muted';
  return <span className={`tabular font-semibold ${tone} ${className}`}>{n > 0 ? '+' : ''}{n.toFixed(2)}%</span>;
}

export function PnlValue({ value, className = '' }) {
  if (value === null || value === undefined || value === '') {
    return <span className={`tabular text-faint ${className}`}>—</span>;
  }
  const n = Number(value) || 0;
  const tone = n > 0 ? 'text-pos' : n < 0 ? 'text-neg' : 'text-muted';
  return <span className={`tabular font-semibold ${tone} ${className}`}>{n > 0 ? '+' : ''}${n.toFixed(2)}</span>;
}

export function Button({ children, variant = 'default', className = '', ...props }) {
  const variants = {
    default: 'bg-surface-hi border border-border text-muted hover:text-ink',
    primary: 'bg-brand hover:bg-brand-hover text-white',
    ghost: 'text-muted hover:text-ink hover:bg-surface-hi',
    danger: 'bg-neg-dim border border-neg/20 text-neg hover:bg-neg/20',
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium px-4 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function IconButton({ children, active, className = '', ...props }) {
  return (
    <button
      className={`relative p-2.5 rounded-xl border transition-colors ${
        active ? 'border-brand/40 text-brand bg-brand-dim' : 'border-border bg-surface-hi text-muted hover:text-ink'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-medium uppercase tracking-wide text-muted ml-0.5">{label}</label>
      {children}
    </div>
  );
}

export const inputClass =
  'w-full bg-canvas border border-border rounded-xl px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand/50 transition-colors placeholder:text-faint';

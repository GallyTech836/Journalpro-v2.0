import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Plus, Wallet, Flame, Trophy, RotateCcw, Pencil, Trash2, ArrowRight, TriangleAlert as AlertTriangle, Copy, ArrowRightLeft,
} from 'lucide-react';
import { useApp } from '../context/useApp';
import {
  computeAccountStats, cloneAccountConfig, nextPhase, typeLabel, statusLabel,
} from '../shared/accounts';
import { Button, PnlValue } from '../components/ui';
import EmptyState from '../components/EmptyState';
import AccountFormModal from '../components/AccountFormModal';
import MoveTradesModal from '../components/MoveTradesModal';

const today = () => format(new Date(), 'yyyy-MM-dd');
const money = (n) => `$${Number(n || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS_STYLE = {
  activa: 'text-brand bg-brand-dim border-brand/20',
  quemada: 'text-neg bg-neg-dim border-neg/20',
  aprobada: 'text-pos bg-pos-dim border-pos/20',
  cerrada: 'text-muted bg-surface-hi border-border',
};

function StatusPill({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide border ${STATUS_STYLE[status] || STATUS_STYLE.cerrada}`}>
      {statusLabel(status)}
    </span>
  );
}

function Meter({ label, value, limit, tone = 'neg', suffix = '%' }) {
  const ratio = limit ? Math.min(100, (value / limit) * 100) : 0;
  const color = tone === 'pos'
    ? 'bg-pos'
    : ratio >= 100 ? 'bg-neg' : ratio >= 70 ? 'bg-warn' : 'bg-faint';
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-1">
        <span className="text-muted">{label}</span>
        <span className="tabular text-ink">{value.toFixed(2)}{suffix} <span className="text-faint">/ {limit}{suffix}</span></span>
      </div>
      <div className="h-1.5 rounded-full bg-canvas border border-border overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${ratio}%` }} />
      </div>
    </div>
  );
}

function SmallBtn({ children, onClick, tone = 'default' }) {
  const tones = {
    default: 'border-border text-muted hover:text-ink',
    neg: 'border-neg/20 text-neg bg-neg-dim hover:bg-neg/20',
    pos: 'border-pos/20 text-pos bg-pos-dim hover:bg-pos/20',
    brand: 'border-brand/30 text-brand bg-brand-dim hover:bg-brand/20',
  };
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${tones[tone]}`}>
      {children}
    </button>
  );
}

function AccountCard({ account, stats, onEdit, onOpenForm, onShowTrades }) {
  const { updateAccount, deleteAccount } = useApp();
  const [confirm, setConfirm] = useState(null); // 'quemada' | 'aprobada' | 'cerrada' | 'delete'
  const isFunded = account.type === 'fondeo';
  const isActive = account.status === 'activa';
  const next = nextPhase(account.phase);

  const setStatus = async (status) => {
    await updateAccount(account.id, { status, endDate: status === 'activa' ? '' : today() });
    setConfirm(null);
  };

  const confirmText = {
    quemada: '¿Marcar como quemada?',
    aprobada: '¿Marcar como aprobada?',
    cerrada: '¿Cerrar esta cuenta?',
    delete: '¿Eliminar la cuenta? No tiene operaciones.',
  };

  return (
    <div className={`bg-surface border rounded-2xl p-5 space-y-4 ${stats.breaches.length && isActive ? 'border-neg/40' : 'border-border'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-ink truncate">{account.name}</span>
            <StatusPill status={account.status} />
          </div>
          <div className="text-[11px] text-faint mt-1">
            {typeLabel(account.type)}
            {isFunded && account.firm ? ` · ${account.firm}` : ''}
            {isFunded && account.phase ? ` · ${account.phase}` : ''}
            {` · ${money(account.initialBalance)}`}
            {isFunded && account.cost ? ` · costo ${money(account.cost)}` : ''}
          </div>
        </div>
        <button onClick={() => onEdit(account)} className="text-faint hover:text-ink p-1 shrink-0" title="Editar">
          <Pencil size={15} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-muted mb-0.5">Balance</div>
          <div className="text-sm font-semibold tabular text-ink">{money(stats.balance)}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-muted mb-0.5">P&L</div>
          <div className="text-sm"><PnlValue value={stats.pnl} /></div>
          <div className={`text-[11px] tabular ${stats.pnlPct >= 0 ? 'text-pos' : 'text-neg'}`}>
            {stats.pnlPct > 0 ? '+' : ''}{stats.pnlPct.toFixed(2)}%
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-muted mb-0.5">Trades</div>
          <div className="text-sm font-semibold tabular text-ink">{stats.trades}</div>
          {stats.trades > 0 && <div className="text-[11px] text-faint tabular">{stats.winRate.toFixed(0)}% WR</div>}
        </div>
      </div>

      {(account.profitTarget || account.maxDailyLoss || account.maxDrawdown) && (
        <div className="space-y-2.5">
          {account.profitTarget ? (
            <Meter label="Objetivo" value={Math.max(0, stats.pnlPct)} limit={account.profitTarget} tone="pos" />
          ) : null}
          {account.maxDailyLoss && isActive ? (
            <Meter label="Pérdida hoy" value={Math.max(0, -stats.todayPct)} limit={account.maxDailyLoss} />
          ) : null}
          {account.maxDrawdown ? (
            <Meter
              label={isActive ? `Drawdown actual (${account.drawdownMode === 'trailing' ? 'trailing' : 'estático'})` : 'Peor drawdown'}
              value={isActive ? stats.currentDdPct : stats.worstDdPct}
              limit={account.maxDrawdown}
            />
          ) : null}
        </div>
      )}

      {isActive && stats.breaches.length > 0 && (
        <div className="flex items-start gap-2 text-xs text-neg bg-neg-dim border border-neg/20 rounded-xl px-3 py-2.5">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>
            Según tus operaciones se superó {stats.breaches.includes('drawdown') ? 'el drawdown máximo' : ''}
            {stats.breaches.length === 2 ? ' y ' : ''}
            {stats.breaches.includes('daily') ? 'la pérdida diaria máxima' : ''}.
          </span>
        </div>
      )}
      {isActive && isFunded && stats.targetReached && (
        <div className="flex items-center gap-2 text-xs text-pos bg-pos-dim border border-pos/20 rounded-xl px-3 py-2.5">
          <Trophy size={14} /> Objetivo alcanzado.
        </div>
      )}

      {confirm ? (
        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs text-muted flex-1">{confirmText[confirm]}</span>
          <SmallBtn onClick={() => setConfirm(null)}>Cancelar</SmallBtn>
          <SmallBtn
            tone={confirm === 'aprobada' ? 'pos' : 'neg'}
            onClick={() => (confirm === 'delete' ? deleteAccount(account.id) : setStatus(confirm))}
          >
            Confirmar
          </SmallBtn>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 pt-1">
          {stats.trades > 0 && (
            <SmallBtn onClick={() => onShowTrades(account)}>Ver trades <ArrowRight size={12} /></SmallBtn>
          )}

          {isActive && isFunded && (
            <SmallBtn tone="neg" onClick={() => setConfirm('quemada')}><Flame size={13} /> Quemada</SmallBtn>
          )}
          {isActive && isFunded && account.phase !== 'Fondeada' && (
            <SmallBtn tone="pos" onClick={() => setConfirm('aprobada')}><Trophy size={13} /> Aprobada</SmallBtn>
          )}
          {isActive && (!isFunded || account.phase === 'Fondeada') && (
            <SmallBtn onClick={() => setConfirm('cerrada')}>Cerrar</SmallBtn>
          )}

          {account.status === 'quemada' && (
            <SmallBtn
              tone="brand"
              onClick={() => onOpenForm({
                initial: cloneAccountConfig(account, { phase: isFunded ? 'Fase 1' : account.phase }),
                title: 'Nueva cuenta (misma configuración)',
              })}
            >
              <Copy size={13} /> Comprar otra igual
            </SmallBtn>
          )}
          {account.status === 'aprobada' && next && (
            <SmallBtn
              tone="brand"
              onClick={() => onOpenForm({
                initial: cloneAccountConfig(account, { phase: next, keepCost: false }),
                title: `Crear ${next}`,
              })}
            >
              <ArrowRight size={13} /> Crear {next}
            </SmallBtn>
          )}
          {!isActive && (
            <SmallBtn onClick={() => setStatus('activa')}><RotateCcw size={13} /> Reactivar</SmallBtn>
          )}
          {stats.trades === 0 && (
            <SmallBtn onClick={() => setConfirm('delete')}><Trash2 size={13} /></SmallBtn>
          )}
        </div>
      )}
    </div>
  );
}

const LEGACY_TYPE = { real: 'real', demo: 'demo', backtesting: 'backtest', backtest: 'backtest' };

export default function AccountsPage() {
  const { accounts, trades, legacyAccountNames, setFilters, clearFilters, bulkUpdateTrades } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState(null); // { account?, initial?, title?, legacyName? }
  const [move, setMove] = useState(null); // { source }

  const statsById = useMemo(() => {
    const byAcc = {};
    trades.forEach(t => { (byAcc[t._accountId] ||= []).push(t); });
    return Object.fromEntries(accounts.map(a => [a.id, computeAccountStats(a, byAcc[a.id] || [])]));
  }, [accounts, trades]);

  const legacyCounts = useMemo(() => {
    const c = {};
    trades.forEach(t => { if (t._accountId.startsWith('legacy:')) c[t.accountType] = (c[t.accountType] || 0) + 1; });
    return c;
  }, [trades]);

  const active = accounts.filter(a => a.status === 'activa');
  const history = accounts.filter(a => a.status !== 'activa');

  const funded = accounts.filter(a => a.type === 'fondeo');
  const fundedSummary = {
    total: funded.length,
    burned: funded.filter(a => a.status === 'quemada').length,
    passed: funded.filter(a => a.status === 'aprobada').length,
    live: funded.filter(a => a.phase === 'Fondeada' && a.status === 'activa').length,
    spent: funded.reduce((s, a) => s + (Number(a.cost) || 0), 0),
  };

  const showTrades = (account) => {
    clearFilters();
    setFilters(prev => ({ ...prev, account: account.id }));
    navigate('/journal');
  };

  const cardProps = {
    onEdit: (account) => setForm({ account }),
    onOpenForm: (opts) => setForm(opts),
    onShowTrades: showTrades,
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 anim-fade">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Cuentas</h1>
          <p className="text-sm text-muted mt-0.5">Fondeo, real, demo y backtest</p>
        </div>
        <div className="flex items-center gap-2">
          {accounts.length > 0 && (
            <Button onClick={() => setMove({ source: '' })}>
              <ArrowRightLeft size={16} /> <span className="hidden sm:inline">Mover trades</span>
            </Button>
          )}
          <Button variant="primary" onClick={() => setForm({})}>
            <Plus size={16} /> <span className="hidden sm:inline">Nueva cuenta</span>
          </Button>
        </div>
      </div>

      {fundedSummary.total > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            ['Cuentas de fondeo', fundedSummary.total, 'text-ink'],
            ['Quemadas', fundedSummary.burned, 'text-neg'],
            ['Aprobadas', fundedSummary.passed, 'text-pos'],
            ['Fondeadas activas', fundedSummary.live, 'text-brand'],
            ['Invertido en fondeo', money(fundedSummary.spent), 'text-ink'],
          ].map(([label, value, tone]) => (
            <div key={label} className="bg-surface border border-border rounded-2xl p-4">
              <div className="text-[10px] font-medium uppercase tracking-wide text-muted mb-1.5">{label}</div>
              <div className={`text-lg font-semibold tabular ${tone}`}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {legacyAccountNames.length > 0 && (
        <div className="bg-surface border border-warn/30 rounded-2xl p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-warn mb-1">Cuentas sin configurar</h3>
          <p className="text-[11px] text-muted mb-3">
            Tienes operaciones guardadas con estos nombres de cuenta. Puedes crear una cuenta nueva para ellas o moverlas a una cuenta que ya tengas.
          </p>
          <div className="space-y-2">
            {legacyAccountNames.map(name => (
              <div key={name} className="flex flex-wrap items-center justify-between gap-2 bg-canvas border border-border rounded-xl px-3.5 py-2.5">
                <span className="text-sm text-ink">
                  {name} <span className="text-[11px] text-faint">({legacyCounts[name] || 0} trades)</span>
                </span>
                <div className="flex gap-2">
                  {accounts.length > 0 && (
                    <SmallBtn tone="brand" onClick={() => setMove({ source: `legacy:${name}` })}>
                      <ArrowRightLeft size={12} /> Mover a una cuenta
                    </SmallBtn>
                  )}
                  <SmallBtn
                    onClick={() => setForm({
                      initial: { name, type: LEGACY_TYPE[String(name).toLowerCase()] || 'real', phase: '' },
                      title: `Crear cuenta para "${name}"`,
                      legacyName: name,
                    })}
                  >
                    <Plus size={12} /> Crear cuenta
                  </SmallBtn>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {accounts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Aún no tienes cuentas"
          description="Crea tus cuentas de fondeo o reales para seguir el balance y las reglas de cada una."
          actionLabel="Nueva cuenta"
          onAction={() => setForm({})}
        />
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Activas ({active.length})</h2>
            {active.length === 0 ? (
              <p className="text-xs text-faint">No tienes cuentas activas.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {active.map(a => <AccountCard key={a.id} account={a} stats={statsById[a.id]} {...cardProps} />)}
              </div>
            )}
          </section>

          {history.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Historial ({history.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {history.map(a => <AccountCard key={a.id} account={a} stats={statsById[a.id]} {...cardProps} />)}
              </div>
            </section>
          )}
        </>
      )}

      {form && (
        <AccountFormModal
          account={form.account}
          initial={form.initial}
          title={form.title}
          onClose={() => setForm(null)}
          onCreated={form.legacyName ? async (created) => {
            // Enlaza de forma fija los trades antiguos con la cuenta recién creada
            const ids = trades.filter(t => t._accountId === `legacy:${form.legacyName}`).map(t => t.id);
            if (ids.length) await bulkUpdateTrades(ids, { accountId: created.id, accountType: created.name });
          } : undefined}
        />
      )}

      {move && <MoveTradesModal initialSource={move.source} onClose={() => setMove(null)} />}
    </div>
  );
}

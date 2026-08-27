import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Wallet, Target, TrendingUp, Layers, ChartBar as BarChart3, Clock, Trophy, Award, Compass, ListFilter as Filter } from 'lucide-react';
import { useApp } from '../context/useApp';
import { computeAllMetrics, buildEquityCurve, groupPerformance } from '../shared/metrics';
import { StatCard, RValue, PnlValue, ResultPill, DirectionPill, IconButton } from '../components/ui';
import EmptyState from '../components/EmptyState';
import FilterDrawer from '../components/FilterDrawer';

export default function Dashboard() {
  const { trades, filteredTrades, activeFilterCount, settings } = useApp();
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);

  const metrics = useMemo(() => computeAllMetrics(filteredTrades, settings), [filteredTrades, settings]);
  const equityData = useMemo(() => buildEquityCurve(filteredTrades, 'r'), [filteredTrades]);
  const recent = useMemo(() => [...filteredTrades].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5), [filteredTrades]);

  const bySetup = useMemo(() => groupPerformance(filteredTrades, t => t.setup), [filteredTrades]);
  const bySession = useMemo(() => groupPerformance(filteredTrades, t => t.session), [filteredTrades]);
  const byAsset = useMemo(() => groupPerformance(filteredTrades, t => t.asset), [filteredTrades]);

  const bestSetup = bySetup[0];
  const bestSession = [...bySession].sort((a, b) => b.netR - a.netR)[0];
  const bestAsset = [...byAsset].sort((a, b) => b.netR - a.netR)[0];

  const balance = settings.startingBalance + metrics.netPnl;

  if (trades.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <EmptyState
          icon={Compass}
          title="Aún no hay operaciones"
          description="Registra tu primer trade para empezar a construir tu historial de rendimiento."
          actionLabel="Nueva operación"
          onAction={() => navigate('/journal')}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 anim-fade">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted mt-0.5">Cómo estás operando actualmente</p>
        </div>
        <IconButton onClick={() => setShowFilters(true)} active={activeFilterCount > 0} title="Filtro">
          <Filter size={16} />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand text-[9px] font-bold text-white flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </IconButton>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Balance" value={`$${balance.toFixed(2)}`} icon={Wallet} />
        <StatCard
          label="P&L Neto"
          value={<PnlValue value={metrics.netPnl} />}
          icon={TrendingUp}
        />
        <StatCard label="Win Rate" value={`${metrics.winRate.toFixed(1)}%`} icon={Target} tone={metrics.winRate >= 50 ? 'pos' : 'default'} />
        <StatCard label="Avg % (wins)" value={`${metrics.avgWinR.toFixed(2)}%`} icon={Layers} tone="brand" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted flex items-center gap-1.5">
                <BarChart3 size={13} /> Equity Curve
              </h3>
              <p className="text-[11px] text-faint mt-1">Rendimiento acumulado en %</p>
            </div>
            <RValue value={metrics.netR} className="text-xl" />
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={equityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232833" vertical={false} opacity={0.6} />
                <XAxis dataKey="name" hide />
                <YAxis stroke="#4B525E" fontSize={10} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} width={36} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#12151C', border: '1px solid #232833', borderRadius: 12, fontSize: 12 }}
                  labelFormatter={() => ''}
                  formatter={(v) => [`${v > 0 ? '+' : ''}${Number(v).toFixed(2)}%`, 'Equity']}
                  cursor={{ stroke: '#6C6FF0', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Line type="monotone" dataKey="value" stroke="#6C6FF0" strokeWidth={2.5} dot={false} animationDuration={600} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-surface border border-border rounded-2xl p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-4 flex items-center gap-1.5">
              <Trophy size={13} /> Best Setup
            </h3>
            {bestSetup ? (
              <>
                <div className="text-sm font-semibold text-ink mb-1">{bestSetup.key}</div>
                <div className="flex items-center gap-3 text-xs text-muted">
                  <span>{bestSetup.winRate.toFixed(0)}% WR</span>
                  <RValue value={bestSetup.netR} className="text-xs" />
                </div>
              </>
            ) : <span className="text-xs text-faint">Sin datos</span>}
          </div>
          <div className="bg-surface border border-border rounded-2xl p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-4 flex items-center gap-1.5">
              <Award size={13} /> Best Session
            </h3>
            {bestSession ? (
              <>
                <div className="text-sm font-semibold text-ink mb-1">{bestSession.key}</div>
                <div className="flex items-center gap-3 text-xs text-muted">
                  <span>{bestSession.winRate.toFixed(0)}% WR</span>
                  <RValue value={bestSession.netR} className="text-xs" />
                </div>
              </>
            ) : <span className="text-xs text-faint">Sin datos</span>}
          </div>
          <div className="bg-surface border border-border rounded-2xl p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-4 flex items-center gap-1.5">
              <Target size={13} /> Best Asset
            </h3>
            {bestAsset ? (
              <>
                <div className="text-sm font-semibold text-ink mb-1">{bestAsset.key}</div>
                <div className="flex items-center gap-3 text-xs text-muted">
                  <span>{bestAsset.winRate.toFixed(0)}% WR</span>
                  <RValue value={bestAsset.netR} className="text-xs" />
                </div>
              </>
            ) : <span className="text-xs text-faint">Sin datos</span>}
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted flex items-center gap-1.5">
            <Clock size={13} /> Recent Trades
          </h3>
          <button onClick={() => navigate('/journal')} className="text-xs font-medium text-brand hover:text-brand-hover">
            Ver todas
          </button>
        </div>
        <div className="divide-y divide-border">
          {recent.map(t => (
            <div key={t.id} className="flex items-center justify-between px-5 sm:px-6 py-3.5">
              <div className="flex items-center gap-3">
                <DirectionPill side={t.side} />
                <div>
                  <div className="text-sm font-medium text-ink">{t.asset}</div>
                  <div className="text-[11px] text-faint">{t.date} · {t.setup}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ResultPill type={t.type} />
                <RValue value={t.rResult} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {showFilters && <FilterDrawer onClose={() => setShowFilters(false)} />}
    </div>
  );
}
import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartBar as BarChart3, Layers, Clock, ArrowLeftRight, TrendingUp, ListFilter as Filter } from 'lucide-react';
import { useApp } from '../context/useApp';
import { computeAllMetrics, buildEquityCurve, groupPerformance } from '../shared/metrics';
import { StatCard, RValue, IconButton } from '../components/ui';
import EmptyState from '../components/EmptyState';
import FilterDrawer from '../components/FilterDrawer';

function BreakdownTable({ title, icon: Icon, rows }) {
  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted flex items-center gap-1.5">
          <Icon size={13} /> {title}
        </h3>
      </div>
      <div className="divide-y divide-border">
        {rows.map(r => (
          <div key={r.key} className="flex items-center justify-between px-5 py-3">
            <div>
              <div className="text-sm font-medium text-ink">{r.key}</div>
              <div className="text-[11px] text-faint">{r.total} trades · {r.winRate.toFixed(0)}% WR</div>
            </div>
            <RValue value={r.netR} />
          </div>
        ))}
        {rows.length === 0 && <div className="px-5 py-6 text-center text-xs text-faint">Sin datos suficientes</div>}
      </div>
    </div>
  );
}

export default function Analytics() {
  const { trades, filteredTrades, activeFilterCount, settings } = useApp();
  const [curveMode, setCurveMode] = useState('r');
  const [showFilters, setShowFilters] = useState(false);

  const metrics = useMemo(() => computeAllMetrics(filteredTrades, settings), [filteredTrades, settings]);
  const equityData = useMemo(() => buildEquityCurve(filteredTrades, curveMode === 'pnl' ? 'pnl' : 'r', settings), [filteredTrades, curveMode, settings]);
  const byAsset = useMemo(() => groupPerformance(filteredTrades, t => t.asset, settings), [filteredTrades, settings]);
  const bySetup = useMemo(() => groupPerformance(filteredTrades, t => t.setup, settings), [filteredTrades, settings]);
  const bySession = useMemo(() => groupPerformance(filteredTrades, t => t.session, settings), [filteredTrades, settings]);
  const byDirection = useMemo(() => groupPerformance(filteredTrades, t => t.side === 'Sell' ? 'Short' : 'Long', settings), [filteredTrades, settings]);

  if (trades.length < 3) {
    return (
      <div className="max-w-6xl mx-auto">
        <EmptyState
          icon={BarChart3}
          title="Not enough data yet"
          description="Keep journaling to unlock your analytics."
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-5 anim-fade">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted mt-0.5">Qué patrones existen en tus resultados</p>
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
        <StatCard label="Win Rate" value={`${metrics.winRate.toFixed(1)}%`} icon={TrendingUp} />
        <StatCard label="Expectancy" value={`${metrics.expectancy.toFixed(2)}%`} icon={Layers} />
        <StatCard label="Profit Factor" value={metrics.profitFactor.toFixed(2)} icon={BarChart3} />
        <StatCard label="Max Drawdown" value={`${metrics.maxDrawdown.toFixed(1)}%`} icon={ArrowLeftRight} tone="neg" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Avg Win" value={`${metrics.avgWinR.toFixed(2)}%`} tone="pos" />
        <StatCard label="Avg Loss" value={`-${metrics.avgLossR.toFixed(2)}%`} tone="neg" />
        <StatCard label="Win Streak" value={metrics.maxWinStreak} />
        <StatCard label="Loss Streak" value={metrics.maxLossStreak} />
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted flex items-center gap-1.5">
            <BarChart3 size={13} /> Equity Curve
          </h3>
          <div className="flex items-center bg-canvas border border-border rounded-lg p-0.5">
            {['r', 'pnl'].map(m => (
              <button
                key={m}
                onClick={() => setCurveMode(m)}
                className={`px-3 py-1 rounded-md text-[11px] font-semibold uppercase transition-colors ${
                  curveMode === m ? 'bg-brand text-white' : 'text-muted'
                }`}
              >
                {m === 'r' ? '%' : '$'}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={equityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232833" vertical={false} opacity={0.6} />
              <XAxis dataKey="name" hide />
              <YAxis
                stroke="#4B525E" fontSize={10} axisLine={false} tickLine={false} width={40}
                tickFormatter={(v) => curveMode === 'pnl' ? `$${v}` : `${v}%`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#12151C', border: '1px solid #232833', borderRadius: 12, fontSize: 12 }}
                labelFormatter={() => ''}
                formatter={(v) => [curveMode === 'pnl' ? `$${Number(v).toFixed(2)}` : `${Number(v).toFixed(2)}%`, 'Equity']}
                cursor={{ stroke: '#6C6FF0', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Line type="monotone" dataKey="value" stroke="#6C6FF0" strokeWidth={2.5} dot={false} animationDuration={600} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <BreakdownTable title="By Asset" icon={TrendingUp} rows={byAsset} />
        <BreakdownTable title="By Setup" icon={Layers} rows={bySetup} />
        <BreakdownTable title="By Session" icon={Clock} rows={bySession} />
        <BreakdownTable title="By Direction" icon={ArrowLeftRight} rows={byDirection} />
      </div>

      {showFilters && <FilterDrawer onClose={() => setShowFilters(false)} />}
    </div>
  );
}
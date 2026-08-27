// Todas las métricas de la app pasan por estas funciones.
// Dashboard, Calendar y Analytics NUNCA deben recalcular esto por su cuenta.

// El resultado de cada operación se carga directamente en % del balance inicial.
// Ej: balance 25.000, resultado = 0.3% -> esa operación valen $75.
// Si el trade tiene un P&L en $ cargado a mano, ese valor manda siempre.
function effectivePnl(t, settings = {}) {
  if (t.pnl !== null && t.pnl !== undefined && t.pnl !== '') return Number(t.pnl) || 0;
  const baseBalance = Number(settings.startingBalance) || 0;
  return baseBalance * ((Number(t.rResult) || 0) / 100);
}

export function calculatePnL(trades, settings = {}) {
  return trades.reduce((sum, t) => sum + effectivePnl(t, settings), 0);
}

export function calculateNetR(trades) {
  return trades.reduce((sum, t) => sum + (Number(t.rResult) || 0), 0);
}

export function calculateWinRate(trades) {
  if (trades.length === 0) return 0;
  const wins = trades.filter(t => Number(t.rResult) > 0).length;
  return (wins / trades.length) * 100;
}

export function calculateLossRate(trades) {
  if (trades.length === 0) return 0;
  const losses = trades.filter(t => Number(t.rResult) < 0).length;
  return (losses / trades.length) * 100;
}

export function calculateBeRate(trades) {
  if (trades.length === 0) return 0;
  const be = trades.filter(t => Number(t.rResult) === 0).length;
  return (be / trades.length) * 100;
}

export function calculateAverageR(trades) {
  const wins = trades.filter(t => Number(t.rResult) > 0);
  if (wins.length === 0) return 0;
  return wins.reduce((s, t) => s + Number(t.rResult), 0) / wins.length;
}

export function calculateAverageLossR(trades) {
  const losses = trades.filter(t => Number(t.rResult) < 0);
  if (losses.length === 0) return 0;
  return losses.reduce((s, t) => s + Math.abs(Number(t.rResult)), 0) / losses.length;
}

export function calculateExpectancy(trades) {
  if (trades.length === 0) return 0;
  return calculateNetR(trades) / trades.length;
}

export function calculateProfitFactor(trades) {
  const grossWinR = trades.filter(t => Number(t.rResult) > 0).reduce((s, t) => s + Number(t.rResult), 0);
  const grossLossR = trades.filter(t => Number(t.rResult) < 0).reduce((s, t) => s + Math.abs(Number(t.rResult)), 0);
  if (grossLossR === 0) return grossWinR;
  return grossWinR / grossLossR;
}

// Drawdown calculado sobre la curva de equity en R, en orden cronológico.
export function calculateDrawdown(trades) {
  const chron = [...trades].sort((a, b) => a.timestamp - b.timestamp);
  let peak = 0, equity = 0, maxDD = 0;
  chron.forEach(t => {
    equity += Number(t.rResult) || 0;
    peak = Math.max(peak, equity);
    maxDD = Math.max(maxDD, peak - equity);
  });
  return maxDD;
}

export function calculateStreaks(trades) {
  const chron = [...trades].sort((a, b) => a.timestamp - b.timestamp);
  let curW = 0, curL = 0, curBE = 0, maxW = 0, maxL = 0, maxBE = 0;
  chron.forEach(t => {
    const r = Number(t.rResult) || 0;
    if (r > 0) { curW++; curL = 0; curBE = 0; }
    else if (r < 0) { curL++; curW = 0; curBE = 0; }
    else { curBE++; curW = 0; curL = 0; }
    maxW = Math.max(maxW, curW); maxL = Math.max(maxL, curL); maxBE = Math.max(maxBE, curBE);
  });
  return { maxWinStreak: maxW, maxLossStreak: maxL, maxBeStreak: maxBE };
}

// Curva de equity acumulada, en R o en $ según `mode`.
export function buildEquityCurve(trades, mode = 'r', settings = {}) {
  const chron = [...trades].sort((a, b) => a.timestamp - b.timestamp);
  let bal = 0;
  return chron.map((t, i) => {
    bal += mode === 'pnl' ? effectivePnl(t, settings) : (Number(t.rResult) || 0);
    return { name: i + 1, value: bal, date: t.date };
  });
}

// Agrupa trades por una key arbitraria (activo, setup, sesión, dirección...)
// y devuelve win rate, R neto y P&L neto por grupo.
export function groupPerformance(trades, keyFn, settings = {}) {
  const groups = {};
  trades.forEach(t => {
    const key = keyFn(t) || 'Sin definir';
    if (!groups[key]) groups[key] = { key, trades: [] };
    groups[key].trades.push(t);
  });
  return Object.values(groups).map(g => ({
    key: g.key,
    total: g.trades.length,
    winRate: calculateWinRate(g.trades),
    netR: calculateNetR(g.trades),
    netPnl: calculatePnL(g.trades, settings),
  })).sort((a, b) => b.total - a.total);
}

// Agrupa trades por fecha (YYYY-MM-DD) para el Calendar.
export function groupByDay(trades) {
  const byDay = {};
  trades.forEach(t => {
    if (!byDay[t.date]) byDay[t.date] = [];
    byDay[t.date].push(t);
  });
  return byDay;
}

export function summarizeDay(dayTrades, settings = {}) {
  const wins = dayTrades.filter(t => Number(t.rResult) > 0).length;
  const losses = dayTrades.filter(t => Number(t.rResult) < 0).length;
  const be = dayTrades.length - wins - losses;
  return {
    count: dayTrades.length,
    wins,
    losses,
    be,
    netR: calculateNetR(dayTrades),
    netPnl: calculatePnL(dayTrades, settings),
    outcome: wins === 0 && losses === 0 ? 'neutral' : (calculateNetR(dayTrades) > 0 ? 'positive' : calculateNetR(dayTrades) < 0 ? 'negative' : 'neutral'),
  };
}

export function computeAllMetrics(trades, settings = {}) {
  return {
    total: trades.length,
    winRate: calculateWinRate(trades),
    lossRate: calculateLossRate(trades),
    beRate: calculateBeRate(trades),
    avgWinR: calculateAverageR(trades),
    avgLossR: calculateAverageLossR(trades),
    expectancy: calculateExpectancy(trades),
    profitFactor: calculateProfitFactor(trades),
    maxDrawdown: calculateDrawdown(trades),
    netR: calculateNetR(trades),
    netPnl: calculatePnL(trades, settings),
    ...calculateStreaks(trades),
  };
}
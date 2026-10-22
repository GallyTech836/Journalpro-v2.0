// Modelo de cuentas (fondeo, real, demo, backtest) y cálculos por cuenta.
import { format } from 'date-fns';

export const ACCOUNT_TYPES = [
  { value: 'fondeo', label: 'Fondeo' },
  { value: 'real', label: 'Real' },
  { value: 'demo', label: 'Demo' },
  { value: 'backtest', label: 'Backtest' },
];

export const ACCOUNT_STATUS = [
  { value: 'activa', label: 'Activa' },
  { value: 'quemada', label: 'Quemada' },
  { value: 'aprobada', label: 'Aprobada' },
  { value: 'cerrada', label: 'Cerrada' },
];

export const FUNDING_PHASES = ['Fase 1', 'Fase 2', 'Fondeada'];

export const DRAWDOWN_MODES = [
  { value: 'static', label: 'Estático (desde el balance inicial)' },
  { value: 'trailing', label: 'Trailing (desde el máximo alcanzado)' },
];

export function typeLabel(type) {
  return ACCOUNT_TYPES.find(t => t.value === type)?.label || type;
}

export function statusLabel(status) {
  return ACCOUNT_STATUS.find(s => s.value === status)?.label || status;
}

export function nextPhase(phase) {
  const i = FUNDING_PHASES.indexOf(phase);
  return i >= 0 && i < FUNDING_PHASES.length - 1 ? FUNDING_PHASES[i + 1] : null;
}

function today() {
  return format(new Date(), 'yyyy-MM-dd');
}

export const emptyAccount = () => ({
  name: '',
  type: 'fondeo',
  firm: '',
  phase: 'Fase 1',
  initialBalance: '',
  cost: '',
  profitTarget: '',
  maxDailyLoss: '',
  maxDrawdown: '',
  drawdownMode: 'static',
  status: 'activa',
  startDate: today(),
  endDate: '',
  notes: '',
});

const numOrNull = (v) => (v === '' || v === null || v === undefined || isNaN(Number(v)) ? null : Number(v));

export function normalizeAccount(raw) {
  return {
    id: raw.id,
    name: raw.name || 'Sin nombre',
    type: raw.type || 'real',
    firm: raw.firm || '',
    phase: raw.phase || '',
    initialBalance: Number(raw.initialBalance) || 0,
    cost: numOrNull(raw.cost),
    profitTarget: numOrNull(raw.profitTarget),
    maxDailyLoss: numOrNull(raw.maxDailyLoss),
    maxDrawdown: numOrNull(raw.maxDrawdown),
    drawdownMode: raw.drawdownMode || 'static',
    status: raw.status || 'activa',
    startDate: raw.startDate || '',
    endDate: raw.endDate || '',
    notes: raw.notes || '',
    createdAt: raw.createdAt || 0,
  };
}

// Convierte lo que viene del formulario a lo que se guarda en Firestore.
export function accountPayload(form) {
  const p = {
    name: String(form.name || '').trim(),
    type: form.type,
    firm: String(form.firm || '').trim(),
    phase: form.type === 'fondeo' ? (form.phase || 'Fase 1') : '',
    initialBalance: Number(form.initialBalance) || 0,
    cost: numOrNull(form.cost),
    profitTarget: numOrNull(form.profitTarget),
    maxDailyLoss: numOrNull(form.maxDailyLoss),
    maxDrawdown: numOrNull(form.maxDrawdown),
    drawdownMode: form.drawdownMode || 'static',
    status: form.status || 'activa',
    startDate: form.startDate || '',
    endDate: form.endDate || '',
    notes: form.notes || '',
  };
  return p;
}

// Copia la configuración de una cuenta para crear otra (recompra tras quemar,
// o siguiente fase tras aprobar).
export function cloneAccountConfig(acc, { phase, keepCost = true } = {}) {
  const newPhase = phase ?? acc.phase;
  let name = acc.name;
  if (acc.type === 'fondeo' && acc.phase && newPhase && name.includes(acc.phase)) {
    name = name.replace(acc.phase, newPhase);
  }
  return {
    ...emptyAccount(),
    name,
    type: acc.type,
    firm: acc.firm,
    phase: newPhase,
    initialBalance: acc.initialBalance,
    cost: keepCost ? (acc.cost ?? '') : '',
    profitTarget: acc.profitTarget ?? '',
    maxDailyLoss: acc.maxDailyLoss ?? '',
    maxDrawdown: acc.maxDrawdown ?? '',
    drawdownMode: acc.drawdownMode,
  };
}

// Las operaciones nuevas guardan accountId. Las antiguas solo tienen
// accountType (un nombre como "Real"); se enlazan por nombre si existe
// una cuenta con ese nombre, si no quedan como cuenta "heredada".
export function resolveTradeAccount(trade, accountsById, accountsByName) {
  if (trade.accountId && accountsById[trade.accountId]) return accountsById[trade.accountId];
  const byName = accountsByName[trade.accountType];
  return byName || null;
}

export const legacyAccountId = (name) => `legacy:${name}`;

function tradePnl(t, initialBalance) {
  if (t.pnl !== null && t.pnl !== undefined && t.pnl !== '') return Number(t.pnl) || 0;
  return initialBalance * ((Number(t.rResult) || 0) / 100);
}

// Estado de una cuenta a partir de sus operaciones.
export function computeAccountStats(account, trades) {
  const init = account.initialBalance || 0;
  const chron = [...trades].sort((a, b) => a.timestamp - b.timestamp);

  let equity = init;
  let peak = init;
  let maxDdFromPeak = 0;
  let maxLossFromInitial = 0;
  const byDay = {};

  chron.forEach(t => {
    const p = tradePnl(t, init);
    equity += p;
    peak = Math.max(peak, equity);
    maxDdFromPeak = Math.max(maxDdFromPeak, peak - equity);
    maxLossFromInitial = Math.max(maxLossFromInitial, init - equity);
    byDay[t.date] = (byDay[t.date] || 0) + p;
  });

  const pnl = equity - init;
  const pct = (v) => (init > 0 ? (v / init) * 100 : 0);

  // Drawdown actual según el modo de la cuenta
  const currentDd = account.drawdownMode === 'trailing'
    ? Math.max(0, peak - equity)
    : Math.max(0, init - equity);
  const worstDd = account.drawdownMode === 'trailing' ? maxDdFromPeak : maxLossFromInitial;

  const todayPnl = byDay[today()] || 0;
  const worstDayPnl = Object.values(byDay).reduce((m, v) => Math.min(m, v), 0);

  const wins = trades.filter(t => Number(t.rResult) > 0).length;

  const breaches = [];
  if (account.maxDrawdown && pct(worstDd) >= account.maxDrawdown) breaches.push('drawdown');
  if (account.maxDailyLoss && pct(-worstDayPnl) >= account.maxDailyLoss) breaches.push('daily');

  return {
    trades: trades.length,
    winRate: trades.length ? (wins / trades.length) * 100 : 0,
    pnl,
    pnlPct: pct(pnl),
    balance: equity,
    currentDdPct: pct(currentDd),
    worstDdPct: pct(worstDd),
    todayPnl,
    todayPct: pct(todayPnl),
    worstDayPct: pct(-worstDayPnl),
    targetProgress: account.profitTarget ? Math.max(0, pct(pnl) / account.profitTarget) * 100 : null,
    targetReached: account.profitTarget ? pct(pnl) >= account.profitTarget : false,
    breaches,
  };
}

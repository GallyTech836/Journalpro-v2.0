// Fuente única de verdad para el modelo de una operación (trade).
// Toda operación, nueva o antigua (creada por la versión anterior de la app),
// pasa por normalizeTrade() para garantizar que siempre tenga todos los campos.

export const ASSET_FALLBACKS = ['XAUUSD', 'EURUSD', 'USDJPY', 'EURJPY'];
export const SETUP_FALLBACKS = ['Fibonacci', 'Manipulación'];
export const SESSION_OPTIONS = ['London', 'New York', 'Asia'];
export const ACCOUNT_OPTIONS = ['Real', 'Demo', 'Backtesting'];
export const RESULT_OPTIONS = ['Win', 'Loss', 'BE'];

export function normalizeDateString(rawDate) {
  if (!rawDate) return '';
  const clean = String(rawDate).trim();
  let y, m, d;
  if (clean.includes('/')) {
    const p = clean.split('/');
    if (p.length === 3) {
      d = p[0].trim().padStart(2, '0');
      m = p[1].trim().padStart(2, '0');
      y = p[2].trim();
    }
  } else if (clean.includes('-')) {
    const p = clean.split('-');
    if (p.length === 3) {
      if (p[0].length === 4) {
        y = p[0].trim(); m = p[1].trim().padStart(2, '0'); d = p[2].trim().padStart(2, '0');
      } else {
        d = p[0].trim().padStart(2, '0'); m = p[1].trim().padStart(2, '0'); y = p[2].trim();
      }
    }
  }
  return (y && m && d) ? `${y}-${m}-${d}` : clean;
}

export function calculateTimestamp(dateStr, timeStr) {
  try {
    const normDate = normalizeDateString(dateStr);
    const normTime = (timeStr || '12:00').trim();
    const dt = new Date(`${normDate}T${normTime}`);
    if (!isNaN(dt.getTime())) return dt.getTime();
    const dOnly = new Date(normDate);
    return !isNaN(dOnly.getTime()) ? dOnly.getTime() : 0;
  } catch { return 0; }
}

export function detectSession(timeString) {
  if (!timeString) return 'New York';
  const hour = parseInt(timeString.split(':')[0], 10);
  if (hour >= 2 && hour < 10) return 'London';
  if (hour >= 10 && hour < 17) return 'New York';
  return 'Asia';
}

// Buy/Sell se conserva como valor interno (compatibilidad con datos existentes),
// Long/Short es solo la etiqueta visual que pide el nuevo diseño.
export function directionLabel(side) {
  return side === 'Sell' ? 'SHORT' : 'LONG';
}

export const initialTradeState = {
  date: new Date().toISOString().split('T')[0],
  time: new Date().toTimeString().slice(0, 5),
  asset: 'XAUUSD',
  accountType: 'Real',
  side: 'Buy',
  type: 'Win',
  setup: 'Fibonacci',
  session: 'New York',
  entry: '',
  stopLoss: '',
  takeProfit: '',
  size: '',
  riskAmount: '',
  pnl: '',
  notes: '',
  screenshotUrl: '',
  hasPartial: false,
  partialTP: 1.5,
  finalTP: 3.0,
  partialPercent: 50,
  rResult: 3.0,
};

// Rellena campos faltantes en trades antiguos sin romper nada existente.
// Soporta datos de Firebase (camelCase) y Supabase (snake_case).
export function normalizeTrade(raw) {
  const date = raw.date || '';
  const normDate = normalizeDateString(date);
  const time = raw.time || '12:00';
  const ts = raw.timestamp && Number(raw.timestamp) > 0
    ? Number(raw.timestamp)
    : calculateTimestamp(normDate, time);
  return {
    id: raw.id,
    date: normDate,
    time,
    timestamp: ts,
    asset: raw.asset || 'XAUUSD',
    accountType: raw.accountType || raw.account_type || 'Real',
    side: raw.side || 'Buy',
    type: raw.type || 'Win',
    setup: raw.setup || 'Otro',
    session: raw.session || detectSession(time),
    entry: raw.entry ?? '',
    stopLoss: raw.stopLoss || raw.stop_loss || '',
    takeProfit: raw.takeProfit || raw.take_profit || '',
    size: raw.size ?? '',
    riskAmount: raw.riskAmount || raw.risk_amount || '',
    pnl: raw.pnl !== undefined && raw.pnl !== null && raw.pnl !== '' ? Number(raw.pnl) : null,
    notes: raw.notes || '',
    screenshotUrl: raw.screenshotUrl || raw.screenshot_url || '',
    hasPartial: !!(raw.hasPartial ?? raw.has_partial),
    partialTP: raw.partialTP ?? raw.partial_tp ?? 1.5,
    finalTP: raw.finalTP ?? raw.final_tp ?? 3.0,
    partialPercent: raw.partialPercent ?? raw.partial_percent ?? 50,
    rResult: Number(raw.rResult ?? raw.r_result) || 0,
  };
}

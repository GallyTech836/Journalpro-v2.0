// Reemplazo de src/lib/firestore.js (que en realidad usaba Supabase / la base
// de datos que bolt.new conecta automáticamente). Esta versión guarda todo
// en localStorage, en el propio navegador, sin depender de ningún backend.
//
// Mantiene EXACTAMENTE la misma interfaz (mismas funciones exportadas, mismos
// parámetros) para que AppContext.jsx y el resto de la app no necesiten
// ningún cambio.

const TRADES_KEY = 'journalpro_trades';
const SETTINGS_KEY = 'journalpro_settings';

const DEFAULT_SETTINGS = {
  assets: ['XAUUSD', 'EURUSD', 'USDJPY', 'EURJPY'],
  setups: ['Fibonacci', 'Manipulación'],
  sessions: ['London', 'New York', 'Asia'],
  accounts: ['Real', 'Demo', 'Backtesting'],
  startingBalance: 0,
};

// --- Helpers internos ---

function readTrades() {
  try {
    const raw = localStorage.getItem(TRADES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeTrades(trades) {
  localStorage.setItem(TRADES_KEY, JSON.stringify(trades));
  window.dispatchEvent(new Event('journalpro:trades-changed'));
}

function readSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function writeSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(new Event('journalpro:settings-changed'));
}

function generateId() {
  return (crypto.randomUUID ? crypto.randomUUID() : `id_${Date.now()}_${Math.random().toString(36).slice(2)}`);
}

function sortByTimestampDesc(list) {
  return [...list].sort((a, b) => {
    const ta = a.timestamp || 0;
    const tb = b.timestamp || 0;
    return tb - ta;
  });
}

// --- API pública (misma forma que src/lib/firestore.js) ---

export function subscribeTrades(onData, _onError) {
  const emit = () => onData(sortByTimestampDesc(readTrades()));
  emit();
  window.addEventListener('journalpro:trades-changed', emit);
  window.addEventListener('storage', emit);
  return () => {
    window.removeEventListener('journalpro:trades-changed', emit);
    window.removeEventListener('storage', emit);
  };
}

export async function addTrade(data) {
  const trades = readTrades();
  const newTrade = {
    ...data,
    id: generateId(),
    created_at: new Date().toISOString(),
  };
  trades.push(newTrade);
  writeTrades(trades);
  return { data: newTrade, error: null };
}

export async function updateTrade(id, data) {
  const trades = readTrades();
  const idx = trades.findIndex(t => t.id === id);
  if (idx === -1) return { data: null, error: new Error('Trade no encontrado') };
  trades[idx] = { ...trades[idx], ...data };
  writeTrades(trades);
  return { data: trades[idx], error: null };
}

export async function deleteTrade(id) {
  const trades = readTrades().filter(t => t.id !== id);
  writeTrades(trades);
  return { data: null, error: null };
}

export async function bulkAddTrades(newTrades) {
  const trades = readTrades();
  const rows = newTrades.map(t => ({
    ...t,
    id: generateId(),
    created_at: new Date().toISOString(),
  }));
  writeTrades([...trades, ...rows]);
}

export function subscribeSettings(onData) {
  const emit = () => onData(readSettings());
  emit();
  window.addEventListener('journalpro:settings-changed', emit);
  window.addEventListener('storage', emit);
  return () => {
    window.removeEventListener('journalpro:settings-changed', emit);
    window.removeEventListener('storage', emit);
  };
}

export async function saveSettings(partial) {
  const current = readSettings();
  writeSettings({ ...current, ...partial });
}

export { DEFAULT_SETTINGS };
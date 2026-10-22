// Fuente única de verdad para el modelo de una cuenta.
// Una cuenta agrupa trades bajo un mismo capital/objetivo (ej. "WeMaster Funded #1").
// El "tipo" (Real/Demo/Backtesting) sigue existiendo, pero ahora es una
// propiedad de la cuenta, no del trade individual.

import { ACCOUNT_OPTIONS } from './tradeModel';

export { ACCOUNT_OPTIONS as ACCOUNT_TYPES };

export const ACCOUNT_STATUSES = [
  { value: 'active', label: 'Activa' },
  { value: 'failed', label: 'Quemada / Fallida' },
  { value: 'closed', label: 'Cerrada' },
  { value: 'archived', label: 'Archivada' },
  { value: 'completed', label: 'Finalizada' },
];

export function statusLabel(status) {
  return ACCOUNT_STATUSES.find(s => s.value === status)?.label || status;
}

export const initialAccountState = {
  name: '',
  type: 'Real',
  initialBalance: '',
  status: 'active',
};

// Rellena campos faltantes en una cuenta leída de Firestore.
export function normalizeAccount(raw) {
  return {
    id: raw.id,
    name: raw.name || 'Cuenta sin nombre',
    type: raw.type || 'Real',
    initialBalance: Number(raw.initialBalance) || 0,
    status: raw.status || 'active',
    isLegacy: !!raw.isLegacy,
    createdAt: raw.createdAt || null,
  };
}

export function legacyAccountName(type) {
  return `Cuenta Legacy · ${type}`;
}

// --- Compatibilidad con trades antiguos (sin accountId) ---

// Dado el conjunto de trades y cuentas actuales, determina qué tipos de cuenta
// (Real/Demo/Backtesting) tienen trades huérfanos (sin accountId) que todavía
// no tienen una cuenta legacy creada para ellos.
export function buildMissingLegacyTypes(trades, accounts) {
  const orphanTypes = new Set(
    trades.filter(t => !t.accountId).map(t => t.accountType || 'Real')
  );
  const existingLegacyTypes = new Set(
    accounts.filter(a => a.isLegacy).map(a => a.type)
  );
  return Array.from(orphanTypes).filter(type => !existingLegacyTypes.has(type));
}

// Resuelve el accountId "efectivo" de un trade:
// 1. Si el trade ya tiene un accountId que apunta a una cuenta existente, se usa ese.
// 2. Si no, se le asigna (solo en memoria, sin escribir en Firestore) el id de la
//    cuenta legacy que corresponda a su accountType.
// 3. Si ni siquiera existe una cuenta legacy todavía (se están creando), devuelve null.
export function resolveTradeAccountId(trade, accounts) {
  if (trade.accountId && accounts.some(a => a.id === trade.accountId)) {
    return trade.accountId;
  }
  const legacy = accounts.find(a => a.isLegacy && a.type === (trade.accountType || 'Real'));
  return legacy ? legacy.id : null;
}
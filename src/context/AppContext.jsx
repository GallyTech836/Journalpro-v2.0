import { createContext, useEffect, useMemo, useState } from 'react';
import {
  subscribeTrades, addTrade, updateTrade, deleteTrade, bulkAddTrades, bulkUpdateTrades,
  subscribeAccounts, addAccount, updateAccount, deleteAccount,
} from '../lib/firestore';
import { subscribeSettings, saveSettings } from '../lib/localStorage';
import { normalizeTrade } from '../shared/tradeModel';
import { normalizeAccount, resolveTradeAccount, legacyAccountId } from '../shared/accounts';

const AppContext = createContext(null);

const DEFAULT_FILTERS = {
  asset: 'All',
  session: 'All',
  account: 'All',
  setup: 'All',
  direction: 'All',
  result: 'All',
  month: 'All',
  year: 'All',
};

const DEFAULT_SETTINGS = {
  assets: ['XAUUSD', 'EURUSD', 'USDJPY', 'EURJPY'],
  setups: ['Fibonacci', 'Manipulación'],
  sessions: ['London', 'New York', 'Asia'],
  accounts: ['Real', 'Demo', 'Backtesting'],
  startingBalance: 0,
};

export function AppProvider({ children }) {
  const [tradesLoaded, setTradesLoaded] = useState(false);
  const [accountsLoaded, setAccountsLoaded] = useState(false);
  const [rawTrades, setRawTrades] = useState([]);
  const [rawAccounts, setRawAccounts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  useEffect(() => {
    const unsubTrades = subscribeTrades(
      (list) => { setRawTrades(list.map(normalizeTrade)); setTradesLoaded(true); },
      () => { setTradesLoaded(true); }
    );
    const unsubAccounts = subscribeAccounts(
      (list) => { setRawAccounts(list); setAccountsLoaded(true); },
      () => { setAccountsLoaded(true); }
    );
    const unsubSettings = subscribeSettings(setSettings);

    return () => {
      if (unsubTrades) unsubTrades();
      if (unsubAccounts) unsubAccounts();
      if (unsubSettings) unsubSettings();
    };
  }, []);

  const effectiveSettings = settings || DEFAULT_SETTINGS;

  const accounts = useMemo(
    () => rawAccounts.map(normalizeAccount).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
    [rawAccounts]
  );

  const accountsById = useMemo(() => Object.fromEntries(accounts.map(a => [a.id, a])), [accounts]);

  // Para enlazar trades antiguos por nombre: si hay varias cuentas con el
  // mismo nombre, gana la más antigua.
  const accountsByName = useMemo(() => {
    const map = {};
    [...accounts].reverse().forEach(a => { if (!map[a.name]) map[a.name] = a; });
    return map;
  }, [accounts]);

  // Cada trade queda enlazado a su cuenta (_accountId) y con el balance
  // sobre el que se calcula su % (_baseBalance). Estos campos solo viven en
  // memoria, no se guardan.
  const trades = useMemo(() => rawTrades.map(t => {
    const acc = resolveTradeAccount(t, accountsById, accountsByName);
    return {
      ...t,
      _accountId: acc ? acc.id : legacyAccountId(t.accountType),
      _accountName: acc ? acc.name : t.accountType,
      _baseBalance: acc ? acc.initialBalance : (Number(effectiveSettings.startingBalance) || 0),
    };
  }), [rawTrades, accountsById, accountsByName, effectiveSettings.startingBalance]);

  const filteredTrades = useMemo(() => {
    return trades.filter(t => {
      if (filters.asset !== 'All' && t.asset !== filters.asset) return false;
      if (filters.session !== 'All' && t.session !== filters.session) return false;
      if (filters.account !== 'All' && t._accountId !== filters.account) return false;
      if (filters.setup !== 'All' && t.setup !== filters.setup) return false;
      if (filters.direction !== 'All' && t.side !== filters.direction) return false;
      if (filters.result !== 'All' && t.type !== filters.result) return false;
      if (filters.month !== 'All' || filters.year !== 'All') {
        const d = new Date(t.date + 'T12:00:00');
        if (isNaN(d.getTime())) return false;
        const mLabel = d.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
        const yLabel = d.getFullYear().toString();
        if (filters.month !== 'All' && mLabel !== filters.month) return false;
        if (filters.year !== 'All' && yLabel !== filters.year) return false;
      }
      return true;
    }).sort((a, b) => b.timestamp - a.timestamp);
  }, [trades, filters]);

  // Nombres de cuenta usados por trades antiguos que no coinciden con
  // ninguna cuenta creada.
  const legacyAccountNames = useMemo(() => {
    const names = new Set();
    trades.forEach(t => { if (t._accountId.startsWith('legacy:')) names.add(t.accountType); });
    return Array.from(names);
  }, [trades]);

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter(v => v !== 'All').length,
    [filters]
  );

  const clearFilters = () => setFilters(DEFAULT_FILTERS);

  const value = {
    isLoading: !tradesLoaded || !accountsLoaded,
    trades, filteredTrades, filters, setFilters, clearFilters, activeFilterCount,
    settings: effectiveSettings,
    saveSettings,
    addTrade, updateTrade, deleteTrade, bulkAddTrades, bulkUpdateTrades,
    accounts, accountsById, legacyAccountNames,
    addAccount, updateAccount, deleteAccount,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export { AppContext };

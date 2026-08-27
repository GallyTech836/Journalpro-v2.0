import { createContext, useEffect, useMemo, useState } from 'react';
import {
  subscribeTrades, addTrade, updateTrade, deleteTrade, bulkAddTrades,
} from '../lib/firestore';
import { subscribeSettings, saveSettings } from '../lib/localStorage';
import { normalizeTrade } from '../shared/tradeModel';

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

export function AppProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [trades, setTrades] = useState([]);
  const [settings, setSettings] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  useEffect(() => {
    let unsubTrades, unsubSettings;

    unsubTrades = subscribeTrades(
      (list) => {
        setTrades(list.map(normalizeTrade));
        setIsLoading(false);
      },
      () => { setIsLoading(false); }
    );

    unsubSettings = subscribeSettings(setSettings);

    return () => {
      if (unsubTrades) unsubTrades();
      if (unsubSettings) unsubSettings();
    };
  }, []);

  const filteredTrades = useMemo(() => {
    return trades.filter(t => {
      if (filters.asset !== 'All' && t.asset !== filters.asset) return false;
      if (filters.session !== 'All' && t.session !== filters.session) return false;
      if (filters.account !== 'All' && t.accountType !== filters.account) return false;
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

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter(v => v !== 'All').length,
    [filters]
  );

  const clearFilters = () => setFilters(DEFAULT_FILTERS);

  const value = {
    isLoading, trades, filteredTrades, filters, setFilters, clearFilters, activeFilterCount,
    settings: settings || {
      assets: ['XAUUSD', 'EURUSD', 'USDJPY', 'EURJPY'],
      setups: ['Fibonacci', 'Manipulación'],
      sessions: ['London', 'New York', 'Asia'],
      accounts: ['Real', 'Demo', 'Backtesting'],
      startingBalance: 0,
    },
    saveSettings,
    addTrade, updateTrade, deleteTrade, bulkAddTrades,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export { AppContext };

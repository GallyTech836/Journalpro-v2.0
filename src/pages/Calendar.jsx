import { useMemo, useState } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  format, isSameMonth, isToday, addMonths, subMonths, isSameDay,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarDays, ListFilter as Filter } from 'lucide-react';
import { useApp } from '../context/useApp';
import { groupByDay, summarizeDay } from '../shared/metrics';
import { RValue, IconButton } from '../components/ui';
import EmptyState from '../components/EmptyState';
import TradeDetailModal from '../components/TradeDetailModal';
import TradeFormModal from '../components/TradeFormModal';
import DayTradesModal from '../components/DayTradesModal';
import FilterDrawer from '../components/FilterDrawer';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function dotClass(outcome) {
  if (outcome === 'positive') return 'bg-pos';
  if (outcome === 'negative') return 'bg-neg';
  return 'bg-faint';
}

export default function CalendarPage() {
  const { trades, filteredTrades, activeFilterCount, settings } = useApp();
  const [cursor, setCursor] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [detailTrade, setDetailTrade] = useState(null);
  const [editingTrade, setEditingTrade] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const byDay = useMemo(() => groupByDay(filteredTrades), [filteredTrades]);

  const gridDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const selectedTrades = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, 'yyyy-MM-dd');
    return (byDay[key] || []).sort((a, b) => a.timestamp - b.timestamp);
  }, [selectedDate, byDay]);

  const selectedSummary = selectedTrades.length > 0 ? summarizeDay(selectedTrades, settings) : null;

  const handleDayClick = (day) => {
    setSelectedDate(day);
  };

  if (trades.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <EmptyState
          icon={CalendarDays}
          title="Your trading calendar is empty"
          description="Add your first trade to start tracking your performance."
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-5 anim-fade">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted mt-0.5">Cómo te fue cada día</p>
        </div>
        <div className="flex items-center gap-2">
          <IconButton onClick={() => setShowFilters(true)} active={activeFilterCount > 0} title="Filtro">
            <Filter size={16} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand text-[9px] font-bold text-white flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </IconButton>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setCursor(c => subMonths(c, 1))} className="p-2 rounded-lg border border-border text-muted hover:text-ink">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium w-32 text-center capitalize tabular">
              {format(cursor, 'MMMM yyyy', { locale: es })}
            </span>
            <button onClick={() => setCursor(c => addMonths(c, 1))} className="p-2 rounded-lg border border-border text-muted hover:text-ink">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-[10px] font-semibold uppercase tracking-wide text-faint py-2.5">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {gridDays.map(day => {
            const key = format(day, 'yyyy-MM-dd');
            const dayTrades = byDay[key] || [];
            const summary = dayTrades.length > 0 ? summarizeDay(dayTrades, settings) : null;
            const inMonth = isSameMonth(day, cursor);
            const selected = selectedDate && isSameDay(day, selectedDate);
            return (
              <button
                key={key}
                onClick={() => handleDayClick(day)}
                className={`aspect-square sm:aspect-[4/3] border-b border-r border-border/60 p-1.5 sm:p-2.5 flex flex-col items-start justify-between text-left transition-colors ${
                  inMonth ? 'bg-surface hover:bg-surface-hi' : 'bg-canvas/40'
                } ${selected ? 'ring-2 ring-inset ring-brand' : ''} ${isToday(day) ? 'relative' : ''}`}
              >
                <span className={`text-[11px] sm:text-xs font-medium tabular ${inMonth ? 'text-ink' : 'text-faint'} ${isToday(day) ? 'text-brand font-bold' : ''}`}>
                  {format(day, 'd')}
                </span>
                {summary && (
                  <div className="w-full">
                    <div className="hidden sm:block">
                      <RValue value={summary.netR} className="text-[11px]" />
                      <div className="text-[9px] text-faint">{summary.count} ops</div>
                    </div>
                    <div className={`sm:hidden w-1.5 h-1.5 rounded-full ${dotClass(summary.outcome)}`} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <DayTradesModal
          date={format(selectedDate, "d 'de' MMMM yyyy", { locale: es })}
          trades={selectedTrades}
          summary={selectedSummary}
          onClose={() => setSelectedDate(null)}
          onSelectTrade={(t) => setDetailTrade(t)}
        />
      )}

      {detailTrade && (
        <TradeDetailModal
          trade={detailTrade}
          onClose={() => setDetailTrade(null)}
          onEdit={(t) => { setDetailTrade(null); setEditingTrade(t); setShowForm(true); }}
        />
      )}
      {showForm && <TradeFormModal trade={editingTrade} onClose={() => { setShowForm(false); setEditingTrade(null); }} />}
      {showFilters && <FilterDrawer onClose={() => setShowFilters(false)} />}
    </div>
  );
}
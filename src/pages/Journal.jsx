import { useRef, useState } from 'react';
import { Plus, ListFilter as Filter, Upload, Download, BookOpen } from 'lucide-react';
import { useApp } from '../context/useApp';
import { parseTradesCSV, exportTradesCSV } from '../shared/csv';
import { IconButton, Button, ResultPill, DirectionPill, RValue, PnlValue } from '../components/ui';
import EmptyState from '../components/EmptyState';
import TradeFormModal from '../components/TradeFormModal';
import TradeDetailModal from '../components/TradeDetailModal';
import FilterDrawer from '../components/FilterDrawer';
import ImportSummaryModal from '../components/ImportSummaryModal';

export default function Journal() {
  const { trades, filteredTrades, activeFilterCount, bulkAddTrades } = useApp();
  const fileInputRef = useRef(null);

  const [showForm, setShowForm] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const [detailTrade, setDetailTrade] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const [importing, setImporting] = useState(false);

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const text = ev.target.result;
        const { valid, errors, duplicatesInFile } = parseTradesCSV(text, trades);
        if (valid.length > 0) await bulkAddTrades(valid);
        setImportSummary({ imported: valid.length, duplicates: duplicatesInFile, errors });
      } catch (err) {
        console.error(err);
        setImportSummary({ imported: 0, duplicates: 0, errors: ['No se pudo leer el archivo. Verifica el formato CSV.'] });
      } finally {
        setImporting(false);
        e.target.value = null;
      }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    exportTradesCSV(filteredTrades, `journalpro_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-5 anim-fade">
      <input type="file" ref={fileInputRef} onChange={handleImportFile} accept=".csv,text/csv" className="hidden" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Journal</h1>
          <p className="text-sm text-muted mt-0.5">{filteredTrades.length} de {trades.length} operaciones</p>
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
          <IconButton onClick={() => fileInputRef.current?.click()} title="Importar" disabled={importing}>
            <Upload size={16} />
          </IconButton>
          <IconButton onClick={handleExport} title="Exportar" disabled={filteredTrades.length === 0}>
            <Download size={16} />
          </IconButton>
          <Button variant="primary" onClick={() => { setEditingTrade(null); setShowForm(true); }}>
            <Plus size={16} /> <span className="hidden sm:inline">Nueva operación</span>
          </Button>
        </div>
      </div>

      {filteredTrades.length === 0 ? (
        trades.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No operations yet"
            description="Start building your trading history."
            actionLabel="New Trade"
            onAction={() => { setEditingTrade(null); setShowForm(true); }}
          />
        ) : (
          <EmptyState icon={Filter} title="Sin resultados" description="Ninguna operación coincide con los filtros activos." />
        )
      ) : (
        <>
          {/* Tabla desktop */}
          <div className="hidden md:block bg-surface border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-canvas/60 text-[10px] uppercase text-muted font-semibold tracking-wide border-b border-border">
                  <th className="px-5 py-3">Fecha</th>
                  <th className="px-5 py-3">Activo</th>
                  <th className="px-5 py-3">Dirección</th>
                  <th className="px-5 py-3">Setup</th>
                  <th className="px-5 py-3">Sesión</th>
                  <th className="px-5 py-3">Resultado</th>
                  <th className="px-5 py-3 text-right">%</th>
                  <th className="px-5 py-3 text-right">P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTrades.map(t => (
                  <tr key={t.id} onClick={() => setDetailTrade(t)} className="hover:bg-surface-hi/60 cursor-pointer transition-colors">
                    <td className="px-5 py-3.5 text-xs text-muted tabular">{t.date}</td>
                    <td className="px-5 py-3.5 text-sm font-medium text-ink">{t.asset}</td>
                    <td className="px-5 py-3.5"><DirectionPill side={t.side} /></td>
                    <td className="px-5 py-3.5 text-xs text-muted">{t.setup}</td>
                    <td className="px-5 py-3.5 text-xs text-muted">{t.session}</td>
                    <td className="px-5 py-3.5"><ResultPill type={t.type} /></td>
                    <td className="px-5 py-3.5 text-right"><RValue value={t.rResult} /></td>
                    <td className="px-5 py-3.5 text-right"><PnlValue value={t.pnl} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards mobile */}
          <div className="md:hidden space-y-2.5">
            {filteredTrades.map(t => (
              <button
                key={t.id}
                onClick={() => setDetailTrade(t)}
                className="w-full text-left bg-surface border border-border rounded-2xl p-4 active:bg-surface-hi transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink text-sm">{t.asset}</span>
                    <DirectionPill side={t.side} />
                  </div>
                  <RValue value={t.rResult} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted">
                  <span>{t.setup} · {t.session}</span>
                  <span className="tabular">{t.date}</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {showForm && <TradeFormModal trade={editingTrade} onClose={() => { setShowForm(false); setEditingTrade(null); }} />}
      {detailTrade && (
        <TradeDetailModal
          trade={detailTrade}
          onClose={() => setDetailTrade(null)}
          onEdit={(t) => { setDetailTrade(null); setEditingTrade(t); setShowForm(true); }}
        />
      )}
      {showFilters && <FilterDrawer onClose={() => setShowFilters(false)} />}
      {importSummary && <ImportSummaryModal summary={importSummary} onClose={() => setImportSummary(null)} />}
    </div>
  );
}

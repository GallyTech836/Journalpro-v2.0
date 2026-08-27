import { normalizeDateString, calculateTimestamp, detectSession } from './tradeModel';

// Cabeceras esperadas en el CSV (case-insensitive, en español o inglés).
const HEADER_MAP = {
  fecha: 'date', date: 'date',
  hora: 'time', time: 'time',
  activo: 'asset', asset: 'asset', symbol: 'asset',
  direccion: 'side', dirección: 'side', side: 'side', lado: 'side',
  cuenta: 'accountType', account: 'accountType',
  resultado: 'type', result: 'type',
  setup: 'setup', estrategia: 'setup',
  sesion: 'session', sesión: 'session', session: 'session',
  r: 'rResult', rresult: 'rResult', 'r result': 'rResult',
  pnl: 'pnl', 'p&l': 'pnl', ganancia: 'pnl',
  entrada: 'entry', entry: 'entry',
  sl: 'stopLoss', stoploss: 'stopLoss',
  tp: 'takeProfit', takeprofit: 'takeProfit',
  notas: 'notes', notes: 'notes',
};

function parseLine(line) {
  // Split simple por coma respetando comillas básicas.
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === ',' && !inQuotes) { result.push(cur); cur = ''; continue; }
    cur += ch;
  }
  result.push(cur);
  return result.map(c => c.trim());
}

function tradeSignature(t) {
  return [t.date, t.time, t.asset, t.side, t.rResult].join('|');
}

/**
 * Parsea un CSV crudo y devuelve { valid, errors, duplicatesInFile }.
 * `existingTrades` se usa para detectar duplicados contra lo que ya está guardado.
 */
export function parseTradesCSV(text, existingTrades = []) {
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  if (lines.length < 2) {
    return { valid: [], errors: ['El archivo no contiene operaciones.'], duplicatesInFile: 0 };
  }

  const headerCols = parseLine(lines[0]).map(h => h.toLowerCase().trim());
  const hasNamedHeaders = headerCols.some(h => HEADER_MAP[h]);

  const existingSigs = new Set(existingTrades.map(tradeSignature));
  const seenInFile = new Set();
  const valid = [];
  const errors = [];
  let duplicatesInFile = 0;

  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw.trim()) continue;
    const cols = parseLine(raw);

    let row = {};
    if (hasNamedHeaders) {
      headerCols.forEach((h, idx) => {
        const key = HEADER_MAP[h];
        if (key) row[key] = cols[idx];
      });
    } else {
      // Formato posicional heredado: Fecha,Hora,Activo,Lado,Cuenta,Resultado,Setup,Sesion,R
      [row.date, row.time, row.asset, row.side, row.accountType, row.type, row.setup, row.session, row.rResult] = cols;
    }

    if (!row.date) {
      errors.push(`Fila ${i + 1}: falta la fecha, se omitió.`);
      continue;
    }

    const normDate = normalizeDateString(row.date);
    const dateCheck = new Date(normDate + 'T12:00:00');
    if (isNaN(dateCheck.getTime())) {
      errors.push(`Fila ${i + 1}: fecha inválida ("${row.date}"), se omitió.`);
      continue;
    }

    const time = row.time || '12:00';
    const ts = calculateTimestamp(normDate, time);
    const type = row.type || 'Win';
    let rResult = row.rResult !== undefined ? parseFloat(row.rResult) : NaN;
    if (isNaN(rResult)) {
      rResult = type === 'Win' ? 1 : type === 'Loss' ? -1 : 0;
    }
    const pnl = row.pnl !== undefined && row.pnl !== '' && !isNaN(parseFloat(row.pnl)) ? parseFloat(row.pnl) : null;

    const trade = {
      date: normDate,
      time,
      timestamp: ts,
      asset: row.asset || 'XAUUSD',
      side: row.side === 'Sell' || row.side === 'SHORT' || row.side === 'Short' ? 'Sell' : 'Buy',
      accountType: row.accountType || 'Real',
      type,
      setup: row.setup || 'Otro',
      session: row.session || detectSession(time),
      rResult,
      pnl,
      entry: row.entry || '',
      stopLoss: row.stopLoss || '',
      takeProfit: row.takeProfit || '',
      notes: row.notes || '',
    };

    const sig = tradeSignature(trade);
    if (existingSigs.has(sig) || seenInFile.has(sig)) {
      duplicatesInFile++;
      continue;
    }
    seenInFile.add(sig);
    valid.push(trade);
  }

  valid.sort((a, b) => a.timestamp - b.timestamp);
  return { valid, errors, duplicatesInFile };
}

export function exportTradesCSV(trades, filename = 'journalpro_export.csv') {
  const headers = [
    'Fecha', 'Hora', 'Activo', 'Direccion', 'Cuenta', 'Resultado', 'Setup', 'Sesion',
    'R', 'PnL', 'Entrada', 'SL', 'TP', 'Notas',
  ];
  const rows = trades.map(t => [
    t.date, t.time, t.asset, t.side === 'Sell' ? 'Short' : 'Long', t.accountType, t.type,
    t.setup, t.session, t.rResult, t.pnl ?? '', t.entry ?? '', t.stopLoss ?? '', t.takeProfit ?? '',
    (t.notes || '').replace(/,/g, ';').replace(/\n/g, ' '),
  ]);
  const csvContent = [headers, ...rows].map(row => row.map(c => `${c}`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

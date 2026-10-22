import {
  collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';

// Misma estructura que usa la app original: artifacts/{projectId}/public/data/trades
const TRADES_PATH = ['artifacts', 'journal-pro-22b6b', 'public', 'data', 'trades'];

function tradesCollection() {
  return collection(db, ...TRADES_PATH);
}

function tradeDoc(id) {
  return doc(db, ...TRADES_PATH, id);
}

export function subscribeTrades(onData, onError) {
  const unsub = onSnapshot(
    tradesCollection(),
    (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      onData(list);
    },
    (err) => {
      console.error('Firestore trades error:', err);
      if (onError) onError(err);
    }
  );
  return unsub;
}

export async function addTrade(data) {
  const ref = await addDoc(tradesCollection(), data);
  return { data: { id: ref.id, ...data }, error: null };
}

export async function updateTrade(id, data) {
  await updateDoc(tradeDoc(id), data);
  return { data: { id, ...data }, error: null };
}

export async function deleteTrade(id) {
  await deleteDoc(tradeDoc(id));
  return { data: null, error: null };
}

export async function bulkAddTrades(newTrades) {
  const batch = writeBatch(db);
  newTrades.forEach(t => {
    const ref = doc(tradesCollection());
    batch.set(ref, t);
  });
  await batch.commit();
}

// Aplica los mismos cambios a muchos trades. Firestore admite 500
// operaciones por batch, así que se divide en bloques.
export async function bulkUpdateTrades(ids, data) {
  for (let i = 0; i < ids.length; i += 450) {
    const batch = writeBatch(db);
    ids.slice(i, i + 450).forEach(id => batch.update(tradeDoc(id), data));
    await batch.commit();
  }
}

// --- Cuentas ---
// Misma ubicación que los trades: artifacts/{projectId}/public/data/accounts
const ACCOUNTS_PATH = ['artifacts', 'journal-pro-22b6b', 'public', 'data', 'accounts'];

function accountsCollection() {
  return collection(db, ...ACCOUNTS_PATH);
}

export function subscribeAccounts(onData, onError) {
  return onSnapshot(
    accountsCollection(),
    (snap) => onData(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    (err) => {
      console.error('Firestore accounts error:', err);
      if (onError) onError(err);
    }
  );
}

export async function addAccount(data) {
  const ref = await addDoc(accountsCollection(), { ...data, createdAt: Date.now() });
  return { data: { id: ref.id, ...data }, error: null };
}

export async function updateAccount(id, data) {
  await updateDoc(doc(db, ...ACCOUNTS_PATH, id), data);
  return { data: { id, ...data }, error: null };
}

export async function deleteAccount(id) {
  await deleteDoc(doc(db, ...ACCOUNTS_PATH, id));
  return { data: null, error: null };
}
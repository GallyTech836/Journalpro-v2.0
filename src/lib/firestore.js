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
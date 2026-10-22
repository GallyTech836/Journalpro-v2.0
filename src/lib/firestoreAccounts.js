import {
    collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot,
  } from 'firebase/firestore';
  import { db } from './firebase';
  
  // Misma estructura que usa trades: artifacts/{projectId}/public/data/accounts
  const ACCOUNTS_PATH = ['artifacts', 'journal-pro-22b6b', 'public', 'data', 'accounts'];
  
  function accountsCollection() {
    return collection(db, ...ACCOUNTS_PATH);
  }
  
  function accountDoc(id) {
    return doc(db, ...ACCOUNTS_PATH, id);
  }
  
  export function subscribeAccounts(onData, onError) {
    const unsub = onSnapshot(
      accountsCollection(),
      (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        onData(list);
      },
      (err) => {
        console.error('Firestore accounts error:', err);
        if (onError) onError(err);
      }
    );
    return unsub;
  }
  
  export async function addAccount(data) {
    const ref = await addDoc(accountsCollection(), data);
    return { data: { id: ref.id, ...data }, error: null };
  }
  
  export async function updateAccount(id, data) {
    await updateDoc(accountDoc(id), data);
    return { data: { id, ...data }, error: null };
  }
  
  export async function deleteAccount(id) {
    await deleteDoc(accountDoc(id));
    return { data: null, error: null };
  }
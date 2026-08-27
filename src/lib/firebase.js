import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCB05lPGBRsvu28sjMDjXjGwrXsiYzkDCc",
  authDomain: "journal-pro-22b6b.firebaseapp.com",
  databaseURL: "https://journal-pro-22b6b-default-rtdb.firebaseio.com",
  projectId: "journal-pro-22b6b",
  storageBucket: "journal-pro-22b6b.firebasestorage.app",
  messagingSenderId: "793280929290",
  appId: "1:793280929290:web:ee1c5ffb063c0213bbc9f3"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDT_Au1HsBQ2d6G-_oah44nk2pf3s35cpM",
  authDomain: "robotiks-2d0c8.firebaseapp.com",
  projectId: "robotiks-2d0c8",
  storageBucket: "robotiks-2d0c8.firebasestorage.app",
  messagingSenderId: "546834253359",
  appId: "1:546834253359:web:c4d0887e13065934d228da"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const DOC_REF = () => doc(db, 'robotiks', 'data');

export async function fbSave(data) {
  await setDoc(DOC_REF(), data, { merge: true });
}

export function fbListen(callback) {
  return onSnapshot(DOC_REF(), (snap) => {
    if (snap.exists()) callback(snap.data());
  });
}

export async function loginWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function logout() {
  return signOut(auth);
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

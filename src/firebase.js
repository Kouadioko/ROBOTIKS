import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
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

// ─── Interventions (une collection, un document par fiche) ──

export function fbListenInterventions(callback) {
  const q = query(collection(db, 'interventions'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, () => {});
}

export async function fbSaveIntervention(intervention) {
  const { id, ...data } = intervention;
  await setDoc(doc(db, 'interventions', id), data);
}

export async function fbDeleteIntervention(id) {
  await deleteDoc(doc(db, 'interventions', id));
}

// ─── Clients ──────────────────────────────────────────

export function fbListenClients(callback) {
  return onSnapshot(collection(db, 'clients'), (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, () => {});
}

export async function fbSaveClient(client) {
  const { id, ...data } = client;
  await setDoc(doc(db, 'clients', id), data);
}

export async function fbDeleteClient(id) {
  await deleteDoc(doc(db, 'clients', id));
}

// ─── Paramètres de la société (document unique) ──────

export function fbListenSettings(callback) {
  return onSnapshot(doc(db, 'settings', 'main'), (snap) => {
    if (snap.exists()) callback(snap.data());
  }, () => {});
}

export async function fbSaveSettings(settings) {
  await setDoc(doc(db, 'settings', 'main'), settings, { merge: true });
}

// ─── Authentification ────────────────────────────────

export async function loginWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function logout() {
  return signOut(auth);
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

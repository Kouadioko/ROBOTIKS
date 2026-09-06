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

// ─── Révisions (une collection, un document par fiche) ──

export function fbListenRevisions(callback) {
  const q = query(collection(db, 'revisions'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, () => {});
}

export async function fbSaveRevision(revision) {
  const { id, ...data } = revision;
  await setDoc(doc(db, 'revisions', id), data);
}

export async function fbDeleteRevision(id) {
  await deleteDoc(doc(db, 'revisions', id));
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

// ─── Locations de machines ────────────────────────────
// Une fiche par machine louée : client, chantier, jours pointés, signatures.

export function fbListenLocations(callback) {
  const q = query(collection(db, 'locations'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, () => {});
}

export async function fbSaveLocation(location) {
  const { id, ...data } = location;
  await setDoc(doc(db, 'locations', id), data);
}

export async function fbDeleteLocation(id) {
  await deleteDoc(doc(db, 'locations', id));
}

// ─── Accès opérateurs ─────────────────────────────────
// Un document par opérateur, dont l'identifiant est son e-mail en minuscules.
//
// On ne SUPPRIME jamais un document pour couper un accès : les règles de
// sécurité Firestore reconnaissent un opérateur à sa présence dans cette
// collection, donc effacer sa ligne le ferait repasser pour un compte patron
// avec accès à tout. Couper l'accès = passer `actif` à false.

export function fbListenOperateurs(callback) {
  return onSnapshot(collection(db, 'operateurs'), (snap) => {
    callback(snap.docs.map(d => {
      const data = d.data() || {};
      return { email: d.id, actif: data.actif !== false, createdAt: data.createdAt || '' };
    }));
  }, () => {});
}

export async function fbAutoriserOperateur(email) {
  const m = String(email || '').trim().toLowerCase();
  await setDoc(doc(db, 'operateurs', m), { email: m, actif: true, createdAt: new Date().toISOString() });
}

export async function fbActiverOperateur(email, actif) {
  const m = String(email || '').trim().toLowerCase();
  await setDoc(doc(db, 'operateurs', m), { email: m, actif: !!actif, majAt: new Date().toISOString() });
}

// ─── Comptes de connexion des opérateurs ──────────────
// Ces quatre fonctions passent par l'API REST de Firebase Auth plutôt que par
// le SDK, pour une raison précise : createUserWithEmailAndPassword bascule la
// session sur le compte qui vient d'être créé, ce qui déconnecterait le patron
// au moment même où il crée l'accès de son opérateur. Un appel REST direct ne
// touche pas du tout à la session en cours.

const AUTH_API = 'https://identitytoolkit.googleapis.com/v1/accounts:';

async function authRest(methode, corps) {
  const rep = await fetch(`${AUTH_API}${methode}?key=${firebaseConfig.apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corps),
  });
  const data = await rep.json();
  if (!rep.ok) throw new Error(data?.error?.message || 'ERREUR_INCONNUE');
  return data;
}

/** Traduit les codes d'erreur de Firebase en messages lisibles. */
export function messageAuth(code) {
  const c = String(code);
  if (c.startsWith('INVALID_LOGIN_CREDENTIALS') || c.startsWith('INVALID_PASSWORD'))
    return "Mot de passe incorrect (ou ce compte n'existe pas).";
  if (c.startsWith('EMAIL_NOT_FOUND')) return "Aucun compte de connexion pour cet e-mail.";
  if (c.startsWith('EMAIL_EXISTS')) return "Un compte existe déjà avec cet e-mail.";
  if (c.startsWith('WEAK_PASSWORD')) return "Mot de passe trop court : 6 caractères minimum.";
  if (c.startsWith('INVALID_EMAIL')) return "Adresse e-mail invalide.";
  if (c.startsWith('TOO_MANY_ATTEMPTS')) return "Trop d'essais. Attends quelques minutes.";
  if (c.startsWith('OPERATION_NOT_ALLOWED'))
    return "Active la connexion E-mail/Mot de passe dans Firebase (Authentication > Sign-in method).";
  return c;
}

export async function creerCompteOperateur(email, motDePasse) {
  // returnSecureToken doit valoir true : avec false, Firebase répond sans
  // erreur mais l'identifiant créé ne permet pas de se connecter.
  return authRest('signUp', { email, password: motDePasse, returnSecureToken: true });
}

/** Vérifie qu'un couple e-mail / mot de passe ouvre bien une session.
 *  Le jeton obtenu est jeté aussitôt : la session du patron n'est pas touchée. */
export async function verifierAcces(email, motDePasse) {
  await authRest('signInWithPassword', { email, password: motDePasse, returnSecureToken: true });
  return true;
}

/** Change le mot de passe d'un opérateur. Exige de connaître l'ancien : c'est
 *  une contrainte de Firebase côté navigateur. Sans l'ancien, passer par le
 *  lien de réinitialisation ci-dessous. */
export async function changerMotDePasse(email, ancien, nouveau) {
  const session = await authRest('signInWithPassword', { email, password: ancien, returnSecureToken: true });
  await authRest('update', { idToken: session.idToken, password: nouveau, returnSecureToken: false });
}

export async function envoyerLienReinitialisation(email) {
  await authRest('sendOobCode', { requestType: 'PASSWORD_RESET', email });
}

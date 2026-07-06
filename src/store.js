import {
  fbSaveIntervention, fbDeleteIntervention,
  fbSaveClient, fbDeleteClient,
  fbSaveSettings,
  fbSaveRevision, fbDeleteRevision,
} from './firebase';

const INTERVENTIONS_KEY = 'robotiks_interventions';
const CLIENTS_KEY = 'robotiks_clients';
const SETTINGS_KEY = 'robotiks_settings';
const REVISIONS_KEY = 'robotiks_revisions';
const MIGRATED_KEY = 'robotiks_migrated_v2';
const PENDING_SYNC_KEY = 'robotiks_pending_sync';

// ─── Lecture locale ───────────────────────────────────

export function loadInterventions() {
  try { return JSON.parse(localStorage.getItem(INTERVENTIONS_KEY) || '[]'); } catch { return []; }
}

export function loadClients() {
  try { return JSON.parse(localStorage.getItem(CLIENTS_KEY) || '[]'); } catch { return []; }
}

export function loadSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); } catch { return {}; }
}

export function loadRevisions() {
  try { return JSON.parse(localStorage.getItem(REVISIONS_KEY) || '[]'); } catch { return []; }
}

// ─── File d'attente : fiches dont l'envoi cloud a échoué ──

function loadPendingSync() {
  try {
    return { interventions: [], clients: [], settings: false, revisions: [], ...JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || '{}') };
  } catch {
    return { interventions: [], clients: [], settings: false, revisions: [] };
  }
}

function markPending(type, id) {
  const p = loadPendingSync();
  if (type === 'settings') p.settings = true;
  else if (!p[type].includes(id)) p[type].push(id);
  localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(p));
}

function unmarkPending(type, id) {
  const p = loadPendingSync();
  if (type === 'settings') p.settings = false;
  else p[type] = p[type].filter(x => x !== id);
  localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(p));
}

// ─── Sauvegarde / suppression (un document par fiche) ─

export async function saveIntervention(intervention) {
  const list = loadInterventions();
  const idx = list.findIndex(i => i.id === intervention.id);
  if (idx >= 0) list[idx] = intervention; else list.unshift(intervention);
  localStorage.setItem(INTERVENTIONS_KEY, JSON.stringify(list));
  try {
    await fbSaveIntervention(intervention);
    unmarkPending('interventions', intervention.id);
  } catch {
    markPending('interventions', intervention.id); // hors-ligne : sera resynchronisé
  }
}

export async function deleteIntervention(id) {
  const list = loadInterventions();
  localStorage.setItem(INTERVENTIONS_KEY, JSON.stringify(list.filter(i => i.id !== id)));
  unmarkPending('interventions', id);
  try { await fbDeleteIntervention(id); } catch { /* hors-ligne */ }
}

export async function saveClient(client) {
  const list = loadClients();
  const idx = list.findIndex(c => c.id === client.id);
  if (idx >= 0) list[idx] = client; else list.push(client);
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(list));
  try {
    await fbSaveClient(client);
    unmarkPending('clients', client.id);
  } catch {
    markPending('clients', client.id); // hors-ligne : sera resynchronisé
  }
}

export async function deleteClient(id) {
  const list = loadClients().filter(c => c.id !== id);
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(list));
  unmarkPending('clients', id);
  try { await fbDeleteClient(id); } catch { /* hors-ligne */ }
}

export async function saveRevision(revision) {
  const list = loadRevisions();
  const idx = list.findIndex(r => r.id === revision.id);
  if (idx >= 0) list[idx] = revision; else list.unshift(revision);
  localStorage.setItem(REVISIONS_KEY, JSON.stringify(list));
  try {
    await fbSaveRevision(revision);
    unmarkPending('revisions', revision.id);
  } catch {
    markPending('revisions', revision.id);
  }
}

export async function deleteRevision(id) {
  const list = loadRevisions();
  localStorage.setItem(REVISIONS_KEY, JSON.stringify(list.filter(r => r.id !== id)));
  unmarkPending('revisions', id);
  try { await fbDeleteRevision(id); } catch { /* hors-ligne */ }
}

export async function saveSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  try {
    await fbSaveSettings(s);
    unmarkPending('settings');
  } catch {
    markPending('settings'); // hors-ligne : sera resynchronisé
  }
}

// ─── Appliquer les données reçues de Firebase ────────

// Fusionne deux listes par id : pour chaque id, garde la version la plus
// récente (updatedAt/createdAt), et conserve les entrées présentes d'un
// seul côté (jamais de perte si la synchro cloud est en retard).
function mergeById(remoteList, localList) {
  const byId = new Map();
  for (const item of localList || []) {
    if (item?.id) byId.set(item.id, item);
  }
  for (const item of remoteList || []) {
    if (!item?.id) continue;
    const local = byId.get(item.id);
    if (!local) {
      byId.set(item.id, item);
    } else {
      const remoteTime = new Date(item.updatedAt || item.createdAt || 0).getTime();
      const localTime = new Date(local.updatedAt || local.createdAt || 0).getTime();
      if (remoteTime >= localTime) byId.set(item.id, item);
    }
  }
  return Array.from(byId.values()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

export function applyRemoteRevisions(remoteList) {
  const merged = mergeById(remoteList, loadRevisions());
  localStorage.setItem(REVISIONS_KEY, JSON.stringify(merged));
}

export function applyRemoteInterventions(remoteList) {
  const merged = mergeById(remoteList, loadInterventions());
  localStorage.setItem(INTERVENTIONS_KEY, JSON.stringify(merged));
}

export function applyRemoteClients(remoteList) {
  const merged = mergeById(remoteList, loadClients());
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(merged));
}

export function applyRemoteSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ─── Synchronisation différée : fiches en attente ──────
// Réessaie d'envoyer vers Firestore les fiches (interventions, clients,
// paramètres) dont l'enregistrement cloud avait échoué (créées hors-ligne).
// Idempotent : ne fait rien si tout est déjà synchronisé.
export async function syncPending() {
  const docsChanged = await syncPendingDocs();

  // Migration ponctuelle (une fois) des anciennes données vers les nouvelles collections
  if (!localStorage.getItem(MIGRATED_KEY)) {
    for (const c of loadClients()) {
      try { await fbSaveClient(c); } catch { return docsChanged; } // hors-ligne : on réessaiera plus tard
    }
    const settings = loadSettings();
    if (Object.keys(settings).length) {
      try { await fbSaveSettings(settings); } catch { return docsChanged; }
    }
    localStorage.setItem(MIGRATED_KEY, 'true');
  }

  return docsChanged;
}

// Réessaie d'envoyer vers Firestore les fiches modifiées hors-ligne.
async function syncPendingDocs() {
  const pending = loadPendingSync();
  let anyChanged = false;

  for (const id of pending.interventions) {
    const item = loadInterventions().find(i => i.id === id);
    if (!item) { unmarkPending('interventions', id); continue; }
    try {
      await fbSaveIntervention(item);
      unmarkPending('interventions', id);
      anyChanged = true;
    } catch { /* toujours hors-ligne */ }
  }

  for (const id of pending.clients) {
    const item = loadClients().find(c => c.id === id);
    if (!item) { unmarkPending('clients', id); continue; }
    try {
      await fbSaveClient(item);
      unmarkPending('clients', id);
      anyChanged = true;
    } catch { /* toujours hors-ligne */ }
  }

  if (pending.settings) {
    try {
      await fbSaveSettings(loadSettings());
      unmarkPending('settings');
      anyChanged = true;
    } catch { /* toujours hors-ligne */ }
  }

  for (const id of pending.revisions) {
    const item = loadRevisions().find(r => r.id === id);
    if (!item) { unmarkPending('revisions', id); continue; }
    try {
      await fbSaveRevision(item);
      unmarkPending('revisions', id);
      anyChanged = true;
    } catch { /* toujours hors-ligne */ }
  }

  return anyChanged;
}

// ─── Utilitaires ──────────────────────────────────────

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6).toUpperCase();
}

export function generateNumero(interventions) {
  const year = new Date().getFullYear();
  const count = interventions.filter(i => i.numero?.startsWith(`INT-${year}`)).length + 1;
  return `INT-${year}-${String(count).padStart(4, '0')}`;
}

export function generateNumeroRevision(revisions) {
  const year = new Date().getFullYear();
  const count = revisions.filter(r => r.numero?.startsWith(`REV-${year}`)).length + 1;
  return `REV-${year}-${String(count).padStart(4, '0')}`;
}

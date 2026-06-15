import {
  fbSaveIntervention, fbDeleteIntervention,
  fbSaveClient, fbDeleteClient,
  fbSaveSettings,
  uploadPhoto, deletePhoto, urlToDataUrl,
} from './firebase';
import { compressDataUrl, estimateDataUrlBytes } from './utils/image';

const MAX_PHOTO_BYTES = 350 * 1024; // ~350 Ko
const INTERVENTIONS_KEY = 'robotiks_interventions';
const CLIENTS_KEY = 'robotiks_clients';
const SETTINGS_KEY = 'robotiks_settings';
const MIGRATED_KEY = 'robotiks_migrated_v2';

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

// ─── Sauvegarde / suppression (un document par fiche) ─

export async function saveIntervention(intervention) {
  const list = loadInterventions();
  const idx = list.findIndex(i => i.id === intervention.id);
  if (idx >= 0) list[idx] = intervention; else list.unshift(intervention);
  localStorage.setItem(INTERVENTIONS_KEY, JSON.stringify(list));
  try { await fbSaveIntervention(intervention); } catch { /* hors-ligne : sera resynchronisé */ }
}

export async function deleteIntervention(id) {
  const list = loadInterventions();
  const target = list.find(i => i.id === id);
  localStorage.setItem(INTERVENTIONS_KEY, JSON.stringify(list.filter(i => i.id !== id)));
  try { await fbDeleteIntervention(id); } catch { /* hors-ligne */ }
  // Nettoyage des photos associées dans Firebase Storage (best-effort)
  if (target) {
    for (const field of ['photosAvant', 'photosApres']) {
      for (const p of target[field] || []) {
        if (p?.path) deletePhoto(p.path);
      }
    }
  }
}

export async function saveClient(client) {
  const list = loadClients();
  const idx = list.findIndex(c => c.id === client.id);
  if (idx >= 0) list[idx] = client; else list.push(client);
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(list));
  try { await fbSaveClient(client); } catch { /* hors-ligne */ }
}

export async function deleteClient(id) {
  const list = loadClients().filter(c => c.id !== id);
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(list));
  try { await fbDeleteClient(id); } catch { /* hors-ligne */ }
}

export async function saveSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  try { await fbSaveSettings(s); } catch { /* hors-ligne */ }
}

// ─── Photos : compression + envoi vers Firebase Storage ─

// dataUrl déjà compressée -> upload Storage. En cas d'échec (hors-ligne),
// la photo est conservée localement avec le marqueur `pending`.
export async function uploadInterventionPhoto(interventionId, compressedDataUrl) {
  try {
    return await uploadPhoto(interventionId, compressedDataUrl, generateId());
  } catch {
    return { dataUrl: compressedDataUrl, pending: true };
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

// ─── Migration / synchronisation différée des photos ──
// - Convertit les anciennes photos (base64 en texte) vers Firebase Storage.
// - Réessaie d'envoyer les photos restées "en attente" (ajoutées hors-ligne).
// Idempotent : ne fait rien si tout est déjà synchronisé.
export async function syncPendingPhotos() {
  // Clients et paramètres : migration ponctuelle vers les nouvelles collections
  if (!localStorage.getItem(MIGRATED_KEY)) {
    for (const c of loadClients()) {
      try { await fbSaveClient(c); } catch { return; } // hors-ligne : on réessaiera plus tard
    }
    const settings = loadSettings();
    if (Object.keys(settings).length) {
      try { await fbSaveSettings(settings); } catch { return; }
    }
    localStorage.setItem(MIGRATED_KEY, 'true');
  }

  const list = loadInterventions();
  let anyChanged = false;
  for (const inter of list) {
    let changed = false;
    for (const field of ['photosAvant', 'photosApres']) {
      const photos = inter[field];
      if (!Array.isArray(photos)) continue;
      for (let i = 0; i < photos.length; i++) {
        const p = photos[i];
        if (p && typeof p === 'object' && p.url) continue; // déjà sur Storage
        const rawDataUrl = typeof p === 'string' ? p : p?.dataUrl;
        if (!rawDataUrl) continue;
        try {
          const compressed = estimateDataUrlBytes(rawDataUrl) > MAX_PHOTO_BYTES
            ? await compressDataUrl(rawDataUrl)
            : rawDataUrl;
          photos[i] = await uploadPhoto(inter.id, compressed, generateId());
          changed = true;
        } catch {
          // toujours hors-ligne : on réessaiera à la prochaine occasion
        }
      }
    }
    if (changed) {
      anyChanged = true;
      await saveIntervention(inter);
    }
  }
  return anyChanged;
}

// ─── PDF : récupérer une photo sous forme de data URL ─

export async function photoToDataUrl(photo) {
  if (typeof photo === 'string') return photo;
  if (photo?.dataUrl) return photo.dataUrl;
  if (photo?.url) {
    try { return await urlToDataUrl(photo.url); } catch { return null; }
  }
  return null;
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

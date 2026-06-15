import { fbSave } from './firebase';
import { compressDataUrl, estimateDataUrlBytes } from './utils/image';

const MAX_PHOTO_BYTES = 350 * 1024; // ~350 Ko

const INTERVENTIONS_KEY = 'robotiks_interventions';
const CLIENTS_KEY = 'robotiks_clients';
const SETTINGS_KEY = 'robotiks_settings';

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

// ─── Écriture locale + sync Firebase ─────────────────

export function saveInterventions(list) {
  localStorage.setItem(INTERVENTIONS_KEY, JSON.stringify(list));
  fbSave({ interventions: list }).catch(() => {});
}

export function saveClients(list) {
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(list));
  fbSave({ clients: list }).catch(() => {});
}

export function saveSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  fbSave({ settings: s }).catch(() => {});
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

export function applyRemoteData(data) {
  if (data.interventions) {
    const merged = mergeById(data.interventions, loadInterventions());
    localStorage.setItem(INTERVENTIONS_KEY, JSON.stringify(merged));
  }
  if (data.clients) {
    const merged = mergeById(data.clients, loadClients());
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(merged));
  }
  if (data.settings) localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
}

// ─── Compression rétroactive des photos déjà enregistrées ──
// Réduit la taille des photos volumineuses stockées dans d'anciennes
// interventions, pour libérer de la place dans le stockage local.
export async function compressStoredPhotos() {
  const list = loadInterventions();
  let changed = false;
  for (const inter of list) {
    for (const field of ['photosAvant', 'photosApres']) {
      const photos = inter[field];
      if (!Array.isArray(photos)) continue;
      for (let i = 0; i < photos.length; i++) {
        if (estimateDataUrlBytes(photos[i]) > MAX_PHOTO_BYTES) {
          try {
            photos[i] = await compressDataUrl(photos[i]);
            changed = true;
          } catch {
            // image illisible : on la laisse telle quelle
          }
        }
      }
    }
  }
  if (changed) saveInterventions(list);
  return changed;
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

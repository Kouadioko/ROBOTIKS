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

export function applyRemoteData(data) {
  if (data.interventions) localStorage.setItem(INTERVENTIONS_KEY, JSON.stringify(data.interventions));
  if (data.clients) localStorage.setItem(CLIENTS_KEY, JSON.stringify(data.clients));
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

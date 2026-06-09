import { fbSave } from './firebase';

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

// ─── Utilitaires ──────────────────────────────────────

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6).toUpperCase();
}

export function generateNumero(interventions) {
  const year = new Date().getFullYear();
  const count = interventions.filter(i => i.numero?.startsWith(`INT-${year}`)).length + 1;
  return `INT-${year}-${String(count).padStart(4, '0')}`;
}

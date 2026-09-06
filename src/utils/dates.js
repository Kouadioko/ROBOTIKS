// Les dates de pointage sont stockées au format "AAAA-MM-JJ".
// C'est un choix délibéré : trié alphabétiquement, c'est trié
// chronologiquement, et il n'y a pas de piège de fuseau horaire.
// L'affichage, lui, est TOUJOURS en jj/mm/aaaa.

/** Date JavaScript → "2026-09-06" (en heure locale, pas UTC). */
export function versISO(date) {
  const d = new Date(date);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

/** "2026-09-06" → "06/09/2026" ; chaîne vide si la date est absente ou invalide. */
export function versFr(iso) {
  const p = String(iso || '').split('-');
  if (p.length !== 3 || !p[0] || !p[1] || !p[2]) return '';
  return `${p[2]}/${p[1]}/${p[0]}`;
}

/** "2026-09-06" → "sam. 06/09" */
export function jourCourt(iso) {
  const p = String(iso || '').split('-');
  if (p.length !== 3) return '';
  const d = new Date(+p[0], +p[1] - 1, +p[2]);
  return `${d.toLocaleDateString('fr-FR', { weekday: 'short' })} ${p[2]}/${p[1]}`;
}

/** Pose les barres obliques au fur et à mesure de la frappe : "01092026" → "01/09/2026". */
export function masqueDate(texte) {
  const d = String(texte).replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/** "06/09/2026" → "2026-09-06". Chaîne vide si la date n'existe pas (31/02 par exemple). */
export function depuisFr(texte) {
  const m = String(texte).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return '';
  const [, jj, mm, aaaa] = m;
  const j = +jj, mois = +mm, an = +aaaa;
  const d = new Date(an, mois - 1, j);
  if (d.getDate() !== j || d.getMonth() !== mois - 1 || d.getFullYear() !== an) return '';
  return `${an}-${String(mois).padStart(2, '0')}-${String(j).padStart(2, '0')}`;
}

/** Cases d'un mois pour un calendrier dont la semaine commence le lundi.
 *  Les cases vides du début sont des null. */
export function grilleDuMois(annee, mois) {
  const premier = new Date(annee, mois, 1);
  const decalage = (premier.getDay() + 6) % 7;          // dimanche = 0 → 6
  const nbJours = new Date(annee, mois + 1, 0).getDate();
  const cases = [];
  for (let i = 0; i < decalage; i++) cases.push(null);
  for (let j = 1; j <= nbJours; j++) cases.push(versISO(new Date(annee, mois, j)));
  return cases;
}

export const JOURS_ENTETE = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

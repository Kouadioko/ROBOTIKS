export const SECTIONS = [
  {
    id: 'chassis',
    title: 'Chassis',
    emoji: '🏗',
    items: [
      'Structure générale (fissures, déformations)',
      'Chenilles / patins (usure, tension)',
      'Galets supérieurs',
      'Galets inférieurs',
      'Moteur de déplacement (fuites)',
      "Couronne d'orientation",
      'Contrepoids',
      'Boulonnerie châssis',
    ],
  },
  {
    id: 'bras',
    title: 'Flèche & Bras',
    emoji: '🦾',
    items: [
      'Flèche (fissures, déformations)',
      'Bras / stick (fissures)',
      'Vérin de flèche (fuites, joints)',
      'Vérin de bras (fuites, joints)',
      'Axes de flèche (usure, jeu)',
      'Axes de bras (usure, jeu)',
      'Boulonnerie flèche & bras',
    ],
  },
  {
    id: 'hydraulique',
    title: 'Hydraulique',
    emoji: '🛢',
    items: [
      'Niveau huile hydraulique',
      'Flexibles (fuites, fissurations)',
      'Pompe principale (bruit, pression)',
      'Distributeurs (fuites)',
      'Radiateur huile (fuites, colmatage)',
      'Filtre hydraulique',
    ],
  },
  {
    id: 'moteur',
    title: 'Moteur & Fluides',
    emoji: '⚙',
    items: [
      'Niveau huile moteur',
      'Niveau liquide refroidissement',
      'Niveau carburant',
      'Courroies (usure, tension)',
      'Filtre à air',
      'Filtre à gasoil',
      'Batterie (charge, corrosion)',
      'Fuites moteur',
    ],
  },
  {
    id: 'cabine',
    title: 'Cabine & Commandes',
    emoji: '🚧',
    items: [
      'Siège (état)',
      'Commandes (fonctionnement)',
      'Tableau de bord / instruments',
      'Klaxon / alarmes de recul',
      'Éclairage (feux de travail)',
      'Essuie-glaces',
      'Vitres / porte',
    ],
  },
];

export const TOOLS = [
  {
    id: 'godet',
    title: 'Godet',
    emoji: '🪣',
    items: [
      'Dents / adaptateurs (usure)',
      'Tranchants latéraux',
      'Structure (fissures)',
      'Attache rapide',
      'Vérin de godet (fuites)',
    ],
  },
  {
    id: 'pince',
    title: 'Pince',
    emoji: '🤝',
    items: [
      'Mâchoires (usure)',
      'Vérin de pince (fuites)',
      'Circuit hydraulique auxiliaire',
      'Structure (fissures)',
      'Attache',
    ],
  },
  {
    id: 'brh',
    title: 'BRH',
    emoji: '🔨',
    items: [
      'Circuit hydraulique (pression, débit)',
      'État du burin / ciseau',
      'Attache',
      'Fuites',
      'Structure (fissures)',
    ],
  },
];

export const STATUS_OPTS = [
  { key: 'ok',     label: '✓', color: '#2e7d32', bg: '#e8f5e9', text: 'OK' },
  { key: 'watch',  label: '⚠', color: '#e65100', bg: '#fff3e0', text: 'Surveiller' },
  { key: 'defaut', label: '✗', color: '#c62828', bg: '#ffebee', text: 'Défaut' },
  { key: 'na',     label: '–', color: '#757575', bg: '#f5f5f5', text: 'N/A' },
];

export function buildChecklist() {
  const cl = {};
  for (const s of [...SECTIONS, ...TOOLS]) {
    cl[s.id] = { items: {}, notes: '' };
    for (const item of s.items) cl[s.id].items[item] = '';
  }
  return cl;
}

export function getRevisionCounts(revision) {
  const counts = { ok: 0, watch: 0, defaut: 0, na: 0 };
  const activeSections = [...SECTIONS, ...TOOLS.filter(t => revision.activeTools?.includes(t.id))];
  for (const s of activeSections) {
    const data = revision.checklist?.[s.id];
    if (!data) continue;
    for (const item of s.items) {
      const v = data.items[item];
      if (v && counts[v] !== undefined) counts[v]++;
    }
  }
  return counts;
}

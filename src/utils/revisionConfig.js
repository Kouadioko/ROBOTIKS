// Sections communes (sans la partie motorisation)
const SECTIONS_BASE = [
  {
    id: 'chassis',
    title: 'Chassis',
    emoji: '🏗',
    items: [
      'Structure générale (fissures, déformations)',
      'Chenilles / patins (usure, tension)',
      'Galets supérieurs',
      'Galets inférieurs',
      'Moteur de déplacement (fuites / état)',
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

// Section motorisation THERMIQUE (diesel / essence)
const MOTOR_THERMIQUE = {
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
};

// Section motorisation ÉLECTRIQUE (Brokk, etc.)
const MOTOR_ELECTRIQUE = {
  id: 'moteur',
  title: 'Motorisation électrique',
  emoji: '⚡',
  items: [
    'Moteur électrique (état, surchauffe)',
    'Câbles et connexions électriques',
    'Alimentation / source d\'énergie',
    'Boîtier de commande / télécommande',
    'Fusibles / disjoncteurs',
    'Refroidissement moteur (ventilation)',
    'Batterie de commande (charge, état)',
  ],
};

// Retourne la liste complète des sections en insérant la bonne motorisation
export function getSections(motorType) {
  const motorSection = motorType === 'electrique' ? MOTOR_ELECTRIQUE : MOTOR_THERMIQUE;
  // Insertion entre hydraulique et cabine
  return [
    SECTIONS_BASE[0], // chassis
    SECTIONS_BASE[1], // bras
    SECTIONS_BASE[2], // hydraulique
    motorSection,
    SECTIONS_BASE[3], // cabine
  ];
}

// Pour les boucles et la config
export const SECTIONS = SECTIONS_BASE; // compatibilité (non utilisé en interne)

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
  // Sections de base (sans moteur)
  for (const s of SECTIONS_BASE) {
    cl[s.id] = { items: {}, notes: '' };
    for (const item of s.items) cl[s.id].items[item] = '';
  }
  // Section moteur : union des items thermique + électrique sous la même clé
  cl['moteur'] = { items: {}, notes: '' };
  for (const item of [...MOTOR_THERMIQUE.items, ...MOTOR_ELECTRIQUE.items]) {
    cl['moteur'].items[item] = '';
  }
  // Outils
  for (const t of TOOLS) {
    cl[t.id] = { items: {}, notes: '' };
    for (const item of t.items) cl[t.id].items[item] = '';
  }
  return cl;
}

export function getRevisionCounts(revision) {
  const counts = { ok: 0, watch: 0, defaut: 0, na: 0 };
  const motorType = revision.motorType || 'thermique';
  const activeSections = [
    ...getSections(motorType),
    ...TOOLS.filter(t => revision.activeTools?.includes(t.id)),
  ];
  for (const s of activeSections) {
    const data = revision.checklist?.[s.id];
    if (!data) continue;
    for (const item of s.items) {
      const v = data.items?.[item];
      if (v && counts[v] !== undefined) counts[v]++;
    }
  }
  return counts;
}

/** Compteurs d'une fiche de location, utilisés par la liste et par le détail. */
export function totauxLocation(location) {
  const jours = location?.jours || [];
  return {
    total: jours.length,
    avecOp: jours.filter(j => j.op).length,
    sansOp: jours.filter(j => !j.op).length,
    aSigner: jours.filter(j => !j.sig).length,
  };
}

/** Mot de passe simple à dicter au téléphone : ni l, ni o, ni 0, ni 1. */
export function propositionMotDePasse() {
  const lettres = 'abcdefghijkmnpqrstuvwxyz';
  const chiffres = '23456789';
  let out = '';
  for (let i = 0; i < 4; i++) out += lettres[Math.floor(Math.random() * lettres.length)];
  for (let i = 0; i < 4; i++) out += chiffres[Math.floor(Math.random() * chiffres.length)];
  return out;
}

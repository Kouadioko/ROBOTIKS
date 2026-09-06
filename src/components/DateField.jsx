import React, { useState } from 'react';
import { versFr, depuisFr, masqueDate } from '../utils/dates';

/**
 * Champ de date saisi et affiché en jj/mm/aaaa, quelle que soit la langue de
 * l'appareil.
 *
 * Pourquoi pas un simple <input type="date"> ? Parce qu'il s'affiche selon la
 * locale du téléphone : jj/mm/aaaa en français, mais mm/jj/aaaa sur un
 * appareil réglé en anglais. Comme l'appli finit sur le téléphone d'un
 * opérateur dont on ne maîtrise pas les réglages, on garde un champ texte pour
 * l'affichage — et le sélecteur natif reste accessible derrière le bouton 📅.
 *
 * La valeur remontée par onChange est toujours au format ISO "AAAA-MM-JJ".
 */
export default function DateField({ label, value, onChange }) {
  const [texte, setTexte] = useState(() => versFr(value));

  const saisir = (brut) => {
    const masque = masqueDate(brut);
    setTexte(masque);
    const iso = depuisFr(masque);
    if (iso) onChange(iso);
    else if (!masque) onChange('');
  };

  const choisir = (iso) => {
    if (!iso) return;
    onChange(iso);
    setTexte(versFr(iso));
  };

  const valide = !texte || !!depuisFr(texte);

  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{
        display: 'block', fontSize: 12, fontWeight: 700, color: '#e65100',
        marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5,
      }}>{label}</label>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={texte}
          inputMode="numeric"
          placeholder="jj/mm/aaaa"
          maxLength={10}
          onChange={e => saisir(e.target.value)}
          style={{
            flex: 1, padding: '11px 14px', borderRadius: 10, fontSize: 14,
            background: '#fafafa',
            border: `1px solid ${valide ? '#e0e0e0' : '#e57373'}`,
          }}
        />
        {/* Le sélecteur natif est rendu transparent par-dessus le bouton :
            c'est le seul moyen fiable de l'ouvrir sur tous les navigateurs. */}
        <div style={{ position: 'relative', width: 48, flexShrink: 0 }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10, fontSize: 18,
          }}>📅</div>
          <input
            type="date"
            value={value || ''}
            onChange={e => choisir(e.target.value)}
            style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              opacity: 0, border: 'none', padding: 0, margin: 0,
            }}
          />
        </div>
      </div>
    </div>
  );
}

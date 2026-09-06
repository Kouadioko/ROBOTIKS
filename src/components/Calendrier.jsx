import React from 'react';
import { versISO, grilleDuMois, JOURS_ENTETE } from '../utils/dates';

const boutonMois = {
  background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10,
  width: 36, height: 36, fontSize: 20, color: '#e65100', fontWeight: 800,
};

/**
 * Calendrier de pointage : on tape sur une date pour la pointer ou la retirer.
 *   vert  = journée avec opérateur
 *   bleu  = journée sans opérateur
 *   🔒    = journée déjà signée par le client, donc verrouillée
 */
export default function Calendrier({ jours, annee, mois, onPrev, onNext, onToggle }) {
  const aujourdhui = versISO(new Date());
  const parDate = new Map((jours || []).map(j => [j.date, j]));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button type="button" onClick={onPrev} style={boutonMois}>‹</button>
        <div style={{ fontWeight: 800, fontSize: 15, textTransform: 'capitalize' }}>
          {new Date(annee, mois, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        </div>
        <button type="button" onClick={onNext} style={boutonMois}>›</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
        {JOURS_ENTETE.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#aaa' }}>{d}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
        {grilleDuMois(annee, mois).map((iso, i) => {
          if (!iso) return <div key={`vide-${i}`} />;
          const pointe = parDate.get(iso);
          const verrouille = pointe && pointe.sig;
          const fond = !pointe ? '#fff' : (pointe.op ? '#e8f5e9' : '#e3f2fd');
          const trait = !pointe ? '#eee' : (pointe.op ? '#2e7d32' : '#1565c0');
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onToggle(iso)}
              style={{
                padding: '8px 0', borderRadius: 10, border: `1.5px solid ${trait}`,
                background: fond, fontSize: 14,
                fontWeight: pointe ? 800 : 500,
                color: pointe ? trait : (iso === aujourdhui ? '#e65100' : '#555'),
                position: 'relative', cursor: 'pointer',
                outline: iso === aujourdhui ? '2px solid #ffcc80' : 'none',
              }}
            >
              {iso.slice(8)}
              {verrouille && (
                <span style={{ position: 'absolute', top: 1, right: 3, fontSize: 8 }}>🔒</span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 11, color: '#888', flexWrap: 'wrap' }}>
        <span>🟩 avec opérateur</span>
        <span>🟦 sans opérateur</span>
        <span>🔒 signé</span>
      </div>
    </div>
  );
}

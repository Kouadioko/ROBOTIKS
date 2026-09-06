import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { loadLocations } from '../store';
import { totauxLocation } from '../utils/locations';

const puce = { fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10 };

export default function Locations({ operateur, onBack, onNew, onOpen, onOperateurs }) {
  const [liste, setListe] = useState(loadLocations);

  useEffect(() => {
    const maj = () => setListe(loadLocations());
    window.addEventListener('robotiks-sync', maj);
    return () => window.removeEventListener('robotiks-sync', maj);
  }, []);

  return (
    <div style={{ paddingBottom: 100 }}>
      <Header
        title="Locations machines"
        onBack={onBack}
        action={!operateur && (
          <button onClick={onOperateurs} title="Gérer les accès opérateurs" style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
            width: 36, height: 36, borderRadius: 8, fontSize: 16,
          }}>👷</button>
        )}
      />

      <div style={{ padding: 16 }}>
        {liste.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#aaa' }}>
            <div style={{ fontSize: 48 }}>📅</div>
            <div style={{ marginTop: 12, fontSize: 15 }}>Aucune location</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>
              {operateur ? "Ton patron doit d'abord créer la fiche" : 'Appuie sur + pour en créer une'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {liste.map(loc => {
              const t = totauxLocation(loc);
              const fini = loc.status === 'terminee';
              return (
                <div key={loc.id} onClick={() => onOpen(loc.id)} style={{
                  background: '#fff', borderRadius: 12, padding: 14,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)', cursor: 'pointer',
                  borderLeft: `4px solid ${fini ? '#2e7d32' : '#e65100'}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{loc.clientNom || 'Client non renseigné'}</div>
                    <div style={{ fontSize: 11, color: '#aaa', marginLeft: 8, whiteSpace: 'nowrap' }}>{loc.numero}</div>
                  </div>
                  <div style={{ fontSize: 13, color: '#555', marginBottom: 2 }}>
                    🔩 {loc.machine || 'Machine non renseignée'}
                  </div>
                  {loc.chantier && (
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>📍 {loc.chantier}</div>
                  )}
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ ...puce, color: '#1a1a2e', background: '#f0f0f0' }}>{t.total} j</span>
                    {t.avecOp > 0 && <span style={{ ...puce, color: '#2e7d32', background: '#e8f5e9' }}>👷 {t.avecOp}</span>}
                    {t.sansOp > 0 && <span style={{ ...puce, color: '#1565c0', background: '#e3f2fd' }}>🔧 {t.sansOp}</span>}
                    {t.aSigner > 0 && <span style={{ ...puce, color: '#e65100', background: '#fff3e0' }}>✍️ {t.aSigner} à signer</span>}
                    <div style={{ flex: 1 }} />
                    {fini && <span style={{ ...puce, color: '#2e7d32', background: '#e8f5e9' }}>Terminée</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!operateur && (
        <button onClick={onNew} style={{
          position: 'fixed', bottom: 24, right: 24, width: 60, height: 60, borderRadius: 30,
          background: '#e65100', color: '#fff', border: 'none', fontSize: 32,
          boxShadow: '0 4px 16px rgba(230,81,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
        }}>+</button>
      )}
    </div>
  );
}

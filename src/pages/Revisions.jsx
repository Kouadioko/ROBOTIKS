import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { loadRevisions } from '../store';
import { getRevisionCounts } from '../utils/revisionConfig';

export default function Revisions({ onBack, onNew, onOpen }) {
  const [revisions, setRevisions] = useState(loadRevisions());

  useEffect(() => {
    const onSync = () => setRevisions(loadRevisions());
    window.addEventListener('robotiks-sync', onSync);
    return () => window.removeEventListener('robotiks-sync', onSync);
  }, []);

  return (
    <div>
      <Header title="Révisions machines" onBack={onBack} />
      <div style={{ padding: 16 }}>
        {revisions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#aaa' }}>
            <div style={{ fontSize: 48 }}>🔍</div>
            <div style={{ marginTop: 12, fontSize: 15 }}>Aucune révision</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Appuie sur + pour créer une fiche</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {revisions.map(r => {
              const counts = getRevisionCounts(r);
              const borderColor = counts.defaut > 0 ? '#c62828' : counts.watch > 0 ? '#e65100' : '#2e7d32';
              return (
                <div key={r.id} onClick={() => onOpen(r.id)} style={{
                  background: '#fff', borderRadius: 12, padding: 14,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)', cursor: 'pointer',
                  borderLeft: `4px solid ${borderColor}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{r.clientNom || 'Client non renseigné'}</div>
                    <div style={{ fontSize: 11, color: '#aaa', marginLeft: 8, whiteSpace: 'nowrap' }}>{r.numero}</div>
                  </div>
                  <div style={{ fontSize: 13, color: '#555', marginBottom: 6 }}>
                    🔩 {[r.marque, r.modele].filter(Boolean).join(' ') || 'Machine non renseignée'}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    {counts.ok > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#2e7d32', background: '#e8f5e9', padding: '2px 8px', borderRadius: 10 }}>
                        ✓ {counts.ok}
                      </span>
                    )}
                    {counts.watch > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#e65100', background: '#fff3e0', padding: '2px 8px', borderRadius: 10 }}>
                        ⚠ {counts.watch}
                      </span>
                    )}
                    {counts.defaut > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#c62828', background: '#ffebee', padding: '2px 8px', borderRadius: 10 }}>
                        ✗ {counts.defaut}
                      </span>
                    )}
                    <div style={{ flex: 1 }} />
                    <div style={{ fontSize: 12, color: '#aaa' }}>
                      {r.dateRevision ? new Date(r.dateRevision).toLocaleDateString('fr-FR') : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button onClick={onNew} style={{
        position: 'fixed', bottom: 24, right: 24,
        width: 60, height: 60, borderRadius: 30,
        background: '#e65100', color: '#fff', border: 'none',
        fontSize: 32, boxShadow: '0 4px 16px rgba(230,81,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
      }}>+</button>
    </div>
  );
}

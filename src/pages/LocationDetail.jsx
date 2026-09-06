import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Calendrier from '../components/Calendrier';
import { loadLocation, saveLocation, deleteLocation, loadSettings } from '../store';
import { versFr, jourCourt } from '../utils/dates';
import { generatePDFLocation } from '../utils/pdfLocation';
import { totauxLocation } from '../utils/locations';

const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 10,
  border: '1px solid #e0e0e0', fontSize: 13, background: '#fafafa',
};

const puce = { fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10 };

function Card({ title, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 14, paddingBottom: 8, borderBottom: '2px solid #f0f0f0' }}>{title}</div>
      {children}
    </div>
  );
}

function gros(fond) {
  return {
    width: '100%', padding: 14, border: 'none', borderRadius: 12,
    fontSize: 15, fontWeight: 800, color: '#fff', marginTop: 10, background: fond,
  };
}

/** Les deux boutons PDF : partage natif ou enregistrement direct. */
function BoutonsPdf({ location, signature }) {
  const lancer = (direct) => generatePDFLocation(location, signature, loadSettings(), direct);
  const style = (couleur) => ({
    flex: 1, padding: '9px 6px', borderRadius: 10, border: '1px solid #e0e0e0',
    background: '#fff', color: couleur, fontSize: 12, fontWeight: 700,
  });
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
      <button type="button" onClick={() => lancer(false)} style={style('#1565c0')}>📤 Envoyer</button>
      <button type="button" onClick={() => lancer(true)} style={style('#e65100')}>📄 Télécharger</button>
    </div>
  );
}

export default function LocationDetail({ locationId, operateur, onBack, onEdit, onSign, onDeleted }) {
  const [, setTick] = useState(0);
  const [mois, setMois] = useState(() => {
    const d = new Date();
    return { a: d.getFullYear(), m: d.getMonth() };
  });

  useEffect(() => {
    const maj = () => setTick(v => v + 1);
    window.addEventListener('robotiks-sync', maj);
    return () => window.removeEventListener('robotiks-sync', maj);
  }, []);

  const location = loadLocation(locationId);
  if (!location) {
    return (
      <div>
        <Header title="Location" onBack={onBack} />
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#aaa' }}>Fiche introuvable</div>
      </div>
    );
  }

  const jours = location.jours || [];

  const majJours = (nouveaux) => {
    saveLocation({ ...location, jours: [...nouveaux].sort((a, b) => (a.date < b.date ? -1 : 1)) });
  };

  const basculer = (iso) => {
    const j = jours.find(x => x.date === iso);
    if (j?.sig) {
      alert('Cette journée a déjà été signée par le client, elle est verrouillée.');
      return;
    }
    if (j) majJours(jours.filter(x => x.date !== iso));
    else majJours([...jours, { date: iso, op: !!location.avecOperateurDefaut, obs: '', sig: '' }]);
  };

  const modifierJour = (iso, champ, valeur) => {
    majJours(jours.map(j => (j.date === iso ? { ...j, [champ]: valeur } : j)));
  };

  const t = totauxLocation(location);
  const joursDuMois = jours.filter(j => {
    const p = j.date.split('-');
    return +p[0] === mois.a && +p[1] - 1 === mois.m;
  });

  return (
    <div style={{ paddingBottom: 40 }}>
      <Header title={location.numero || 'Location'} onBack={onBack} />

      <div style={{ padding: 16 }}>
        {/* En-tête de la fiche */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{location.clientNom || 'Client non renseigné'}</div>
          <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>🔩 {location.machine || '—'}</div>
          {location.chantier && <div style={{ fontSize: 13, color: '#555' }}>📍 {location.chantier}</div>}
          {location.operateurNom && <div style={{ fontSize: 13, color: '#555' }}>👷 {location.operateurNom}</div>}
        </div>

        {/* Totaux */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
          {[
            { l: 'Jours pointés', v: t.total, c: '#e65100' },
            { l: 'Avec opérateur', v: t.avecOp, c: '#2e7d32' },
            { l: 'À faire signer', v: t.aSigner, c: '#1565c0' },
          ].map(c => (
            <div key={c.l} style={{ background: '#fff', borderRadius: 12, padding: '12px 8px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: c.c }}>{c.v}</div>
              <div style={{ fontSize: 11, color: '#888' }}>{c.l}</div>
            </div>
          ))}
        </div>

        <Card title="Pointer les jours">
          <Calendrier
            jours={jours}
            annee={mois.a}
            mois={mois.m}
            onPrev={() => setMois(o => (o.m === 0 ? { a: o.a - 1, m: 11 } : { a: o.a, m: o.m - 1 }))}
            onNext={() => setMois(o => (o.m === 11 ? { a: o.a + 1, m: 0 } : { a: o.a, m: o.m + 1 }))}
            onToggle={basculer}
          />
        </Card>

        {joursDuMois.length > 0 && (
          <Card title={`Détail du mois (${joursDuMois.length} jour(s))`}>
            {joursDuMois.map(j => {
              const verrou = !!j.sig;
              return (
                <div key={j.date} style={{
                  background: '#fff', borderRadius: 12, padding: 12, marginBottom: 8,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  borderLeft: `4px solid ${j.op ? '#2e7d32' : '#1565c0'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, textTransform: 'capitalize' }}>{jourCourt(j.date)}</div>
                    {verrou ? (
                      <span style={{ ...puce, color: '#2e7d32', background: '#e8f5e9' }}>🔒 signé</span>
                    ) : (
                      <button onClick={() => basculer(j.date)} style={{
                        background: 'none', border: 'none', color: '#c62828', fontSize: 12, fontWeight: 700,
                      }}>Retirer</button>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    {[
                      { v: true, l: '👷 Avec opérateur', c: '#2e7d32' },
                      { v: false, l: '🔧 Sans opérateur', c: '#1565c0' },
                    ].map(o => {
                      const actif = !!j.op === o.v;
                      return (
                        <button key={String(o.v)} disabled={verrou} onClick={() => modifierJour(j.date, 'op', o.v)} style={{
                          flex: 1, padding: '8px 4px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                          opacity: verrou ? 0.5 : 1,
                          border: `1.5px solid ${actif ? o.c : '#e0e0e0'}`,
                          background: actif ? o.c : '#fff',
                          color: actif ? '#fff' : '#666',
                        }}>{o.l}</button>
                      );
                    })}
                  </div>
                  <input
                    value={j.obs || ''}
                    disabled={verrou}
                    placeholder="Observation, panne, intempéries…"
                    onChange={e => modifierJour(j.date, 'obs', e.target.value)}
                    style={inputStyle}
                  />
                </div>
              );
            })}
          </Card>
        )}

        {(location.signatures || []).length > 0 && (
          <Card title="Signatures du client">
            {(location.signatures || []).map(s => (
              <div key={s.id} style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* une signature sans image ne doit pas produire de <img src=""> */}
                  {s.image ? (
                    <img src={s.image} alt="signature" style={{
                      width: 70, height: 32, objectFit: 'contain',
                      border: '1px solid #eee', borderRadius: 6, background: '#fff',
                    }} />
                  ) : (
                    <div style={{
                      width: 70, height: 32, border: '1px solid #eee', borderRadius: 6,
                      background: '#fafafa', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 10, color: '#bbb',
                    }}>sans image</div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{s.nom || 'Client'}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>
                      {(s.dates || []).length} jour(s) — le {versFr(s.date)}
                    </div>
                  </div>
                  {!operateur && (
                    <button
                      onClick={() => {
                        if (!window.confirm(`Annuler cette signature ? Les ${(s.dates || []).length} journées redeviendront modifiables.`)) return;
                        saveLocation({
                          ...location,
                          signatures: (location.signatures || []).filter(z => z.id !== s.id),
                          jours: jours.map(j => (j.sig === s.id ? { ...j, sig: '' } : j)),
                        });
                      }}
                      style={{ background: 'none', border: 'none', color: '#c62828', fontSize: 16 }}
                    >🗑</button>
                  )}
                </div>
                <BoutonsPdf location={location} signature={s} />
              </div>
            ))}
          </Card>
        )}

        {t.aSigner > 0 ? (
          <button onClick={onSign} style={gros('#1565c0')}>✍️ Faire signer {t.aSigner} jour(s)</button>
        ) : (
          <div style={{ textAlign: 'center', color: '#aaa', fontSize: 13, marginTop: 10 }}>
            Tous les jours pointés sont signés
          </div>
        )}

        {jours.length > 0 && (
          <Card title="Récapitulatif complet en PDF">
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>
              Toutes les journées de la fiche, signées ou non — pour ton suivi ou pour facturer.
            </div>
            <BoutonsPdf location={location} signature={null} />
          </Card>
        )}

        {!operateur && (
          <>
            <button onClick={onEdit} style={gros('#455a64')}>✏️ Modifier la fiche</button>
            {location.status !== 'terminee' && (
              <button onClick={() => saveLocation({ ...location, status: 'terminee' })} style={gros('#2e7d32')}>
                ✅ Clôturer la location
              </button>
            )}
            <button
              onClick={() => {
                if (!window.confirm('Supprimer définitivement cette location et tous ses pointages ?')) return;
                deleteLocation(location.id);
                onDeleted();
              }}
              style={{ ...gros('#ffebee'), color: '#c62828' }}
            >🗑 Supprimer la location</button>
          </>
        )}
      </div>
    </div>
  );
}

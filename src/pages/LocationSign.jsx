import React, { useState } from 'react';
import Header from '../components/Header';
import SignatureField from '../components/SignaturePad';
import { loadLocation, saveLocation, generateId } from '../store';
import { versISO, jourCourt } from '../utils/dates';

const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: '1px solid #e0e0e0', fontSize: 14, background: '#fafafa',
};

function Card({ title, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 14, paddingBottom: 8, borderBottom: '2px solid #f0f0f0' }}>{title}</div>
      {children}
    </div>
  );
}

/**
 * Un bon couvre TOUTES les journées pas encore signées. C'est ce qui permet de
 * faire signer chaque semaine ou une seule fois en fin de chantier, sans avoir
 * à choisir une période : c'est le même bouton dans les deux cas.
 */
export default function LocationSign({ locationId, onBack, onSaved }) {
  const location = loadLocation(locationId);
  const [nom, setNom] = useState(location?.clientNom || '');
  const [image, setImage] = useState('');

  if (!location) {
    return (
      <div>
        <Header title="Signature" onBack={onBack} />
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#aaa' }}>Fiche introuvable</div>
      </div>
    );
  }

  const jours = location.jours || [];
  const aSigner = jours.filter(j => !j.sig);
  const avecOp = aSigner.filter(j => j.op).length;

  const valider = () => {
    if (!image) {
      alert('Le client doit signer dans le cadre avant de valider.');
      return;
    }
    const sigId = generateId();
    saveLocation({
      ...location,
      signatures: [...(location.signatures || []), {
        id: sigId,
        nom: nom || location.clientNom || 'Client',
        date: versISO(new Date()),
        image,
        dates: aSigner.map(j => j.date),
        nbAvecOperateur: avecOp,
        nbSansOperateur: aSigner.length - avecOp,
      }],
      jours: jours.map(j => (j.sig ? j : { ...j, sig: sigId })),
    });
    onSaved();
  };

  return (
    <div style={{ paddingBottom: 60 }}>
      <Header title="Bon de pointage" onBack={onBack} />

      <div style={{ padding: 16 }}>
        <Card title="Récapitulatif à faire valider">
          <div style={{ fontSize: 13, color: '#555', marginBottom: 10 }}>
            {location.clientNom || 'Client'} — {location.machine || 'machine'}
            {location.chantier ? ` — ${location.chantier}` : ''}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
            {[
              { l: 'Jours', v: aSigner.length, c: '#e65100' },
              { l: 'Avec op.', v: avecOp, c: '#2e7d32' },
              { l: 'Sans op.', v: aSigner.length - avecOp, c: '#1565c0' },
            ].map(c => (
              <div key={c.l} style={{ background: '#fafafa', borderRadius: 10, padding: '10px 4px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: c.c }}>{c.v}</div>
                <div style={{ fontSize: 11, color: '#888' }}>{c.l}</div>
              </div>
            ))}
          </div>

          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {aSigner.map(j => (
              <div key={j.date} style={{ display: 'flex', gap: 8, fontSize: 13, padding: '5px 0', borderBottom: '1px solid #f4f4f4' }}>
                <span style={{ width: 92, textTransform: 'capitalize' }}>{jourCourt(j.date)}</span>
                <span style={{ color: j.op ? '#2e7d32' : '#1565c0', fontWeight: 700, width: 26 }}>{j.op ? '👷' : '🔧'}</span>
                <span style={{ flex: 1, color: '#888', fontSize: 12 }}>{j.obs || ''}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Signature du client">
          <div style={{ marginBottom: 14 }}>
            <label style={{
              display: 'block', fontSize: 12, fontWeight: 700, color: '#e65100',
              marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5,
            }}>Nom du signataire</label>
            <input value={nom} onChange={e => setNom(e.target.value)}
              placeholder="Nom et fonction" style={inputStyle} />
          </div>
          <SignatureField valeur={image} onChange={setImage} />
        </Card>

        <button onClick={valider} style={{
          width: '100%', padding: 14, border: 'none', borderRadius: 12,
          fontSize: 15, fontWeight: 800, color: '#fff',
          background: image ? '#2e7d32' : '#ccc',
        }}>
          ✅ Valider le bon ({aSigner.length} jour(s))
        </button>
      </div>
    </div>
  );
}

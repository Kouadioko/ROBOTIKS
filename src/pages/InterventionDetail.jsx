import React, { useState } from 'react';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import { loadInterventions, saveInterventions, loadSettings } from '../store';
import { generatePDF } from '../utils/pdf';

export default function InterventionDetail({ interventionId, onBack, onEdit, onDeleted }) {
  const [sharing, setSharing] = useState(false);
  const interventions = loadInterventions();
  const intervention = interventions.find(i => i.id === interventionId);

  if (!intervention) return <div style={{ padding: 20 }}>Intervention introuvable</div>;

  const deleteIntervention = () => {
    if (!window.confirm('Supprimer cette intervention ?')) return;
    saveInterventions(interventions.filter(i => i.id !== interventionId));
    onDeleted();
  };

  const handlePDF = async () => {
    setSharing(true);
    try {
      const settings = loadSettings();
      await generatePDF(intervention, settings);
    } catch (e) {
      if (e.name !== 'AbortError') {
        alert(`Erreur PDF : ${e.message || 'inconnue'}`);
        console.error('PDF error:', e);
      }
    } finally {
      setSharing(false);
    }
  };

  const duree = (() => {
    if (!intervention.heureDebut || !intervention.heureFin) return null;
    const [h1, m1] = intervention.heureDebut.split(':').map(Number);
    const [h2, m2] = intervention.heureFin.split(':').map(Number);
    const mins = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (mins <= 0) return null;
    return `${Math.floor(mins / 60)}h${mins % 60 > 0 ? `${mins % 60}min` : ''}`;
  })();

  const Row = ({ label, value }) => value ? (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, color: '#e65100', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 14, color: '#1a1a2e', marginTop: 2 }}>{value}</div>
    </div>
  ) : null;

  const Card = ({ title, children }) => (
    <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #f0f0f0' }}>{title}</div>
      {children}
    </div>
  );

  return (
    <div style={{ paddingBottom: 120 }}>
      <Header
        title={intervention.numero}
        onBack={onBack}
        action={
          <button onClick={onEdit} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
            padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600
          }}>✏️ Modifier</button>
        }
      />

      <div style={{ padding: 16 }}>
        {/* En-tête */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{intervention.clientNom}</div>
            <StatusBadge status={intervention.status} />
          </div>
          <div style={{ fontSize: 13, color: '#666' }}>
            {intervention.dateIntervention && new Date(intervention.dateIntervention).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
          {intervention.lieu && <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>📍 {intervention.lieu}</div>}
          {intervention.clientContact && <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>👤 {intervention.clientContact}</div>}
        </div>

        {/* Machine */}
        <Card title="🔩 Machine">
          <Row label="Type" value={intervention.machine} />
          <Row label="Marque / Modèle" value={[intervention.marque, intervention.modele].filter(Boolean).join(' ')} />
          <Row label="N° de série" value={intervention.numeroSerie} />
        </Card>

        {/* Photos avant */}
        {intervention.photosAvant?.length > 0 && (
          <Card title="📷 Photos avant">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {intervention.photosAvant.map((p, i) => (
                <img key={i} src={p} alt="" style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 8, border: '2px solid #e0e0e0' }} />
              ))}
            </div>
          </Card>
        )}

        {/* Panne & Travaux */}
        <Card title="🛠 Panne & Travaux">
          <Row label="Panne signalée" value={intervention.panneSignalee} />
          <Row label="Diagnostic" value={intervention.diagnostic} />
          <Row label="Travaux effectués" value={intervention.travauxEffectues} />
        </Card>

        {/* Pièces */}
        {intervention.pieces?.length > 0 && (
          <Card title="🔧 Pièces utilisées">
            {intervention.pieces.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f5f5f5' }}>
                <div>
                  <div style={{ fontSize: 14 }}>{p.designation}</div>
                  {p.reference && <div style={{ fontSize: 12, color: '#888' }}>Réf: {p.reference}</div>}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#e65100' }}>×{p.quantite}</div>
              </div>
            ))}
          </Card>
        )}

        {/* Temps */}
        {(intervention.heureDebut || intervention.heureFin) && (
          <Card title="⏱ Temps">
            <div style={{ display: 'flex', gap: 20 }}>
              {intervention.heureDebut && <Row label="Début" value={intervention.heureDebut} />}
              {intervention.heureFin && <Row label="Fin" value={intervention.heureFin} />}
              {duree && <Row label="Durée" value={duree} />}
            </div>
          </Card>
        )}

        {/* Photos après */}
        {intervention.photosApres?.length > 0 && (
          <Card title="📷 Photos après">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {intervention.photosApres.map((p, i) => (
                <img key={i} src={p} alt="" style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 8, border: '2px solid #e0e0e0' }} />
              ))}
            </div>
          </Card>
        )}

        {/* Signature */}
        {intervention.signature && (
          <Card title="✍ Signature client">
            <img src={intervention.signature} alt="Signature" style={{ maxWidth: '100%', border: '1px solid #e0e0e0', borderRadius: 8 }} />
          </Card>
        )}

        {/* Notes */}
        {intervention.notes && (
          <Card title="📝 Notes internes">
            <div style={{ fontSize: 14, color: '#555', whiteSpace: 'pre-wrap' }}>{intervention.notes}</div>
          </Card>
        )}
      </div>

      {/* Actions fixes en bas */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#fff',
        padding: '12px 16px',
        display: 'flex',
        gap: 10,
        boxShadow: '0 -4px 12px rgba(0,0,0,0.1)'
      }}>
        <button onClick={handlePDF} disabled={sharing} style={{
          flex: 3,
          padding: '14px',
          background: sharing ? '#ccc' : 'linear-gradient(135deg, #e65100, #bf360c)',
          color: '#fff',
          border: 'none',
          borderRadius: 12,
          fontSize: 15,
          fontWeight: 700
        }}>
          {sharing ? '⏳ Génération...' : navigator.canShare ? '📤 Envoyer PDF' : '📄 Télécharger PDF'}
        </button>
        <button onClick={deleteIntervention} style={{
          flex: 1,
          padding: '14px',
          background: '#ffebee',
          color: '#c62828',
          border: 'none',
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 700
        }}>🗑</button>
      </div>
    </div>
  );
}

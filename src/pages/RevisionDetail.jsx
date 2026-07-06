import React, { useState } from 'react';
import Header from '../components/Header';
import { loadRevisions, deleteRevision, loadSettings } from '../store';
import { generateRevisionPDF } from '../utils/pdfRevision';
import { SECTIONS, TOOLS, STATUS_OPTS, getRevisionCounts } from '../utils/revisionConfig';

export default function RevisionDetail({ revisionId, onBack, onEdit, onDeleted }) {
  const [sharing, setSharing] = useState(false);
  const revision = loadRevisions().find(r => r.id === revisionId);

  if (!revision) return <div style={{ padding: 20 }}>Révision introuvable</div>;

  const handleDelete = async () => {
    if (!window.confirm('Supprimer cette révision ?')) return;
    await deleteRevision(revisionId);
    onDeleted();
  };

  const handlePDF = async () => {
    setSharing(true);
    try {
      await generateRevisionPDF(revision, loadSettings());
    } catch (e) {
      if (e.name !== 'AbortError') alert(`Erreur PDF : ${e.message || 'inconnue'}`);
    } finally {
      setSharing(false);
    }
  };

  const counts = getRevisionCounts(revision);
  const activeSections = [...SECTIONS, ...TOOLS.filter(t => revision.activeTools?.includes(t.id))];

  const statusFor = (key) => STATUS_OPTS.find(o => o.key === key);

  return (
    <div style={{ paddingBottom: 120 }}>
      <Header
        title={revision.numero}
        onBack={onBack}
        action={
          <button onClick={onEdit} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
            padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          }}>✏️ Modifier</button>
        }
      />

      <div style={{ padding: 16 }}>
        {/* Entête */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{revision.clientNom || 'Client non renseigné'}</div>
          {(revision.marque || revision.modele) && (
            <div style={{ fontSize: 13, color: '#555', marginBottom: 2 }}>
              🔩 {[revision.marque, revision.modele].filter(Boolean).join(' ')}
            </div>
          )}
          {revision.numeroSerie && (
            <div style={{ fontSize: 12, color: '#888' }}>N° série : {revision.numeroSerie}</div>
          )}
          <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
            {revision.dateRevision
              ? new Date(revision.dateRevision).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
              : ''}
          </div>
          {revision.lieu && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>📍 {revision.lieu}</div>}
          {revision.nomIntervenant && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>🔧 {revision.nomIntervenant}</div>}
        </div>

        {/* Résumé */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
          {STATUS_OPTS.map(opt => (
            <div key={opt.key} style={{ background: opt.bg, borderRadius: 10, padding: '10px 4px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: opt.color }}>{counts[opt.key]}</div>
              <div style={{ fontSize: 10, color: opt.color, fontWeight: 600 }}>{opt.text}</div>
            </div>
          ))}
        </div>

        {/* Sections */}
        {activeSections.map(section => {
          const data = revision.checklist?.[section.id];
          if (!data) return null;
          return (
            <div key={section.id} style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a2e', marginBottom: 10, paddingBottom: 6, borderBottom: '2px solid #f0f0f0' }}>
                {section.emoji} {section.title}
              </div>
              {section.items.map(item => {
                const val = data.items?.[item];
                const opt = statusFor(val);
                return (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid #f5f5f5' }}>
                    <div style={{ flex: 1, fontSize: 13, color: '#333' }}>{item}</div>
                    {opt ? (
                      <div style={{
                        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                        background: opt.bg, color: opt.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 15, fontWeight: 700,
                      }}>
                        {opt.label}
                      </div>
                    ) : (
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: '#f5f5f5', flexShrink: 0 }} />
                    )}
                  </div>
                );
              })}
              {data.notes && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#666', fontStyle: 'italic', padding: '6px 8px', background: '#f9f9f9', borderRadius: 6 }}>
                  📝 {data.notes}
                </div>
              )}
            </div>
          );
        })}

        {revision.observations && (
          <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>📝 Observations</div>
            <div style={{ fontSize: 13, color: '#444', lineHeight: 1.6 }}>{revision.observations}</div>
          </div>
        )}
      </div>

      {/* Actions fixes en bas */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#fff', padding: '12px 16px',
        display: 'flex', gap: 10,
        boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
      }}>
        <button onClick={handlePDF} disabled={sharing} style={{
          flex: 3, padding: '14px',
          background: sharing ? '#ccc' : '#e65100',
          color: '#fff', border: 'none', borderRadius: 12,
          fontSize: 15, fontWeight: 700,
        }}>
          {sharing ? '⏳ Génération...' : navigator.canShare ? '📤 Envoyer PDF' : '📄 Télécharger PDF'}
        </button>
        <button onClick={handleDelete} style={{
          flex: 1, padding: '14px',
          background: '#ffebee', color: '#c62828',
          border: 'none', borderRadius: 12,
          fontSize: 14, fontWeight: 700,
        }}>🗑</button>
      </div>
    </div>
  );
}

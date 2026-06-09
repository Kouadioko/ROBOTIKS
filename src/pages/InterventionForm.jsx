import React, { useState, useRef } from 'react';
import Header from '../components/Header';
import { loadInterventions, saveInterventions, loadClients, saveClients, generateId, generateNumero } from '../store';

const STATUTS = [
  { value: 'en_cours', label: 'En cours' },
  { value: 'attente_pieces', label: 'Attente pièces' },
  { value: 'terminee', label: 'Terminée' },
  { value: 'devis', label: 'Devis' },
];

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#e65100', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 10,
  border: '1px solid #e0e0e0',
  fontSize: 14,
  background: '#fafafa',
};

function Section({ title, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a2e', marginBottom: 14, paddingBottom: 8, borderBottom: '2px solid #f0f0f0' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function PhotoSection({ label, photos, onAdd, onRemove }) {
  const inputRef = useRef();

  const handleFile = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => onAdd(ev.target.result);
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#e65100', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {photos.map((p, idx) => (
          <div key={idx} style={{ position: 'relative', width: 80, height: 80 }}>
            <img src={p} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '2px solid #e0e0e0' }} />
            <button onClick={() => onRemove(idx)} style={{
              position: 'absolute', top: -6, right: -6,
              background: '#c62828', color: '#fff',
              border: 'none', borderRadius: '50%',
              width: 22, height: 22, fontSize: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>✕</button>
          </div>
        ))}
        <button onClick={() => inputRef.current.click()} style={{
          width: 80, height: 80,
          border: '2px dashed #e65100',
          borderRadius: 8,
          background: '#fff8f5',
          color: '#e65100',
          fontSize: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column'
        }}>
          <span>📷</span>
          <span style={{ fontSize: 10, marginTop: 2 }}>Photo</span>
        </button>
        <input ref={inputRef} type="file" accept="image/*" capture="environment" multiple onChange={handleFile} style={{ display: 'none' }} />
      </div>
    </div>
  );
}

function SignatureField({ value, onChange }) {
  const canvasRef = useRef();
  const drawing = useRef(false);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return [src.clientX - rect.left, src.clientY - rect.top];
  };

  const start = (e) => {
    e.preventDefault();
    drawing.current = true;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const [x, y] = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    const [x, y] = getPos(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stop = (e) => {
    e.preventDefault();
    drawing.current = false;
    onChange(canvasRef.current.toDataURL());
  };

  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    onChange('');
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#e65100', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Signature client
        </label>
        <button onClick={clear} style={{ fontSize: 12, color: '#888', background: 'none', border: 'none' }}>Effacer</button>
      </div>
      <canvas
        ref={canvasRef}
        width={340}
        height={120}
        style={{ border: '2px solid #e0e0e0', borderRadius: 10, background: '#fafafa', touchAction: 'none', width: '100%', height: 120 }}
        onMouseDown={start} onMouseMove={draw} onMouseUp={stop} onMouseLeave={stop}
        onTouchStart={start} onTouchMove={draw} onTouchEnd={stop}
      />
      {value && <div style={{ fontSize: 11, color: '#2e7d32', marginTop: 4 }}>✓ Signature enregistrée</div>}
    </div>
  );
}

export default function InterventionForm({ interventionId, onBack, onSaved }) {
  const interventions = loadInterventions();
  const clients = loadClients();
  const existing = interventionId ? interventions.find(i => i.id === interventionId) : null;

  const [form, setForm] = useState(existing || {
    clientNom: '',
    clientContact: '',
    clientEmail: '',
    lieu: '',
    dateIntervention: new Date().toISOString().slice(0, 16),
    machine: '',
    marque: '',
    modele: '',
    numeroSerie: '',
    panneSignalee: '',
    diagnostic: '',
    travauxEffectues: '',
    pieces: [],
    heureDebut: '',
    heureFin: '',
    status: 'en_cours',
    photosAvant: [],
    photosApres: [],
    nomSignataire: '',
    signature: '',
    notes: '',
  });

  const [pieceInput, setPieceInput] = useState({ designation: '', quantite: 1, reference: '' });

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const addPiece = () => {
    if (!pieceInput.designation) return;
    set('pieces', [...(form.pieces || []), { ...pieceInput, id: generateId() }]);
    setPieceInput({ designation: '', quantite: 1, reference: '' });
  };

  const removePiece = (id) => set('pieces', form.pieces.filter(p => p.id !== id));

  const save = () => {
    try {
      const list = loadInterventions();
      if (existing) {
        const idx = list.findIndex(i => i.id === existing.id);
        list[idx] = { ...form, id: existing.id, numero: existing.numero, updatedAt: new Date().toISOString() };
      } else {
        list.unshift({
          ...form,
          id: generateId(),
          numero: generateNumero(list),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      saveInterventions(list);

      // Auto-enregistrement du client dans la base
      if (form.clientNom?.trim()) {
        const clientList = loadClients();
        const nomLower = form.clientNom.trim().toLowerCase();
        const exists = clientList.some(c => c.nom?.toLowerCase() === nomLower);
        if (!exists) {
          saveClients([...clientList, {
            id: generateId(),
            nom: form.clientNom.trim(),
            contact: form.clientContact || '',
            email: form.clientEmail || '',
            adresse: form.lieu || '',
            createdAt: new Date().toISOString(),
          }]);
        } else {
          saveClients(clientList.map(c =>
            c.nom?.toLowerCase() === nomLower
              ? { ...c, contact: form.clientContact || c.contact, email: form.clientEmail || c.email }
              : c
          ));
        }
      }

      onSaved();
    } catch (e) {
      console.error('Erreur save:', e);
      alert(`Erreur lors de la sauvegarde : ${e.message}`);
    }
  };

  const clientSuggestions = clients.filter(c =>
    form.clientNom && c.nom?.toLowerCase().includes(form.clientNom.toLowerCase())
  );

  return (
    <div style={{ paddingBottom: 100 }}>
      <Header
        title={existing ? `Modifier ${existing.numero}` : 'Nouvelle intervention'}
        onBack={onBack}
      />

      <div style={{ padding: 16 }}>
        {/* Statut */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
          {STATUTS.map(s => (
            <button key={s.value} onClick={() => set('status', s.value)} style={{
              padding: '8px 14px',
              borderRadius: 20,
              border: 'none',
              background: form.status === s.value ? '#e65100' : '#fff',
              color: form.status === s.value ? '#fff' : '#555',
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
            }}>{s.label}</button>
          ))}
        </div>

        {/* Client */}
        <Section title="🏢 Client">
          <Field label="Nom de l'entreprise *">
            <input value={form.clientNom} onChange={e => set('clientNom', e.target.value)} style={inputStyle} placeholder="Ex: SARL Dupont BTP" />
            {clientSuggestions.length > 0 && (
              <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, marginTop: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                {clientSuggestions.map(c => (
                  <div key={c.id} onClick={() => {
                    setForm(f => ({
                      ...f,
                      clientNom: c.nom,
                      clientContact: c.contact || f.clientContact,
                      clientEmail: c.email || f.clientEmail,
                      clientTelephone: c.telephone || f.clientTelephone,
                      lieu: c.adresse || f.lieu,
                    }));
                  }} style={{ padding: '10px 12px', cursor: 'pointer', fontSize: 14, borderBottom: '1px solid #f5f5f5' }}>
                    <div style={{ fontWeight: 600 }}>{c.nom}</div>
                    {(c.contact || c.telephone) && (
                      <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                        {[c.contact, c.telephone].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Field>
          <Field label="Contact / Responsable">
            <input value={form.clientContact} onChange={e => set('clientContact', e.target.value)} style={inputStyle} placeholder="Nom du responsable" />
          </Field>
          <Field label="Email">
            <input value={form.clientEmail} onChange={e => set('clientEmail', e.target.value)} style={inputStyle} placeholder="email@entreprise.fr" type="email" />
          </Field>
          <Field label="Lieu d'intervention">
            <input value={form.lieu} onChange={e => set('lieu', e.target.value)} style={inputStyle} placeholder="Chantier, adresse..." />
          </Field>
          <Field label="Date et heure">
            <input value={form.dateIntervention} onChange={e => set('dateIntervention', e.target.value)} style={inputStyle} type="datetime-local" />
          </Field>
        </Section>

        {/* Machine */}
        <Section title="🔩 Machine">
          <Field label="Type de machine *">
            <input value={form.machine} onChange={e => set('machine', e.target.value)} style={inputStyle} placeholder="Ex: Pelleteuse, Compresseur, Grue..." />
          </Field>
          <Field label="Marque">
            <input value={form.marque} onChange={e => set('marque', e.target.value)} style={inputStyle} placeholder="Ex: Caterpillar, Atlas Copco..." />
          </Field>
          <Field label="Modèle">
            <input value={form.modele} onChange={e => set('modele', e.target.value)} style={inputStyle} placeholder="Ex: 320D, XAS 185..." />
          </Field>
          <Field label="N° de série">
            <input value={form.numeroSerie} onChange={e => set('numeroSerie', e.target.value)} style={inputStyle} placeholder="Numéro de série" />
          </Field>
        </Section>

        {/* Photos Avant */}
        <Section title="📷 Photos — État initial">
          <PhotoSection
            label="Photos avant intervention"
            photos={form.photosAvant || []}
            onAdd={p => set('photosAvant', [...(form.photosAvant || []), p])}
            onRemove={idx => set('photosAvant', form.photosAvant.filter((_, i) => i !== idx))}
          />
        </Section>

        {/* Panne & Diagnostic */}
        <Section title="🛠 Panne & Diagnostic">
          <Field label="Panne signalée par le client">
            <textarea value={form.panneSignalee} onChange={e => set('panneSignalee', e.target.value)}
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              placeholder="Décrire la panne telle que signalée..." />
          </Field>
          <Field label="Diagnostic technicien">
            <textarea value={form.diagnostic} onChange={e => set('diagnostic', e.target.value)}
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              placeholder="Cause identifiée..." />
          </Field>
          <Field label="Travaux effectués">
            <textarea value={form.travauxEffectues} onChange={e => set('travauxEffectues', e.target.value)}
              style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
              placeholder="Détail des opérations réalisées..." />
          </Field>
        </Section>

        {/* Pièces */}
        <Section title="🔧 Pièces utilisées">
          {(form.pieces || []).map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{p.designation}</div>
                <div style={{ fontSize: 12, color: '#888' }}>Qté: {p.quantite}{p.reference ? ` — Réf: ${p.reference}` : ''}</div>
              </div>
              <button onClick={() => removePiece(p.id)} style={{ background: '#ffebee', border: 'none', color: '#c62828', borderRadius: 6, padding: '4px 8px', fontSize: 12 }}>Suppr.</button>
            </div>
          ))}
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input value={pieceInput.designation} onChange={e => setPieceInput(p => ({ ...p, designation: e.target.value }))}
              style={inputStyle} placeholder="Désignation de la pièce" />
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={pieceInput.reference} onChange={e => setPieceInput(p => ({ ...p, reference: e.target.value }))}
                style={{ ...inputStyle, flex: 2 }} placeholder="Référence (optionnel)" />
              <input value={pieceInput.quantite} onChange={e => setPieceInput(p => ({ ...p, quantite: e.target.value }))}
                style={{ ...inputStyle, flex: 1 }} placeholder="Qté" type="number" min="1" />
            </div>
            <button onClick={addPiece} style={{
              background: '#e65100', color: '#fff', border: 'none',
              borderRadius: 10, padding: '10px', fontWeight: 700, fontSize: 14
            }}>+ Ajouter la pièce</button>
          </div>
        </Section>

        {/* Heures */}
        <Section title="⏱ Temps d'intervention">
          <div style={{ display: 'flex', gap: 10 }}>
            <Field label="Heure début">
              <input value={form.heureDebut} onChange={e => set('heureDebut', e.target.value)} style={inputStyle} type="time" />
            </Field>
            <Field label="Heure fin">
              <input value={form.heureFin} onChange={e => set('heureFin', e.target.value)} style={inputStyle} type="time" />
            </Field>
          </div>
          {form.heureDebut && form.heureFin && (() => {
            const [h1, m1] = form.heureDebut.split(':').map(Number);
            const [h2, m2] = form.heureFin.split(':').map(Number);
            const mins = (h2 * 60 + m2) - (h1 * 60 + m1);
            if (mins > 0) return (
              <div style={{ fontSize: 13, color: '#2e7d32', fontWeight: 600 }}>
                ✓ Durée : {Math.floor(mins / 60)}h{mins % 60 > 0 ? `${mins % 60}min` : ''}
              </div>
            );
          })()}
        </Section>

        {/* Photos Après */}
        <Section title="📷 Photos — Après intervention">
          <PhotoSection
            label="Photos après intervention"
            photos={form.photosApres || []}
            onAdd={p => set('photosApres', [...(form.photosApres || []), p])}
            onRemove={idx => set('photosApres', form.photosApres.filter((_, i) => i !== idx))}
          />
        </Section>

        {/* Notes */}
        <Section title="📝 Notes internes">
          <Field label="Observations (non affichées sur PDF)">
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }}
              placeholder="Notes privées, rappels..." />
          </Field>
        </Section>

        {/* Signature */}
        <Section title="✍ Validation client">
          <Field label="Nom du signataire">
            <input
              value={form.nomSignataire}
              onChange={e => set('nomSignataire', e.target.value)}
              style={inputStyle}
              placeholder="Prénom et nom de la personne qui signe"
            />
          </Field>
          <SignatureField value={form.signature} onChange={v => set('signature', v)} />
        </Section>

        {/* Bouton sauvegarder */}
        <button onClick={save} style={{
          width: '100%',
          padding: '16px',
          background: 'linear-gradient(135deg, #e65100, #bf360c)',
          color: '#fff',
          border: 'none',
          borderRadius: 14,
          fontSize: 16,
          fontWeight: 800,
          boxShadow: '0 4px 16px rgba(230,81,0,0.3)'
        }}>
          {existing ? '✓ Enregistrer les modifications' : '✓ Créer la fiche d\'intervention'}
        </button>
      </div>
    </div>
  );
}

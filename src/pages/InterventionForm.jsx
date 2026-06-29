import React, { useState, useRef } from 'react';
import Header from '../components/Header';
import { loadInterventions, loadClients, saveIntervention, saveClient, generateId, generateNumero } from '../store';

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
        style={{ border: '2px solid #e0e0e0', borderRadius: 10, background: '#ffffff', touchAction: 'none', width: '100%', height: 120, colorScheme: 'light' }}
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
    id: generateId(),
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
    nomIntervenant: '',
    nomSignataire: '',
    signature: '',
    notes: '',
  });

  const [saving, setSaving] = useState(false);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const finalForm = existing
        ? { ...form, updatedAt: new Date().toISOString() }
        : {
            ...form,
            numero: generateNumero(loadInterventions()),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

      await saveIntervention(finalForm);

      // Auto-enregistrement du client dans la base
      if (finalForm.clientNom?.trim()) {
        const clientList = loadClients();
        const nomLower = finalForm.clientNom.trim().toLowerCase();
        const existingClient = clientList.find(c => c.nom?.toLowerCase() === nomLower);
        if (!existingClient) {
          await saveClient({
            id: generateId(),
            nom: finalForm.clientNom.trim(),
            contact: finalForm.clientContact || '',
            email: finalForm.clientEmail || '',
            adresse: finalForm.lieu || '',
            createdAt: new Date().toISOString(),
          });
        } else if (finalForm.clientContact || finalForm.clientEmail) {
          await saveClient({
            ...existingClient,
            contact: finalForm.clientContact || existingClient.contact,
            email: finalForm.clientEmail || existingClient.email,
          });
        }
      }

      onSaved();
    } catch (e) {
      console.error('Erreur save:', e);
      alert(`Erreur lors de la sauvegarde : ${e.message}`);
    } finally {
      setSaving(false);
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

        {/* Panne & Diagnostic */}
        <Section title="🛠 Panne & Diagnostic">
          <Field label="Panne signalée par le client">
            <textarea value={form.panneSignalee} onChange={e => set('panneSignalee', e.target.value)}
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              placeholder="Décrire la panne telle que signalée..." />
          </Field>
          <Field label="Travaux effectués">
            <textarea value={form.travauxEffectues} onChange={e => set('travauxEffectues', e.target.value)}
              style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
              placeholder="Détail des opérations réalisées..." />
          </Field>
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

        {/* Signature */}
        <Section title="✍ Validation client">
          <Field label="Nom de l'intervenant">
            <input
              value={form.nomIntervenant}
              onChange={e => set('nomIntervenant', e.target.value)}
              style={inputStyle}
              placeholder="Prénom et nom du technicien"
            />
          </Field>
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
        <button onClick={save} disabled={saving} style={{
          width: '100%',
          padding: '16px',
          background: saving ? '#ccc' : '#e65100',
          color: '#fff',
          border: 'none',
          borderRadius: 14,
          fontSize: 16,
          fontWeight: 800,
          boxShadow: '0 4px 16px rgba(230,81,0,0.3)'
        }}>
          {saving ? '⏳ Enregistrement...' : (existing ? '✓ Enregistrer les modifications' : '✓ Créer la fiche d\'intervention')}
        </button>
      </div>
    </div>
  );
}

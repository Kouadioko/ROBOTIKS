import React, { useState } from 'react';
import Header from '../components/Header';
import DateField from '../components/DateField';
import { loadLocation, loadLocations, saveLocation, generateId, generateNumeroLocation } from '../store';
import { versISO } from '../utils/dates';

const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: '1px solid #e0e0e0', fontSize: 14, background: '#fafafa',
};

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{
        display: 'block', fontSize: 12, fontWeight: 700, color: '#e65100',
        marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5,
      }}>{label}</label>
      {children}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 14, paddingBottom: 8, borderBottom: '2px solid #f0f0f0' }}>{title}</div>
      {children}
    </div>
  );
}

export default function LocationForm({ locationId, onBack, onSaved }) {
  const existante = locationId ? loadLocation(locationId) : null;
  const [form, setForm] = useState(() => existante || {
    id: generateId(),
    clientNom: '', clientContact: '', chantier: '',
    machine: '', operateurNom: '', avecOperateurDefaut: true,
    dateDebut: versISO(new Date()),
    status: 'en_cours',
    jours: [], signatures: [], notes: '',
  });
  const [enCours, setEnCours] = useState(false);

  const set = (champ, valeur) => setForm(f => ({ ...f, [champ]: valeur }));

  const enregistrer = async () => {
    setEnCours(true);
    try {
      const fiche = { ...form };
      if (!existante) {
        fiche.numero = generateNumeroLocation(loadLocations());
        fiche.createdAt = new Date().toISOString();
      }
      await saveLocation(fiche);
      onSaved(fiche.id);
    } catch (e) {
      alert(`Erreur lors de la sauvegarde : ${e.message}`);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div style={{ paddingBottom: 100 }}>
      <Header title={existante ? `Modifier ${existante.numero}` : 'Nouvelle location'} onBack={onBack} />

      <div style={{ padding: 16 }}>
        <Section title="Client & chantier">
          <Field label="Client">
            <input value={form.clientNom} onChange={e => set('clientNom', e.target.value)}
              placeholder="Nom du client" style={inputStyle} />
          </Field>
          <Field label="Contact">
            <input value={form.clientContact} onChange={e => set('clientContact', e.target.value)}
              placeholder="Téléphone du client" style={inputStyle} />
          </Field>
          <Field label="Chantier / lieu">
            <input value={form.chantier} onChange={e => set('chantier', e.target.value)}
              placeholder="Adresse du chantier" style={inputStyle} />
          </Field>
        </Section>

        <Section title="Machine & opérateur">
          <Field label="Machine">
            <input value={form.machine} onChange={e => set('machine', e.target.value)}
              placeholder="Marque, modèle, n° de parc" style={inputStyle} />
          </Field>
          <Field label="Opérateur">
            <input value={form.operateurNom} onChange={e => set('operateurNom', e.target.value)}
              placeholder="Nom du conducteur" style={inputStyle} />
          </Field>
          <Field label="Par défaut, la journée est…">
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { v: true, l: '👷 Avec opérateur', c: '#2e7d32' },
                { v: false, l: '🔧 Sans opérateur', c: '#1565c0' },
              ].map(o => {
                const actif = !!form.avecOperateurDefaut === o.v;
                return (
                  <button key={String(o.v)} type="button" onClick={() => set('avecOperateurDefaut', o.v)} style={{
                    flex: 1, padding: '10px 6px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                    border: `1.5px solid ${actif ? o.c : '#e0e0e0'}`,
                    background: actif ? o.c : '#fff',
                    color: actif ? '#fff' : '#666',
                  }}>{o.l}</button>
                );
              })}
            </div>
          </Field>
          <DateField label="Date de début" value={form.dateDebut} onChange={v => set('dateDebut', v)} />
        </Section>

        <Section title="Notes">
          <textarea value={form.notes} rows={3} onChange={e => set('notes', e.target.value)}
            placeholder="Conditions, tarif convenu…" style={{ ...inputStyle, resize: 'vertical' }} />
        </Section>

        <button onClick={enregistrer} disabled={enCours} style={{
          width: '100%', padding: 14, border: 'none', borderRadius: 12,
          fontSize: 15, fontWeight: 800, color: '#fff',
          background: enCours ? '#ccc' : '#e65100',
        }}>
          {enCours ? 'Enregistrement...' : '💾 Enregistrer la fiche'}
        </button>
      </div>
    </div>
  );
}

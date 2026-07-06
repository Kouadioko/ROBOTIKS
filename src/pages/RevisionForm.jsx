import React, { useState } from 'react';
import Header from '../components/Header';
import { loadRevisions, loadClients, saveRevision, generateId, generateNumeroRevision } from '../store';
import { SECTIONS, TOOLS, STATUS_OPTS, buildChecklist } from '../utils/revisionConfig';

const inputStyle = {
  width: '100%', padding: '10px 12px',
  borderRadius: 10, border: '1px solid #e0e0e0',
  fontSize: 14, background: '#fafafa',
};

function Label({ children }) {
  return (
    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#e65100', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 }}>
      {children}
    </label>
  );
}

function CheckItem({ label, value, onSet }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 0', borderBottom: '1px solid #f5f5f5' }}>
      <div style={{ flex: 1, fontSize: 13, color: '#333', lineHeight: 1.35 }}>{label}</div>
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        {STATUS_OPTS.map(opt => {
          const active = value === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onSet(active ? '' : opt.key)}
              style={{
                width: 36, height: 36, borderRadius: 8,
                border: active ? 'none' : '1.5px solid #e0e0e0',
                background: active ? opt.bg : '#fafafa',
                color: active ? opt.color : '#ccc',
                fontSize: 15, fontWeight: 700, cursor: 'pointer',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SectionBlock({ section, data, onSetItem, onSetNotes }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a2e', marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #f0f0f0' }}>
        {section.emoji} {section.title}
      </div>
      {section.items.map(item => (
        <CheckItem
          key={item}
          label={item}
          value={data?.items?.[item] || ''}
          onSet={(v) => onSetItem(section.id, item, v)}
        />
      ))}
      <textarea
        placeholder="Notes / observations sur cette section..."
        value={data?.notes || ''}
        onChange={e => onSetNotes(section.id, e.target.value)}
        style={{ ...inputStyle, minHeight: 44, resize: 'vertical', marginTop: 10 }}
      />
    </div>
  );
}

export default function RevisionForm({ revisionId, onBack, onSaved }) {
  const clients = loadClients();
  const existing = revisionId ? loadRevisions().find(r => r.id === revisionId) : null;

  const [form, setForm] = useState(existing || {
    id: generateId(),
    clientNom: '',
    clientContact: '',
    lieu: '',
    marque: '',
    modele: '',
    numeroSerie: '',
    dateRevision: new Date().toISOString().slice(0, 10),
    activeTools: [],
    checklist: buildChecklist(),
    nomIntervenant: '',
    observations: '',
  });
  const [saving, setSaving] = useState(false);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const setCheckItem = (sectionId, itemLabel, status) =>
    setForm(f => ({
      ...f,
      checklist: {
        ...f.checklist,
        [sectionId]: {
          ...f.checklist[sectionId],
          items: { ...f.checklist[sectionId].items, [itemLabel]: status },
        },
      },
    }));

  const setNotes = (sectionId, notes) =>
    setForm(f => ({
      ...f,
      checklist: {
        ...f.checklist,
        [sectionId]: { ...f.checklist[sectionId], notes },
      },
    }));

  const toggleTool = (toolId) =>
    setForm(f => ({
      ...f,
      activeTools: f.activeTools.includes(toolId)
        ? f.activeTools.filter(t => t !== toolId)
        : [...f.activeTools, toolId],
    }));

  const clientSuggestions = clients.filter(c =>
    form.clientNom && c.nom?.toLowerCase().includes(form.clientNom.toLowerCase())
  );

  const save = async () => {
    setSaving(true);
    try {
      const revisions = loadRevisions();
      const finalForm = existing
        ? { ...form, updatedAt: new Date().toISOString() }
        : { ...form, numero: generateNumeroRevision(revisions), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      await saveRevision(finalForm);
      onSaved();
    } catch (e) {
      alert(`Erreur lors de la sauvegarde : ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ paddingBottom: 100 }}>
      <Header
        title={existing ? `Modifier ${existing.numero}` : 'Nouvelle révision'}
        onBack={onBack}
      />
      <div style={{ padding: 16 }}>

        {/* Client & Machine */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a2e', marginBottom: 14, paddingBottom: 8, borderBottom: '2px solid #f0f0f0' }}>
            🏢 Client & Machine
          </div>

          <div style={{ marginBottom: 10 }}>
            <Label>Client *</Label>
            <input value={form.clientNom} onChange={e => set('clientNom', e.target.value)} style={inputStyle} placeholder="Nom du client" />
            {clientSuggestions.length > 0 && (
              <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, marginTop: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                {clientSuggestions.map(c => (
                  <div key={c.id}
                    onClick={() => setForm(f => ({ ...f, clientNom: c.nom, clientContact: c.contact || f.clientContact, lieu: c.adresse || f.lieu }))}
                    style={{ padding: '10px 12px', cursor: 'pointer', fontSize: 14, borderBottom: '1px solid #f5f5f5', fontWeight: 600 }}>
                    {c.nom}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 10 }}>
            <Label>Contact</Label>
            <input value={form.clientContact} onChange={e => set('clientContact', e.target.value)} style={inputStyle} placeholder="Responsable" />
          </div>

          <div style={{ marginBottom: 10 }}>
            <Label>Lieu</Label>
            <input value={form.lieu} onChange={e => set('lieu', e.target.value)} style={inputStyle} placeholder="Chantier, adresse..." />
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <Label>Marque</Label>
              <input value={form.marque} onChange={e => set('marque', e.target.value)} style={inputStyle} placeholder="Caterpillar..." />
            </div>
            <div style={{ flex: 1 }}>
              <Label>Modèle</Label>
              <input value={form.modele} onChange={e => set('modele', e.target.value)} style={inputStyle} placeholder="320D..." />
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <Label>N° de série</Label>
            <input value={form.numeroSerie} onChange={e => set('numeroSerie', e.target.value)} style={inputStyle} placeholder="Numéro de série" />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <Label>Date de révision</Label>
              <input type="date" value={form.dateRevision} onChange={e => set('dateRevision', e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <Label>Intervenant</Label>
              <input value={form.nomIntervenant} onChange={e => set('nomIntervenant', e.target.value)} style={inputStyle} placeholder="Technicien" />
            </div>
          </div>
        </div>

        {/* Légende */}
        <div style={{ background: '#fff', borderRadius: 10, padding: '10px 14px', marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', marginBottom: 8 }}>Légende</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {STATUS_OPTS.map(opt => (
              <div key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 30, height: 30, borderRadius: 7, background: opt.bg, color: opt.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>
                  {opt.label}
                </div>
                <span style={{ fontSize: 11, color: '#555' }}>{opt.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sections fixes */}
        {SECTIONS.map(section => (
          <SectionBlock
            key={section.id}
            section={section}
            data={form.checklist[section.id]}
            onSetItem={setCheckItem}
            onSetNotes={setNotes}
          />
        ))}

        {/* Sélection des outils */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a2e', marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #f0f0f0' }}>
            🔧 Outils présents sur la machine
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {TOOLS.map(tool => {
              const active = form.activeTools.includes(tool.id);
              return (
                <button key={tool.id} type="button" onClick={() => toggleTool(tool.id)} style={{
                  padding: '8px 16px', borderRadius: 20, border: 'none',
                  background: active ? '#e65100' : '#f0f0f0',
                  color: active ? '#fff' : '#555',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>
                  {tool.emoji} {tool.title}
                </button>
              );
            })}
          </div>
          {form.activeTools.length === 0 && (
            <div style={{ fontSize: 12, color: '#aaa', marginTop: 8 }}>
              Appuie sur un outil pour l'ajouter à la checklist
            </div>
          )}
        </div>

        {/* Checklists des outils actifs */}
        {TOOLS.filter(t => form.activeTools.includes(t.id)).map(tool => (
          <SectionBlock
            key={tool.id}
            section={tool}
            data={form.checklist[tool.id]}
            onSetItem={setCheckItem}
            onSetNotes={setNotes}
          />
        ))}

        {/* Observations générales */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a2e', marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #f0f0f0' }}>
            📝 Observations générales
          </div>
          <textarea
            value={form.observations}
            onChange={e => set('observations', e.target.value)}
            placeholder="Recommandations, travaux à prévoir..."
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
          />
        </div>

        <button onClick={save} disabled={saving} style={{
          width: '100%', padding: '16px',
          background: saving ? '#ccc' : '#e65100',
          color: '#fff', border: 'none', borderRadius: 14,
          fontSize: 16, fontWeight: 800,
          boxShadow: '0 4px 16px rgba(230,81,0,0.3)',
        }}>
          {saving ? '⏳ Enregistrement...' : existing ? '✓ Enregistrer les modifications' : '✓ Sauvegarder la révision'}
        </button>
      </div>
    </div>
  );
}

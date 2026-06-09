import React, { useState, useRef } from 'react';
import Header from '../components/Header';
import { loadSettings, saveSettings } from '../store';

const inputStyle = { width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid #e0e0e0', fontSize: 14, background: '#fafafa' };

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#e65100', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</label>
      {children}
    </div>
  );
}

export default function Settings({ onBack }) {
  const [settings, setSettings] = useState(() => ({
    societe: 'ROBOTIKS',
    siret: '',
    telephone: '',
    email: '',
    adresse: '',
    logo: '',
    ...loadSettings()
  }));
  const [saved, setSaved] = useState(false);
  const logoInputRef = useRef();

  const set = (k, v) => setSettings(s => {
    const updated = { ...s, [k]: v };
    saveSettings(updated); // auto-sauvegarde à chaque frappe
    return updated;
  });

  const handleLogo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => set('logo', ev.target.result); // set() auto-sauvegarde
    reader.readAsDataURL(file);
  };

  const save = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <Header title="Paramètres" onBack={onBack} />
      <div style={{ padding: 16 }}>
        <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 14, paddingBottom: 8, borderBottom: '2px solid #f0f0f0' }}>
            🏢 Informations de la société
          </div>
          {/* Logo */}
          <Field label="Logo de la société">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              {settings.logo ? (
                <img src={settings.logo} alt="Logo" style={{ height: 60, maxWidth: 120, objectFit: 'contain', borderRadius: 8, border: '1px solid #e0e0e0', padding: 4, background: '#fff' }} />
              ) : (
                <div style={{ height: 60, width: 100, borderRadius: 8, border: '2px dashed #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: 12, textAlign: 'center' }}>
                  Pas de logo
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button onClick={() => logoInputRef.current.click()} style={{ padding: '8px 14px', background: '#e65100', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
                  📁 Choisir un logo
                </button>
                {settings.logo && (
                  <button onClick={() => set('logo', '')} style={{ padding: '6px 14px', background: '#ffebee', color: '#c62828', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
                    Supprimer
                  </button>
                )}
              </div>
            </div>
            <div style={{ fontSize: 11, color: '#aaa' }}>PNG ou JPG — apparaîtra en haut de chaque PDF</div>
            <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogo} style={{ display: 'none' }} />
          </Field>

          <Field label="Nom de la société">
            <input value={settings.societe} onChange={e => set('societe', e.target.value)} style={inputStyle} />
          </Field>
          <Field label="SIRET">
            <input value={settings.siret} onChange={e => set('siret', e.target.value)} style={inputStyle} placeholder="XXX XXX XXX XXXXX" />
          </Field>
          <Field label="Téléphone">
            <input value={settings.telephone} onChange={e => set('telephone', e.target.value)} style={inputStyle} type="tel" />
          </Field>
          <Field label="Email">
            <input value={settings.email} onChange={e => set('email', e.target.value)} style={inputStyle} type="email" />
          </Field>
          <Field label="Adresse">
            <textarea value={settings.adresse} onChange={e => set('adresse', e.target.value)}
              style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} placeholder="Adresse complète" />
          </Field>
        </div>

        <button onClick={save} style={{
          width: '100%',
          padding: 16,
          background: saved ? '#2e7d32' : 'linear-gradient(135deg, #e65100, #bf360c)',
          color: '#fff',
          border: 'none',
          borderRadius: 14,
          fontSize: 16,
          fontWeight: 800,
          transition: 'background 0.3s'
        }}>
          {saved ? '✓ Enregistré !' : 'Enregistrer'}
        </button>

        <div style={{ marginTop: 24, textAlign: 'center', color: '#aaa', fontSize: 12 }}>
          ROBOTIKS — Gestion des interventions v1.0
        </div>
      </div>
    </div>
  );
}

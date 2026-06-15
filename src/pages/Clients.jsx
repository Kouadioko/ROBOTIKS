import React, { useState } from 'react';
import Header from '../components/Header';
import { loadClients, saveClient, deleteClient, generateId } from '../store';

export default function Clients({ onBack }) {
  const [clients, setClients] = useState(loadClients());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nom: '', contact: '', email: '', telephone: '', adresse: '', siret: '' });

  const save = async () => {
    if (!form.nom) return;
    const newClient = { ...form, id: generateId(), createdAt: new Date().toISOString() };
    await saveClient(newClient);
    setClients([...clients, newClient]);
    setForm({ nom: '', contact: '', email: '', telephone: '', adresse: '', siret: '' });
    setShowForm(false);
  };

  const remove = async (id) => {
    if (!window.confirm('Supprimer ce client ?')) return;
    await deleteClient(id);
    setClients(clients.filter(c => c.id !== id));
  };

  const inputStyle = { width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid #e0e0e0', fontSize: 14, background: '#fafafa', marginBottom: 10 };

  return (
    <div>
      <Header
        title="Mes clients"
        onBack={onBack}
        action={
          <button onClick={() => setShowForm(v => !v)} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
            padding: '6px 12px', borderRadius: 8, fontSize: 22, fontWeight: 700
          }}>+</button>
        }
      />

      <div style={{ padding: 16 }}>
        {showForm && (
          <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Nouveau client</div>
            <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} style={inputStyle} placeholder="Nom de l'entreprise *" />
            <input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} style={inputStyle} placeholder="Contact / Responsable" />
            <input value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} style={inputStyle} placeholder="Téléphone" type="tel" />
            <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} placeholder="Email" type="email" />
            <input value={form.adresse} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))} style={inputStyle} placeholder="Adresse" />
            <input value={form.siret} onChange={e => setForm(f => ({ ...f, siret: e.target.value }))} style={inputStyle} placeholder="SIRET client" />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={save} style={{ flex: 2, padding: 12, background: '#e65100', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700 }}>Enregistrer</button>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: 12, background: '#f5f5f5', color: '#555', border: 'none', borderRadius: 10, fontWeight: 700 }}>Annuler</button>
            </div>
          </div>
        )}

        {clients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#aaa' }}>
            <div style={{ fontSize: 48 }}>🏢</div>
            <div style={{ marginTop: 12 }}>Aucun client enregistré</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {clients.map(c => (
              <div key={c.id} style={{ background: '#fff', borderRadius: 12, padding: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{c.nom}</div>
                  {c.contact && <div style={{ fontSize: 13, color: '#666' }}>👤 {c.contact}</div>}
                  {c.telephone && <div style={{ fontSize: 13, color: '#666' }}>📞 {c.telephone}</div>}
                  {c.email && <div style={{ fontSize: 13, color: '#666' }}>✉️ {c.email}</div>}
                  {c.adresse && <div style={{ fontSize: 12, color: '#aaa' }}>📍 {c.adresse}</div>}
                </div>
                <button onClick={() => remove(c.id)} style={{ background: '#ffebee', border: 'none', color: '#c62828', borderRadius: 8, padding: '6px 10px', fontSize: 16 }}>🗑</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

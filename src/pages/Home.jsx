import React, { useState } from 'react';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import { loadInterventions } from '../store';

export default function Home({ onNew, onOpen, onClients, onSettings }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const interventions = loadInterventions();

  const filtered = interventions
    .filter(i => {
      const matchSearch = !search ||
        i.clientNom?.toLowerCase().includes(search.toLowerCase()) ||
        i.machine?.toLowerCase().includes(search.toLowerCase()) ||
        i.numero?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'all' || i.status === filterStatus;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const stats = {
    total: interventions.length,
    en_cours: interventions.filter(i => i.status === 'en_cours').length,
    terminee: interventions.filter(i => i.status === 'terminee').length,
    attente: interventions.filter(i => i.status === 'attente_pieces').length,
  };

  return (
    <div>
      <Header
        title="Mes Interventions"
        action={
          <button onClick={onSettings} style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: '#fff',
            width: 36, height: 36,
            borderRadius: 8,
            fontSize: 18
          }}>⚙</button>
        }
      />

      <div style={{ padding: 16 }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Total', value: stats.total, color: '#1565c0' },
            { label: 'En cours', value: stats.en_cours, color: '#e65100' },
            { label: 'Terminées', value: stats.terminee, color: '#2e7d32' },
          ].map(s => (
            <div key={s.label} style={{
              background: '#fff',
              borderRadius: 12,
              padding: '12px 8px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#888' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Rechercher client, machine, N°..."
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 12,
            border: '1px solid #e0e0e0',
            fontSize: 14,
            marginBottom: 10,
            background: '#fff'
          }}
        />

        {/* Filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {[
            { key: 'all', label: 'Tout' },
            { key: 'en_cours', label: 'En cours' },
            { key: 'attente_pieces', label: 'Attente pièces' },
            { key: 'terminee', label: 'Terminées' },
            { key: 'devis', label: 'Devis' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilterStatus(f.key)} style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: 'none',
              background: filterStatus === f.key ? '#e65100' : '#fff',
              color: filterStatus === f.key ? '#fff' : '#555',
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
            }}>{f.label}</button>
          ))}
        </div>

        {/* Nav rapide */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <button onClick={onClients} style={{
            flex: 1,
            padding: '10px',
            background: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            color: '#1565c0'
          }}>🏢 Mes clients</button>
        </div>

        {/* Liste */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#aaa' }}>
            <div style={{ fontSize: 48 }}>🔧</div>
            <div style={{ marginTop: 12, fontSize: 15 }}>Aucune intervention</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Appuie sur + pour en créer une</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(i => (
              <div key={i.id} onClick={() => onOpen(i.id)} style={{
                background: '#fff',
                borderRadius: 12,
                padding: 14,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                cursor: 'pointer',
                borderLeft: '4px solid #e65100'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{i.clientNom || 'Client non renseigné'}</div>
                  <StatusBadge status={i.status} />
                </div>
                <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>
                  🔩 {i.machine || 'Machine non renseignée'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 12, color: '#aaa' }}>{i.numero}</div>
                  <div style={{ fontSize: 12, color: '#aaa' }}>
                    {i.dateIntervention ? new Date(i.dateIntervention).toLocaleDateString('fr-FR') : ''}
                  </div>
                </div>
                {i.lieu && (
                  <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>📍 {i.lieu}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={onNew} style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 60,
        height: 60,
        borderRadius: 30,
        background: '#e65100',
        color: '#fff',
        border: 'none',
        fontSize: 32,
        boxShadow: '0 4px 16px rgba(230,81,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50
      }}>+</button>
    </div>
  );
}

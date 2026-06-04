import React from 'react';

const STATUS = {
  'en_cours': { label: 'En cours', color: '#1565c0', bg: '#e3f2fd' },
  'terminee': { label: 'Terminée', color: '#2e7d32', bg: '#e8f5e9' },
  'attente_pieces': { label: 'Attente pièces', color: '#f57f17', bg: '#fff8e1' },
  'devis': { label: 'Devis', color: '#6a1b9a', bg: '#f3e5f5' },
};

export default function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS['en_cours'];
  return (
    <span style={{
      background: s.bg,
      color: s.color,
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 600,
    }}>{s.label}</span>
  );
}

export { STATUS };

import React from 'react';

export default function Header({ title, onBack, action }) {
  return (
    <header style={{
      background: 'linear-gradient(135deg, #e65100, #bf360c)',
      color: '#fff',
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
    }}>
      {onBack && (
        <button onClick={onBack} style={{
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          color: '#fff',
          width: 36,
          height: 36,
          borderRadius: 8,
          fontSize: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>←</button>
      )}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, opacity: 0.8, letterSpacing: 1, textTransform: 'uppercase' }}>ROBOTIKS</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
      </div>
      {action}
    </header>
  );
}

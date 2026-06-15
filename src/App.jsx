import React, { useState, useEffect, useRef } from 'react';
import Home from './pages/Home';
import InterventionForm from './pages/InterventionForm';
import InterventionDetail from './pages/InterventionDetail';
import Clients from './pages/Clients';
import Settings from './pages/Settings';
import { onAuthChange, loginWithEmail, logout, fbListen } from './firebase';
import { applyRemoteData, compressStoredPhotos } from './store';

// ─── Écran de connexion ───────────────────────────────

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onLogin(email, password);
    } catch {
      setError('Email ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #e65100, #bf360c)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
    }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 380, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🔧</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#e65100' }}>ROBOTIKS</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Gestion des interventions</div>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#e65100', marginBottom: 4, textTransform: 'uppercase' }}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              required autoComplete="email"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e0e0e0', fontSize: 15 }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#e65100', marginBottom: 4, textTransform: 'uppercase' }}>Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                required autoComplete="current-password"
                style={{ width: '100%', padding: '12px 44px 12px 14px', borderRadius: 10, border: '1.5px solid #e0e0e0', fontSize: 15 }}
              />
              <button type="button" onClick={() => setShowPassword(s => !s)} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#888'
              }}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          {error && <div style={{ color: '#c62828', fontSize: 13, marginBottom: 14, textAlign: 'center' }}>{error}</div>}
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: 14,
            background: loading ? '#ccc' : 'linear-gradient(135deg, #e65100, #bf360c)',
            color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 800
          }}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Application principale ───────────────────────────

export default function App() {
  const [authUser, setAuthUser] = useState(undefined); // undefined = en cours de vérification
  const [screen, setScreen] = useState('home');
  const [selectedId, setSelectedId] = useState(null);
  const [syncStatus, setSyncStatus] = useState(''); // '' | 'sync' | 'ok' | 'err'
  const hasCompressedPhotos = useRef(false);

  // Surveiller l'état de connexion Firebase
  useEffect(() => {
    return onAuthChange(user => setAuthUser(user));
  }, []);

  // Écouter les changements Firebase en temps réel une fois connecté
  useEffect(() => {
    if (!authUser) return;
    setSyncStatus('sync');
    const unsub = fbListen((data) => {
      applyRemoteData(data);
      setSyncStatus('ok');
      // Forcer le re-rendu des pages qui lisent localStorage
      window.dispatchEvent(new Event('robotiks-sync'));
    });
    return unsub;
  }, [authUser]);

  // Une fois les données synchronisées, compresser les anciennes photos
  // trop volumineuses pour libérer de la place dans le stockage local.
  useEffect(() => {
    if (syncStatus === 'ok' && !hasCompressedPhotos.current) {
      hasCompressedPhotos.current = true;
      compressStoredPhotos()
        .then(changed => { if (changed) window.dispatchEvent(new Event('robotiks-sync')); })
        .catch(() => {});
    }
  }, [syncStatus]);

  // Chargement initial
  if (authUser === undefined) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e65100' }}>
        <div style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>Chargement...</div>
      </div>
    );
  }

  // Non connecté → écran login
  if (!authUser) {
    return <LoginScreen onLogin={loginWithEmail} />;
  }

  // Indicateur de sync en haut
  const SyncDot = () => (
    <div style={{ position: 'fixed', top: 10, right: 12, zIndex: 9999 }}>
      {syncStatus === 'sync' && <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff9800' }} title="Synchronisation..." />}
      {syncStatus === 'ok' && <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#4caf50' }} title="Synchronisé" />}
      {syncStatus === 'err' && <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f44336' }} title="Erreur sync" />}
    </div>
  );

  if (screen === 'form') return (
    <>
      <SyncDot />
      <InterventionForm
        interventionId={selectedId}
        onBack={() => setScreen(selectedId ? 'detail' : 'home')}
        onSaved={() => setScreen(selectedId ? 'detail' : 'home')}
      />
    </>
  );

  if (screen === 'detail') return (
    <>
      <SyncDot />
      <InterventionDetail
        interventionId={selectedId}
        onBack={() => setScreen('home')}
        onEdit={() => setScreen('form')}
        onDeleted={() => setScreen('home')}
      />
    </>
  );

  if (screen === 'clients') return (
    <>
      <SyncDot />
      <Clients onBack={() => setScreen('home')} />
    </>
  );

  if (screen === 'settings') return (
    <>
      <SyncDot />
      <Settings onBack={() => setScreen('home')} onLogout={logout} />
    </>
  );

  return (
    <>
      <SyncDot />
      <Home
        onNew={() => { setSelectedId(null); setScreen('form'); }}
        onOpen={(id) => { setSelectedId(id); setScreen('detail'); }}
        onClients={() => setScreen('clients')}
        onSettings={() => setScreen('settings')}
      />
    </>
  );
}

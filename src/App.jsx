import React, { useState, useEffect, useRef } from 'react';
import Home from './pages/Home';
import InterventionForm from './pages/InterventionForm';
import InterventionDetail from './pages/InterventionDetail';
import Clients from './pages/Clients';
import Settings from './pages/Settings';
import Revisions from './pages/Revisions';
import RevisionForm from './pages/RevisionForm';
import RevisionDetail from './pages/RevisionDetail';
import Locations from './pages/Locations';
import LocationForm from './pages/LocationForm';
import LocationDetail from './pages/LocationDetail';
import LocationSign from './pages/LocationSign';
import Operateurs from './pages/Operateurs';
import OperateurApp from './pages/OperateurApp';
import { onAuthChange, loginWithEmail, logout, fbListenInterventions, fbListenClients, fbListenSettings, fbListenRevisions, fbListenLocations, fbListenOperateurs } from './firebase';
import { applyRemoteInterventions, applyRemoteClients, applyRemoteSettings, applyRemoteRevisions, applyRemoteLocations, applyRemoteOperateurs, estOperateur, syncPending } from './store';

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
      minHeight: '100vh', background: '#e65100',
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
            background: loading ? '#ccc' : '#e65100',
            color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 800
          }}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Indicateur de synchronisation ────────────────────
// Défini hors du composant : recréé à chaque rendu, il perdrait son état.

const POINTS = {
  sync: { couleur: '#ff9800', titre: 'Synchronisation...' },
  ok: { couleur: '#4caf50', titre: 'Synchronisé' },
  err: { couleur: '#f44336', titre: 'Erreur sync' },
};

function SyncDot({ statut }) {
  const point = POINTS[statut];
  return (
    <div style={{ position: 'fixed', top: 10, right: 12, zIndex: 9999 }}>
      {point && (
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: point.couleur }} title={point.titre} />
      )}
    </div>
  );
}

// ─── Application principale ───────────────────────────

export default function App() {
  const [authUser, setAuthUser] = useState(undefined); // undefined = en cours de vérification
  const [screen, setScreen] = useState('home');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedRevisionId, setSelectedRevisionId] = useState(null);
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [syncStatus, setSyncStatus] = useState(''); // '' | 'sync' | 'ok' | 'err'
  const [, forceRefresh] = useState(0);
  const hasSyncedOnce = useRef(false);

  // La liste des opérateurs arrive après le premier rendu : il faut redessiner
  // pour basculer sur l'écran opérateur dès qu'on sait qui est connecté.
  useEffect(() => {
    const maj = () => forceRefresh(v => v + 1);
    window.addEventListener('robotiks-sync', maj);
    return () => window.removeEventListener('robotiks-sync', maj);
  }, []);

  // Surveiller l'état de connexion Firebase
  useEffect(() => {
    return onAuthChange(user => setAuthUser(user));
  }, []);

  // Écouter les changements Firebase en temps réel une fois connecté
  useEffect(() => {
    if (!authUser) return;
    setSyncStatus('sync');
    const sync = () => window.dispatchEvent(new Event('robotiks-sync'));
    const unsubInter = fbListenInterventions((list) => {
      applyRemoteInterventions(list);
      setSyncStatus('ok');
      sync();
    });
    const unsubClients = fbListenClients((list) => {
      applyRemoteClients(list);
      sync();
    });
    const unsubSettings = fbListenSettings((settings) => {
      applyRemoteSettings(settings);
      sync();
    });
    const unsubRevisions = fbListenRevisions((list) => {
      applyRemoteRevisions(list);
      sync();
    });
    const unsubLocations = fbListenLocations((list) => {
      applyRemoteLocations(list);
      sync();
    });
    const unsubOperateurs = fbListenOperateurs((list) => {
      applyRemoteOperateurs(list);
      sync();
    });
    return () => { unsubInter(); unsubClients(); unsubSettings(); unsubRevisions(); unsubLocations(); unsubOperateurs(); };
  }, [authUser]);

  // Une fois les données synchronisées : réessayer l'envoi des fiches
  // restées en attente (créées/modifiées hors-ligne).
  useEffect(() => {
    if (syncStatus === 'ok' && !hasSyncedOnce.current) {
      hasSyncedOnce.current = true;
      syncPending()
        .then(changed => { if (changed) window.dispatchEvent(new Event('robotiks-sync')); })
        .catch(() => {});
    }
  }, [syncStatus]);

  // Réessayer l'envoi des fiches en attente quand la connexion revient
  useEffect(() => {
    const onOnline = () => {
      syncPending()
        .then(changed => { if (changed) window.dispatchEvent(new Event('robotiks-sync')); })
        .catch(() => {});
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);

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

  // Un opérateur ne voit que le pointage des locations.
  if (estOperateur(authUser)) {
    return (
      <OperateurApp
        user={authUser}
        screen={screen}
        setScreen={setScreen}
        locationId={selectedLocationId}
        setLocationId={setSelectedLocationId}
        onLogout={logout}
      />
    );
  }

  if (screen === 'form') return (
    <>
      <SyncDot statut={syncStatus} />
      <InterventionForm
        interventionId={selectedId}
        onBack={() => setScreen(selectedId ? 'detail' : 'home')}
        onSaved={() => setScreen(selectedId ? 'detail' : 'home')}
      />
    </>
  );

  if (screen === 'detail') return (
    <>
      <SyncDot statut={syncStatus} />
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
      <SyncDot statut={syncStatus} />
      <Clients onBack={() => setScreen('home')} />
    </>
  );

  if (screen === 'revisions') return (
    <>
      <SyncDot statut={syncStatus} />
      <Revisions
        onBack={() => setScreen('home')}
        onNew={() => { setSelectedRevisionId(null); setScreen('revision-form'); }}
        onOpen={(id) => { setSelectedRevisionId(id); setScreen('revision-detail'); }}
      />
    </>
  );

  if (screen === 'revision-form') return (
    <>
      <SyncDot statut={syncStatus} />
      <RevisionForm
        revisionId={selectedRevisionId}
        onBack={() => setScreen(selectedRevisionId ? 'revision-detail' : 'revisions')}
        onSaved={() => setScreen(selectedRevisionId ? 'revision-detail' : 'revisions')}
      />
    </>
  );

  if (screen === 'revision-detail') return (
    <>
      <SyncDot statut={syncStatus} />
      <RevisionDetail
        revisionId={selectedRevisionId}
        onBack={() => setScreen('revisions')}
        onEdit={() => setScreen('revision-form')}
        onDeleted={() => setScreen('revisions')}
      />
    </>
  );

  if (screen === 'locations') return (
    <>
      <SyncDot statut={syncStatus} />
      <Locations
        onBack={() => setScreen('home')}
        onNew={() => { setSelectedLocationId(null); setScreen('location-form'); }}
        onOpen={(id) => { setSelectedLocationId(id); setScreen('location-detail'); }}
        onOperateurs={() => setScreen('location-ops')}
      />
    </>
  );

  if (screen === 'location-form') return (
    <>
      <SyncDot statut={syncStatus} />
      <LocationForm
        locationId={selectedLocationId}
        onBack={() => setScreen(selectedLocationId ? 'location-detail' : 'locations')}
        onSaved={(id) => { setSelectedLocationId(id); setScreen('location-detail'); }}
      />
    </>
  );

  if (screen === 'location-detail') return (
    <>
      <SyncDot statut={syncStatus} />
      <LocationDetail
        locationId={selectedLocationId}
        onBack={() => setScreen('locations')}
        onEdit={() => setScreen('location-form')}
        onSign={() => setScreen('location-sign')}
        onDeleted={() => setScreen('locations')}
      />
    </>
  );

  if (screen === 'location-sign') return (
    <>
      <SyncDot statut={syncStatus} />
      <LocationSign
        locationId={selectedLocationId}
        onBack={() => setScreen('location-detail')}
        onSaved={() => setScreen('location-detail')}
      />
    </>
  );

  if (screen === 'location-ops') return (
    <>
      <SyncDot statut={syncStatus} />
      <Operateurs onBack={() => setScreen('locations')} />
    </>
  );

  if (screen === 'settings') return (
    <>
      <SyncDot statut={syncStatus} />
      <Settings onBack={() => setScreen('home')} onLogout={logout} />
    </>
  );

  return (
    <>
      <SyncDot statut={syncStatus} />
      <Home
        onNew={() => { setSelectedId(null); setScreen('form'); }}
        onOpen={(id) => { setSelectedId(id); setScreen('detail'); }}
        onClients={() => setScreen('clients')}
        onSettings={() => setScreen('settings')}
        onRevisions={() => setScreen('revisions')}
        onLocations={() => setScreen('locations')}
      />
    </>
  );
}

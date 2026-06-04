import React, { useState } from 'react';
import Home from './pages/Home';
import InterventionForm from './pages/InterventionForm';
import InterventionDetail from './pages/InterventionDetail';
import Clients from './pages/Clients';
import Settings from './pages/Settings';

export default function App() {
  const [screen, setScreen] = useState('home');
  const [selectedId, setSelectedId] = useState(null);

  if (screen === 'form') return (
    <InterventionForm
      interventionId={selectedId}
      onBack={() => { setScreen(selectedId ? 'detail' : 'home'); }}
      onSaved={() => { setScreen(selectedId ? 'detail' : 'home'); }}
    />
  );

  if (screen === 'detail') return (
    <InterventionDetail
      interventionId={selectedId}
      onBack={() => setScreen('home')}
      onEdit={() => setScreen('form')}
      onDeleted={() => setScreen('home')}
    />
  );

  if (screen === 'clients') return (
    <Clients onBack={() => setScreen('home')} />
  );

  if (screen === 'settings') return (
    <Settings onBack={() => setScreen('home')} />
  );

  return (
    <Home
      onNew={() => { setSelectedId(null); setScreen('form'); }}
      onOpen={(id) => { setSelectedId(id); setScreen('detail'); }}
      onClients={() => setScreen('clients')}
      onSettings={() => setScreen('settings')}
    />
  );
}

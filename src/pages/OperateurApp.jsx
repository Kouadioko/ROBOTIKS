import React from 'react';
import Header from '../components/Header';
import Locations from './Locations';
import LocationDetail from './LocationDetail';
import LocationSign from './LocationSign';
import { operateurEstActif } from '../store';

/** Écran affiché quand l'accès a été révoqué (fin de chantier). */
function AccesTermine({ onLogout }) {
  return (
    <div>
      <Header title="Accès terminé" />
      <div style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 14 }}>🚫</div>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Ton accès a été clôturé</div>
        <div style={{ fontSize: 13, color: '#888', lineHeight: 1.6 }}>
          Le chantier est terminé. Contacte ton responsable si tu penses qu'il s'agit d'une erreur.
        </div>
        <button onClick={onLogout} style={{
          width: '100%', marginTop: 20, padding: 14, border: 'none', borderRadius: 12,
          fontSize: 15, fontWeight: 800, color: '#fff', background: '#c62828',
        }}>Se déconnecter</button>
      </div>
    </div>
  );
}

/**
 * L'appli réduite qui s'ouvre sur le téléphone de l'opérateur : il ne voit que
 * les locations. Il peut pointer les jours et faire signer le client, mais ni
 * créer, ni modifier, ni clôturer, ni supprimer une fiche.
 *
 * Ce cloisonnement est doublé côté serveur par les règles Firestore : même en
 * bricolant l'appli, ce compte ne peut pas lire les interventions.
 */
export default function OperateurApp({ user, screen, setScreen, locationId, setLocationId, onLogout }) {
  if (!operateurEstActif(user)) return <AccesTermine onLogout={onLogout} />;

  if (screen === 'location-detail' && locationId) {
    return (
      <LocationDetail
        locationId={locationId}
        operateur
        onBack={() => setScreen('locations')}
        onSign={() => setScreen('location-sign')}
        onEdit={() => {}}
        onDeleted={() => setScreen('locations')}
      />
    );
  }

  if (screen === 'location-sign' && locationId) {
    return (
      <LocationSign
        locationId={locationId}
        onBack={() => setScreen('location-detail')}
        onSaved={() => setScreen('location-detail')}
      />
    );
  }

  return (
    <div>
      <Locations
        operateur
        onOpen={(id) => { setLocationId(id); setScreen('location-detail'); }}
      />
      <button onClick={onLogout} style={{
        position: 'fixed', bottom: 20, left: 20,
        background: '#fff', border: '1px solid #e0e0e0', color: '#c62828',
        padding: '10px 16px', borderRadius: 12, fontSize: 13, fontWeight: 700,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)', zIndex: 60,
      }}>Se déconnecter</button>
    </div>
  );
}

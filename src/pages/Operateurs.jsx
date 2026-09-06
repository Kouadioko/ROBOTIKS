import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { loadOperateurs } from '../store';
import { propositionMotDePasse } from '../utils/locations';
import {
  fbAutoriserOperateur, fbActiverOperateur,
  creerCompteOperateur, verifierAcces, changerMotDePasse,
  envoyerLienReinitialisation, messageAuth,
} from '../firebase';

const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: '1px solid #e0e0e0', fontSize: 14, background: '#fafafa',
};

function Card({ title, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 14, paddingBottom: 8, borderBottom: '2px solid #f0f0f0' }}>{title}</div>
      {children}
    </div>
  );
}

function Message({ contenu }) {
  if (!contenu) return null;
  return (
    <div style={{
      fontSize: 12, fontWeight: 600, padding: 10, borderRadius: 10,
      marginBottom: 10, lineHeight: 1.5,
      background: contenu.ko ? '#ffebee' : '#e8f5e9',
      color: contenu.ko ? '#c62828' : '#2e7d32',
    }}>{contenu.texte}</div>
  );
}

// ─── Une ligne de la liste, avec son panneau mot de passe ───

function LigneOperateur({ op }) {
  const actif = op.actif !== false;
  const [ouvert, setOuvert] = useState(false);
  const [ancien, setAncien] = useState('');
  const [nouveau, setNouveau] = useState(propositionMotDePasse);
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState(null);

  const tester = async () => {
    if (!ancien) { setMessage({ ko: true, texte: 'Entre le mot de passe à tester.' }); return; }
    setOccupe(true); setMessage(null);
    try {
      await verifierAcces(op.email, ancien);
      setMessage({ ko: false, texte: '✅ Ce mot de passe fonctionne : il peut se connecter avec.' });
    } catch (e) {
      setMessage({ ko: true, texte: `❌ ${messageAuth(e.message)}` });
    }
    setOccupe(false);
  };

  const changer = async () => {
    if (!ancien) { setMessage({ ko: true, texte: 'Entre le mot de passe actuel.' }); return; }
    if (nouveau.length < 6) { setMessage({ ko: true, texte: 'Nouveau mot de passe : 6 caractères minimum.' }); return; }
    setOccupe(true); setMessage(null);
    try {
      await changerMotDePasse(op.email, ancien, nouveau);
      setMessage({ ko: false, texte: `Mot de passe changé. Donne-lui : ${nouveau}` });
      setAncien('');
    } catch (e) {
      setMessage({ ko: true, texte: messageAuth(e.message) });
    }
    setOccupe(false);
  };

  const reinitialiser = async () => {
    if (!window.confirm(`Envoyer un lien de réinitialisation à ${op.email} ?\n\nÀ n'utiliser que si tu ne connais plus le mot de passe actuel : c'est l'opérateur qui devra ouvrir le lien dans sa boîte mail.`)) return;
    setOccupe(true); setMessage(null);
    try {
      await envoyerLienReinitialisation(op.email);
      setMessage({ ko: false, texte: `Lien envoyé à ${op.email}. Il doit ouvrir sa boîte mail pour choisir un nouveau mot de passe.` });
    } catch (e) {
      setMessage({ ko: true, texte: messageAuth(e.message) });
    }
    setOccupe(false);
  };

  const petitBouton = (texte, fond, couleur, action) => (
    <button type="button" onClick={action} style={{
      background: fond, border: 'none', color: couleur, padding: '7px 12px',
      borderRadius: 9, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
    }}>{texte}</button>
  );

  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: actif ? 1 : 0.55 }}>
        <span style={{ fontSize: 18 }}>{actif ? '👷' : '🚫'}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, wordBreak: 'break-all' }}>{op.email}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: actif ? '#2e7d32' : '#c62828' }}>
            {actif ? 'Accès actif' : 'Accès révoqué'}
          </div>
        </div>
        {petitBouton('🔑', ouvert ? '#e65100' : '#f0f0f0', ouvert ? '#fff' : '#555',
          () => { setOuvert(!ouvert); setMessage(null); })}
        {petitBouton(actif ? 'Révoquer' : 'Réactiver',
          actif ? '#ffebee' : '#e8f5e9', actif ? '#c62828' : '#2e7d32',
          () => {
            if (actif && !window.confirm(`Révoquer l'accès de ${op.email} ?\n\nIl pourra encore se connecter, mais ne verra plus aucune location.`)) return;
            fbActiverOperateur(op.email, !actif);
          })}
      </div>

      {ouvert && (
        <div style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: 10, padding: 12, marginTop: 10 }}>
          <div style={{
            fontSize: 12, fontWeight: 800, color: '#e65100', marginBottom: 10,
            textTransform: 'uppercase', letterSpacing: 0.5,
          }}>Changer son mot de passe</div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input value={ancien} type="text" autoComplete="off" placeholder="Mot de passe actuel"
              onChange={e => setAncien(e.target.value)}
              style={{ ...inputStyle, flex: 1, background: '#fff' }} />
            <button type="button" onClick={tester} disabled={occupe} title="Tester ce mot de passe sans rien changer" style={{
              padding: '0 14px', background: '#fff', border: '1px solid #e0e0e0',
              borderRadius: 10, fontSize: 12, fontWeight: 700, color: '#1565c0', whiteSpace: 'nowrap',
            }}>Tester</button>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input value={nouveau} type="text" autoComplete="off" placeholder="Nouveau mot de passe"
              onChange={e => setNouveau(e.target.value)}
              style={{ ...inputStyle, flex: 1, background: '#fff', fontFamily: 'monospace', letterSpacing: 1 }} />
            <button type="button" onClick={() => setNouveau(propositionMotDePasse())} title="En proposer un autre" style={{
              padding: '0 14px', background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10, fontSize: 16,
            }}>🎲</button>
          </div>

          <Message contenu={message} />

          <button type="button" onClick={changer} disabled={occupe} style={{
            width: '100%', padding: 14, border: 'none', borderRadius: 12,
            fontSize: 15, fontWeight: 800, color: '#fff',
            background: occupe ? '#ccc' : '#e65100',
          }}>{occupe ? 'Patiente...' : '🔑 Changer le mot de passe'}</button>

          <button type="button" onClick={reinitialiser} disabled={occupe} style={{
            width: '100%', marginTop: 8, padding: 10, background: 'none', border: 'none',
            color: '#1565c0', fontSize: 12, fontWeight: 600, textDecoration: 'underline',
          }}>Je ne connais plus l'ancien — lui envoyer un lien par e-mail</button>
        </div>
      )}
    </div>
  );
}

// ─── L'écran ────────────────────────────────────────

export default function Operateurs({ onBack }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const maj = () => setTick(v => v + 1);
    window.addEventListener('robotiks-sync', maj);
    return () => window.removeEventListener('robotiks-sync', maj);
  }, []);

  const [mail, setMail] = useState('');
  const [motDePasse, setMotDePasse] = useState(propositionMotDePasse);
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState(null);
  const liste = loadOperateurs();

  const creer = async () => {
    const m = mail.trim().toLowerCase();
    if (!m || m.indexOf('@') < 1) { setMessage({ ko: true, texte: 'Entre une adresse e-mail valide.' }); return; }
    if (motDePasse.length < 6) { setMessage({ ko: true, texte: 'Mot de passe : 6 caractères minimum.' }); return; }
    setOccupe(true); setMessage(null);

    // L'AUTORISATION D'ABORD, le compte ensuite. Dans l'autre sens, un refus
    // d'écriture laisse un compte de connexion orphelin dans Firebase.
    try {
      await fbAutoriserOperateur(m);
    } catch (e) {
      const detail = String(e.message || e);
      setMessage({
        ko: true,
        texte: detail.includes('ermission')
          ? "Écriture refusée par les règles de sécurité Firestore : la collection « operateurs » n'y est pas autorisée. Aucun compte n'a été créé."
          : `Autorisation impossible : ${detail}`,
      });
      setOccupe(false);
      return;
    }

    let creeMaintenant = false;
    try {
      await creerCompteOperateur(m, motDePasse);
      creeMaintenant = true;
    } catch (e) {
      if (!String(e.message).startsWith('EMAIL_EXISTS')) {
        setMessage({ ko: true, texte: `Autorisation posée, mais le compte de connexion n'a pas pu être créé : ${messageAuth(e.message)}` });
        setOccupe(false);
        return;
      }
    }

    // On ne se contente pas de dire « c'est créé » : on essaie vraiment de se
    // connecter avec l'identifiant, et on ne l'annonce que si ça marche.
    try {
      await verifierAcces(m, motDePasse);
      setMessage({ ko: false, texte: `✅ Accès créé ET vérifié. Donne-lui : ${m} / ${motDePasse}` });
      setMail(''); setMotDePasse(propositionMotDePasse());
    } catch (e) {
      setMessage({
        ko: true,
        texte: creeMaintenant
          ? `Le compte a été créé mais la connexion de test échoue : ${messageAuth(e.message)}`
          : `Ce compte existait déjà et garde SON mot de passe : « ${motDePasse} » ne fonctionne pas pour lui. Ouvre le 🔑 de sa ligne pour le changer.`,
      });
    }
    setOccupe(false);
  };

  return (
    <div style={{ paddingBottom: 40 }}>
      <Header title="Accès opérateurs" onBack={onBack} />

      <div style={{ padding: 16 }}>
        <div style={{
          background: '#fff3e0', border: '1px solid #ffe0b2', borderRadius: 12,
          padding: 12, fontSize: 12, color: '#7a4a00', marginBottom: 14, lineHeight: 1.5,
        }}>
          Un accès créé ici n'ouvre QUE le pointage des locations : ni interventions, ni clients,
          ni révisions, ni réglages. Il ne peut pas non plus créer ni modifier une fiche —
          seulement cocher les jours et faire signer.
        </div>

        <Card title="Créer un accès opérateur">
          <div style={{ marginBottom: 14 }}>
            <label style={{
              display: 'block', fontSize: 12, fontWeight: 700, color: '#e65100',
              marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5,
            }}>Son e-mail</label>
            <input value={mail} type="email" autoComplete="off"
              onChange={e => setMail(e.target.value)}
              placeholder="operateur@exemple.com" style={inputStyle} />
          </div>

          <div style={{ marginBottom: 6 }}>
            <label style={{
              display: 'block', fontSize: 12, fontWeight: 700, color: '#e65100',
              marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5,
            }}>Son mot de passe</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={motDePasse} autoComplete="off"
                onChange={e => setMotDePasse(e.target.value)}
                style={{ ...inputStyle, flex: 1, fontFamily: 'monospace', letterSpacing: 1 }} />
              <button type="button" onClick={() => setMotDePasse(propositionMotDePasse())} title="En proposer un autre" style={{
                padding: '0 14px', background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10, fontSize: 16,
              }}>🎲</button>
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 10 }}>
            Tu choisis ce que tu veux (6 caractères minimum). Note-le : il ne sera plus affiché
            après. Tu pourras le changer plus tard avec le bouton 🔑 de sa ligne.
          </div>

          <Message contenu={message} />

          <button type="button" onClick={creer} disabled={occupe} style={{
            width: '100%', padding: 14, border: 'none', borderRadius: 12,
            fontSize: 15, fontWeight: 800, color: '#fff',
            background: occupe ? '#ccc' : '#e65100',
          }}>{occupe ? 'Création...' : "👷 Créer l'accès"}</button>
        </Card>

        <Card title={`Accès existants (${liste.length})`}>
          {liste.length === 0
            ? <div style={{ color: '#aaa', fontSize: 13 }}>Aucun accès opérateur pour le moment</div>
            : liste.map(op => <LigneOperateur key={op.email} op={op} />)}
        </Card>

        <div style={{ fontSize: 11, color: '#999', lineHeight: 1.6, padding: '0 4px' }}>
          Pourquoi « révoquer » et pas « supprimer » ? Parce que les règles de sécurité
          reconnaissent un opérateur à sa présence dans cette liste. Effacer la ligne le ferait
          passer pour un compte patron. La ligne révoquée reste donc, inoffensive : il n'a plus
          accès à rien. Pour effacer complètement le compte, passe par la console Firebase
          (Authentication).
        </div>
      </div>
    </div>
  );
}

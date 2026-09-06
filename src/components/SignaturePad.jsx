import React, { useRef, useEffect, useState } from 'react';

/**
 * Zone de signature au doigt.
 *
 * Trois points sur lesquels une implémentation naïve échoue sur téléphone,
 * et que ce composant corrige :
 *
 * 1. L'image interne du canvas doit être calée sur sa taille réelle à
 *    l'écran, multipliée par la densité de pixels de l'appareil. Un canvas
 *    dont le `width` est figé (340 par exemple) mais qui s'affiche sur 315 px
 *    dessine le trait décalé par rapport au doigt, et flou.
 * 2. React enregistre les événements tactiles (`onTouchMove`) en mode passif :
 *    `preventDefault()` y est ignoré et le geste fait défiler la page au lieu
 *    de dessiner. Les « pointer events » n'ont pas ce problème et traitent
 *    doigt, stylet et souris de la même façon.
 * 3. `touchAction: 'none'` empêche le navigateur de récupérer le geste.
 */
export function SignaturePad({ valeur, hauteur = 200, consigne, onChange }) {
  const canvasRef = useRef(null);
  const traceEnCours = useRef(false);
  const [aDessine, setADessine] = useState(false);

  // Cale l'image interne sur la taille affichée.
  // Ne fait rien si c'est déjà bon : toucher à canvas.width efface le dessin.
  const caler = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = window.devicePixelRatio || 1;
    const l = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);
    if (canvas.width === l && canvas.height === h) return;
    canvas.width = l;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1a1a2e';
  };

  useEffect(() => {
    caler();

    // Si une signature existe déjà (fiche rouverte pour modification), on la
    // redessine pour qu'elle reste visible plutôt que de repartir d'un cadre vide.
    if (valeur) {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        try {
          canvas.getContext('2d').drawImage(img, 0, 0, rect.width, rect.height);
          setADessine(true);
        } catch { /* image illisible : on laisse le cadre vide */ }
      };
      img.src = valeur;
    }

    window.addEventListener('resize', caler);
    window.addEventListener('orientationchange', caler);
    return () => {
      window.removeEventListener('resize', caler);
      window.removeEventListener('orientationchange', caler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const position = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  };

  const debut = (e) => {
    caler();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const [x, y] = position(e);
    try { canvas.setPointerCapture(e.pointerId); } catch { /* non supporté */ }
    traceEnCours.current = true;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.01, y);   // un simple appui laisse un point visible
    ctx.stroke();
  };

  const bouge = (e) => {
    if (!traceEnCours.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const [x, y] = position(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const fin = () => {
    if (!traceEnCours.current) return;
    traceEnCours.current = false;
    setADessine(true);
    onChange(canvasRef.current.toDataURL('image/png'));
  };

  const effacer = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    setADessine(false);
    onChange('');
  };

  return (
    <div>
      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          onPointerDown={debut}
          onPointerMove={bouge}
          onPointerUp={fin}
          onPointerCancel={fin}
          onPointerLeave={fin}
          style={{
            display: 'block', width: '100%', height: hauteur,
            border: '2px dashed #d0d0d0', borderRadius: 12, background: '#fff',
            touchAction: 'none', cursor: 'crosshair', colorScheme: 'light',
          }}
        />
        {!aDessine && (
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none', color: '#c8c8c8', fontSize: 15, fontWeight: 600,
          }}>
            {consigne || 'Signez ici avec le doigt'}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
        <div style={{ flex: 1, fontSize: 12, color: '#2e7d32', fontWeight: 700 }}>
          {aDessine ? '✓ Signature saisie' : ''}
        </div>
        <button type="button" onClick={effacer} style={{
          background: '#fff', border: '1px solid #e0e0e0', borderRadius: 9,
          padding: '7px 14px', fontSize: 12, fontWeight: 700, color: '#888',
        }}>Effacer</button>
      </div>
    </div>
  );
}

/** Signature en plein écran : bien plus confortable sur téléphone. */
function SignaturePleinEcran({ valeur, onValider, onFermer }) {
  const [image, setImage] = useState(valeur || '');
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: '#fff', zIndex: 9999,
      display: 'flex', flexDirection: 'column', padding: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 800 }}>Signature du client</div>
        <button type="button" onClick={onFermer} style={{
          background: '#f0f0f0', border: 'none', borderRadius: 9,
          padding: '8px 14px', fontSize: 13, fontWeight: 700, color: '#555',
        }}>Annuler</button>
      </div>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>
        Tourne le téléphone si tu veux plus de place. Signe dans le cadre, puis valide.
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <SignaturePad
          valeur={valeur}
          hauteur={Math.max(220, window.innerHeight - 260)}
          consigne="Signez ici"
          onChange={setImage}
        />
      </div>
      <button type="button" onClick={() => onValider(image)} style={{
        width: '100%', marginTop: 10, padding: 14, border: 'none', borderRadius: 12,
        fontSize: 15, fontWeight: 800, color: '#fff',
        background: image ? '#2e7d32' : '#ccc',
      }}>
        {image ? '✅ Valider la signature' : "Signe d'abord dans le cadre"}
      </button>
    </div>
  );
}

/** Le bloc complet : libellé, cadre, bouton plein écran. */
export default function SignatureField({ valeur, titre, hauteur, onChange }) {
  const [plein, setPlein] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{
        display: 'block', fontSize: 12, fontWeight: 700, color: '#e65100',
        marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5,
      }}>{titre || 'Signature client'}</label>

      <SignaturePad valeur={valeur} hauteur={hauteur || 200} onChange={onChange} />

      <button type="button" onClick={() => setPlein(true)} style={{
        width: '100%', marginTop: 6, padding: 11, background: '#fff',
        border: '1px solid #e0e0e0', borderRadius: 10,
        fontSize: 13, fontWeight: 700, color: '#1565c0',
      }}>⛶ Signer en plein écran</button>

      {plein && (
        <SignaturePleinEcran
          valeur={valeur}
          onFermer={() => setPlein(false)}
          onValider={(img) => { if (img) onChange(img); setPlein(false); }}
        />
      )}
    </div>
  );
}

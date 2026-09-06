import jsPDF from 'jspdf';
import { versFr } from './dates';

const ORANGE = [230, 81, 0];
const ENCRE = [26, 26, 46];
const GRIS = [100, 100, 100];
const TRAME = [240, 240, 240];

/**
 * Bon de pointage en PDF, dans la même charte que les fiches d'intervention.
 *
 * @param location  la fiche de location
 * @param signature un bon signé précis, ou null pour le récapitulatif complet
 * @param settings  les réglages société (nom, logo, coordonnées)
 * @param telechargementDirect  true pour enregistrer sans passer par le partage
 */
export async function generatePDFLocation(location, signature, settings = {}, telechargementDirect = false) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const couper = (texte, largeur) => {
    let t = String(texte ?? '');
    if (doc.getTextWidth(t) <= largeur) return t;
    while (t.length > 1 && doc.getTextWidth(`${t}…`) > largeur) t = t.slice(0, -1);
    return `${t}…`;
  };

  // ── Bandeau d'en-tête ──────────────────────────────
  doc.setFillColor(...ORANGE);
  doc.rect(0, 0, 210, 38, 'F');
  doc.setTextColor(255, 255, 255);

  const contact = [settings.telephone, settings.email, settings.adresse].filter(Boolean).join('  |  ');
  let logoPose = false;
  if (settings.logo) {
    try { doc.addImage(settings.logo, 15, 4, 30, 22, '', 'FAST'); logoPose = true; } catch { logoPose = false; }
  }
  if (logoPose) {
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    if (contact) doc.text(couper(contact, 81), 49, 14);
    if (settings.siret) doc.text(couper(`SIRET : ${settings.siret}`, 81), 49, 20);
  } else {
    doc.setFontSize(22); doc.setFont('helvetica', 'bold');
    doc.text(couper(settings.societe || 'ROBOTIKS', 115), 15, 16);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    if (contact) doc.text(couper(contact, 115), 15, 23);
    if (settings.siret) doc.text(couper(`SIRET : ${settings.siret}`, 115), 15, 29);
  }
  doc.setFontSize(11); doc.setFont('helvetica', 'bold');
  doc.text(location.numero || '', 195, 14, { align: 'right' });
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text('BON DE POINTAGE', 195, 20, { align: 'right' });
  doc.text('Location de machine', 195, 26, { align: 'right' });

  // ── Client / chantier / machine ────────────────────
  let y = 48;
  doc.setFontSize(9);
  [
    ['Client', location.clientNom || '—'],
    ['Chantier', location.chantier || '—'],
    ['Machine', location.machine || '—'],
    ['Opérateur', location.operateurNom || '—'],
  ].forEach(([label, valeur]) => {
    doc.setTextColor(...GRIS); doc.setFont('helvetica', 'normal');
    doc.text(label, 15, y);
    doc.setTextColor(...ENCRE); doc.setFont('helvetica', 'bold');
    doc.text(couper(valeur, 145), 45, y);
    y += 6;
  });

  // ── Quelles journées imprime-t-on ? ────────────────
  let jours = location.jours || [];
  if (signature) {
    const dedans = signature.dates || [];
    jours = jours.filter(j => dedans.includes(j.date));
  }
  jours = [...jours].sort((a, b) => (a.date < b.date ? -1 : 1));

  y += 4;
  doc.setTextColor(...ENCRE); doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
  doc.text(signature ? 'Journées validées' : 'Récapitulatif des journées', 15, y);
  y += 6;

  // ── Tableau ────────────────────────────────────────
  const COL_DATE = 15, COL_TYPE = 62, COL_OBS = 108, FIN = 195;
  const enteteTableau = () => {
    doc.setFillColor(...TRAME);
    doc.rect(15, y - 4.5, 180, 7, 'F');
    doc.setTextColor(...GRIS); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.text('DATE', COL_DATE + 1, y);
    doc.text('TYPE DE JOURNÉE', COL_TYPE, y);
    doc.text('OBSERVATIONS', COL_OBS, y);
    y += 7;
  };
  enteteTableau();

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  jours.forEach((j, n) => {
    if (y > 262) {
      doc.addPage(); y = 20; enteteTableau();
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    }
    if (n % 2 === 1) { doc.setFillColor(250, 250, 250); doc.rect(15, y - 4, 180, 6.5, 'F'); }
    doc.setTextColor(...ENCRE);
    doc.text(versFr(j.date), COL_DATE + 1, y);
    doc.setTextColor(...(j.op ? [46, 125, 50] : [21, 101, 192]));
    doc.setFont('helvetica', 'bold');
    doc.text(j.op ? 'Avec opérateur' : 'Sans opérateur', COL_TYPE, y);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRIS);
    if (j.obs) doc.text(couper(j.obs, FIN - COL_OBS), COL_OBS, y);
    y += 6.5;
  });

  // ── Totaux ─────────────────────────────────────────
  const avecOp = jours.filter(j => j.op).length;
  if (y > 240) { doc.addPage(); y = 25; }
  y += 4;
  doc.setFillColor(...TRAME);
  doc.roundedRect(15, y, 180, 16, 2, 2, 'F');
  doc.setTextColor(...ENCRE); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text(`TOTAL : ${jours.length} journée(s)`, 20, y + 10);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text(`dont ${avecOp} avec opérateur et ${jours.length - avecOp} sans opérateur`, 82, y + 10);
  y += 26;

  // ── Signature ──────────────────────────────────────
  if (signature) {
    if (y > 235) { doc.addPage(); y = 25; }
    doc.setTextColor(...GRIS); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text('Bon accepté par :', 15, y);
    doc.setTextColor(...ENCRE); doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.text(couper(signature.nom || 'Client', 90), 48, y);
    doc.setTextColor(...GRIS); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text(`le ${versFr(signature.date)}`, 150, y);
    y += 5;
    if (signature.image) {
      doc.setFontSize(8);
      doc.text('Signature :', 15, y + 3);
      try { doc.addImage(signature.image, 'PNG', 15, y + 5, 70, 25); } catch { /* image illisible */ }
      doc.setDrawColor(220, 220, 220);
      doc.rect(15, y + 5, 70, 25);
    }
  } else {
    doc.setTextColor(...GRIS); doc.setFontSize(8);
    doc.text('Document de suivi interne — non signé par le client.', 15, y);
  }

  // ── Pied de page sur chaque page ───────────────────
  const nb = doc.internal.getNumberOfPages();
  for (let p = 1; p <= nb; p++) {
    doc.setPage(p);
    doc.setFillColor(...ORANGE);
    doc.rect(0, 287, 210, 10, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    doc.text(`${settings.societe || 'ROBOTIKS'} — ${location.numero || ''}`, 15, 293);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 105, 293, { align: 'center' });
    doc.text(`Page ${p}/${nb}`, 195, 293, { align: 'right' });
  }

  // ── Partage ou téléchargement ──────────────────────
  const nomFichier = `${location.numero || 'pointage'}_${String(location.clientNom || 'client').replace(/\s+/g, '_')}`
    + (signature ? `_${versFr(signature.date).replace(/\//g, '-')}` : '') + '.pdf';

  try {
    const blob = doc.output('blob');
    const file = new File([blob], nomFichier, { type: 'application/pdf' });
    if (!telechargementDirect && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: `Bon de pointage ${location.numero || ''}`,
        text: `${location.clientNom || ''} — ${jours.length} journée(s)`,
        files: [file],
      });
      return;
    }
  } catch (e) {
    if (e?.name === 'AbortError') return;   // l'utilisateur a annulé : normal
  }

  try {
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomFichier;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch {
    doc.save(nomFichier);
  }
}

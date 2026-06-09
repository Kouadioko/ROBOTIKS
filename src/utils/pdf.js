import jsPDF from 'jspdf';

function formatDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(str) {
  if (!str) return '';
  return new Date(str).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const ORANGE = [230, 81, 0];
const DARK = [26, 26, 46];
const GRAY = [100, 100, 100];
const LIGHT_GRAY = [240, 240, 240];

export async function generatePDF(intervention, settings = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;
  const margin = 15;
  let y = 0;

  const addPage = () => {
    doc.addPage();
    y = 15;
  };

  const checkSpace = (needed) => {
    if (y + needed > 275) addPage();
  };

  // ─── HEADER ───────────────────────────────────────────
  doc.setFillColor(...ORANGE);
  doc.rect(0, 0, W, 38, 'F');

  doc.setTextColor(255, 255, 255);

  // Logo ou nom texte
  if (settings.logo) {
    try {
      doc.addImage(settings.logo, margin, 4, 30, 22, '', 'FAST');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const infos = [settings.telephone, settings.email, settings.adresse].filter(Boolean);
      if (infos.length) doc.text(infos.join('  |  '), margin + 34, 14);
      if (settings.siret) doc.text(`SIRET : ${settings.siret}`, margin + 34, 20);
    } catch {
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(settings.societe || 'ROBOTIKS', margin, 16);
    }
  } else {
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.societe || 'ROBOTIKS', margin, 16);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const infos = [settings.telephone, settings.email, settings.adresse].filter(Boolean);
    doc.text(infos.join('  |  '), margin, 23);
    if (settings.siret) doc.text(`SIRET : ${settings.siret}`, margin, 29);
  }

  // N° intervention en haut à droite
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(intervention.numero || '', W - margin, 14, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('FICHE D\'INTERVENTION', W - margin, 20, { align: 'right' });
  doc.text(formatDateTime(intervention.dateIntervention), W - margin, 26, { align: 'right' });

  y = 46;

  // Titre statut
  const statusLabels = { en_cours: 'EN COURS', terminee: 'TERMINÉE', attente_pieces: 'ATTENTE PIÈCES', devis: 'DEVIS' };
  const statusColors = { en_cours: [21, 101, 192], terminee: [46, 125, 50], attente_pieces: [245, 127, 23], devis: [106, 27, 154] };
  const sColor = statusColors[intervention.status] || ORANGE;
  doc.setFillColor(...sColor);
  doc.roundedRect(margin, y - 5, 50, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(statusLabels[intervention.status] || '', margin + 25, y, { align: 'center' });
  y += 10;

  // ─── Section helper ──────────────────────────────────
  const sectionTitle = (title) => {
    checkSpace(14);
    doc.setFillColor(...LIGHT_GRAY);
    doc.rect(margin, y, W - margin * 2, 7, 'F');
    doc.setTextColor(...ORANGE);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin + 2, y + 5);
    y += 10;
  };

  const field = (label, value, x = margin, width = W - margin * 2) => {
    if (!value) return;
    checkSpace(12);
    doc.setTextColor(...GRAY);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(label + ' :', x, y);
    doc.setTextColor(...DARK);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const lines = doc.splitTextToSize(String(value), width - 35);
    doc.text(lines, x + 35, y);
    y += lines.length * 5 + 2;
  };

  const multiField = (label, value) => {
    if (!value) return;
    checkSpace(16);
    doc.setTextColor(...GRAY);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(label + ' :', margin, y);
    y += 5;
    doc.setTextColor(...DARK);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(value, W - margin * 2);
    lines.forEach(line => {
      checkSpace(6);
      doc.text(line, margin + 4, y);
      y += 5;
    });
    y += 2;
  };

  // ─── CLIENT ──────────────────────────────────────────
  sectionTitle('CLIENT');
  field('Entreprise', intervention.clientNom);
  field('Contact', intervention.clientContact);
  field('Email', intervention.clientEmail);
  field('Lieu', intervention.lieu);
  y += 3;

  // ─── MACHINE ─────────────────────────────────────────
  sectionTitle('MACHINE');
  field('Type', intervention.machine);
  const marqueModel = [intervention.marque, intervention.modele].filter(Boolean).join(' ');
  field('Marque / Modèle', marqueModel);
  field('N° de série', intervention.numeroSerie);
  y += 3;

  // ─── PHOTOS AVANT ────────────────────────────────────
  if (intervention.photosAvant?.length > 0) {
    sectionTitle('PHOTOS — ÉTAT INITIAL');
    const photoW = 55;
    const photoH = 40;
    let px = margin;
    for (const photo of intervention.photosAvant) {
      checkSpace(photoH + 5);
      if (px + photoW > W - margin) { px = margin; y += photoH + 4; }
      try { doc.addImage(photo, 'JPEG', px, y, photoW, photoH); } catch (e) { /* skip */ }
      px += photoW + 4;
    }
    y += photoH + 8;
  }

  // ─── PANNE & TRAVAUX ─────────────────────────────────
  sectionTitle('PANNE & DIAGNOSTIC');
  multiField('Panne signalée', intervention.panneSignalee);
  multiField('Diagnostic', intervention.diagnostic);
  multiField('Travaux effectués', intervention.travauxEffectues);
  y += 3;

  // ─── PIÈCES ──────────────────────────────────────────
  if (intervention.pieces?.length > 0) {
    sectionTitle('PIÈCES UTILISÉES');
    // En-tête tableau
    doc.setFillColor(...DARK);
    doc.rect(margin, y, W - margin * 2, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Désignation', margin + 2, y + 4);
    doc.text('Référence', margin + 100, y + 4);
    doc.text('Qté', W - margin - 10, y + 4, { align: 'right' });
    y += 7;

    intervention.pieces.forEach((p, idx) => {
      checkSpace(7);
      if (idx % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, y - 1, W - margin * 2, 6, 'F');
      }
      doc.setTextColor(...DARK);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(p.designation || '', margin + 2, y + 4);
      doc.text(p.reference || '', margin + 100, y + 4);
      doc.setFont('helvetica', 'bold');
      doc.text(String(p.quantite || 1), W - margin - 10, y + 4, { align: 'right' });
      y += 6;
    });
    y += 5;
  }

  // ─── TEMPS ───────────────────────────────────────────
  if (intervention.heureDebut || intervention.heureFin) {
    sectionTitle('TEMPS D\'INTERVENTION');
    const dureeStr = (() => {
      if (!intervention.heureDebut || !intervention.heureFin) return '';
      const [h1, m1] = intervention.heureDebut.split(':').map(Number);
      const [h2, m2] = intervention.heureFin.split(':').map(Number);
      const mins = (h2 * 60 + m2) - (h1 * 60 + m1);
      if (mins <= 0) return '';
      return `${Math.floor(mins / 60)}h${mins % 60 > 0 ? `${mins % 60}min` : ''}`;
    })();

    const cols = [
      ['Heure de début', intervention.heureDebut],
      ['Heure de fin', intervention.heureFin],
      ['Durée totale', dureeStr],
    ].filter(c => c[1]);

    cols.forEach(([lbl, val]) => field(lbl, val));
    y += 3;
  }

  // ─── PHOTOS APRÈS ────────────────────────────────────
  if (intervention.photosApres?.length > 0) {
    sectionTitle('PHOTOS — APRÈS INTERVENTION');
    const photoW = 55;
    const photoH = 40;
    let px = margin;
    for (const photo of intervention.photosApres) {
      checkSpace(photoH + 5);
      if (px + photoW > W - margin) { px = margin; y += photoH + 4; }
      try { doc.addImage(photo, 'JPEG', px, y, photoW, photoH); } catch (e) { /* skip */ }
      px += photoW + 4;
    }
    y += photoH + 8;
  }

  // ─── SIGNATURE ───────────────────────────────────────
  if (intervention.signature) {
    checkSpace(50);
    sectionTitle('VALIDATION CLIENT');
    doc.setTextColor(...GRAY);
    doc.setFontSize(8);
    doc.text('Signature du client :', margin, y);
    try {
      doc.addImage(intervention.signature, 'PNG', margin, y + 3, 70, 25);
    } catch (e) { /* skip */ }
    y += 35;
  }

  // ─── PIED DE PAGE ────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(...ORANGE);
    doc.rect(0, 287, W, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`${settings.societe || 'ROBOTIKS'} — ${intervention.numero}`, margin, 293);
    doc.text(`Page ${i}/${pageCount}`, W - margin, 293, { align: 'right' });
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, W / 2, 293, { align: 'center' });
  }

  const filename = `${intervention.numero}_${(intervention.clientNom || 'client').replace(/\s+/g, '_')}.pdf`;

  // Sur mobile : ouvre le menu de partage natif (WhatsApp, Gmail, SMS…)
  // Sur PC : télécharge le fichier
  if (navigator.canShare) {
    const blob = doc.output('blob');
    const file = new File([blob], filename, { type: 'application/pdf' });
    if (navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: `Fiche intervention ${intervention.numero}`,
        text: `Intervention du ${formatDate(intervention.dateIntervention)} — ${intervention.clientNom || ''}`,
        files: [file],
      });
      return;
    }
  }
  doc.save(filename);
}

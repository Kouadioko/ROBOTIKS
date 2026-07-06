import jsPDF from 'jspdf';
import { SECTIONS, TOOLS, getRevisionCounts } from './revisionConfig';

function formatDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const ORANGE  = [230, 81, 0];
const DARK    = [26, 26, 46];
const GRAY    = [100, 100, 100];
const LIGHT   = [240, 240, 240];
const GREEN   = [46, 125, 50];
const RED     = [198, 40, 40];

const STATUS_PDF = {
  ok:     { text: 'OK',    color: GREEN },
  watch:  { text: 'SURV.', color: ORANGE },
  defaut: { text: 'DEF.', color: RED },
  na:     { text: 'N/A',  color: GRAY },
};

export async function generateRevisionPDF(revision, settings = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;
  const margin = 15;
  let y = 0;

  const addPage = () => { doc.addPage(); y = 15; };
  const checkSpace = (needed) => { if (y + needed > 275) addPage(); };

  // ─── EN-TÊTE (identique à l'intervention) ─────────────────
  doc.setFillColor(...ORANGE);
  doc.rect(0, 0, W, 38, 'F');
  doc.setTextColor(255, 255, 255);

  const fitText = (text, maxWidth) => {
    if (doc.getTextWidth(text) <= maxWidth) return text;
    let s = text;
    while (s.length > 1 && doc.getTextWidth(s + '…') > maxWidth) s = s.slice(0, -1);
    return s + '…';
  };
  const headerRightX = W - margin - 62;

  if (settings.logo) {
    try {
      doc.addImage(settings.logo, margin, 4, 30, 22, '', 'FAST');
      const infoX = margin + 34;
      const infoMaxW = headerRightX - infoX - 3;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const infos = [settings.telephone, settings.email, settings.adresse].filter(Boolean);
      if (infos.length) doc.text(fitText(infos.join('  |  '), infoMaxW), infoX, 14);
      if (settings.siret) doc.text(fitText(`SIRET : ${settings.siret}`, infoMaxW), infoX, 20);
    } catch {
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(fitText(settings.societe || 'ROBOTIKS', headerRightX - margin - 3), margin, 16);
    }
  } else {
    const leftMaxW = headerRightX - margin - 3;
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(fitText(settings.societe || 'ROBOTIKS', leftMaxW), margin, 16);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const infos = [settings.telephone, settings.email, settings.adresse].filter(Boolean);
    doc.text(fitText(infos.join('  |  '), leftMaxW), margin, 23);
    if (settings.siret) doc.text(fitText(`SIRET : ${settings.siret}`, leftMaxW), margin, 29);
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(revision.numero || '', W - margin, 14, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('FICHE DE REVISION', W - margin, 20, { align: 'right' });
  doc.text(formatDate(revision.dateRevision), W - margin, 26, { align: 'right' });

  y = 46;

  // ─── INFOS MACHINE ─────────────────────────────────────────
  doc.setFillColor(...LIGHT);
  doc.rect(margin, y, W - margin * 2, 7, 'F');
  doc.setTextColor(...ORANGE);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('MACHINE & CLIENT', margin + 2, y + 5);
  y += 10;

  const infoRow = (label, value) => {
    if (!value) return;
    doc.setTextColor(...GRAY);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(label + ' :', margin, y);
    doc.setTextColor(...DARK);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const lines = doc.splitTextToSize(String(value), W - margin * 2 - 35);
    doc.text(lines, margin + 35, y);
    y += lines.length * 5 + 1;
  };

  infoRow('Client', revision.clientNom);
  infoRow('Contact', revision.clientContact);
  infoRow('Lieu', revision.lieu);
  const machine = [revision.marque, revision.modele].filter(Boolean).join(' ');
  infoRow('Machine', machine);
  infoRow('N de serie', revision.numeroSerie);
  infoRow('Intervenant', revision.nomIntervenant);
  y += 5;

  // ─── RESUME (4 compteurs colorés) ──────────────────────────
  checkSpace(22);
  const counts = getRevisionCounts(revision);
  const summaryItems = [
    { label: 'OK',         value: counts.ok,     color: GREEN  },
    { label: 'Surveiller', value: counts.watch,   color: ORANGE },
    { label: 'Defaut',     value: counts.defaut,  color: RED    },
    { label: 'N/A',        value: counts.na,      color: GRAY   },
  ];
  const colW = (W - margin * 2 - 6) / 4;
  summaryItems.forEach((s, i) => {
    const x = margin + i * (colW + 2);
    doc.setFillColor(...s.color);
    doc.roundedRect(x, y, colW, 16, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(String(s.value), x + colW / 2, y + 10, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(s.label, x + colW / 2, y + 15, { align: 'center' });
  });
  y += 22;

  // ─── SECTIONS ──────────────────────────────────────────────
  const sectionBar = (title) => {
    checkSpace(14);
    doc.setFillColor(...LIGHT);
    doc.rect(margin, y, W - margin * 2, 7, 'F');
    doc.setTextColor(...ORANGE);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin + 2, y + 5);
    y += 10;
  };

  const activeSections = [
    ...SECTIONS,
    ...TOOLS.filter(t => revision.activeTools?.includes(t.id)),
  ];

  for (const section of activeSections) {
    const data = revision.checklist?.[section.id];
    if (!data) continue;

    sectionBar(`${section.emoji}  ${section.title.toUpperCase()}`);

    for (const item of section.items) {
      checkSpace(7);
      const val = data.items[item];
      const si = STATUS_PDF[val];

      doc.setTextColor(...DARK);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      const itemLines = doc.splitTextToSize(item, W - margin * 2 - 18);
      doc.text(itemLines, margin + 2, y);

      // Badge statut à droite
      if (si) {
        doc.setFillColor(...si.color);
        doc.roundedRect(W - margin - 15, y - 4.5, 15, 6, 1, 1, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text(si.text, W - margin - 7.5, y - 0.5, { align: 'center' });
      } else {
        doc.setDrawColor(...LIGHT);
        doc.roundedRect(W - margin - 15, y - 4.5, 15, 6, 1, 1, 'S');
      }

      // Ligne séparatrice
      doc.setDrawColor(240, 240, 240);
      doc.line(margin, y + 2.5, W - margin, y + 2.5);

      y += Math.max(itemLines.length * 5, 6.5);
    }

    if (data.notes) {
      checkSpace(10);
      doc.setTextColor(...GRAY);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      const noteLines = doc.splitTextToSize('Notes : ' + data.notes, W - margin * 2 - 4);
      noteLines.forEach(line => { checkSpace(5); doc.text(line, margin + 2, y); y += 5; });
    }

    y += 5;
  }

  // ─── OBSERVATIONS GENERALES ────────────────────────────────
  if (revision.observations) {
    checkSpace(14);
    sectionBar('OBSERVATIONS GENERALES');
    doc.setTextColor(...DARK);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(revision.observations, W - margin * 2);
    lines.forEach(line => { checkSpace(6); doc.text(line, margin, y); y += 5; });
  }

  // ─── PIED DE PAGE ──────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(...ORANGE);
    doc.rect(0, 287, W, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`${settings.societe || 'ROBOTIKS'} — ${revision.numero}`, margin, 293);
    doc.text(`Page ${i}/${pageCount}`, W - margin, 293, { align: 'right' });
    doc.text(`Genere le ${new Date().toLocaleDateString('fr-FR')}`, W / 2, 293, { align: 'center' });
  }

  // ─── ENVOI / TÉLÉCHARGEMENT ─────────────────────────────────
  const filename = `${revision.numero}_${(revision.clientNom || 'client').replace(/\s+/g, '_')}.pdf`;

  try {
    const blob = doc.output('blob');
    const file = new File([blob], filename, { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: `Revision ${revision.numero}`,
        text: `Revision du ${formatDate(revision.dateRevision)} — ${revision.clientNom || ''}`,
        files: [file],
      });
      return;
    }
  } catch (e) {
    if (e.name === 'AbortError') return;
  }

  try {
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch {
    doc.save(filename);
  }
}

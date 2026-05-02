import { jsPDF } from "jspdf";
import type { ParsedCV } from "./parse-cv";

// ── A4 constants (pt) ────────────────────────────────────────────────────────
const PW = 595.28;
const PH = 841.89;
const MX = 50;
const MB = 40;
const CW = PW - MX * 2;
const HDR_H = 76;

// ── Colour palette (slate scale) ─────────────────────────────────────────────
const C = {
  s900: [15, 23, 42],
  s800: [30, 41, 59],
  s700: [51, 65, 85],
  s600: [71, 100, 130],
  s500: [100, 116, 139],
  s400: [148, 163, 184],
  s300: [203, 213, 225],
  s200: [226, 232, 240],
  white: [255, 255, 255],
} as const;

type RGB = readonly [number, number, number];

function setColor(
  doc: jsPDF,
  color: RGB,
  target: "text" | "fill" | "draw",
) {
  if (target === "text") doc.setTextColor(color[0], color[1], color[2]);
  if (target === "fill") doc.setFillColor(color[0], color[1], color[2]);
  if (target === "draw") doc.setDrawColor(color[0], color[1], color[2]);
}

// ── Page cursor ───────────────────────────────────────────────────────────────
class Cursor {
  y: number;
  constructor(start: number) {
    this.y = start;
  }
  advance(n: number) {
    this.y += n;
  }
  ensureSpace(doc: jsPDF, needed: number) {
    if (this.y + needed > PH - MB) {
      doc.addPage();
      this.y = 38;
    }
  }
}

// ── Styled CV PDF ─────────────────────────────────────────────────────────────
export function downloadCvPdf(data: ParsedCV, fileName: string): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const cur = new Cursor(HDR_H + 22);

  // Header block
  setColor(doc, C.s900, "fill");
  doc.rect(0, 0, PW, HDR_H, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  setColor(doc, C.white, "text");
  doc.text(
    (data.header.name || "Curriculum Vitae").toUpperCase(),
    PW / 2,
    28,
    { align: "center" },
  );

  if (data.header.contact.length > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    setColor(doc, C.s300, "text");
    const contactStr = data.header.contact
      .map((c) => c.replace(/^https?:\/\/(www\.)?/, ""))
      .join("  •  ");
    const cLines = doc.splitTextToSize(contactStr, CW - 20) as string[];
    doc.text(cLines, PW / 2, 48, { align: "center" });
  }

  // ── Section heading ──────────────────────────────────────────────────────
  function sectionHead(label: string) {
    cur.ensureSpace(doc, 24);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    setColor(doc, C.s900, "text");
    doc.text(label.toUpperCase(), MX, cur.y);
    setColor(doc, C.s200, "draw");
    doc.setLineWidth(0.75);
    doc.line(MX, cur.y + 3, MX + CW, cur.y + 3);
    cur.advance(14);
  }

  // ── Item heading (job / degree / project) ────────────────────────────────
  function itemHead(title: string, sub: string, date: string) {
    cur.ensureSpace(doc, 16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setColor(doc, C.s800, "text");
    const dateW = date ? doc.getTextWidth(date) + 8 : 0;
    const titleLines = doc.splitTextToSize(title, CW - dateW) as string[];
    doc.text(titleLines, MX, cur.y);
    if (date) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      setColor(doc, C.s500, "text");
      doc.text(date, MX + CW, cur.y, { align: "right" });
    }
    cur.advance(titleLines.length * 10 + 2);
    if (sub) {
      cur.ensureSpace(doc, 10);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      setColor(doc, C.s600, "text");
      doc.text(sub, MX, cur.y);
      cur.advance(10);
    }
  }

  // ── Bullet line ──────────────────────────────────────────────────────────
  function bulletLine(text: string) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    setColor(doc, C.s600, "text");
    const lines = doc.splitTextToSize(text, CW - 12) as string[];
    for (let i = 0; i < lines.length; i++) {
      cur.ensureSpace(doc, 11);
      if (i === 0) {
        setColor(doc, C.s400, "fill");
        doc.circle(MX + 4, cur.y - 2.5, 1.3, "F");
      }
      doc.text(lines[i], MX + 11, cur.y);
      cur.advance(10);
    }
    cur.advance(1);
  }

  // ── Paragraph text ───────────────────────────────────────────────────────
  function para(text: string) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    setColor(doc, C.s600, "text");
    const lines = doc.splitTextToSize(text, CW) as string[];
    for (const line of lines) {
      cur.ensureSpace(doc, 11);
      doc.text(line, MX, cur.y);
      cur.advance(10);
    }
    cur.advance(2);
  }

  // ── Skill row ────────────────────────────────────────────────────────────
  function skillRow(category: string, items: string[]) {
    cur.ensureSpace(doc, 16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setColor(doc, C.s800, "text");
    const label = `${category}:`;
    doc.text(label, MX, cur.y);
    const labelW = doc.getTextWidth(label) + 4;
    let x = MX + labelW;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setColor(doc, C.s700, "text");
    for (let i = 0; i < items.length; i++) {
      const chunk = items[i] + (i < items.length - 1 ? ", " : "");
      const cw = doc.getTextWidth(chunk);
      if (x + cw > MX + CW) {
        cur.advance(10);
        cur.ensureSpace(doc, 10);
        x = MX + labelW;
      }
      doc.text(chunk, x, cur.y);
      x += cw;
    }
    cur.advance(12);
  }

  // ── Body sections ────────────────────────────────────────────────────────
  if (data.summary) {
    sectionHead("Summary");
    para(data.summary);
    cur.advance(4);
  }

  if (data.experience.length > 0) {
    sectionHead("Experience");
    for (const exp of data.experience) {
      itemHead(exp.title, exp.company, exp.date);
      exp.bullets.forEach(bulletLine);
      cur.advance(5);
    }
    cur.advance(2);
  }

  if (data.education.length > 0) {
    sectionHead("Education");
    for (const edu of data.education) {
      itemHead(edu.degree, edu.institution, edu.date);
      if (edu.details) para(edu.details);
      cur.advance(5);
    }
    cur.advance(2);
  }

  if (data.skills.length > 0) {
    sectionHead("Skills");
    for (const group of data.skills) {
      skillRow(group.category, group.items);
    }
    cur.advance(2);
  }

  if (data.projects.length > 0) {
    sectionHead("Projects");
    for (const proj of data.projects) {
      itemHead(proj.name, proj.details, "");
      proj.bullets.forEach(bulletLine);
      cur.advance(5);
    }
  }

  doc.save(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
}

// ── Plain-text PDF (cover letters) ───────────────────────────────────────────
export function downloadPlainTextPdf(
  title: string,
  body: string,
  fileName: string,
): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 50;
  const maxWidth = PW - margin * 2;

  // Subtle header line
  setColor(doc, C.s900, "fill");
  doc.rect(0, 0, PW, 52, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  setColor(doc, C.white, "text");
  doc.text(title, margin, 32);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  setColor(doc, C.s700, "text");

  let y = 52 + 24;
  const lineH = 13.5;
  const rawLines = body.trim().split("\n");

  for (const raw of rawLines) {
    const clean = raw
      .replace(/^#{1,6}\s*/, "")
      .replace(/\*\*/g, "")
      .replace(/^[-*•]\s*/, "• ");
    const wrapped = doc.splitTextToSize(clean || " ", maxWidth) as string[];
    for (const wl of wrapped) {
      if (y > PH - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(wl, margin, y);
      y += lineH;
    }
  }

  doc.save(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
}

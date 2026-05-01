import { jsPDF } from "jspdf";

const PT_PAGE_W = 595.28;
const PT_PAGE_H = 841.89;

/**
 * Lightweight plain-text PDF (client-side) for MVP exports.
 */
export function downloadPlainTextPdf(
  title: string,
  body: string,
  fileName: string
): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const maxWidth = PT_PAGE_W - margin * 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, margin, margin);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  let y = margin + 26;
  const lineHeight = 14;
  const lines = doc.splitTextToSize(body.trim() || "(empty)", maxWidth);

  for (const line of lines) {
    if (y > PT_PAGE_H - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += lineHeight;
  }
  doc.save(fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
}

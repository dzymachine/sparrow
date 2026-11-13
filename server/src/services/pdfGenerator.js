const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

/**
 * Sanitize text for Helvetica WinAnsi encoding so special characters
 * (em-dashes, smart quotes, bullets) never throw pdf-lib encoding errors.
 */
function sanitizePdfText(input) {
  return String(input ?? '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2022/g, '*')
    .replace(/[^\x20-\x7E\n]/g, ' ');
}

function wrapText(text, font, fontSize, maxWidth) {
  const clean = sanitizePdfText(text);
  const paragraphs = clean.split('\n');
  const lines = [];

  for (const para of paragraphs) {
    const words = para.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push('');
      continue;
    }
    let currentLine = words[0];
    for (let i = 1; i < words.length; i++) {
      const candidate = `${currentLine} ${words[i]}`;
      const width = font.widthOfTextAtSize(candidate, fontSize);
      if (width <= maxWidth) {
        currentLine = candidate;
      } else {
        lines.push(currentLine);
        currentLine = words[i];
      }
    }
    lines.push(currentLine);
  }
  return lines;
}

function formatFieldValue(field, rawValue) {
  if (field.type === 'checkbox') {
    return rawValue ? '[X] Confirmed' : '[ ] Not selected';
  }
  if (rawValue === undefined || rawValue === null || String(rawValue).trim() === '') {
    return '(Not provided / Left blank)';
  }
  if (field.type === 'currency') {
    const num = Number(String(rawValue).replace(/[^0-9.-]/g, ''));
    if (!Number.isNaN(num)) {
      return `$${num.toLocaleString('en-US')}`;
    }
  }
  return String(rawValue);
}

async function generateFilledDocumentPdf({ schema, values, stateJurisdiction }) {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const pageWidth = 612; // US Letter
  const pageHeight = 792;
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const ensureSpace = (neededHeight) => {
    if (y - neededHeight < margin + 30) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  };

  // Top Header Banner
  page.drawRectangle({
    x: margin,
    y: y - 56,
    width: contentWidth,
    height: 56,
    color: rgb(0.96, 0.95, 0.98),
    borderColor: rgb(0.75, 0.70, 0.85),
    borderWidth: 1
  });

  page.drawText(sanitizePdfText(`RUTH AI | COMPLETED FORM PACKET (${schema.formCode || 'FORM'})`), {
    x: margin + 12,
    y: y - 18,
    size: 9,
    font: fontBold,
    color: rgb(0.35, 0.22, 0.55)
  });

  const titleLines = wrapText(schema.title || 'Divorce Document', fontBold, 12, contentWidth - 24);
  page.drawText(titleLines[0] || 'Divorce Document', {
    x: margin + 12,
    y: y - 35,
    size: 12,
    font: fontBold,
    color: rgb(0.1, 0.12, 0.18)
  });

  page.drawText(
    sanitizePdfText(`Jurisdiction: ${stateJurisdiction || 'California'}  |  Generated: ${new Date().toLocaleDateString()}`),
    {
      x: margin + 12,
      y: y - 49,
      size: 8.5,
      font: fontRegular,
      color: rgb(0.35, 0.38, 0.45)
    }
  );

  y -= 76;

  // Render Sections & Fields
  for (const section of schema.sections || []) {
    ensureSpace(44);

    page.drawText(sanitizePdfText(section.title), {
      x: margin,
      y,
      size: 11,
      font: fontBold,
      color: rgb(0.25, 0.15, 0.45)
    });
    y -= 6;
    page.drawLine({
      start: { x: margin, y },
      end: { x: pageWidth - margin, y },
      thickness: 0.75,
      color: rgb(0.82, 0.82, 0.86)
    });
    y -= 16;

    for (const field of section.fields || []) {
      const valueText = formatFieldValue(field, values?.[field.key]);
      const labelLines = wrapText(field.label, fontBold, 9.5, contentWidth);
      const valueLines = wrapText(valueText, fontRegular, 10, contentWidth - 12);

      const blockHeight = labelLines.length * 12 + valueLines.length * 13 + 12;
      ensureSpace(blockHeight);

      for (const lLine of labelLines) {
        page.drawText(lLine, {
          x: margin,
          y,
          size: 9.5,
          font: fontBold,
          color: rgb(0.2, 0.23, 0.3)
        });
        y -= 12;
      }

      for (const vLine of valueLines) {
        page.drawText(vLine, {
          x: margin + 10,
          y,
          size: 10,
          font: fontRegular,
          color: rgb(0.08, 0.08, 0.1)
        });
        y -= 13;
      }

      y -= 8;
    }

    y -= 8;
  }

  // DocuSign-style E-Signature Certificate Box if signed
  if (values?.signatureName && String(values.signatureName).trim()) {
    ensureSpace(85);
    page.drawRectangle({
      x: margin,
      y: y - 66,
      width: contentWidth,
      height: 66,
      color: rgb(0.94, 0.99, 0.96),
      borderColor: rgb(0.16, 0.62, 0.42),
      borderWidth: 1.2
    });

    page.drawText('ELECTRONIC SIGNATURE RECORD', {
      x: margin + 12,
      y: y - 16,
      size: 8.5,
      font: fontBold,
      color: rgb(0.1, 0.45, 0.3)
    });

    page.drawText(sanitizePdfText(`/s/ ${values.signatureName}`), {
      x: margin + 12,
      y: y - 36,
      size: 15,
      font: fontItalic,
      color: rgb(0.08, 0.25, 0.18)
    });

    page.drawText(
      sanitizePdfText(`Signed Date: ${values.signatureDate || new Date().toISOString().split('T')[0]}  |  Verified under penalty of perjury`),
      {
        x: margin + 12,
        y: y - 54,
        size: 8.5,
        font: fontRegular,
        color: rgb(0.2, 0.35, 0.28)
      }
    );
    y -= 80;
  }

  // Footer Disclaimer
  ensureSpace(30);
  page.drawText(
    'Prepared with RuthAI Guided Document Filler. Review all entries before filing with your court clerk.',
    {
      x: margin,
      y: margin - 10,
      size: 8,
      font: fontItalic,
      color: rgb(0.45, 0.48, 0.54)
    }
  );

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

module.exports = {
  generateFilledDocumentPdf
};

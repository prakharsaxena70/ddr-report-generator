const PAGE = {
  left: 40,
  right: 40,
  top: 100,
  bottom: 52,
  footerTop: 26,
};

function formatDate(value) {
  if (!value) {
    return "Not specified";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function createPalette() {
  return {
    charcoal: [45, 45, 45],
    ember: [245, 166, 35],
    amberdeep: [232, 148, 26],
    moss: [141, 198, 63],
    stone: [94, 94, 94],
    pale: [247, 242, 232],
    border: [214, 209, 201],
    rose: [252, 241, 241],
    sky: [240, 249, 255],
    white: [255, 255, 255],
  };
}

function getContentWidth(pdf) {
  return pdf.internal.pageSize.getWidth() - PAGE.left - PAGE.right;
}

function getContentBottom(pdf) {
  return pdf.internal.pageSize.getHeight() - PAGE.bottom;
}

function drawHeader(pdf, title, subtitle) {
  const palette = createPalette();
  const pageWidth = pdf.internal.pageSize.getWidth();

  pdf.setFillColor(...palette.charcoal);
  pdf.rect(0, 0, pageWidth, 72, "F");

  pdf.setTextColor(...palette.ember);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(24);
  pdf.text("UrbanRoof", PAGE.left, 30);

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(16);
  pdf.text(title, PAGE.left, 50);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(220, 220, 220);
  pdf.text(subtitle, pageWidth - PAGE.right, 50, { align: "right", maxWidth: 280 });

  pdf.setFillColor(...palette.moss);
  pdf.rect(0, 72, pageWidth, 4, "F");
}

function drawFooter(pdf, pageNumber, totalPages) {
  const palette = createPalette();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const pageWidth = pdf.internal.pageSize.getWidth();

  pdf.setDrawColor(...palette.border);
  pdf.line(PAGE.left, pageHeight - PAGE.footerTop, pageWidth - PAGE.right, pageHeight - PAGE.footerTop);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...palette.stone);
  pdf.text("www.urbanroof.in | UrbanRoof Private Limited", PAGE.left, pageHeight - 12);
  pdf.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - PAGE.right, pageHeight - 12, {
    align: "right",
  });
}

function startNewPage(pdf, title, subtitle) {
  pdf.addPage();
  drawHeader(pdf, title, subtitle);
  return PAGE.top;
}

function ensurePage(pdf, y, requiredHeight, title, subtitle) {
  if (y + requiredHeight <= getContentBottom(pdf)) {
    return y;
  }
  return startNewPage(pdf, title, subtitle);
}

function splitLines(pdf, text, width, fontSize = 10) {
  pdf.setFontSize(fontSize);
  return pdf.splitTextToSize(String(text || ""), width);
}

function writeLines(pdf, lines, y, options = {}) {
  const x = options.x || PAGE.left;
  const lineHeight = options.lineHeight || 14;
  pdf.setFont("helvetica", options.bold ? "bold" : "normal");
  pdf.setFontSize(options.fontSize || 10);
  pdf.setTextColor(...(options.color || [70, 70, 70]));
  pdf.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function writeParagraph(pdf, text, y, options = {}) {
  const width = options.width || getContentWidth(pdf);
  const lines = splitLines(pdf, text, width, options.fontSize || 10);
  const nextY = writeLines(pdf, lines, y, options);
  return nextY + (options.marginBottom ?? 6);
}

function estimateParagraphHeight(pdf, text, options = {}) {
  const width = options.width || getContentWidth(pdf);
  const lines = splitLines(pdf, text, width, options.fontSize || 10);
  return lines.length * (options.lineHeight || 14) + (options.marginBottom ?? 6);
}

function drawSectionTitle(pdf, y, title, indexLabel) {
  const palette = createPalette();

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...palette.amberdeep);
  pdf.text(indexLabel, PAGE.left, y);

  pdf.setFontSize(18);
  pdf.setTextColor(...palette.charcoal);
  pdf.text(title, PAGE.left, y + 20);

  pdf.setFillColor(...palette.moss);
  pdf.rect(PAGE.left, y + 28, 120, 3, "F");

  return y + 48;
}

function estimateInfoRowHeight(pdf, label, value) {
  const labelLines = splitLines(pdf, label, 138, 9);
  const valueLines = splitLines(pdf, value, 350, 9);
  return Math.max(labelLines.length, valueLines.length) * 12 + 10;
}

function drawInfoTable(pdf, y, rows, title, subtitle) {
  const palette = createPalette();
  let cursorY = y;
  const totalWidth = getContentWidth(pdf);
  const labelWidth = 150;

  rows.forEach((row, index) => {
    const rowHeight = estimateInfoRowHeight(pdf, row[0], row[1]);
    cursorY = ensurePage(pdf, cursorY, rowHeight + 2, title, subtitle);

    pdf.setFillColor(...(index % 2 === 0 ? palette.pale : palette.white));
    pdf.setDrawColor(...palette.border);
    pdf.rect(PAGE.left, cursorY, totalWidth, rowHeight, "FD");
    pdf.line(PAGE.left + labelWidth, cursorY, PAGE.left + labelWidth, cursorY + rowHeight);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(60, 60, 60);
    pdf.text(splitLines(pdf, row[0], labelWidth - 12, 9), PAGE.left + 6, cursorY + 14);

    pdf.setFont("helvetica", "normal");
    pdf.text(splitLines(pdf, row[1], totalWidth - labelWidth - 12, 9), PAGE.left + labelWidth + 6, cursorY + 14);

    cursorY += rowHeight;
  });

  return cursorY + 12;
}

function drawTableHeader(pdf, y, headers, columnWidths) {
  const palette = createPalette();
  const fullWidth = columnWidths.reduce((sum, width) => sum + width, 0);

  pdf.setFillColor(...palette.charcoal);
  pdf.setDrawColor(...palette.border);
  pdf.rect(PAGE.left, y, fullWidth, 24, "FD");

  let x = PAGE.left;
  headers.forEach((header, index) => {
    if (index > 0) {
      pdf.line(x, y, x, y + 24);
    }
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.setTextColor(255, 255, 255);
    pdf.text(splitLines(pdf, header, columnWidths[index] - 10, 8.5), x + 5, y + 14);
    x += columnWidths[index];
  });

  return y + 24;
}

function drawTable(pdf, y, headers, rows, columnWidths, title, subtitle) {
  const palette = createPalette();
  let cursorY = ensurePage(pdf, y, 40, title, subtitle);
  const fullWidth = columnWidths.reduce((sum, width) => sum + width, 0);

  cursorY = drawTableHeader(pdf, cursorY, headers, columnWidths);

  rows.forEach((row, rowIndex) => {
    const cellLines = row.map((cell, index) =>
      splitLines(pdf, String(cell), columnWidths[index] - 10, 8.5),
    );
    const rowHeight = Math.max(...cellLines.map((lines) => lines.length), 1) * 10 + 10;

    if (cursorY + rowHeight > getContentBottom(pdf)) {
      cursorY = startNewPage(pdf, title, subtitle);
      cursorY = drawTableHeader(pdf, cursorY, headers, columnWidths);
    }

    pdf.setFillColor(...(rowIndex % 2 === 0 ? palette.pale : palette.white));
    pdf.setDrawColor(...palette.border);
    pdf.rect(PAGE.left, cursorY, fullWidth, rowHeight, "FD");

    let cellX = PAGE.left;
    cellLines.forEach((lines, cellIndex) => {
      if (cellIndex > 0) {
        pdf.line(cellX, cursorY, cellX, cursorY + rowHeight);
      }
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.setTextColor(60, 60, 60);
      pdf.text(lines, cellX + 5, cursorY + 13);
      cellX += columnWidths[cellIndex];
    });

    cursorY += rowHeight;
  });

  return cursorY + 14;
}

function drawBulletCard(pdf, y, titleLabel, items, fillColor, title, subtitle) {
  const palette = createPalette();
  const safeItems = items?.length ? items : ["Not Available"];
  const itemHeight = safeItems.reduce(
    (sum, item) => sum + estimateParagraphHeight(pdf, `- ${item}`, { x: PAGE.left + 16, width: getContentWidth(pdf) - 32, fontSize: 9.5, marginBottom: 2 }),
    0,
  );
  const boxHeight = 22 + itemHeight + 20;

  let cursorY = ensurePage(pdf, y, boxHeight + 2, title, subtitle);

  pdf.setFillColor(...fillColor);
  pdf.setDrawColor(...palette.border);
  pdf.roundedRect(PAGE.left, cursorY, getContentWidth(pdf), boxHeight, 16, 16, "FD");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(...palette.charcoal);
  pdf.text(titleLabel, PAGE.left + 14, cursorY + 18);

  let textY = cursorY + 38;
  safeItems.forEach((item) => {
    textY = writeParagraph(pdf, `- ${item}`, textY, {
      x: PAGE.left + 16,
      width: getContentWidth(pdf) - 32,
      fontSize: 9.5,
      marginBottom: 2,
    });
  });

  return cursorY + boxHeight + 12;
}

function drawLabeledParagraph(pdf, y, label, text, title, subtitle) {
  const labelHeight = estimateParagraphHeight(pdf, `${label}: ${text}`, {
    width: getContentWidth(pdf) - 28,
    x: PAGE.left + 14,
    fontSize: 10,
    marginBottom: 4,
  });
  let cursorY = ensurePage(pdf, y, labelHeight + 8, title, subtitle);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(45, 45, 45);
  pdf.text(`${label}:`, PAGE.left + 14, cursorY);

  cursorY = writeParagraph(pdf, text, cursorY, {
    x: PAGE.left + 14 + pdf.getTextWidth(`${label}: `),
    width: getContentWidth(pdf) - 28 - pdf.getTextWidth(`${label}: `),
    fontSize: 10,
    marginBottom: 6,
  });

  return cursorY;
}

function drawBulletList(pdf, y, heading, items, title, subtitle) {
  let cursorY = ensurePage(pdf, y, 30, title, subtitle);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(45, 45, 45);
  pdf.text(heading, PAGE.left + 14, cursorY);
  cursorY += 8;

  const safeItems = items?.length ? items : ["Not Available"];
  safeItems.forEach((item) => {
    const needed = estimateParagraphHeight(pdf, `- ${item}`, {
      x: PAGE.left + 22,
      width: getContentWidth(pdf) - 36,
      fontSize: 10,
      marginBottom: 3,
    });
    cursorY = ensurePage(pdf, cursorY, needed + 2, title, subtitle);
    cursorY = writeParagraph(pdf, `- ${item}`, cursorY, {
      x: PAGE.left + 22,
      width: getContentWidth(pdf) - 36,
      fontSize: 10,
      marginBottom: 3,
    });
  });

  return cursorY + 2;
}

function drawObservationHeader(pdf, y, item, title, subtitle) {
  const palette = createPalette();
  let cursorY = ensurePage(pdf, y, 42, title, subtitle);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor(...palette.charcoal);
  pdf.text(item.area, PAGE.left, cursorY + 14);

  const chipText = String(item.severityAssessment.level || "Not Available").toUpperCase();
  const chipWidth = Math.max(92, pdf.getTextWidth(chipText) + 26);
  const pageWidth = pdf.internal.pageSize.getWidth();
  const chipX = pageWidth - PAGE.right - chipWidth;

  pdf.setFillColor(...palette.pale);
  pdf.roundedRect(chipX, cursorY, chipWidth, 22, 10, 10, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.text(chipText, chipX + chipWidth / 2, cursorY + 14, { align: "center" });

  return cursorY + 32;
}

function drawEvidenceImages(pdf, y, evidenceImages, title, subtitle) {
  const palette = createPalette();
  let cursorY = ensurePage(pdf, y, 28, title, subtitle);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(45, 45, 45);
  pdf.text("Supporting Images", PAGE.left + 14, cursorY);
  cursorY += 12;

  const images = Array.isArray(evidenceImages) && evidenceImages.length
    ? evidenceImages
    : [{ src: null, label: "Image Not Available" }];

  images.forEach((image) => {
    cursorY = ensurePage(pdf, cursorY, 150, title, subtitle);
    pdf.setDrawColor(...palette.border);
    pdf.roundedRect(PAGE.left + 12, cursorY, getContentWidth(pdf) - 24, 138, 12, 12, "S");

    if (image.src) {
      try {
        pdf.addImage(image.src, "JPEG", PAGE.left + 18, cursorY + 8, getContentWidth(pdf) - 36, 108);
      } catch (error) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(...palette.stone);
        pdf.text("Image Not Available", PAGE.left + 22, cursorY + 66);
      }
    } else {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(...palette.stone);
      pdf.text("Image Not Available", PAGE.left + 22, cursorY + 66);
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.setTextColor(...palette.stone);
    pdf.text(image.label || "Image Not Available", PAGE.left + 18, cursorY + 128, {
      maxWidth: getContentWidth(pdf) - 40,
    });

    cursorY += 148;
  });

  return cursorY + 6;
}

function drawObservation(pdf, y, item, title, subtitle) {
  let cursorY = drawObservationHeader(pdf, y, item, title, subtitle);
  cursorY = drawLabeledParagraph(pdf, cursorY, "Observation", item.observation, title, subtitle);
  cursorY = drawLabeledParagraph(pdf, cursorY, "Probable Root Cause", item.probableRootCause, title, subtitle);
  cursorY = drawLabeledParagraph(
    pdf,
    cursorY,
    "Severity Assessment",
    item.severityAssessment.reasoning,
    title,
    subtitle,
  );
  cursorY = drawBulletList(pdf, cursorY, "Recommended Actions", item.recommendedActions, title, subtitle);
  cursorY = drawBulletList(pdf, cursorY, "Additional Notes", item.additionalNotes, title, subtitle);
  cursorY = drawBulletList(
    pdf,
    cursorY,
    "Missing Or Unclear Information",
    item.missingOrUnclearInformation,
    title,
    subtitle,
  );
  cursorY = drawBulletList(pdf, cursorY, "Conflicts", item.conflicts, title, subtitle);
  cursorY = drawEvidenceImages(pdf, cursorY, item.evidenceImages, title, subtitle);
  return cursorY + 16;
}

function addPageFooters(pdf) {
  const totalPages = pdf.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    pdf.setPage(page);
    drawFooter(pdf, page, totalPages);
  }
}

export async function exportReportPdf({
  report,
  propertyDetails,
  fileName = "urbanroof-detailed-diagnosis-report.pdf",
}) {
  if (!report) {
    throw new Error("No generated report available for export.");
  }

  const [{ default: jsPDF }] = await Promise.all([import("jspdf")]);
  const pdf = new jsPDF("p", "pt", "a4");
  const title = "Detailed Diagnostic Report";
  const subtitle = propertyDetails?.propertyAddress || "UrbanRoof Diagnosis";
  let y = PAGE.top;

  drawHeader(pdf, title, subtitle);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(28);
  pdf.setTextColor(45, 45, 45);
  pdf.text("AI-Powered DDR Generator Output", PAGE.left, y);
  y += 34;

  y = writeParagraph(
    pdf,
    "This report combines the uploaded inspection report and thermal report to produce a client-friendly building diagnosis.",
    y,
    { fontSize: 11, color: [90, 90, 90], marginBottom: 16 },
  );

  y = drawInfoTable(
    pdf,
    y,
    [
      ["Property Address", propertyDetails.propertyAddress],
      ["Inspector Name", propertyDetails.inspectorName],
      ["Inspection Date", formatDate(propertyDetails.inspectionDate)],
      ["Property Type", propertyDetails.propertyType],
      ["Floors", propertyDetails.floors],
      ["Property Age", `${propertyDetails.propertyAge} years`],
    ],
    title,
    subtitle,
  );

  y = ensurePage(pdf, y, 120, title, subtitle);
  y = drawSectionTitle(pdf, y, "1. Property Issue Summary", "Section 1");
  y = writeParagraph(pdf, report.propertyIssueSummary.headline, y, {
    bold: true,
    fontSize: 12,
    marginBottom: 10,
  });
  y = writeParagraph(pdf, report.propertyIssueSummary.overview, y, { marginBottom: 10 });
  y = drawBulletList(pdf, y, "Key Findings", report.propertyIssueSummary.keyFindings, title, subtitle);

  y = ensurePage(pdf, y, 80, title, subtitle);
  y = drawSectionTitle(pdf, y, "2. Area-wise Observations", "Section 2");
  for (let index = 0; index < report.areaWiseObservations.length; index += 1) {
    const item = report.areaWiseObservations[index];
    if (index > 0) {
      y = ensurePage(pdf, y, 80, title, subtitle);
    }
    y = drawObservation(pdf, y, item, title, subtitle);
  }

  y = ensurePage(pdf, y, 120, title, subtitle);
  y = drawSectionTitle(pdf, y, "3. Probable Root Cause", "Section 3");
  y = drawTable(
    pdf,
    y,
    ["Area", "Probable Root Cause", "Supporting Evidence"],
    report.probableRootCause.map((item) => [item.area, item.cause, item.supportingEvidence]),
    [115, 180, 220],
    title,
    subtitle,
  );

  y = ensurePage(pdf, y, 120, title, subtitle);
  y = drawSectionTitle(pdf, y, "4. Severity Assessment", "Section 4");
  y = drawTable(
    pdf,
    y,
    ["Area", "Severity", "Reasoning"],
    report.severityAssessment.map((item) => [item.area, item.severity, item.reasoning]),
    [115, 80, 320],
    title,
    subtitle,
  );

  y = ensurePage(pdf, y, 120, title, subtitle);
  y = drawSectionTitle(pdf, y, "5. Recommended Actions", "Section 5");
  y = drawTable(
    pdf,
    y,
    ["Area", "Action", "Priority", "Reasoning"],
    report.recommendedActions.map((item) => [
      item.area,
      item.action,
      item.priority,
      item.reasoning,
    ]),
    [95, 220, 70, 130],
    title,
    subtitle,
  );

  y = ensurePage(pdf, y, 120, title, subtitle);
  y = drawSectionTitle(pdf, y, "6. Additional Notes", "Section 6");
  y = drawBulletCard(
    pdf,
    y,
    "Additional Notes",
    report.additionalNotes,
    createPalette().pale,
    title,
    subtitle,
  );

  y = ensurePage(pdf, y, 120, title, subtitle);
  y = drawSectionTitle(pdf, y, "7. Missing or Unclear Information", "Section 7");
  y = drawBulletCard(
    pdf,
    y,
    "Missing Or Unclear Information",
    report.missingOrUnclearInformation,
    createPalette().rose,
    title,
    subtitle,
  );

  y = ensurePage(pdf, y, 60, title, subtitle);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(...createPalette().stone);
  pdf.text("Conflicting Details", PAGE.left, y);
  y += 14;
  drawBulletCard(
    pdf,
    y,
    "Conflicting Details",
    report.conflicts,
    createPalette().sky,
    title,
    subtitle,
  );

  addPageFooters(pdf);
  pdf.save(fileName);
}

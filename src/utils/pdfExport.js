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
  };
}

function drawHeader(pdf, title, subtitle) {
  const palette = createPalette();
  const pageWidth = pdf.internal.pageSize.getWidth();

  pdf.setFillColor(...palette.charcoal);
  pdf.rect(0, 0, pageWidth, 72, "F");

  pdf.setTextColor(...palette.ember);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(24);
  pdf.text("UrbanRoof", 40, 30);

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(16);
  pdf.text(title, 40, 50);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(220, 220, 220);
  pdf.text(subtitle, pageWidth - 40, 50, { align: "right" });

  pdf.setFillColor(...palette.moss);
  pdf.rect(0, 72, pageWidth, 4, "F");
}

function drawFooter(pdf, pageNumber, totalPages) {
  const palette = createPalette();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const pageWidth = pdf.internal.pageSize.getWidth();

  pdf.setDrawColor(...palette.border);
  pdf.line(40, pageHeight - 26, pageWidth - 40, pageHeight - 26);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...palette.stone);
  pdf.text("www.urbanroof.in | UrbanRoof Private Limited", 40, pageHeight - 12);
  pdf.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - 40, pageHeight - 12, {
    align: "right",
  });
}

function writeParagraph(pdf, text, y, options = {}) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const width = options.width || pageWidth - 80;
  const x = options.x || 40;
  const fontSize = options.fontSize || 10;
  const lines = pdf.splitTextToSize(String(text), width);

  pdf.setFont("helvetica", options.bold ? "bold" : "normal");
  pdf.setFontSize(fontSize);
  pdf.setTextColor(...(options.color || [70, 70, 70]));
  pdf.text(lines, x, y);

  return y + lines.length * (options.lineHeight || 14) + (options.marginBottom || 6);
}

function ensurePage(pdf, y, requiredHeight, title, subtitle) {
  const pageHeight = pdf.internal.pageSize.getHeight();
  if (y + requiredHeight <= pageHeight - 44) {
    return y;
  }

  pdf.addPage();
  drawHeader(pdf, title, subtitle);
  return 100;
}

function drawSectionTitle(pdf, y, title, indexLabel) {
  const palette = createPalette();

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...palette.amberdeep);
  pdf.text(indexLabel, 40, y);

  pdf.setFontSize(18);
  pdf.setTextColor(...palette.charcoal);
  pdf.text(title, 40, y + 18);

  pdf.setFillColor(...palette.moss);
  pdf.rect(40, y + 24, 120, 3, "F");

  return y + 42;
}

function drawInfoTable(pdf, y, rows) {
  const palette = createPalette();
  let cursorY = y;
  const totalWidth = 515;

  rows.forEach((row, index) => {
    pdf.setFillColor(...(index % 2 === 0 ? palette.pale : [255, 255, 255]));
    pdf.setDrawColor(...palette.border);
    pdf.rect(40, cursorY, totalWidth, 22, "FD");
    pdf.line(190, cursorY, 190, cursorY + 22);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(60, 60, 60);
    pdf.text(String(row[0]), 46, cursorY + 14, { maxWidth: 138 });

    pdf.setFont("helvetica", "normal");
    pdf.text(String(row[1]), 196, cursorY + 14, { maxWidth: 350 });
    cursorY += 22;
  });

  return cursorY + 10;
}

function drawTable(pdf, y, headers, rows, columnWidths, title, subtitle) {
  const palette = createPalette();
  let cursorY = ensurePage(pdf, y, 36, title, subtitle);
  const fullWidth = columnWidths.reduce((sum, width) => sum + width, 0);

  pdf.setFillColor(...palette.charcoal);
  pdf.setDrawColor(...palette.border);
  pdf.rect(40, cursorY, fullWidth, 22, "FD");

  let x = 40;
  headers.forEach((header, index) => {
    if (index > 0) {
      pdf.line(x, cursorY, x, cursorY + 22);
    }
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.setTextColor(255, 255, 255);
    pdf.text(String(header), x + 5, cursorY + 14, { maxWidth: columnWidths[index] - 10 });
    x += columnWidths[index];
  });

  cursorY += 22;

  rows.forEach((row, rowIndex) => {
    const cellLines = row.map((cell, index) =>
      pdf.splitTextToSize(String(cell), columnWidths[index] - 10),
    );
    const rowHeight = Math.max(...cellLines.map((lines) => lines.length), 1) * 10 + 8;

    cursorY = ensurePage(pdf, cursorY, rowHeight + 4, title, subtitle);
    pdf.setFillColor(...(rowIndex % 2 === 0 ? palette.pale : [255, 255, 255]));
    pdf.setDrawColor(...palette.border);
    pdf.rect(40, cursorY, fullWidth, rowHeight, "FD");

    let cellX = 40;
    cellLines.forEach((lines, cellIndex) => {
      if (cellIndex > 0) {
        pdf.line(cellX, cursorY, cellX, cursorY + rowHeight);
      }
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.setTextColor(60, 60, 60);
      pdf.text(lines, cellX + 5, cursorY + 12);
      cellX += columnWidths[cellIndex];
    });

    cursorY += rowHeight;
  });

  return cursorY + 12;
}

function drawBulletCard(pdf, y, title, items, fillColor, titleText, sectionTitle, subtitle) {
  let cursorY = ensurePage(pdf, y, 90, sectionTitle, subtitle);
  const palette = createPalette();
  const boxHeight = 28 + Math.max(items.length, 1) * 16;

  pdf.setFillColor(...fillColor);
  pdf.setDrawColor(...palette.border);
  pdf.roundedRect(40, cursorY, 515, boxHeight, 16, 16, "FD");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(...titleText);
  pdf.text(title, 52, cursorY + 18);

  let textY = cursorY + 36;
  const safeItems = items.length ? items : ["Not Available"];
  safeItems.forEach((item) => {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    pdf.setTextColor(70, 70, 70);
    pdf.text(`• ${item}`, 56, textY, { maxWidth: 480 });
    textY += 16;
  });

  return cursorY + boxHeight + 10;
}

async function drawObservationBlock(pdf, y, item, title, subtitle) {
  const palette = createPalette();
  let cursorY = ensurePage(pdf, y, 180, title, subtitle);

  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(...palette.border);
  pdf.roundedRect(40, cursorY, 515, 420, 18, 18, "FD");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor(...palette.charcoal);
  pdf.text(item.area, 54, cursorY + 24);

  pdf.setFillColor(...palette.pale);
  pdf.roundedRect(440, cursorY + 10, 92, 22, 10, 10, "F");
  pdf.setFontSize(8.5);
  pdf.setTextColor(...palette.charcoal);
  pdf.text(String(item.severityAssessment.level).toUpperCase(), 486, cursorY + 24, {
    align: "center",
  });

  let textY = cursorY + 48;
  textY = writeParagraph(pdf, `Observation: ${item.observation}`, textY, {
    x: 54,
    width: 485,
    marginBottom: 6,
  });
  textY = writeParagraph(pdf, `Probable Root Cause: ${item.probableRootCause}`, textY, {
    x: 54,
    width: 485,
    marginBottom: 6,
  });
  textY = writeParagraph(
    pdf,
    `Severity Assessment: ${item.severityAssessment.reasoning}`,
    textY,
    { x: 54, width: 485, marginBottom: 6 },
  );

  textY = writeParagraph(pdf, "Recommended Actions:", textY, {
    x: 54,
    bold: true,
    marginBottom: 2,
  });
  item.recommendedActions.forEach((action) => {
    textY = writeParagraph(pdf, `• ${action}`, textY, {
      x: 62,
      width: 475,
      marginBottom: 2,
    });
  });

  textY = writeParagraph(pdf, "Additional Notes:", textY + 2, {
    x: 54,
    bold: true,
    marginBottom: 2,
  });
  item.additionalNotes.forEach((note) => {
    textY = writeParagraph(pdf, `• ${note}`, textY, {
      x: 62,
      width: 475,
      marginBottom: 2,
    });
  });

  const imageY = textY + 6;
  const images = Array.isArray(item.evidenceImages) && item.evidenceImages.length
    ? item.evidenceImages.slice(0, 2)
    : [{ src: null, label: "Image Not Available" }];

  let currentX = 54;
  for (const image of images) {
    pdf.setDrawColor(...palette.border);
    pdf.roundedRect(currentX, imageY, 230, 120, 14, 14, "S");

    if (image.src) {
      try {
        pdf.addImage(image.src, "JPEG", currentX + 4, imageY + 4, 222, 94);
      } catch (error) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(...palette.stone);
        pdf.text("Image Not Available", currentX + 60, imageY + 56);
      }
    } else {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(...palette.stone);
      pdf.text("Image Not Available", currentX + 60, imageY + 56);
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.setTextColor(...palette.stone);
    pdf.text(image.label, currentX + 8, imageY + 110, { maxWidth: 214 });
    currentX += 250;
  }

  return imageY + 136;
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
  let y = 100;

  drawHeader(pdf, title, subtitle);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(28);
  pdf.setTextColor(45, 45, 45);
  pdf.text("AI-Powered DDR Generator Output", 40, y);
  y += 28;

  y = writeParagraph(
    pdf,
    "This report combines the uploaded inspection report and thermal report to produce a client-friendly building diagnosis.",
    y,
    { fontSize: 11, color: [90, 90, 90], marginBottom: 12 },
  );

  y = drawInfoTable(pdf, y, [
    ["Property Address", propertyDetails.propertyAddress],
    ["Inspector Name", propertyDetails.inspectorName],
    ["Inspection Date", formatDate(propertyDetails.inspectionDate)],
    ["Property Type", propertyDetails.propertyType],
    ["Floors", propertyDetails.floors],
    ["Property Age", `${propertyDetails.propertyAge} years`],
  ]);

  y = ensurePage(pdf, y, 120, title, subtitle);
  y = drawSectionTitle(pdf, y, "1. Property Issue Summary", "Section 1");
  y = writeParagraph(pdf, report.propertyIssueSummary.headline, y, {
    bold: true,
    fontSize: 12,
    marginBottom: 8,
  });
  y = writeParagraph(pdf, report.propertyIssueSummary.overview, y, { marginBottom: 8 });
  report.propertyIssueSummary.keyFindings.forEach((item) => {
    y = writeParagraph(pdf, `• ${item}`, y, { marginBottom: 2 });
  });

  y = ensurePage(pdf, y, 100, title, subtitle);
  y = drawSectionTitle(pdf, y, "2. Area-wise Observations", "Section 2");
  for (const item of report.areaWiseObservations) {
    y = await drawObservationBlock(pdf, y, item, title, subtitle);
    y += 10;
  }

  y = ensurePage(pdf, y, 130, title, subtitle);
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

  y = ensurePage(pdf, y, 130, title, subtitle);
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

  y = ensurePage(pdf, y, 130, title, subtitle);
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
    createPalette().charcoal,
    title,
    subtitle,
  );

  y = ensurePage(pdf, y, 120, title, subtitle);
  y = drawSectionTitle(pdf, y, "7. Missing or Unclear Information", "Section 7");
  y = drawBulletCard(
    pdf,
    y,
    "Missing or Unclear Information",
    report.missingOrUnclearInformation,
    createPalette().rose,
    createPalette().charcoal,
    title,
    subtitle,
  );

  y = ensurePage(pdf, y, 120, title, subtitle);
  y = drawSectionTitle(pdf, y, "8. Conflicting Details", "Section 8");
  drawBulletCard(
    pdf,
    y,
    "Conflicting Details",
    report.conflicts,
    createPalette().sky,
    createPalette().charcoal,
    title,
    subtitle,
  );

  addPageFooters(pdf);
  pdf.save(fileName);
}

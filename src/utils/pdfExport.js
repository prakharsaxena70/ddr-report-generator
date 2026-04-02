function severityLabel(value) {
  if (!value) {
    return "";
  }

  return String(value).replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

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
  };
}

function drawHeader(pdf, title, subtitle) {
  const palette = createPalette();
  const pageWidth = pdf.internal.pageSize.getWidth();

  pdf.setFillColor(...palette.charcoal);
  pdf.rect(0, 0, pageWidth, 70, "F");

  pdf.setTextColor(...palette.ember);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(24);
  pdf.text("UrbanRoof", 40, 30);

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(16);
  pdf.text(title, 40, 50);

  if (subtitle) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(220, 220, 220);
    pdf.text(subtitle, pageWidth - 40, 50, { align: "right" });
  }

  pdf.setFillColor(...palette.moss);
  pdf.rect(0, 70, pageWidth, 4, "F");
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

function writeParagraph(pdf, text, y, options = {}) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const width = options.width || pageWidth - 80;
  const fontSize = options.fontSize || 10;
  const lineHeight = options.lineHeight || 5;
  const x = options.x || 40;
  const lines = pdf.splitTextToSize(text, width);

  pdf.setFont("helvetica", options.bold ? "bold" : "normal");
  pdf.setFontSize(fontSize);
  pdf.setTextColor(...(options.color || [70, 70, 70]));
  pdf.text(lines, x, y);
  return y + lines.length * lineHeight + (options.marginBottom || 4);
}

function ensurePage(pdf, y, requiredHeight, title, subtitle) {
  const pageHeight = pdf.internal.pageSize.getHeight();
  if (y + requiredHeight <= pageHeight - 40) {
    return y;
  }

  pdf.addPage();
  drawHeader(pdf, title, subtitle);
  return 100;
}

function drawInfoTable(pdf, y, rows, columnWidths) {
  const palette = createPalette();
  let cursorY = y;

  rows.forEach((row, index) => {
    const rowHeight = 20;
    pdf.setFillColor(...(index % 2 === 0 ? palette.pale : [255, 255, 255]));
    pdf.setDrawColor(...palette.border);
    pdf.rect(40, cursorY, columnWidths.reduce((sum, width) => sum + width, 0), rowHeight, "FD");

    let x = 40;
    row.forEach((cell, cellIndex) => {
      if (cellIndex > 0) {
        pdf.line(x, cursorY, x, cursorY + rowHeight);
      }
      pdf.setFont("helvetica", cellIndex === 0 ? "bold" : "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(60, 60, 60);
      pdf.text(String(cell), x + 6, cursorY + 13, {
        maxWidth: columnWidths[cellIndex] - 12,
      });
      x += columnWidths[cellIndex];
    });
    cursorY += rowHeight;
  });

  return cursorY + 8;
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
    pdf.text(header, x + 5, cursorY + 14, { maxWidth: columnWidths[index] - 10 });
    x += columnWidths[index];
  });
  cursorY += 22;

  rows.forEach((row, rowIndex) => {
    const cellLines = row.map((cell, index) =>
      pdf.splitTextToSize(String(cell), columnWidths[index] - 10),
    );
    const rowHeight = Math.max(...cellLines.map((lines) => lines.length), 1) * 10 + 6;

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

  return cursorY + 10;
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
  const title = "Detailed Diagnosis Report";
  const subtitle = propertyDetails?.propertyAddress || "UrbanRoof Diagnosis";
  let y = 100;

  drawHeader(pdf, title, subtitle);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(28);
  pdf.setTextColor(45, 45, 45);
  pdf.text("AI-Powered Property Diagnosis Report", 40, y);
  y += 28;

  y = writeParagraph(
    pdf,
    "Prepared using thermography, inspection checklist correlation, and UrbanRoof diagnosis logic.",
    y,
    { fontSize: 11, color: [90, 90, 90], marginBottom: 12 },
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
    [150, 365],
  );

  y = ensurePage(pdf, y, 120, title, subtitle);
  y = drawSectionTitle(pdf, y, "Executive Summary", "Executive Summary");
  report.executiveSummary.forEach((item) => {
    y = ensurePage(pdf, y, 36, title, subtitle);
    y = writeParagraph(pdf, item, y, { fontSize: 10, marginBottom: 6 });
  });

  y = ensurePage(pdf, y, 120, title, subtitle);
  y = drawSectionTitle(pdf, y, "Data & Information Disclaimer", "Disclaimer");
  y = writeParagraph(
    pdf,
    "This report is generated from property details, uploaded PDF documents, and UrbanRoof's AI-assisted diagnosis workflow. Thermal signatures are interpreted as non-destructive indicators and should be read with the stated limitations.",
    y,
    { fontSize: 10, marginBottom: 10 },
  );

  y = ensurePage(pdf, y, 140, title, subtitle);
  y = drawSectionTitle(pdf, y, "1. Introduction", "Section 1");
  y = writeParagraph(pdf, `Background: ${report.introduction.background}`, y, { marginBottom: 6 });
  y = writeParagraph(pdf, `Objective: ${report.introduction.objective}`, y, { marginBottom: 6 });
  y = writeParagraph(pdf, `Scope: ${report.introduction.scope}`, y, { marginBottom: 6 });
  y = writeParagraph(pdf, `Tools Used: ${report.introduction.toolsUsed.join(", ")}`, y, {
    marginBottom: 8,
  });

  y = ensurePage(pdf, y, 180, title, subtitle);
  y = drawSectionTitle(pdf, y, "2. General Information", "Section 2");
  y = drawInfoTable(pdf, y, report.generalInformation.clientTable, [180, 335]);
  y = drawInfoTable(pdf, y, report.generalInformation.siteTable, [180, 335]);

  y = ensurePage(pdf, y, 220, title, subtitle);
  y = drawSectionTitle(pdf, y, "3. Visual Observation and Readings", "Section 3");
  y = drawTable(
    pdf,
    y,
    ["Area", "Observed Finding", "Likely Cause", "Urgency"],
    report.leakageSummary.map((item) => [
      item.area,
      item.finding,
      item.likelyCause,
      item.urgency,
    ]),
    [85, 145, 205, 80],
    title,
    subtitle,
  );

  y = ensurePage(pdf, y, 160, title, subtitle);
  y = writeParagraph(pdf, "Checklist Responses", y, {
    bold: true,
    fontSize: 12,
    color: [45, 45, 45],
    marginBottom: 6,
  });
  [
    ["WC / Bathroom", report.checklistResponses.bathroom],
    ["Balcony", report.checklistResponses.balcony],
    ["Terrace", report.checklistResponses.terrace],
    ["External Wall", report.checklistResponses.externalWall],
  ].forEach(([label, value]) => {
    y = ensurePage(pdf, y, 34, title, subtitle);
    y = writeParagraph(pdf, `${value.selected ? "☒" : "☐"} ${label}: ${value.notes}`, y, {
      fontSize: 10,
      marginBottom: 4,
    });
  });

  y = drawTable(
    pdf,
    y + 6,
    ["Impacted Area", "Description", "Severity"],
    report.negativeSideInputs.map((item) => [
      item.area,
      item.description,
      severityLabel(item.severity),
    ]),
    [120, 305, 90],
    title,
    subtitle,
  );

  y = drawTable(
    pdf,
    y,
    ["Source Area", "Description", "Risk"],
    report.positiveSideInputs.map((item) => [
      item.area,
      item.description,
      severityLabel(item.risk),
    ]),
    [120, 305, 90],
    title,
    subtitle,
  );

  y = ensurePage(pdf, y, 180, title, subtitle);
  y = drawSectionTitle(pdf, y, "4. Analysis & Suggestions", "Section 4");
  y = drawTable(
    pdf,
    y,
    ["Action", "Suggested Therapy", "Priority", "Linked Areas"],
    report.therapies.map((item) => [
      item.action,
      item.therapy,
      item.priority,
      item.linkedAreas.join(", "),
    ]),
    [110, 210, 70, 125],
    title,
    subtitle,
  );

  y = ensurePage(pdf, y, 120, title, subtitle);
  y = writeParagraph(pdf, "Further Possibilities due to Delayed Action", y, {
    bold: true,
    fontSize: 12,
    color: [45, 45, 45],
    marginBottom: 6,
  });
  report.delayedActionRisks.forEach((item) => {
    y = ensurePage(pdf, y, 34, title, subtitle);
    y = writeParagraph(pdf, `• ${item}`, y, { fontSize: 10, marginBottom: 4 });
  });

  y = drawTable(
    pdf,
    y + 6,
    ["Impacted Area", "Exposed Area", "Correlation"],
    report.summaryTable.map((item) => [
      item.impactedArea,
      item.exposedArea,
      item.link,
    ]),
    [150, 140, 225],
    title,
    subtitle,
  );

  y = ensurePage(pdf, y, 180, title, subtitle);
  y = drawSectionTitle(pdf, y, "4.4 Thermal References", "Section 4.4");
  y = drawTable(
    pdf,
    y,
    ["Image ID", "Location", "Hot", "Cold", "Emis.", "Diagnosis / Pattern", "Severity"],
    report.thermalReferences.map((item) => [
      item.imageId,
      item.location,
      `${item.hotspot}°C`,
      `${item.coldspot}°C`,
      `${item.emissivity}`,
      `${item.diagnosis} ${item.thermalPattern}`,
      severityLabel(item.severity),
    ]),
    [62, 92, 45, 45, 40, 180, 51],
    title,
    subtitle,
  );

  y = ensurePage(pdf, y, 150, title, subtitle);
  y = drawSectionTitle(pdf, y, "4.5 Visual References for Positive Side Inputs", "Section 4.5");
  y = drawTable(
    pdf,
    y,
    ["Source Area", "Description", "Risk"],
    report.visualReferences.map((item) => [
      item.area,
      item.description,
      severityLabel(item.risk),
    ]),
    [120, 305, 90],
    title,
    subtitle,
  );

  y = ensurePage(pdf, y, 140, title, subtitle);
  y = drawSectionTitle(pdf, y, "5. Limitation and Precaution Note", "Section 5");
  report.limitations.forEach((item) => {
    y = ensurePage(pdf, y, 34, title, subtitle);
    y = writeParagraph(pdf, `• ${item}`, y, { fontSize: 10, marginBottom: 4 });
  });

  y = ensurePage(pdf, y, 100, title, subtitle);
  y = drawSectionTitle(pdf, y, "Legal Disclaimer", "Legal");
  writeParagraph(pdf, report.legalDisclaimer, y, { fontSize: 10, marginBottom: 4 });

  const totalPages = pdf.getNumberOfPages();
  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
    pdf.setPage(pageNumber);
    drawFooter(pdf, pageNumber, totalPages);
  }

  pdf.save(fileName);
}

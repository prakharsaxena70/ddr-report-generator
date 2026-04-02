import fs from "node:fs";
import path from "node:path";
import {
  sampleInspectionAnalysis,
  samplePropertyDetails,
  sampleThermalAnalysis,
} from "../src/data/sampleData.js";

const outputDir = path.resolve("sample-output");
const outputPdf = path.join(outputDir, "sample-generated-report.pdf");
const outputJson = path.join(outputDir, "sample-generated-report.json");

function wrapLine(text, maxLength = 88) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = "";

  for (const word of words) {
    const proposed = current ? `${current} ${word}` : word;
    if (proposed.length > maxLength) {
      lines.push(current);
      current = word;
    } else {
      current = proposed;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function escapePdfText(text) {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildPages() {
  const severityCounts = sampleThermalAnalysis.reduce(
    (accumulator, entry) => {
      accumulator[entry.severity] += 1;
      return accumulator;
    },
    { immediate: 0, moderate: 0, monitor: 0 },
  );

  const pages = [
    [
      "URBANROOF DETAILED DIAGNOSIS REPORT",
      "",
      `Property: ${samplePropertyDetails.propertyAddress}`,
      `Inspector: ${samplePropertyDetails.inspectorName}`,
      `Inspection Date: ${samplePropertyDetails.inspectionDate}`,
      `Property Type: ${samplePropertyDetails.propertyType} | Floors: ${samplePropertyDetails.floors} | Age: ${samplePropertyDetails.propertyAge} years`,
      "",
      "EXECUTIVE SUMMARY",
      ...wrapLine(
        "UrbanRoof cross-correlated 30 thermal references with inspection checklist findings and identified 7 impacted negative-side areas. Primary contributors include bathroom tile-joint distress in Flat 203, facade cracking with plumbing-related wetting, and moisture migration at slab and ceiling interfaces.",
      ),
      "",
      `Severity breakdown: Immediate ${severityCounts.immediate}, Necessary ${severityCounts.moderate}, Monitor ${severityCounts.monitor}.`,
    ],
    [
      "SECTION 1: INTRODUCTION",
      ...wrapLine(
        "UrbanRoof performed a non-destructive diagnosis using infrared thermography, checklist interpretation, and expert building pathology logic to determine likely moisture ingress paths and recommended remedial therapies.",
      ),
      "",
      "SECTION 2: GENERAL INFORMATION",
      `Client / Site: ${samplePropertyDetails.clientName}`,
      `Health Score: ${sampleInspectionAnalysis.propertyHealthScore}%`,
      `Previous Audit / Repairs: ${sampleInspectionAnalysis.previousAuditOrRepairs}`,
      "",
      "SECTION 3.1: SOURCES OF LEAKAGE SUMMARY",
      ...wrapLine(
        "Bathroom: open tile joints and hollow tiles in Flat 203 indicate active transfer through wall and floor interfaces.",
      ),
      ...wrapLine(
        "Balcony: grout deterioration and threshold ponding allow lateral migration under tile bed.",
      ),
      ...wrapLine(
        "Terrace / upper wet area: delayed waterproofing distress likely contributes to ceiling level ingress.",
      ),
      ...wrapLine(
        "External wall: moderate cracks, algae/fungus, and plumbing issues contribute to rainwater penetration.",
      ),
    ],
    [
      "SECTION 3.2 - 3.9: NEGATIVE SIDE INPUTS",
      ...sampleInspectionAnalysis.impactedAreas.flatMap((item, index) => [
        `${index + 1}. ${item.area} (${item.severity.toUpperCase()})`,
        ...wrapLine(item.description),
        "",
      ]),
      "POSITIVE SIDE INPUTS",
      ...sampleInspectionAnalysis.positiveSideInputs.flatMap((item, index) => [
        `${index + 1}. ${item.area} (${item.risk.toUpperCase()})`,
        ...wrapLine(item.description),
        "",
      ]),
    ],
    [
      "SECTION 4: ANALYSIS & SUGGESTIONS",
      ...wrapLine(
        "Recommended therapies include polymer-modified grouting at the bathroom wet area, replacement of hollow tiles, sealing of floor-wall junctions, external crack treatment with elastomeric repair mortar, balcony threshold waterproofing, and localized RCC/plaster repair at ceiling and parking-level affected zones.",
      ),
      "",
      "DELAYED ACTION RISKS",
      ...sampleInspectionAnalysis.summaryTable.flatMap((item) => wrapLine(`${item.impactedArea} <- ${item.exposedArea}: ${item.link}`)),
      "",
      "THERMAL REFERENCES (SELECTED)",
      ...sampleThermalAnalysis.slice(0, 8).flatMap((item) => [
        `${item.imageId} | ${item.location} | Hot ${item.hotspot}C | Cold ${item.coldspot}C | ${item.severity.toUpperCase()}`,
        ...wrapLine(`${item.diagnosis} ${item.thermalPattern}`),
        "",
      ]),
    ],
    [
      "SECTION 5: LIMITATION AND PRECAUTION NOTE",
      ...wrapLine(
        "Findings are based on conditions visible and measurable on the date of inspection. Thermal imagery indicates moisture signatures and anomalies but does not replace invasive confirmation where required. Hidden services and inaccessible cavities may influence actual remedial scope.",
      ),
      "",
      "LEGAL DISCLAIMER",
      ...wrapLine(
        "This sample-generated report was created from the bundled UrbanRoof case data for demonstration of the AI-powered DDR workflow. Final site execution decisions should always be validated by a qualified inspection professional.",
      ),
    ],
  ];

  return pages;
}

function createPdf(linesPerPage) {
  const objects = [];
  const pageIds = [];
  const contentIds = [];
  const fontRegularId = 3;
  let nextId = 4;

  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  for (const lines of linesPerPage) {
    const streamLines = ["BT", "/F1 11 Tf", "50 790 Td", "14 TL"];
    lines.forEach((line, index) => {
      if (index === 0) {
        streamLines.push(`(${escapePdfText(line)}) Tj`);
      } else {
        streamLines.push("T*");
        streamLines.push(`(${escapePdfText(line)}) Tj`);
      }
    });
    streamLines.push("ET");
    const stream = streamLines.join("\n");
    const contentId = nextId;
    const pageId = nextId + 1;
    contentIds.push(contentId);
    pageIds.push(pageId);
    objects[contentId] = `<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`;
    objects[pageId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontRegularId} 0 R >> >> /Contents ${contentId} 0 R >>`;
    nextId += 2;
  }

  objects[2] = `<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds
    .map((id) => `${id} 0 R`)
    .join(" ")}] >>`;

  const bodyParts = [];
  const offsets = [0];
  let cursor = 0;

  for (let id = 1; id < objects.length; id += 1) {
    const objectBody = `${id} 0 obj\n${objects[id]}\nendobj\n`;
    bodyParts.push(objectBody);
    offsets[id] = cursor;
    cursor += Buffer.byteLength(objectBody, "utf8");
  }

  const header = "%PDF-1.4\n";
  let fileContent = header + bodyParts.join("");
  const xrefStart = Buffer.byteLength(fileContent, "utf8");
  let xref = `xref\n0 ${objects.length}\n0000000000 65535 f \n`;

  for (let id = 1; id < objects.length; id += 1) {
    const absoluteOffset = Buffer.byteLength(header, "utf8") + offsets[id];
    xref += `${String(absoluteOffset).padStart(10, "0")} 00000 n \n`;
  }

  fileContent += `${xref}trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return fileContent;
}

fs.mkdirSync(outputDir, { recursive: true });
const pages = buildPages();
fs.writeFileSync(outputPdf, createPdf(pages), "binary");
fs.writeFileSync(
  outputJson,
  JSON.stringify(
    {
      propertyDetails: samplePropertyDetails,
      inspection: sampleInspectionAnalysis,
      thermalSample: sampleThermalAnalysis.slice(0, 10),
    },
    null,
    2,
  ),
);

console.log(`Sample report assets generated in ${outputDir}`);

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
  const words = String(text).split(/\s+/);
  const lines = [];
  let current = "";

  for (const word of words) {
    const proposed = current ? `${current} ${word}` : word;
    if (proposed.length > maxLength) {
      if (current) {
        lines.push(current);
      }
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
  return String(text).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function summarizeArea(area) {
  const thermalMatches = sampleThermalAnalysis.filter((item) =>
    `${item.location} ${item.suggestedArea}`.toLowerCase().includes(area.area.toLowerCase().split(" ")[0]),
  );
  const positiveMatch = sampleInspectionAnalysis.positiveSideInputs[0];

  return {
    area: area.area,
    observation: area.description,
    rootCause: positiveMatch
      ? `${positiveMatch.area}: ${positiveMatch.description}`
      : "Not Available",
    severity: area.severity,
    reasoning: thermalMatches.length
      ? `${thermalMatches[0].diagnosis} Thermal evidence also shows ${thermalMatches[0].thermalPattern.toLowerCase()}`
      : "Not Available",
    actions: [
      "Inspect and repair the source-side leakage path.",
      "Carry out local surface repair after moisture entry is stopped.",
    ],
  };
}

function buildPages() {
  const areas = sampleInspectionAnalysis.impactedAreas.map(summarizeArea);
  const keyFindings = areas.slice(0, 4).map(
    (item) => `${item.area}: ${item.severity.toUpperCase()} concern linked to ${item.rootCause}.`,
  );

  const pages = [
    [
      "URBANROOF MAIN DDR",
      "",
      `Property: ${samplePropertyDetails.propertyAddress}`,
      `Inspector: ${samplePropertyDetails.inspectorName}`,
      `Inspection Date: ${samplePropertyDetails.inspectionDate}`,
      "",
      "1. PROPERTY ISSUE SUMMARY",
      ...wrapLine(
        `This sample DDR combines the inspection report and thermal report for ${samplePropertyDetails.propertyType.toLowerCase()} premises at ${samplePropertyDetails.propertyAddress}.`,
      ),
      ...keyFindings.flatMap((item) => wrapLine(`- ${item}`)),
    ],
    [
      "2. AREA-WISE OBSERVATIONS",
      ...areas.slice(0, 3).flatMap((item) => [
        ...wrapLine(`${item.area}`),
        ...wrapLine(`Observation: ${item.observation}`),
        ...wrapLine(`Probable Root Cause: ${item.rootCause}`),
        ...wrapLine(`Severity Assessment: ${item.severity.toUpperCase()} - ${item.reasoning}`),
        ...wrapLine(`Recommended Actions: ${item.actions.join(" ")}`),
        ...wrapLine("Additional Notes: Image Not Available in this static sample artifact."),
        "",
      ]),
    ],
    [
      "2. AREA-WISE OBSERVATIONS (CONTINUED)",
      ...areas.slice(3).flatMap((item) => [
        ...wrapLine(`${item.area}`),
        ...wrapLine(`Observation: ${item.observation}`),
        ...wrapLine(`Probable Root Cause: ${item.rootCause}`),
        ...wrapLine(`Severity Assessment: ${item.severity.toUpperCase()} - ${item.reasoning}`),
        ...wrapLine(`Recommended Actions: ${item.actions.join(" ")}`),
        ...wrapLine("Additional Notes: Image Not Available in this static sample artifact."),
        "",
      ]),
    ],
    [
      "3. PROBABLE ROOT CAUSE",
      ...areas.flatMap((item) => wrapLine(`- ${item.area}: ${item.rootCause}`)),
      "",
      "4. SEVERITY ASSESSMENT",
      ...areas.flatMap((item) => wrapLine(`- ${item.area}: ${item.severity.toUpperCase()} because ${item.reasoning}`)),
    ],
    [
      "5. RECOMMENDED ACTIONS",
      ...areas.flatMap((item) => wrapLine(`- ${item.area}: ${item.actions.join(" ")}`)),
      "",
      "6. ADDITIONAL NOTES",
      ...wrapLine(
        `- Property health score from the inspection form: ${sampleInspectionAnalysis.propertyHealthScore}%.`,
      ),
      ...wrapLine(`- Thermal references reviewed: ${sampleThermalAnalysis.length}.`),
      ...wrapLine("- This static sample script does not embed report images."),
      "",
      "7. MISSING OR UNCLEAR INFORMATION",
      ...wrapLine("- Not Available: exact repair history before inspection."),
      "",
      "8. CONFLICTING DETAILS",
      ...wrapLine("- Not Available."),
    ],
  ];

  return pages;
}

function createPdf(linesPerPage) {
  const objects = [];
  const pageIds = [];
  const fontRegularId = 3;
  let nextId = 4;

  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  for (const lines of linesPerPage) {
    const streamLines = ["BT", "/F1 11 Tf", "50 790 Td", "14 TL"];
    lines.forEach((line, index) => {
      if (index > 0) {
        streamLines.push("T*");
      }
      streamLines.push(`(${escapePdfText(line)}) Tj`);
    });
    streamLines.push("ET");

    const stream = streamLines.join("\n");
    const contentId = nextId;
    const pageId = nextId + 1;
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

const sampleSummary = {
  propertyDetails: samplePropertyDetails,
  inspectionAnalysis: sampleInspectionAnalysis,
  thermalSample: sampleThermalAnalysis.slice(0, 10),
  note: "This sample artifact is a lightweight static export and is not the same as the live in-app PDF export.",
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPdf, createPdf(buildPages()), "binary");
fs.writeFileSync(outputJson, JSON.stringify(sampleSummary, null, 2));

console.log(`Sample report assets generated in ${outputDir}`);

import {
  INSPECTION_ANALYSIS_PROMPT,
  REPORT_GENERATION_PROMPT,
  sendGeminiRequest,
} from "./geminiApi";
import {
  sampleInspectionAnalysis,
  samplePropertyDetails,
  sampleThermalAnalysis,
} from "../data/sampleData";

function groupSeverity(thermalData) {
  return thermalData.reduce(
    (accumulator, entry) => {
      accumulator[entry.severity] += 1;
      return accumulator;
    },
    { immediate: 0, moderate: 0, monitor: 0 },
  );
}

function createExecutiveSummary({ propertyDetails, thermalData, inspectionData }) {
  const severity = groupSeverity(thermalData);
  return [
    `UrbanRoof conducted a non-destructive diagnosis of ${propertyDetails.propertyType.toLowerCase()} premises at ${propertyDetails.propertyAddress}.`,
    `The inspection cross-referenced ${thermalData.length} thermal references with on-site checklist findings and recorded ${inspectionData.impactedAreas.length} impacted negative-side areas.`,
    "The dominant leakage contributors are bathroom tile-joint distress in Flat 203, facade cracking with external plumbing wetting, and moisture migration at ceiling/slab interfaces.",
    `Severity distribution indicates ${severity.immediate} immediate repairs, ${severity.moderate} necessary remedial actions, and ${severity.monitor} monitoring observations.`,
  ];
}

function createLeakageSummary(inspectionData) {
  return [
    {
      area: "Bathroom",
      finding: inspectionData.checklistResponses.bathroom.notes,
      likelyCause:
        "Open tile joints, hollow tiles and possible concealed wet-area transfer through masonry.",
      urgency: "Immediate",
    },
    {
      area: "Balcony",
      finding: inspectionData.checklistResponses.balcony.notes,
      likelyCause:
        "Failed grout lines and threshold ponding enabling lateral migration below tile bed.",
      urgency: "Necessary",
    },
    {
      area: "Terrace",
      finding: inspectionData.checklistResponses.terrace.notes,
      likelyCause:
        "Delayed waterproofing deterioration and slab interface seepage.",
      urgency: "Necessary",
    },
    {
      area: "External Wall",
      finding: inspectionData.checklistResponses.externalWall.notes,
      likelyCause:
        "Facade cracks, algae-bearing wetness and plumbing-related wall saturation.",
      urgency: "Immediate",
    },
  ];
}

function createTherapies() {
  return [
    {
      action: "Bathroom wet-area rectification",
      therapy:
        "Rake open failed joints, execute polymer-modified grouting, replace hollow tiles where required, and seal floor-wall junctions.",
      priority: "Immediate",
      linkedAreas: ["Bedroom", "Common Bathroom Ceiling", "Hall"],
    },
    {
      action: "External wall and plumbing treatment",
      therapy:
        "Seal cracks with elastomeric repair mortar, rectify exposed plumbing defects, treat algae/fungus, and apply breathable waterproof coating.",
      priority: "Immediate",
      linkedAreas: ["Master Bedroom", "Kitchen", "External wall affected rooms"],
    },
    {
      action: "Balcony threshold remediation",
      therapy:
        "Restore slope, regrout and waterproof the threshold and tile bed interface to prevent lateral ingress.",
      priority: "Necessary",
      linkedAreas: ["Hall", "Balcony-adjacent wall"],
    },
    {
      action: "Ceiling/slab repair",
      therapy:
        "Open distressed plaster, dry substrate, carry out RCC/plaster repair where required, and reinstate with waterproof protection.",
      priority: "Necessary",
      linkedAreas: ["Common Bathroom Ceiling", "Parking Area"],
    },
  ];
}

function createDelayedActionRisks() {
  return [
    "Expansion of damp zones leading to larger plaster delamination and paint failure.",
    "Acceleration of fungal growth, indoor air-quality deterioration, and occupant discomfort.",
    "Progressive RCC corrosion risk where repeated saturation affects reinforcement-bearing elements.",
    "Wider lateral migration into adjacent rooms, joinery, and electrical service interfaces.",
  ];
}

function buildFallbackNarrative({ propertyDetails, thermalData, inspectionData }) {
  const executiveSummary = createExecutiveSummary({
    propertyDetails,
    thermalData,
    inspectionData,
  });
  const leakageSummary = createLeakageSummary(inspectionData);
  const thermalReferences = thermalData.map((entry, index) => ({
    serial: index + 1,
    imageId: entry.imageId,
    location: entry.location,
    hotspot: entry.hotspot,
    coldspot: entry.coldspot,
    emissivity: entry.emissivity,
    diagnosis: entry.diagnosis,
    thermalPattern: entry.thermalPattern,
    severity: entry.severity,
  }));

  return {
    meta: {
      generatedOn: new Date().toLocaleDateString("en-GB"),
      reportCode: "UR-DDR-2022-0927-AI",
      version: "1.0",
    },
    executiveSummary,
    introduction: {
      background:
        "UrbanRoof conducted a detailed building diagnosis using infrared thermography, moisture interpretation, and inspection checklist correlation to identify probable leakage and dampness contributors.",
      objective:
        "To determine the likely source of moisture ingress, classify urgency, and recommend practical therapies aligned with UrbanRoof's diagnosis methodology.",
      scope:
        "The assessment covers observable negative-side affected areas, positive-side source zones, thermal references, and cross-correlation with site checklist inputs.",
      toolsUsed: [
        "Bosch GTC 400C Thermal Camera (Serial: 02700034772)",
        "Moisture meter",
        "Crack gauge",
        "Tapping hammer",
      ],
    },
    generalInformation: {
      clientTable: [
        ["Client / Site", propertyDetails.clientName || "UrbanRoof Demo Client"],
        ["Property Address", propertyDetails.propertyAddress],
        ["Property Type", propertyDetails.propertyType],
        ["Inspection Date", propertyDetails.inspectionDate],
        ["Inspector Name", propertyDetails.inspectorName],
        ["Report Reference", "UrbanRoof Detailed Diagnosis Report"],
      ],
      siteTable: [
        ["Floors in Building", propertyDetails.floors],
        ["Approximate Property Age", `${propertyDetails.propertyAge} years`],
        ["Previous Audit / Repairs", inspectionData.previousAuditOrRepairs],
        ["Property Health Score", `${inspectionData.propertyHealthScore}%`],
        ["Impacted Areas Identified", `${inspectionData.impactedAreas.length}`],
        ["Thermal References Reviewed", `${thermalData.length}`],
      ],
    },
    leakageSummary,
    negativeSideInputs: inspectionData.impactedAreas,
    positiveSideInputs: inspectionData.positiveSideInputs,
    checklistResponses: inspectionData.checklistResponses,
    therapies: createTherapies(),
    delayedActionRisks: createDelayedActionRisks(),
    summaryTable: inspectionData.summaryTable,
    thermalReferences,
    visualReferences: inspectionData.positiveSideInputs.map((item, index) => ({
      serial: index + 1,
      area: item.area,
      description: item.description,
      risk: item.risk,
    })),
    limitations: [
      "Findings are based on conditions visible and measurable on the date of inspection.",
      "Thermal images indicate moisture signatures and thermal anomalies; intrusive confirmation was not undertaken.",
      "Hidden services, inaccessible cavities, and future changes in occupancy or climate may alter observed behavior.",
    ],
    legalDisclaimer:
      "This DDR is an expert opinion generated from available inspection inputs, thermal imagery, and AI-assisted report drafting. Final remedial scope should be validated on site before execution.",
  };
}

function normalizeInspectionResponse(result) {
  return {
    ...sampleInspectionAnalysis,
    ...result,
    impactedAreas: result.impactedAreas || sampleInspectionAnalysis.impactedAreas,
    positiveSideInputs:
      result.positiveSideInputs || sampleInspectionAnalysis.positiveSideInputs,
    checklistResponses:
      result.checklistResponses || sampleInspectionAnalysis.checklistResponses,
    summaryTable: result.summaryTable || sampleInspectionAnalysis.summaryTable,
  };
}

export async function analyzeInspectionDocument({ file, propertyDetails }) {
  if (!file) {
    throw new Error("Upload the Inspection Checklist PDF before generating the report.");
  }

  try {
    const result = await sendGeminiRequest({
      prompt: INSPECTION_ANALYSIS_PROMPT,
      file,
      context: {
        propertyDetails,
        sampleHints: sampleInspectionAnalysis,
      },
    });

    return normalizeInspectionResponse(result);
  } catch (error) {
    console.error("Inspection analysis failed.", error);
    throw new Error(
      "Unable to analyze the inspection PDF. Please verify the file and Gemini configuration.",
    );
  }
}

export async function generateDiagnosisReport({
  propertyDetails = samplePropertyDetails,
  thermalData = sampleThermalAnalysis,
  inspectionData = sampleInspectionAnalysis,
}) {
  const fallbackReport = buildFallbackNarrative({
    propertyDetails,
    thermalData,
    inspectionData,
  });

  try {
    const result = await sendGeminiRequest({
      prompt: REPORT_GENERATION_PROMPT,
      context: {
        propertyDetails,
        thermalData,
        inspectionData,
        desiredSchema: {
          executiveSummary: ["string"],
          introduction: {
            background: "string",
            objective: "string",
            scope: "string",
            toolsUsed: ["string"],
          },
          generalInformation: {
            clientTable: [["label", "value"]],
            siteTable: [["label", "value"]],
          },
          leakageSummary: [
            { area: "string", finding: "string", likelyCause: "string", urgency: "string" },
          ],
          negativeSideInputs: [
            { area: "string", description: "string", severity: "string", observedAt: "string" },
          ],
          positiveSideInputs: [{ area: "string", description: "string", risk: "string" }],
          checklistResponses: {
            bathroom: { selected: true, notes: "string" },
            balcony: { selected: true, notes: "string" },
            terrace: { selected: true, notes: "string" },
            externalWall: { selected: true, notes: "string" },
          },
          therapies: [
            { action: "string", therapy: "string", priority: "string", linkedAreas: ["string"] },
          ],
          delayedActionRisks: ["string"],
          summaryTable: [
            { impactedArea: "string", exposedArea: "string", link: "string" },
          ],
          limitations: ["string"],
          legalDisclaimer: "string",
        },
      },
      maxTokens: 5000,
    });

    return {
      ...fallbackReport,
      ...result,
      thermalReferences: fallbackReport.thermalReferences,
      visualReferences:
        result.visualReferences ||
        inspectionData.positiveSideInputs.map((item, index) => ({
          serial: index + 1,
          area: item.area,
          description: item.description,
          risk: item.risk,
        })),
    };
  } catch (error) {
    console.warn("Using bundled report-generation fallback.", error);
    return fallbackReport;
  }
}

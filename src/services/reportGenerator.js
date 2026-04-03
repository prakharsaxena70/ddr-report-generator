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

const NOT_AVAILABLE = "Not Available";

function ensureText(value, fallback = NOT_AVAILABLE) {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return fallback;
}

function ensureStringList(value, fallback = [NOT_AVAILABLE]) {
  const list = Array.isArray(value)
    ? value
        .map((item) => ensureText(item, ""))
        .filter(Boolean)
    : [];

  return [...new Set(list)].length ? [...new Set(list)] : fallback;
}

function ensurePageList(value) {
  return [...new Set((Array.isArray(value) ? value : []).map(Number).filter((page) => page > 0))];
}

function normalizeArray(value, fallback = []) {
  return Array.isArray(value) && value.length ? value : fallback;
}

function keywordSet(text) {
  return ensureText(text, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

function includesAnyKeyword(sourceText, targetText) {
  const sourceWords = keywordSet(sourceText);
  const targetWords = keywordSet(targetText);
  return sourceWords.some((word) => targetWords.includes(word));
}

function sortBySeverity(items = []) {
  const rank = { immediate: 0, high: 0, moderate: 1, medium: 1, monitor: 2, low: 2 };
  return [...items].sort(
    (left, right) => (rank[left?.severity || left?.risk] ?? 3) - (rank[right?.severity || right?.risk] ?? 3),
  );
}

function mergeChecklistResponses(responses = {}) {
  return {
    bathroom: {
      ...sampleInspectionAnalysis.checklistResponses.bathroom,
      ...(responses.bathroom || {}),
    },
    balcony: {
      ...sampleInspectionAnalysis.checklistResponses.balcony,
      ...(responses.balcony || {}),
    },
    terrace: {
      ...sampleInspectionAnalysis.checklistResponses.terrace,
      ...(responses.terrace || {}),
    },
    externalWall: {
      ...sampleInspectionAnalysis.checklistResponses.externalWall,
      ...(responses.externalWall || {}),
    },
  };
}

function normalizeInspectionResponse(result = {}) {
  return {
    ...sampleInspectionAnalysis,
    ...result,
    impactedAreas: normalizeArray(result.impactedAreas, sampleInspectionAnalysis.impactedAreas).map(
      (item) => ({
        area: ensureText(item.area),
        description: ensureText(item.description),
        severity: ensureText(item.severity, "monitor").toLowerCase(),
        observedAt: ensureText(item.observedAt, "Negative side"),
        sourcePages: ensurePageList(item.sourcePages),
      }),
    ),
    positiveSideInputs: normalizeArray(
      result.positiveSideInputs,
      sampleInspectionAnalysis.positiveSideInputs,
    ).map((item) => ({
      area: ensureText(item.area),
      description: ensureText(item.description),
      risk: ensureText(item.risk, "medium").toLowerCase(),
      sourcePages: ensurePageList(item.sourcePages),
    })),
    checklistResponses: mergeChecklistResponses(result.checklistResponses),
    summaryTable: normalizeArray(result.summaryTable, sampleInspectionAnalysis.summaryTable).map(
      (item) => ({
        impactedArea: ensureText(item.impactedArea),
        exposedArea: ensureText(item.exposedArea),
        link: ensureText(item.link),
      }),
    ),
    conflicts: ensureStringList(result.conflicts, []),
    missingInformation: ensureStringList(result.missingInformation, []),
    previousAuditOrRepairs: ensureText(
      result.previousAuditOrRepairs,
      sampleInspectionAnalysis.previousAuditOrRepairs,
    ),
    propertyHealthScore:
      typeof result.propertyHealthScore === "number"
        ? result.propertyHealthScore
        : sampleInspectionAnalysis.propertyHealthScore,
  };
}

function normalizeThermalSeverity(value) {
  const normalized = ensureText(value, "monitor").toLowerCase();
  if (["immediate", "moderate", "monitor"].includes(normalized)) {
    return normalized;
  }
  return "monitor";
}

function severityLabel(value) {
  const normalized = ensureText(value, "Not Available");
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getHighestSeverity(impactedSeverity, thermalEntries) {
  const scores = { immediate: 3, moderate: 2, monitor: 1 };
  const impacted = normalizeThermalSeverity(impactedSeverity);
  const highestThermal = thermalEntries.reduce((best, entry) => {
    const current = normalizeThermalSeverity(entry.severity);
    return scores[current] > scores[best] ? current : best;
  }, impacted);

  return scores[highestThermal] > scores[impacted] ? highestThermal : impacted;
}

function matchThermalEntries(area, thermalData) {
  const areaKeywords = keywordSet(area);

  const directMatches = thermalData.filter((entry) => {
    const source = `${entry.location} ${entry.suggestedArea} ${entry.diagnosis}`;
    return areaKeywords.some((word) => source.toLowerCase().includes(word));
  });

  if (directMatches.length) {
    return sortBySeverity(directMatches).slice(0, 3);
  }

  return sortBySeverity(thermalData).slice(0, 2);
}

function matchPositiveInputs(area, inspectionData) {
  const fromSummary = inspectionData.summaryTable
    .filter((item) => includesAnyKeyword(item.impactedArea, area))
    .map((item) => ({
      area: item.exposedArea,
      description: item.link,
      risk: "medium",
      sourcePages: [],
    }));

  const directMatches = inspectionData.positiveSideInputs.filter(
    (item) =>
      includesAnyKeyword(item.area, area) ||
      includesAnyKeyword(item.description, area) ||
      includesAnyKeyword(area, item.description),
  );

  return sortBySeverity([...directMatches, ...fromSummary]).slice(0, 2);
}

function buildRecommendedActions(area, rootCause, severity) {
  const actions = [];

  if (/bath|tile|joint|plumb/i.test(rootCause)) {
    actions.push(
      "Open failed tile joints, repair weak spots, and seal floor-wall junctions in the wet area.",
    );
  }
  if (/external|facade|crack|wall/i.test(rootCause)) {
    actions.push(
      "Repair wall cracks, stop external water entry, and apply suitable waterproof protection.",
    );
  }
  if (/ceiling|slab|terrace/i.test(rootCause)) {
    actions.push(
      "Inspect the slab or terrace above, repair the seepage path, and restore damaged ceiling finish.",
    );
  }
  if (/shaft|service|plumb/i.test(rootCause)) {
    actions.push("Check nearby plumbing lines and service shafts for hidden leakage.");
  }
  if (!actions.length) {
    actions.push(`Carry out a focused repair investigation for the ${area} and stop moisture entry.`);
  }
  if (severity === "immediate") {
    actions.unshift("Treat this area as urgent to prevent further spread of dampness and surface damage.");
  }

  return [...new Set(actions)];
}

function buildSeverityReasoning(impactedArea, thermalEntries, positiveInputs, severity) {
  const reasons = [ensureText(impactedArea.description)];

  if (thermalEntries.length) {
    reasons.push(
      `Thermal evidence shows ${thermalEntries[0].diagnosis.toLowerCase()} at ${thermalEntries[0].location.toLowerCase()}.`,
    );
  }

  if (positiveInputs.length) {
    reasons.push(`Related source-side evidence points to ${positiveInputs[0].description.toLowerCase()}.`);
  }

  if (severity === "immediate") {
    reasons.push("The issue appears active and likely to worsen if it is delayed.");
  } else if (severity === "moderate") {
    reasons.push("The issue is established and should be repaired in the near term.");
  } else {
    reasons.push("The issue appears limited right now but should still be watched.");
  }

  return reasons.join(" ");
}

function buildAreaObservation(impactedArea, thermalData, inspectionData) {
  const thermalEntries = matchThermalEntries(impactedArea.area, thermalData);
  const positiveInputs = matchPositiveInputs(impactedArea.area, inspectionData);
  const severity = getHighestSeverity(impactedArea.severity, thermalEntries);
  const probableRootCause = positiveInputs[0]
    ? `${positiveInputs[0].area}: ${positiveInputs[0].description}`
    : NOT_AVAILABLE;

  const missingInfo = [];
  if (!positiveInputs.length) {
    missingInfo.push("Exact source-side confirmation is Not Available.");
  }
  if (!impactedArea.sourcePages.length) {
    missingInfo.push("Inspection page reference is Not Available.");
  }
  if (!thermalEntries.length) {
    missingInfo.push("Related thermal image reference is Not Available.");
  }

  const additionalNotes = [];
  if (thermalEntries.length) {
    additionalNotes.push(
      `Linked thermal evidence: ${thermalEntries.map((entry) => entry.imageId).join(", ")}.`,
    );
  } else {
    additionalNotes.push("Image Not Available.");
  }
  if (positiveInputs.length) {
    additionalNotes.push(`Related source area: ${positiveInputs.map((item) => item.area).join(", ")}.`);
  }

  return {
    area: impactedArea.area,
    observation: `${impactedArea.description} ${
      thermalEntries[0]
        ? `Thermal review also shows ${thermalEntries[0].thermalPattern.toLowerCase()}`
        : ""
    }`.trim(),
    probableRootCause,
    severityAssessment: {
      level: severity,
      reasoning: buildSeverityReasoning(impactedArea, thermalEntries, positiveInputs, severity),
    },
    recommendedActions: buildRecommendedActions(impactedArea.area, probableRootCause, severity),
    additionalNotes,
    missingOrUnclearInformation: missingInfo.length ? missingInfo : [NOT_AVAILABLE],
    conflicts: [NOT_AVAILABLE],
    evidenceRefs: {
      thermalImageIds: thermalEntries.map((entry) => entry.imageId),
      thermalPages: ensurePageList(thermalEntries.map((entry) => entry.sourcePage)),
      inspectionPages: ensurePageList([
        ...(impactedArea.sourcePages || []),
        ...positiveInputs.flatMap((item) => item.sourcePages || []),
      ]),
    },
    evidenceImages: [],
  };
}

function buildFallbackReport({ propertyDetails, thermalData, inspectionData }) {
  const areaWiseObservations = inspectionData.impactedAreas.map((item) =>
    buildAreaObservation(item, thermalData, inspectionData),
  );

  const probableRootCause = areaWiseObservations.map((item) => ({
    area: item.area,
    cause: item.probableRootCause,
    supportingEvidence: item.severityAssessment.reasoning,
  }));

  const severityAssessment = areaWiseObservations.map((item) => ({
    area: item.area,
    severity: item.severityAssessment.level,
    reasoning: item.severityAssessment.reasoning,
  }));

  const recommendedActions = areaWiseObservations.flatMap((item) =>
    item.recommendedActions.map((action) => ({
      area: item.area,
      action,
      priority: severityLabel(item.severityAssessment.level),
      reasoning: item.probableRootCause,
    })),
  );

  const additionalNotes = [
    `${thermalData.length} thermal references were cross-checked against the inspection checklist.`,
    `${inspectionData.impactedAreas.length} impacted areas were identified in the uploaded inspection form.`,
    `Property health score captured from the inspection form: ${inspectionData.propertyHealthScore}%.`,
  ];

  const missingOrUnclearInformation = [
    ...inspectionData.missingInformation,
    ...areaWiseObservations.flatMap((item) => item.missingOrUnclearInformation),
  ].filter((item) => item !== NOT_AVAILABLE);

  const conflicts = inspectionData.conflicts.length ? inspectionData.conflicts : [NOT_AVAILABLE];

  const keyFindings = areaWiseObservations.slice(0, 4).map((item) => {
    const rootCause = item.probableRootCause === NOT_AVAILABLE ? "a source not confirmed" : item.probableRootCause;
    return `${item.area}: ${item.severityAssessment.level} concern linked to ${rootCause}.`;
  });

  return {
    meta: {
      generatedOn: new Date().toLocaleDateString("en-GB"),
      reportType: "Detailed Diagnostic Report",
      reportVersion: "2.0",
    },
    propertyDetails: {
      ...samplePropertyDetails,
      ...propertyDetails,
    },
    propertyIssueSummary: {
      headline: "Property moisture and leakage diagnosis summary",
      overview: `This report combines the uploaded thermal report and inspection report for ${propertyDetails.propertyAddress}. The system identified ${inspectionData.impactedAreas.length} affected areas and used both source-side and thermal evidence to prepare a client-friendly diagnosis.`,
      keyFindings,
    },
    areaWiseObservations,
    probableRootCause,
    severityAssessment,
    recommendedActions,
    additionalNotes,
    missingOrUnclearInformation:
      missingOrUnclearInformation.length ? [...new Set(missingOrUnclearInformation)] : [NOT_AVAILABLE],
    conflicts,
    sourceDocuments: {
      thermalReport: `${thermalData.length} thermal entries analyzed`,
      inspectionReport: `${inspectionData.impactedAreas.length} impacted areas extracted`,
    },
  };
}

function normalizeObservation(item, fallback) {
  const evidenceRefs = item?.evidenceRefs || {};

  return {
    area: ensureText(item?.area, fallback.area),
    observation: ensureText(item?.observation, fallback.observation),
    probableRootCause: ensureText(item?.probableRootCause, fallback.probableRootCause),
    severityAssessment: {
      level: ensureText(item?.severityAssessment?.level, fallback.severityAssessment.level),
      reasoning: ensureText(
        item?.severityAssessment?.reasoning,
        fallback.severityAssessment.reasoning,
      ),
    },
    recommendedActions: ensureStringList(
      item?.recommendedActions,
      fallback.recommendedActions,
    ),
    additionalNotes: ensureStringList(item?.additionalNotes, fallback.additionalNotes),
    missingOrUnclearInformation: ensureStringList(
      item?.missingOrUnclearInformation,
      fallback.missingOrUnclearInformation,
    ),
    conflicts: ensureStringList(item?.conflicts, fallback.conflicts),
    evidenceRefs: {
      thermalImageIds: ensureStringList(
        evidenceRefs.thermalImageIds,
        fallback.evidenceRefs.thermalImageIds,
      ),
      thermalPages: ensurePageList(evidenceRefs.thermalPages).length
        ? ensurePageList(evidenceRefs.thermalPages)
        : fallback.evidenceRefs.thermalPages,
      inspectionPages: ensurePageList(evidenceRefs.inspectionPages).length
        ? ensurePageList(evidenceRefs.inspectionPages)
        : fallback.evidenceRefs.inspectionPages,
    },
    evidenceImages: Array.isArray(item?.evidenceImages) ? item.evidenceImages : fallback.evidenceImages,
  };
}

function mergeGeneratedReport(result, fallbackReport) {
  const resultByArea = new Map(
    normalizeArray(result.areaWiseObservations, []).map((item) => [
      ensureText(item.area, "").toLowerCase(),
      item,
    ]),
  );
  const probableByArea = new Map(
    normalizeArray(result.probableRootCause, []).map((item) => [
      ensureText(item.area, "").toLowerCase(),
      item,
    ]),
  );
  const severityByArea = new Map(
    normalizeArray(result.severityAssessment, []).map((item) => [
      ensureText(item.area, "").toLowerCase(),
      item,
    ]),
  );
  const mergedAreaObservations = fallbackReport.areaWiseObservations.map((fallback) => {
    const generated = resultByArea.get(fallback.area.toLowerCase()) || {};
    return normalizeObservation(generated, fallback);
  });

  return {
    ...fallbackReport,
    ...result,
    propertyIssueSummary: {
      ...fallbackReport.propertyIssueSummary,
      ...(result.propertyIssueSummary || {}),
      headline: ensureText(result.propertyIssueSummary?.headline, fallbackReport.propertyIssueSummary.headline),
      overview: ensureText(result.propertyIssueSummary?.overview, fallbackReport.propertyIssueSummary.overview),
      keyFindings: ensureStringList(
        result.propertyIssueSummary?.keyFindings,
        fallbackReport.propertyIssueSummary.keyFindings,
      ),
    },
    areaWiseObservations: mergedAreaObservations,
    probableRootCause: fallbackReport.probableRootCause.map((fallback) => {
      const item = probableByArea.get(fallback.area.toLowerCase()) || {};
      return {
        area: ensureText(item.area, fallback.area),
        cause: ensureText(item.cause, fallback.cause),
        supportingEvidence: ensureText(
          item.supportingEvidence,
          fallback.supportingEvidence,
        ),
      };
    }),
    severityAssessment: fallbackReport.severityAssessment.map((fallback) => {
      const item = severityByArea.get(fallback.area.toLowerCase()) || {};
      return {
        area: ensureText(item.area, fallback.area),
        severity: ensureText(item.severity, fallback.severity),
        reasoning: ensureText(
          item.reasoning,
          fallback.reasoning,
        ),
      };
    }),
    recommendedActions: normalizeArray(
      result.recommendedActions,
      fallbackReport.recommendedActions,
    ).map((item, index) => ({
      area: ensureText(item.area, fallbackReport.recommendedActions[index]?.area || NOT_AVAILABLE),
      action: ensureText(item.action, fallbackReport.recommendedActions[index]?.action || NOT_AVAILABLE),
      priority: ensureText(
        item.priority,
        fallbackReport.recommendedActions[index]?.priority || NOT_AVAILABLE,
      ),
      reasoning: ensureText(
        item.reasoning,
        fallbackReport.recommendedActions[index]?.reasoning || NOT_AVAILABLE,
      ),
    })),
    additionalNotes: ensureStringList(result.additionalNotes, fallbackReport.additionalNotes),
    missingOrUnclearInformation: ensureStringList(
      result.missingOrUnclearInformation,
      fallbackReport.missingOrUnclearInformation,
    ),
    conflicts: ensureStringList(result.conflicts, fallbackReport.conflicts),
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
  const fallbackReport = buildFallbackReport({
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
        outputRequirements: [
          "Property Issue Summary",
          "Area-wise Observations",
          "Probable Root Cause",
          "Severity Assessment with reasoning",
          "Recommended Actions",
          "Additional Notes",
          "Missing or Unclear Information",
          "Conflicts",
        ],
      },
      temperature: 0.2,
    });

    return mergeGeneratedReport(result, fallbackReport);
  } catch (error) {
    console.warn("Using bundled report-generation fallback.", error);
    return fallbackReport;
  }
}

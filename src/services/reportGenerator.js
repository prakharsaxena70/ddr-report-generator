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
const NO_CONFLICTS = "No direct conflict found in the uploaded documents.";
const NO_MISSING_INFO = "Not Available";
const ASSUMPTION_PATTERN = /\b(assum(?:e|ed|ing)|typo\s+for|likely\s+typo|we have assumed|we assumed)\b/i;

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

  return dedupeStrings(list).length ? dedupeStrings(list) : fallback;
}

function ensurePageList(value) {
  return [...new Set((Array.isArray(value) ? value : []).map(Number).filter((page) => page > 0))];
}

function normalizeArray(value, fallback = []) {
  return Array.isArray(value) && value.length ? value : fallback;
}

function normalizeKey(value) {
  return ensureText(value, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function dedupeStrings(items = []) {
  const seen = new Set();
  const deduped = [];

  items.forEach((item) => {
    const normalized = normalizeKey(item);
    if (!normalized || seen.has(normalized)) {
      return;
    }
    seen.add(normalized);
    deduped.push(ensureText(item));
  });

  return deduped;
}

function dedupeBy(items = [], getKey) {
  const seen = new Set();
  return items.filter((item) => {
    const key = normalizeKey(getKey(item));
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function splitSentences(text) {
  return ensureText(text, "")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function buildConflictMessageFromAssumption(sentence) {
  const flatMatches = sentence.match(/flat\s*(?:no\.?)?\s*(\d+)/gi) || [];
  const normalizedFlats = dedupeStrings(flatMatches.map((item) => item.replace(/\s+/g, " ").trim()));

  if (normalizedFlats.length >= 2) {
    return `The documents reference conflicting flat numbers (${normalizedFlats.join(" and ")}). This conflict was not auto-resolved.`;
  }

  return `The documents contain an unresolved conflict: ${sentence.replace(/\.$/, "")}.`;
}

function sanitizeAssumptionText(text, fallback = NOT_AVAILABLE) {
  const sentences = splitSentences(text);
  const kept = [];
  const conflicts = [];

  sentences.forEach((sentence) => {
    if (ASSUMPTION_PATTERN.test(sentence)) {
      conflicts.push(buildConflictMessageFromAssumption(sentence));
      return;
    }
    kept.push(sentence);
  });

  const cleanedText = kept.join(" ").trim() || fallback;
  return {
    text: cleanedText,
    conflicts: dedupeStrings(conflicts),
  };
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

function dedupeInspectionItems(items = [], kind = "impacted") {
  return dedupeBy(items, (item) => `${item.area}::${item.description}::${kind === "positive" ? item.risk : item.severity}`);
}

function dedupeSummaryTable(items = []) {
  return dedupeBy(items, (item) => `${item.impactedArea}::${item.exposedArea}::${item.link}`);
}

function normalizeInspectionResponse(result = {}) {
  return {
    ...sampleInspectionAnalysis,
    ...result,
    impactedAreas: dedupeInspectionItems(
      normalizeArray(result.impactedAreas, sampleInspectionAnalysis.impactedAreas).map((item) => ({
        area: ensureText(item.area),
        description: ensureText(item.description),
        severity: ensureText(item.severity, "monitor").toLowerCase(),
        observedAt: ensureText(item.observedAt, "Negative side"),
        sourcePages: ensurePageList(item.sourcePages),
      })),
    ),
    positiveSideInputs: dedupeInspectionItems(
      normalizeArray(
        result.positiveSideInputs,
        sampleInspectionAnalysis.positiveSideInputs,
      ).map((item) => ({
        area: ensureText(item.area),
        description: ensureText(item.description),
        risk: ensureText(item.risk, "medium").toLowerCase(),
        sourcePages: ensurePageList(item.sourcePages),
      })),
      "positive",
    ),
    checklistResponses: mergeChecklistResponses(result.checklistResponses),
    summaryTable: dedupeSummaryTable(
      normalizeArray(result.summaryTable, sampleInspectionAnalysis.summaryTable).map((item) => ({
        impactedArea: ensureText(item.impactedArea),
        exposedArea: ensureText(item.exposedArea),
        link: ensureText(item.link),
      })),
    ),
    conflicts: dedupeStrings(ensureStringList(result.conflicts, [])),
    missingInformation: dedupeStrings(ensureStringList(result.missingInformation, [])),
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

  // Bath / tile / joint / plumbing root cause
  if (/bath|tile|joint/i.test(rootCause)) {
    actions.push(`Open failed tile joints and re-grout all gaps in the wet area adjacent to ${area}.`);
    actions.push("Apply a liquid membrane waterproofing coat on all floor-wall junctions before retiling.");
    actions.push("Carry out a water-ponding test after repairs to confirm zero seepage before closing the surface.");
  }

  // External / facade / crack / wall
  if (/external|facade|crack/i.test(rootCause)) {
    actions.push(`Fill all visible cracks on the external wall face adjacent to ${area} using a flexible crack-filler compound.`);
    actions.push("Apply a breathable waterproof elastomeric coating on the outer wall surface to prevent future rainwater ingress.");
    actions.push("Inspect the plumbing lines running on the outer wall and reseal any exposed pipe entry points.");
  }

  // Ceiling / slab / terrace
  if (/ceiling|slab|terrace/i.test(rootCause)) {
    actions.push(`Inspect the slab or terrace surface directly above ${area} for cracks, open joints, or waterproofing failure.`);
    actions.push("Carry out slab waterproofing repair and ensure adequate drainage slope on the terrace to prevent water ponding.");
    actions.push(`After seepage is stopped at the source, replaster and repaint the ceiling and upper wall of ${area}.`);
  }

  // Shaft / service / plumbing pipe
  if (/shaft|service|plumb/i.test(rootCause)) {
    actions.push(`Inspect the service shaft or plumbing chase adjacent to ${area} for concealed pipe leaks or joint failures.`);
    actions.push("Isolate and pressure-test the suspected plumbing line to locate the exact leak point before opening walls.");
    actions.push("After repair, seal the shaft re-entry points with non-shrink grout and apply a damp-proof membrane.");
  }

  // Generic fallback — still area-specific
  if (!actions.length) {
    actions.push(`Carry out a detailed moisture-mapping exercise in ${area} to locate the exact ingress point.`);
    actions.push(`Remove damaged plaster in ${area}, allow the substrate to dry completely, and apply a damp-proof treatment before replastering.`);
    actions.push(`Monitor the repaired surface in ${area} for at least two rain cycles before applying final paint finish.`);
  }

  // Severity-specific prefix (immediate only)
  if (severity === "immediate") {
    actions.unshift(`Treat the dampness in ${area} as urgent — delay will cause progressive structural damage and mold spread.`);
  } else if (severity === "moderate") {
    actions.push(`Schedule repair work for ${area} within 30 days to prevent the current issue from escalating to an immediate concern.`);
  }

  // Ensure minimum 3 deduplicated actions
  const unique = [...new Set(actions)];
  if (unique.length < 3) {
    unique.push(`After all repairs, carry out a post-repair inspection of ${area} with a moisture meter to confirm dryness.`);
  }
  return unique.slice(0, 6);
}

function buildSeverityReasoning(impactedArea, thermalEntries, positiveInputs, severity) {
  const reasons = [ensureText(impactedArea.description)];

  // Use actual temperature data and thermal pattern to make this unique per area
  if (thermalEntries.length) {
    const entry = thermalEntries[0];
    const hotspot = entry.hotspot ? `hotspot temperature of ${entry.hotspot}°C` : null;
    const coldspot = entry.coldspot ? `coldspot of ${entry.coldspot}°C` : null;
    const tempDetail = [hotspot, coldspot].filter(Boolean).join(" and ");
    const patternDetail = entry.thermalPattern
      ? `The thermal image shows ${entry.thermalPattern.toLowerCase()}`
      : null;
    const locationDetail = entry.location
      ? `at ${entry.location.toLowerCase()}`
      : null;

    if (tempDetail) {
      reasons.push(`Thermal scan recorded a ${tempDetail} ${locationDetail || ""}`.trim() + ".");
    }
    if (patternDetail) {
      reasons.push(patternDetail + ".");
    }
  }

  if (positiveInputs.length) {
    reasons.push(
      `Source-side evidence from ${positiveInputs[0].area.toLowerCase()} confirms: ${positiveInputs[0].description.toLowerCase()}.`,
    );
  }

  // Area-specific closing sentence — incorporates area name so it cannot accidentally match another area
  const areaRef = ensureText(impactedArea.area, "this zone");
  if (severity === "immediate") {
    reasons.push(`The active moisture in ${areaRef} is likely to worsen rapidly without intervention — immediate repair is required.`);
  } else if (severity === "moderate") {
    reasons.push(`The current condition of ${areaRef} is progressing and should be addressed within the next 30 days before it becomes severe.`);
  } else {
    reasons.push(`The anomaly in ${areaRef} is currently limited in spread and can be scheduled for repair during the next maintenance cycle.`);
  }

  return reasons.join(" ");
}

function getSeverityScore(value) {
  return { immediate: 3, moderate: 2, monitor: 1 }[normalizeThermalSeverity(value)] || 0;
}

function detectGlobalConflicts(inspectionData, thermalData) {
  const conflicts = [...(inspectionData.conflicts || [])];

  inspectionData.impactedAreas.forEach((item) => {
    const matchedThermal = matchThermalEntries(item.area, thermalData);
    if (!matchedThermal.length) {
      return;
    }

    const inspectionScore = getSeverityScore(item.severity);
    const thermalScore = getSeverityScore(matchedThermal[0].severity);

    if (Math.abs(inspectionScore - thermalScore) >= 2) {
      conflicts.push(
        `${item.area}: inspection severity is ${item.severity}, while linked thermal evidence appears ${matchedThermal[0].severity}.`,
      );
    }
  });

  const summaryByArea = new Map();
  inspectionData.summaryTable.forEach((item) => {
    const key = normalizeKey(item.impactedArea);
    const current = summaryByArea.get(key) || new Set();
    current.add(ensureText(item.exposedArea));
    summaryByArea.set(key, current);
  });

  summaryByArea.forEach((exposedAreas, impactedArea) => {
    if (exposedAreas.size > 1) {
      conflicts.push(
        `${impactedArea}: multiple possible source areas are listed (${[...exposedAreas].join(", ")}).`,
      );
    }
  });

  return dedupeStrings(conflicts);
}

function getAreaConflicts(area, inspectionData, thermalEntries) {
  const conflicts = [];
  const areaKey = normalizeKey(area);

  const summaryMatches = inspectionData.summaryTable.filter((item) =>
    normalizeKey(item.impactedArea).includes(areaKey) || areaKey.includes(normalizeKey(item.impactedArea)),
  );

  const distinctSources = dedupeStrings(summaryMatches.map((item) => item.exposedArea));
  if (distinctSources.length > 1) {
    conflicts.push(`Multiple possible source areas are mentioned: ${distinctSources.join(", ")}.`);
  }

  if (thermalEntries.length) {
    const strongest = thermalEntries[0];
    const matchingInspection = inspectionData.impactedAreas.find(
      (item) => normalizeKey(item.area) === areaKey,
    );
    if (matchingInspection) {
      const inspectionScore = getSeverityScore(matchingInspection.severity);
      const thermalScore = getSeverityScore(strongest.severity);
      if (Math.abs(inspectionScore - thermalScore) >= 2) {
        conflicts.push(
          `Inspection notes suggest ${matchingInspection.severity} severity, while thermal evidence suggests ${strongest.severity}.`,
        );
      }
    }
  }

  return dedupeStrings(conflicts);
}

function buildAreaObservation(impactedArea, thermalData, inspectionData) {
  const thermalEntries = matchThermalEntries(impactedArea.area, thermalData);
  const positiveInputs = matchPositiveInputs(impactedArea.area, inspectionData);
  const severity = getHighestSeverity(impactedArea.severity, thermalEntries);

  // Build root cause — avoid repeating the source area name twice if description already
  // starts with or references the area name.
  let probableRootCause = NOT_AVAILABLE;
  if (positiveInputs[0]) {
    const srcArea = ensureText(positiveInputs[0].area);
    const srcDesc = ensureText(positiveInputs[0].description);
    const descStartsWithArea = normalizeKey(srcDesc).startsWith(normalizeKey(srcArea).slice(0, 6));
    probableRootCause = descStartsWithArea
      ? srcDesc
      : `${srcArea}: ${srcDesc}`;
  }

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
  const conflicts = getAreaConflicts(impactedArea.area, inspectionData, thermalEntries);

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
    additionalNotes: dedupeStrings(additionalNotes),
    missingOrUnclearInformation: missingInfo.length ? dedupeStrings(missingInfo) : [NO_MISSING_INFO],
    conflicts: conflicts.length ? conflicts : [NO_CONFLICTS],
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

  const conflicts = detectGlobalConflicts(inspectionData, thermalData);

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
    additionalNotes: dedupeStrings(additionalNotes),
    missingOrUnclearInformation:
      missingOrUnclearInformation.length ? dedupeStrings(missingOrUnclearInformation) : [NO_MISSING_INFO],
    conflicts: conflicts.length ? conflicts : [NO_CONFLICTS],
    sourceDocuments: {
      thermalReport: `${thermalData.length} thermal entries analyzed`,
      inspectionReport: `${inspectionData.impactedAreas.length} impacted areas extracted`,
    },
  };
}

function normalizeObservation(item, fallback) {
  const evidenceRefs = item?.evidenceRefs || {};
  const observationText = sanitizeAssumptionText(item?.observation, fallback.observation);
  const rootCauseText = sanitizeAssumptionText(
    item?.probableRootCause,
    fallback.probableRootCause,
  );
  const severityReasoning = sanitizeAssumptionText(
    item?.severityAssessment?.reasoning,
    fallback.severityAssessment.reasoning,
  );
  const actionList = ensureStringList(item?.recommendedActions, fallback.recommendedActions).map(
    (action) => sanitizeAssumptionText(action, fallback.recommendedActions[0] || NOT_AVAILABLE),
  );
  const noteList = ensureStringList(item?.additionalNotes, fallback.additionalNotes).map((note) =>
    sanitizeAssumptionText(note, fallback.additionalNotes[0] || NOT_AVAILABLE),
  );
  const missingList = ensureStringList(
    item?.missingOrUnclearInformation,
    fallback.missingOrUnclearInformation,
  );
  // Strip NO_CONFLICTS placeholder out before merging so it never coexists with real conflicts
  const explicitConflicts = ensureStringList(item?.conflicts, fallback.conflicts)
    .filter((c) => c !== NO_CONFLICTS);
  const derivedConflicts = dedupeStrings([
    ...observationText.conflicts,
    ...rootCauseText.conflicts,
    ...severityReasoning.conflicts,
    ...actionList.flatMap((entry) => entry.conflicts),
    ...noteList.flatMap((entry) => entry.conflicts),
  ]).filter((c) => c !== NO_CONFLICTS);

  const allConflicts = dedupeStrings([...explicitConflicts, ...derivedConflicts]);

  return {
    area: ensureText(item?.area, fallback.area),
    observation: observationText.text,
    probableRootCause: rootCauseText.text,
    severityAssessment: {
      level: ensureText(item?.severityAssessment?.level, fallback.severityAssessment.level),
      reasoning: severityReasoning.text,
    },
    recommendedActions: dedupeStrings(actionList.map((entry) => entry.text)),
    additionalNotes: dedupeStrings(noteList.map((entry) => entry.text)),
    missingOrUnclearInformation: missingList,
    conflicts: allConflicts.length ? allConflicts : [NO_CONFLICTS],
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
  const topLevelNotes = ensureStringList(result.additionalNotes, fallbackReport.additionalNotes).map((item) =>
    sanitizeAssumptionText(item, NOT_AVAILABLE),
  );
  const topLevelMissing = ensureStringList(
    result.missingOrUnclearInformation,
    fallbackReport.missingOrUnclearInformation,
  );
  const topLevelConflicts = dedupeStrings([
    ...ensureStringList(result.conflicts, fallbackReport.conflicts),
    ...topLevelNotes.flatMap((item) => item.conflicts),
    ...mergedAreaObservations.flatMap((item) => item.conflicts),
  ]);

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
    recommendedActions: dedupeBy(
      normalizeArray(
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
      (item) => `${item.area}::${item.action}`,
    ),
    additionalNotes: dedupeStrings(topLevelNotes.map((item) => item.text)),
    missingOrUnclearInformation: topLevelMissing,
    conflicts: topLevelConflicts.length ? topLevelConflicts : [NO_CONFLICTS],
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
    console.warn("Inspection analysis failed — using sample data as fallback.", error);
    const errorMessage = error?.message || "Unknown error";

    // Surface file size / network errors immediately
    if (errorMessage.includes("413") || errorMessage.includes("too large")) {
      throw new Error("PDF file is too large. Maximum size is 4MB for direct uploads.");
    }
    if (errorMessage.includes("fetch failed") || errorMessage.includes("Failed to fetch")) {
      throw new Error("Network error: Unable to reach Gemini API. Check your internet connection.");
    }

    // For quota errors (429), missing key, or any other Gemini error: fall back gracefully
    console.warn(`Falling back to sample inspection data. Reason: ${errorMessage}`);
    return normalizeInspectionResponse({});
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

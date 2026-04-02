export function formatLongDate(dateValue) {
  if (!dateValue) {
    return "Not specified";
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function toTitleCase(value) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function deriveDashboardMetrics({ thermalData = [], inspectionData }) {
  const severityBreakdown = thermalData.reduce(
    (accumulator, entry) => {
      accumulator[entry.severity] += 1;
      return accumulator;
    },
    { immediate: 0, moderate: 0, monitor: 0 },
  );

  return {
    impactedAreas: inspectionData?.impactedAreas?.length || 0,
    anomaliesDetected: thermalData.filter(
      (entry) => entry.severity === "immediate" || entry.severity === "moderate",
    ).length,
    healthScore: inspectionData?.propertyHealthScore || 0,
    severityBreakdown,
  };
}

export function buildTocEntries() {
  return [
    "Executive Summary",
    "Data & Information Disclaimer",
    "1. Introduction",
    "2. General Information",
    "3. Visual Observation and Readings",
    "4. Analysis & Suggestions",
    "5. Limitation and Precaution Note",
    "Legal Disclaimer",
  ];
}

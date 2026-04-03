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

export function toTitleCase(value = "") {
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function deriveDashboardMetrics({ report, thermalData = [], inspectionData }) {
  const severityBreakdown = (report?.severityAssessment || []).reduce(
    (accumulator, entry) => {
      const key = String(entry.severity || "").toLowerCase();
      if (accumulator[key] !== undefined) {
        accumulator[key] += 1;
      }
      return accumulator;
    },
    { immediate: 0, moderate: 0, monitor: 0 },
  );

  return {
    impactedAreas:
      report?.areaWiseObservations?.length || inspectionData?.impactedAreas?.length || 0,
    anomaliesDetected: thermalData.filter(
      (entry) => entry.severity === "immediate" || entry.severity === "moderate",
    ).length,
    healthScore: inspectionData?.propertyHealthScore || 0,
    missingInfoCount: report?.missingOrUnclearInformation?.filter(
      (item) => item && item !== "Not Available",
    ).length || 0,
    conflictsCount:
      report?.conflicts?.filter(
        (item) =>
          item &&
          item !== "Not Available" &&
          item !== "No direct conflict found in the uploaded documents.",
      ).length || 0,
    severityBreakdown,
  };
}

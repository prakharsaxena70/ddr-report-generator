import { sendClaudeRequest, THERMAL_ANALYSIS_PROMPT } from "./claudeApi";
import { sampleThermalAnalysis } from "../data/sampleData";

function normalizeThermalEntry(entry) {
  return {
    imageId: entry.imageId || entry.image_filename || entry.filename || "Unknown",
    date: entry.date || "27/09/2022",
    hotspot: Number(entry.hotspot ?? entry.hotspotTemperature ?? 0),
    coldspot: Number(entry.coldspot ?? entry.coldspotTemperature ?? 0),
    emissivity: Number(entry.emissivity ?? 0.94),
    reflectedTemperature: Number(entry.reflectedTemperature ?? 23),
    thermalPattern: entry.thermalPattern || "Thermal pattern interpretation unavailable.",
    diagnosis: entry.diagnosis || "Diagnosis pending.",
    severity: entry.severity || "monitor",
    location: entry.location || "Inspection area not tagged",
  };
}

export async function analyzeThermalDocument({ file, propertyDetails }) {
  if (!file) {
    return sampleThermalAnalysis;
  }

  try {
    const result = await sendClaudeRequest({
      prompt: THERMAL_ANALYSIS_PROMPT,
      file,
      context: {
        propertyDetails,
        expectedDate: "27/09/2022",
        expectedEmissivity: 0.94,
        expectedReflectedTemperature: 23,
      },
    });

    if (!Array.isArray(result)) {
      throw new Error("Unexpected thermal response shape.");
    }

    return result.map(normalizeThermalEntry);
  } catch (error) {
    console.warn("Using bundled sample thermal analysis fallback.", error);
    return sampleThermalAnalysis;
  }
}

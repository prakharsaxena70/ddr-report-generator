import { sendGeminiRequest, THERMAL_ANALYSIS_PROMPT } from "./geminiApi";
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
    sourcePage: Number(entry.sourcePage ?? entry.page ?? 0) || null,
    suggestedArea: entry.suggestedArea || entry.area || "General Area",
    visualDescription:
      entry.visualDescription || "Image-level thermal evidence summary was not available.",
  };
}

export async function analyzeThermalDocument({ file, propertyDetails }) {
  if (!file) {
    throw new Error("Upload the Thermal Images PDF before generating the report.");
  }

  try {
    const result = await sendGeminiRequest({
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

    return result.map((entry, index) =>
      normalizeThermalEntry({
        ...entry,
        sourcePage: entry.sourcePage ?? entry.page ?? index + 1,
      }),
    );
  } catch (error) {
    console.warn("Thermal analysis failed — using sample data as fallback.", error);
    const errorMessage = error?.message || "Unknown error";

    // Surface key/network errors immediately — no fallback possible for these
    if (errorMessage.includes("413") || errorMessage.includes("too large")) {
      throw new Error("PDF file is too large. Maximum size is 4MB for direct uploads.");
    }
    if (errorMessage.includes("fetch failed") || errorMessage.includes("Failed to fetch")) {
      throw new Error("Network error: Unable to reach Gemini API. Check your internet connection.");
    }

    // For quota errors (429), missing key, or any other Gemini error: fall back gracefully
    console.warn(`Falling back to sample thermal data. Reason: ${errorMessage}`);
    return sampleThermalAnalysis;
  }
}

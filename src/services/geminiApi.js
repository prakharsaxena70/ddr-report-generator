import { extractJsonFromText } from "../utils/json";

export const THERMAL_ANALYSIS_PROMPT = `You are an expert building thermographer. Analyze these thermal images and extract structured data.
For each thermal image, identify: image filename, date, hotspot temperature, coldspot temperature,
emissivity, and most importantly - interpret what the thermal pattern means for building health.
Look for: blue/cyan areas indicating moisture/dampness (cooler due to evaporation),
red/orange hotspots indicating thermal bridges or active leakage points,
uneven gradients indicating water ingress paths.
Return JSON array: [{imageId, date, hotspot, coldspot, emissivity, thermalPattern, diagnosis, severity}]
Severity: 'immediate' | 'moderate' | 'monitor'`;

export const INSPECTION_ANALYSIS_PROMPT = `You are a building inspection expert. Analyze this inspection form and extract:
1. All impacted areas (negative side) with their descriptions
2. All exposed/source areas (positive side) with their descriptions
3. Checklist responses for: WC/Bathroom, Balcony, Terrace, External Wall
4. Overall property health score
Return structured JSON matching UrbanRoof DDR format.`;

export const REPORT_GENERATION_PROMPT = `You are UrbanRoof's senior building diagnosis expert. Using the thermal analysis data and
inspection findings provided, generate a complete Detailed Diagnosis Report (DDR).
Write in professional technical language. For each impacted area, explain:
- What is observed (dampness, seepage, efflorescence, spalling)
- Where exactly (skirting level, ceiling, wall corner, etc.)
- The likely cause (tile joint gaps, concealed plumbing, terrace cracks, external wall cracks)
- Recommended therapy (grouting treatment, plaster work, RCC treatment, waterproofing)
Generate all sections matching UrbanRoof's DDR format exactly.`;

const DEFAULT_MODEL = "gemini-2.5-flash";
const FILE_POLL_INTERVAL_MS = 1500;
const FILE_POLL_TIMEOUT_MS = 45000;

export function getGeminiProxyUrl() {
  return import.meta.env.VITE_GEMINI_PROXY_URL || "/api/gemini";
}

export function hasGeminiProxy() {
  return Boolean(import.meta.env.VITE_GEMINI_PROXY_URL) || import.meta.env.PROD;
}

function getGeminiUploadUrl() {
  return "/api/gemini-upload";
}

function getGeminiFileUrl(name) {
  return `/api/gemini-file?name=${encodeURIComponent(name)}`;
}

function parseGeminiJsonResponse(response) {
  const textBlocks = Array.isArray(response?.candidates)
    ? response.candidates
        .flatMap((candidate) => candidate?.content?.parts || [])
        .filter((part) => typeof part.text === "string")
        .map((part) => part.text)
        .join("\n")
    : "";

  const parsed = extractJsonFromText(textBlocks);
  if (!parsed) {
    throw new Error("Gemini response did not contain valid JSON.");
  }

  return parsed;
}

function getFileState(fileData) {
  const state = fileData?.state;
  if (typeof state === "string") {
    return state;
  }
  if (typeof state?.name === "string") {
    return state.name;
  }
  return "";
}

function sleep(timeoutMs) {
  return new Promise((resolve) => window.setTimeout(resolve, timeoutMs));
}

async function pollGeminiFileUntilReady(name) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < FILE_POLL_TIMEOUT_MS) {
    const response = await fetch(getGeminiFileUrl(name));
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini file polling failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const file = data.file || data;
    const state = getFileState(file);

    if (!state || state === "ACTIVE") {
      return file;
    }

    if (state === "FAILED") {
      throw new Error("Gemini file processing failed.");
    }

    await sleep(FILE_POLL_INTERVAL_MS);
  }

  throw new Error("Gemini file processing timed out.");
}

async function uploadFileToGemini(file) {
  const sessionResponse = await fetch(getGeminiUploadUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      displayName: file.name,
      mimeType: file.type || "application/pdf",
      sizeBytes: file.size,
    }),
  });

  if (!sessionResponse.ok) {
    const errorText = await sessionResponse.text();
    throw new Error(`Gemini upload session failed: ${sessionResponse.status} ${errorText}`);
  }

  const { uploadUrl } = await sessionResponse.json();
  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`Gemini file upload failed: ${uploadResponse.status} ${errorText}`);
  }

  const uploadData = await uploadResponse.json();
  const uploadedFile = uploadData.file || uploadData;
  const readyFile =
    getFileState(uploadedFile) && getFileState(uploadedFile) !== "ACTIVE"
      ? await pollGeminiFileUntilReady(uploadedFile.name)
      : uploadedFile;

  return {
    name: readyFile.name,
    uri: readyFile.uri,
    mimeType: readyFile.mimeType || file.type || "application/pdf",
  };
}

async function cleanupGeminiFile(name) {
  if (!name) {
    return;
  }

  try {
    await fetch("/api/gemini-file", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    });
  } catch (_error) {
    // Cleanup failure should not block the user flow.
  }
}

export async function sendGeminiRequest({
  prompt,
  file,
  context = {},
  temperature = 0.2,
}) {
  const uploadedFile = file ? await uploadFileToGemini(file) : null;

  try {
    const response = await fetch(getGeminiProxyUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: import.meta.env.VITE_GEMINI_MODEL || DEFAULT_MODEL,
        prompt,
        context,
        generationConfig: {
          temperature,
          responseMimeType: "application/json",
        },
        ...(uploadedFile
          ? {
              fileUri: uploadedFile.uri,
              fileMimeType: uploadedFile.mimeType,
            }
          : {}),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return parseGeminiJsonResponse(data);
  } finally {
    if (uploadedFile?.name) {
      cleanupGeminiFile(uploadedFile.name);
    }
  }
}

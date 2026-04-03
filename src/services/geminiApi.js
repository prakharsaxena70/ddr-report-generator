import { extractJsonFromText } from "../utils/json";

export const THERMAL_ANALYSIS_PROMPT = `You are an expert building thermographer. Analyze these thermal images and extract structured data.
For each thermal image, identify: image filename, date, hotspot temperature, coldspot temperature,
emissivity, and most importantly - interpret what the thermal pattern means for building health.
Look for: blue/cyan areas indicating moisture/dampness (cooler due to evaporation),
red/orange hotspots indicating thermal bridges or active leakage points,
uneven gradients indicating water ingress paths.
Also return the likely building area, a short visual description, and the source PDF page number when possible.
Return JSON array only:
[{imageId, date, hotspot, coldspot, emissivity, thermalPattern, diagnosis, severity, location, suggestedArea, visualDescription, sourcePage}]
Severity: 'immediate' | 'moderate' | 'monitor'`;

export const INSPECTION_ANALYSIS_PROMPT = `You are a building inspection expert. Analyze this inspection form and extract:
1. All impacted areas (negative side) with their descriptions
2. All exposed/source areas (positive side) with their descriptions
3. Checklist responses for: WC/Bathroom, Balcony, Terrace, External Wall
4. Overall property health score
5. Source PDF page numbers wherever possible
6. Any missing information
7. Any conflicting information
Return JSON only in this structure:
{
  "propertyHealthScore": number,
  "previousAuditOrRepairs": "string",
  "impactedAreas": [{"area":"string","description":"string","severity":"immediate|moderate|monitor","observedAt":"string","sourcePages":[1]}],
  "positiveSideInputs": [{"area":"string","description":"string","risk":"high|medium|low","sourcePages":[1]}],
  "checklistResponses": {
    "bathroom":{"selected":true,"notes":"string"},
    "balcony":{"selected":true,"notes":"string"},
    "terrace":{"selected":true,"notes":"string"},
    "externalWall":{"selected":true,"notes":"string"}
  },
  "summaryTable": [{"impactedArea":"string","exposedArea":"string","link":"string"}],
  "missingInformation": ["string"],
  "conflicts": ["string"]
}`;

export const REPORT_GENERATION_PROMPT = `You are UrbanRoof's senior building diagnosis expert. Using the thermal analysis data and
inspection findings provided, generate a client-friendly Detailed Diagnostic Report.
Rules:
- Extract and merge facts from both documents logically.
- Do not invent facts.
- Avoid duplicate points.
- If information is missing, write "Not Available".
- If information conflicts, mention the conflict clearly.
- Do not resolve conflicts by assumption, typo correction, or guessing.
- Do not say that one value was "assumed" to be another value.
- Keep the language simple and client-friendly.
- For every area-wise observation, include evidence references to source pages and thermal image IDs when available.
Return JSON only in this structure:
{
  "propertyIssueSummary": {
    "headline":"string",
    "overview":"string",
    "keyFindings":["string"]
  },
  "areaWiseObservations": [{
    "area":"string",
    "observation":"string",
    "probableRootCause":"string",
    "severityAssessment":{"level":"immediate|moderate|monitor|Not Available","reasoning":"string"},
    "recommendedActions":["string"],
    "additionalNotes":["string"],
    "missingOrUnclearInformation":["string"],
    "conflicts":["string"],
    "evidenceRefs":{
      "thermalImageIds":["string"],
      "thermalPages":[1],
      "inspectionPages":[1]
    }
  }],
  "probableRootCause":[{"area":"string","cause":"string","supportingEvidence":"string"}],
  "severityAssessment":[{"area":"string","severity":"string","reasoning":"string"}],
  "recommendedActions":[{"area":"string","action":"string","priority":"string","reasoning":"string"}],
  "additionalNotes":["string"],
  "missingOrUnclearInformation":["string"],
  "conflicts":["string"]
}`;

const DEFAULT_MODEL = "gemini-2.5-flash";
const LARGE_FILE_BYTES = 4 * 1024 * 1024;

export function getGeminiProxyUrl() {
  return import.meta.env.VITE_GEMINI_PROXY_URL || "/api/gemini";
}

export function getGeminiApiKey() {
  return import.meta.env.VITE_GEMINI_API_KEY || "";
}

export function hasGeminiProxy() {
  return Boolean(getGeminiApiKey() || import.meta.env.VITE_GEMINI_PROXY_URL || import.meta.env.PROD);
}

export async function fileToBase64(file) {
  const arrayBuffer = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(arrayBuffer);
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
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

function buildGeminiBody({ model, prompt, context, temperature, fileData }) {
  return {
    contents: [
      {
        parts: [
          ...(fileData
            ? [
                {
                  inline_data: {
                    mime_type: fileData.mimeType || "application/pdf",
                    data: fileData.data,
                  },
                },
              ]
            : []),
          {
            text: `${prompt}

Return JSON only.

Context:
${JSON.stringify(context, null, 2)}`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature,
      responseMimeType: "application/json",
    },
    model,
  };
}

async function sendDirectGeminiRequest({
  model,
  prompt,
  context,
  temperature,
  file,
}) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("Missing VITE_GEMINI_API_KEY for direct Gemini requests.");
  }

  const fileData = file
    ? {
        mimeType: file.type || "application/pdf",
        data: await fileToBase64(file),
      }
    : null;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildGeminiBody({ model, prompt, context, temperature, fileData })),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini direct request failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

async function sendProxyGeminiRequest({
  model,
  prompt,
  context,
  temperature,
  file,
}) {
  if (file && file.size > LARGE_FILE_BYTES && !getGeminiApiKey()) {
    throw new Error(
      "Large PDF uploads require VITE_GEMINI_API_KEY on Vercel. Add that env var and redeploy the app.",
    );
  }

  const response = await fetch(getGeminiProxyUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      context,
      generationConfig: {
        temperature,
        responseMimeType: "application/json",
      },
      ...(file
        ? {
            fileData: {
              mimeType: file.type || "application/pdf",
              data: await fileToBase64(file),
            },
          }
        : {}),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 413) {
      throw new Error(
        "PDF upload is too large for the server proxy. Set VITE_GEMINI_API_KEY on Vercel so the browser can call Gemini directly, then redeploy.",
      );
    }
    throw new Error(`Gemini proxy request failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function sendGeminiRequest({
  prompt,
  file,
  context = {},
  temperature = 0.2,
}) {
  const model = import.meta.env.VITE_GEMINI_MODEL || DEFAULT_MODEL;
  const useDirectRequest = Boolean(getGeminiApiKey());

  if (file && !useDirectRequest && import.meta.env.PROD) {
    throw new Error(
      "VITE_GEMINI_API_KEY is missing in production. Add it in Vercel and redeploy to enable PDF analysis.",
    );
  }

  const data = useDirectRequest
    ? await sendDirectGeminiRequest({
        model,
        prompt,
        context,
        temperature,
        file,
      })
    : await sendProxyGeminiRequest({
        model,
        prompt,
        context,
        temperature,
        file,
      });

  return parseGeminiJsonResponse(data);
}

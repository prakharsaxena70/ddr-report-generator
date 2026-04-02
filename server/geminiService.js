const DEFAULT_MODEL = "gemini-2.5-flash";

function getApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY on server.");
  }
  return apiKey;
}

function getModel(model) {
  return model || process.env.GEMINI_MODEL || DEFAULT_MODEL;
}

function buildPromptText(prompt, context = {}) {
  return `${prompt}

Return JSON only.

Context:
${JSON.stringify(context, null, 2)}`;
}

export function readGeminiText(response) {
  return Array.isArray(response?.candidates)
    ? response.candidates
        .flatMap((candidate) => candidate?.content?.parts || [])
        .filter((part) => typeof part.text === "string")
        .map((part) => part.text)
        .join("\n")
    : "";
}

export async function createGeminiUploadSession({
  displayName,
  mimeType,
  sizeBytes,
}) {
  const apiKey = getApiKey();
  const response = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": String(sizeBytes),
        "X-Goog-Upload-Header-Content-Type": mimeType,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        file: {
          display_name: displayName,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini upload session failed: ${response.status} ${errorText}`);
  }

  const uploadUrl = response.headers.get("x-goog-upload-url");
  if (!uploadUrl) {
    throw new Error("Gemini upload session did not return an upload URL.");
  }

  return { uploadUrl };
}

export async function getGeminiFile(name) {
  const apiKey = getApiKey();
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${name}?key=${apiKey}`,
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini file lookup failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function deleteGeminiFile(name) {
  const apiKey = getApiKey();
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${name}?key=${apiKey}`,
    {
      method: "DELETE",
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini file delete failed: ${response.status} ${errorText}`);
  }

  return {};
}

export async function generateGeminiContent({
  model,
  prompt,
  context = {},
  fileUri,
  fileMimeType,
  generationConfig = {},
}) {
  const apiKey = getApiKey();
  const selectedModel = getModel(model);
  const parts = [];

  if (fileUri) {
    parts.push({
      file_data: {
        mime_type: fileMimeType || "application/pdf",
        file_uri: fileUri,
      },
    });
  }

  parts.push({
    text: buildPromptText(prompt, context),
  });

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
          ...generationConfig,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

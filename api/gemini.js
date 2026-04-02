function readGeminiText(response) {
  return Array.isArray(response?.candidates)
    ? response.candidates
        .flatMap((candidate) => candidate?.content?.parts || [])
        .filter((part) => typeof part.text === "string")
        .map((part) => part.text)
        .join("\n")
    : "";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Missing GEMINI_API_KEY on server." });
    return;
  }

  const {
    model = process.env.GEMINI_MODEL || "gemini-2.5-flash",
    prompt,
    context = {},
    file,
    generationConfig = {},
  } = req.body || {};

  if (!prompt) {
    res.status(400).json({ error: "Prompt is required." });
    return;
  }

  const parts = [];
  if (file?.data) {
    parts.push({
      inline_data: {
        mime_type: file.mimeType || "application/pdf",
        data: file.data,
      },
    });
  }

  parts.push({
    text: `${prompt}

Return JSON only.

Context:
${JSON.stringify(context, null, 2)}`,
  });

  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts,
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
          ...generationConfig,
        },
      }),
    },
  );

  if (!geminiResponse.ok) {
    const errorText = await geminiResponse.text();
    res.status(geminiResponse.status).send(errorText);
    return;
  }

  const data = await geminiResponse.json();
  const outputText = readGeminiText(data);

  if (!outputText) {
    res.status(502).json({ error: "Gemini returned no text content.", raw: data });
    return;
  }

  res.status(200).json(data);
}

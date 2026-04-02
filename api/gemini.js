import { generateGeminiContent, readGeminiText } from "../server/geminiService.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const data = await generateGeminiContent(req.body || {});
    const outputText = readGeminiText(data);

    if (!outputText) {
      res.status(502).json({ error: "Gemini returned no text content.", raw: data });
      return;
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message || "Gemini request failed." });
  }
}

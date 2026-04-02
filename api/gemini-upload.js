import { createGeminiUploadSession } from "../server/geminiService.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const data = await createGeminiUploadSession(req.body || {});
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message || "Gemini upload session failed." });
  }
}

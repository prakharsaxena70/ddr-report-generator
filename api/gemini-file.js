import { deleteGeminiFile, getGeminiFile } from "../server/geminiService.js";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const { name } = req.query || {};
      if (!name) {
        res.status(400).json({ error: "Missing file name." });
        return;
      }

      const data = await getGeminiFile(name);
      res.status(200).json(data);
      return;
    }

    if (req.method === "DELETE") {
      const { name } = req.body || {};
      if (!name) {
        res.status(400).json({ error: "Missing file name." });
        return;
      }

      await deleteGeminiFile(name);
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    res.status(500).json({ error: error.message || "Gemini file request failed." });
  }
}

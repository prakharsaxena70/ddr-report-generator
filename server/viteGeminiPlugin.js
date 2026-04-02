import {
  createGeminiUploadSession,
  deleteGeminiFile,
  generateGeminiContent,
  getGeminiFile,
} from "./geminiService";

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      if (!data) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function writeJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

export function viteGeminiPlugin() {
  return {
    name: "vite-gemini-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const url = new URL(req.url, "http://127.0.0.1");

          if (url.pathname === "/api/gemini" && req.method === "POST") {
            const body = await readBody(req);
            const data = await generateGeminiContent(body);
            writeJson(res, 200, data);
            return;
          }

          if (url.pathname === "/api/gemini-upload" && req.method === "POST") {
            const body = await readBody(req);
            const data = await createGeminiUploadSession(body);
            writeJson(res, 200, data);
            return;
          }

          if (url.pathname === "/api/gemini-file" && req.method === "GET") {
            const name = url.searchParams.get("name");
            if (!name) {
              writeJson(res, 400, { error: "Missing file name." });
              return;
            }

            const data = await getGeminiFile(name);
            writeJson(res, 200, data);
            return;
          }

          if (url.pathname === "/api/gemini-file" && req.method === "DELETE") {
            const body = await readBody(req);
            if (!body?.name) {
              writeJson(res, 400, { error: "Missing file name." });
              return;
            }

            await deleteGeminiFile(body.name);
            writeJson(res, 200, { ok: true });
            return;
          }

          next();
        } catch (error) {
          writeJson(res, 500, { error: error.message || "Gemini dev API failed." });
        }
      });
    },
  };
}

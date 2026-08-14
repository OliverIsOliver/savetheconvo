import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, relative } from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import OpenAI from "openai";
import {
  MODEL,
  PERSONA,
  SYSTEM_PROMPT,
  buildDynamicPrompt,
  normalizeChatRequest,
  promptPreview
} from "./prompts.mjs";

const rootDirectory = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT || 4173);
const openai = process.env.OPENAI_API_KEY ? new OpenAI() : null;

const replySchema = {
  type: "object",
  properties: { reply: { type: "string" } },
  required: ["reply"],
  additionalProperties: false
};

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function sendError(response, status, message) {
  sendJson(response, status, { error: message });
}

async function readJson(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > 1_000_000) throw new Error("Request body is too large.");
    chunks.push(chunk);
  }

  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Error("Request body must be valid JSON.");
  }
}

function replyFromResponse(response) {
  const raw = String(response.output_text || "").trim();
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed.reply === "string" && parsed.reply.trim()) return parsed.reply.trim();
  } catch {
    // Keep a plain-text fallback for SDK/model responses that do not serialize the schema.
  }
  if (!raw) throw new Error("The model returned an empty reply.");
  return raw;
}

async function handleApi(request, response, url) {
  if (request.method === "GET" && url.pathname === "/api/health") {
    return sendJson(response, 200, {
      ok: true,
      model: MODEL,
      configured: Boolean(openai)
    });
  }

  if (request.method === "GET" && url.pathname === "/api/prompts") {
    return sendJson(response, 200, promptPreview({
      userScore: 5,
      herScore: 5,
      history: [],
      message: ""
    }));
  }

  if (request.method !== "POST") return sendError(response, 405, "Method not allowed.");

  let body;
  try {
    body = await readJson(request);
  } catch (error) {
    return sendError(response, 400, error.message);
  }

  if (url.pathname === "/api/prompts/preview") {
    try {
      const requestData = normalizeChatRequest(body);
      return sendJson(response, 200, promptPreview(requestData));
    } catch (error) {
      return sendError(response, 400, error.message);
    }
  }

  if (url.pathname !== "/api/chat") return sendError(response, 404, "Not found.");
  if (!openai) return sendError(response, 503, "OPENAI_API_KEY is not configured on the server.");

  let requestData;
  try {
    requestData = normalizeChatRequest(body, { requireMessage: true });
  } catch (error) {
    return sendError(response, 400, error.message);
  }

  const dynamicPrompt = buildDynamicPrompt(requestData);

  try {
    const modelResponse = await openai.responses.create({
      model: MODEL,
      instructions: SYSTEM_PROMPT,
      input: dynamicPrompt,
      reasoning: { effort: "low" },
      text: {
        verbosity: "low",
        format: {
          type: "json_schema",
          name: "tiffany_reply",
          strict: true,
          schema: replySchema
        }
      },
      store: false
    });

    return sendJson(response, 200, {
      reply: replyFromResponse(modelResponse),
      model: MODEL,
      promptInspector: {
        systemPrompt: SYSTEM_PROMPT,
        dynamicPrompt
      }
    });
  } catch (error) {
    console.error("OpenAI request failed:", error?.message || error);
    return sendError(response, 502, "OpenAI could not generate a reply. Check the server log for details.");
  }
}

async function serveStatic(response, url) {
  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = normalize(join(rootDirectory, requestedPath));
  const relativePath = relative(rootDirectory, filePath);

  if (relativePath.startsWith("..") || relativePath.includes(".." + "/")) {
    return sendError(response, 404, "Not found.");
  }

  try {
    const body = await readFile(filePath);
    response.writeHead(200, {
      "content-type": contentTypes[extname(filePath)] || "application/octet-stream",
      "cache-control": "no-cache"
    });
    response.end(body);
  } catch {
    sendError(response, 404, "Not found.");
  }
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  if (url.pathname.startsWith("/api/")) {
    try {
      await handleApi(request, response, url);
    } catch (error) {
      console.error("Request failed:", error?.message || error);
      sendError(response, 500, "Unexpected server error.");
    }
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    sendError(response, 405, "Method not allowed.");
    return;
  }
  await serveStatic(response, url);
});

server.listen(port, () => {
  console.log(`SaveTheConvo listening at http://localhost:${port}`);
  console.log(`Model: ${MODEL} · Tiffany: ${PERSONA.description}`);
  if (!openai) console.log("OPENAI_API_KEY is not set; /api/chat will return a configuration error.");
});

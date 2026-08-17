import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { getVideoPerson } from "./contract.mjs";

const videoDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = dirname(videoDirectory);
const entryPoint = join(videoDirectory, "entry.jsx");
let serveUrlPromise;

async function getServeUrl() {
  if (!serveUrlPromise) {
    serveUrlPromise = bundle({ entryPoint });
  }
  return serveUrlPromise;
}

async function imageDataUrl(assetPath) {
  const imagePath = join(projectDirectory, assetPath);
  const image = await readFile(imagePath);
  const extension = imagePath.toLowerCase().endsWith(".jpg") || imagePath.toLowerCase().endsWith(".jpeg") ? "jpeg" : "png";
  return `data:image/${extension};base64,${image.toString("base64")}`;
}

export async function renderConversationVideo(requestData) {
  const person = getVideoPerson(requestData.personId);
  if (!person) throw new Error("Unknown video person.");

  const serveUrl = await getServeUrl();
  const inputProps = {
    person: {
      ...person,
      avatarSrc: await imageDataUrl(person.assetPath)
    },
    conversation: requestData.conversation,
    durationInFrames: requestData.durationInFrames
  };
  const composition = await selectComposition({
    serveUrl,
    id: "SaveTheConvoVideo",
    inputProps
  });
  const renderDirectory = await mkdtemp(join(tmpdir(), "save-the-convo-video-"));
  const outputLocation = join(renderDirectory, "conversation.mp4");

  try {
    await renderMedia({
      composition,
      serveUrl,
      codec: "h264",
      crf: 18,
      inputProps,
      outputLocation,
      scale: requestData.outputScale
    });
    return await readFile(outputLocation);
  } finally {
    await rm(renderDirectory, { recursive: true, force: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const sample = {
    personId: "tiffany.lane",
    conversation: [
      { timestampMs: 0, side: "them", type: "message", text: "wait are you in econ 204 too?" },
      { timestampMs: 1_200, side: "me", type: "message", text: "yeah lol, back row most days" },
      { timestampMs: 2_200, side: "them", type: "thinking", durationMs: 900 },
      { timestampMs: 3_100, side: "them", type: "message", text: "ok wait i knew you looked familiar 😭" }
    ]
  };
  const { normalizeVideoRequest } = await import("./contract.mjs");
  const output = await renderConversationVideo(normalizeVideoRequest(sample));
  const outputPath = join(projectDirectory, "dist", "sample-conversation.mp4");
  await writeFile(outputPath, output);
  console.log(`Rendered ${outputPath}`);
}

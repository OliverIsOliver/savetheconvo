import { getVideoPerson, videoPeoplePayload } from "./people.mjs";

export const VIDEO_FPS = 30;
export const MAX_VIDEO_EVENTS = 100;
export const MAX_VIDEO_DURATION_MS = 120_000;
const DEFAULT_THINKING_DURATION_MS = 900;
const MESSAGE_HOLD_MS = 1_800;

function asFiniteNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`${label} must be a finite number.`);
  return number;
}

function normalizeSide(value) {
  if (value === "me" || value === "user") return "me";
  if (value === "them" || value === "person" || value === "other") return "them";
  throw new Error('Each event side must be "me" or "them".');
}

function normalizeEvent(event, index) {
  if (!event || typeof event !== "object" || Array.isArray(event)) {
    throw new Error(`conversation[${index}] must be an object.`);
  }

  const timestampValue = event.timestampMs ?? event.at;
  const timestampMs = asFiniteNumber(timestampValue, `conversation[${index}].timestampMs`);
  if (timestampMs < 0) throw new Error(`conversation[${index}].timestampMs cannot be negative.`);

  const type = event.type ?? event.kind ?? "message";
  if (type !== "message" && type !== "thinking" && type !== "typing") {
    throw new Error(`conversation[${index}].type must be "message" or "thinking".`);
  }

  const side = normalizeSide(event.side);
  if (type === "message") {
    if (typeof event.text !== "string" || !event.text.trim()) {
      throw new Error(`conversation[${index}].text is required for message events.`);
    }
    if (event.text.length > 1_200) {
      throw new Error(`conversation[${index}].text cannot exceed 1,200 characters.`);
    }
    return {
      timestampMs: Math.round(timestampMs),
      side,
      type: "message",
      text: event.text.trim()
    };
  }

  if (side !== "them") throw new Error(`conversation[${index}] thinking events must use side "them".`);
  const durationMs = Math.round(asFiniteNumber(event.durationMs ?? DEFAULT_THINKING_DURATION_MS, `conversation[${index}].durationMs`));
  if (durationMs < 100 || durationMs > 10_000) {
    throw new Error(`conversation[${index}].durationMs must be between 100 and 10,000 ms.`);
  }
  return {
    timestampMs: Math.round(timestampMs),
    side,
    type: "thinking",
    durationMs
  };
}

export function normalizeVideoRequest(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Video request must be a JSON object.");
  }

  const personId = typeof body.personId === "string" ? body.personId : body.person;
  if (typeof personId !== "string" || !getVideoPerson(personId)) {
    throw new Error('personId must be one of "tiffany.lane", "emma.rose", or "lucia.vibes".');
  }

  if (!Array.isArray(body.conversation) || body.conversation.length === 0) {
    throw new Error("conversation must be a non-empty array of timestamped events.");
  }
  if (body.conversation.length > MAX_VIDEO_EVENTS) {
    throw new Error(`conversation cannot contain more than ${MAX_VIDEO_EVENTS} events.`);
  }

  const conversation = body.conversation
    .map(normalizeEvent)
    .map((event, index) => ({ ...event, _index: index }))
    .sort((left, right) => left.timestampMs - right.timestampMs || left._index - right._index)
    .map(({ _index, ...event }) => event);

  const timelineEndMs = conversation.reduce((latest, event) => {
    const eventEnd = event.type === "thinking" ? event.timestampMs + event.durationMs : event.timestampMs;
    return Math.max(latest, eventEnd);
  }, 0);

  const options = body.options && typeof body.options === "object" && !Array.isArray(body.options)
    ? body.options
    : {};
  const requestedDuration = body.durationMs ?? options.durationMs;
  const durationMs = requestedDuration === undefined
    ? timelineEndMs + MESSAGE_HOLD_MS
    : Math.round(asFiniteNumber(requestedDuration, "durationMs"));
  if (durationMs < 1_000 || durationMs > MAX_VIDEO_DURATION_MS) {
    throw new Error(`durationMs must be between 1,000 and ${MAX_VIDEO_DURATION_MS} ms.`);
  }
  if (durationMs < timelineEndMs) {
    throw new Error("durationMs must be after the final message and thinking event.");
  }

  const outputScale = options.outputScale === undefined ? 2 : asFiniteNumber(options.outputScale, "options.outputScale");
  if (outputScale < 1 || outputScale > 3) {
    throw new Error("options.outputScale must be between 1 and 3.");
  }

  return {
    personId,
    conversation,
    durationMs,
    outputScale,
    durationInFrames: Math.max(1, Math.ceil((durationMs / 1_000) * VIDEO_FPS))
  };
}

export { getVideoPerson, videoPeoplePayload };

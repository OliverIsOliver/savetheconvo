# SaveTheConvo

SaveTheConvo is a small local practice simulator for learning how to flirt over text. It serves the existing phone-style UI and a Node backend that calls GPT-5.6 Luna.

## Run it

```sh
npm install
cp .env.example .env
# Put a valid OpenAI key in .env, then:
npm start
```

Open [http://localhost:4173](http://localhost:4173).

The API key stays server-side in `OPENAI_API_KEY`. The prompt inspector is intentional: it exposes the stable system prompt separately from the per-turn dynamic prompt so the practice mechanics are transparent.

## Endpoints

- `GET /api/health` — server/model/key configuration status
- `GET /api/prompts` — default prompt inspector payload
- `POST /api/prompts/preview` — preview dynamic prompt without an API call
- `POST /api/chat` — generate Tiffany’s next text reply
- `GET /api/video/people` — list selectable people for marketing renders
- `POST /api/video` — render a timestamped conversation as an MP4

## Conversation video API

`POST /api/video` returns the video bytes directly as `video/mp4`. Timestamps are milliseconds from the start of the clip. Use `message` events to reveal bubbles and `thinking` events to show the animated thinking indicator:

```json
{
  "personId": "tiffany.lane",
  "conversation": [
    { "timestampMs": 0, "side": "them", "type": "message", "text": "wait are you in econ 204 too?" },
    { "timestampMs": 1200, "side": "me", "type": "message", "text": "yeah lol, back row most days" },
    { "timestampMs": 2200, "side": "them", "type": "thinking", "durationMs": 900 },
    { "timestampMs": 3100, "side": "them", "type": "message", "text": "ok wait i knew you looked familiar 😭" }
  ],
  "options": { "outputScale": 2 }
}
```

`side` is `me` or `them`; `user` and `person` are accepted aliases. `personId` can be discovered from `GET /api/video/people`. The default output is the current 390×844 phone UI rendered at 2× scale; `outputScale` accepts 1–3. `durationMs` is optional and otherwise ends 1.8 seconds after the final event.

Example:

```sh
curl -X POST http://localhost:4173/api/video \
  -H 'content-type: application/json' \
  --data @conversation.json \
  --output save-the-convo.mp4
```

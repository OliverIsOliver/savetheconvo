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

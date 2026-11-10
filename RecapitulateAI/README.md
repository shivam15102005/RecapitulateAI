# RecapitulateAI

RecapitulateAI is a structured AI study workspace. A learner pastes study notes or a topic, and the app renders the returned content as three interactive blocks: a 3D flashcard deck, a multi-round multiple-choice quiz with a wrong-answer retest loop, and an expandable concept mastery checklist. It is a React application—not a chatbot UI—and all model credentials stay on the Express server.

## Requirements

- Node.js 24.22.1 (pinned for consistent local and Render builds)
- npm 9+
- One configured AI provider, or a running local Ollama model

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Create the server environment file
cp .env.example .env

# 3. Add at least one server-side provider key to .env
#    Prefer GEMINI_API_KEY, GROQ_API_KEY, OPENAI_API_KEY, or OLLAMA_MODEL.

# 4. Start the Express API and Vite frontend together
npm run dev
```

Open **http://localhost:5173**. The Express API listens on **http://localhost:4000** by default (or the value of `PORT` in `.env`). Vite reads that same `PORT` value and proxies `/api/*` requests to Express, so the browser only calls same-origin `/api/study`.

For a production build, run:

```bash
npm run build
```

The production start command is `npm start`. It starts Express, which serves the compiled Vite `dist/` frontend and the `/api/*` routes from the same origin. The local development command remains `npm run dev`, which starts Express and the Vite development server together.

Run the backend request-schema tests with:

```bash
npm test
```

A Render Blueprint is included in `render.yaml`. Connect this repository to Render using **New + → Blueprint**, then provide `GEMINI_API_KEY` when prompted. See [`README_RENDER.md`](README_RENDER.md) for detailed Blueprint and manual deployment instructions.

## Environment configuration

Copy `.env.example` to `.env` in the project root.

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Enables Gemini as the first provider in the fallback chain. |
| `GEMINI_MODEL` | Optional Gemini model; defaults to `gemini-2.5-flash`. |
| `GROQ_API_KEY` | Enables Groq after Gemini. |
| `GROQ_MODEL` | Optional Groq chat model. |
| `OPENAI_API_KEY` | Enables OpenAI after Groq. |
| `OPENAI_MODEL` | Optional OpenAI chat model. |
| `OLLAMA_MODEL` | Enables local Ollama as the final provider. |
| `OLLAMA_BASE_URL` | Ollama server URL; defaults to `http://127.0.0.1:11434`. |
| `PORT` | Express API port; defaults to `4000`. Vite reads this same value for its `/api` proxy. |
| `AI_PROVIDER_TIMEOUT_MS` | Total time budget for provider attempts; defaults to 18 seconds and must be no more than 18.5 seconds so fallback can finish before the 20-second browser timeout. |
| `ENABLE_FAULT_SIMULATOR` | Enables evaluator fault modes in production when explicitly set to `true`. |

Provider fallback order is **Gemini → Groq → OpenAI → Ollama**, skipping providers that are not configured. When one provider fails, the server records the failure and attempts the next configured provider.

**Security note:** never add provider credentials to `VITE_*` variables, React source, HTML, or any file committed to version control. Vite environment variables are client-visible by design. Only the Express backend reads provider keys. `server/config/env.js` loads `.env` and exposes server-side configuration; no key is imported by the browser bundle.

## Product capabilities

### Structured generation (not chat)

The backend instructs the model to return one JSON object with `title`, `summary`, `flashcards`, `quiz`, and `conceptChecklist`. The browser parses that text and renders validated stateful UI. It does not print conversational LLM output as a chat transcript.

### Defensive response pipeline

1. Each generation receives a monotonically increasing request ID and an `AbortController`. Starting a new generation aborts the old one, and request IDs are checked before committing asynchronous state.
2. A six-second timer marks the request as slow and exposes a cancel action. A twenty-second client timer aborts the request and exposes a retryable timeout error.
3. `aiParser.ts` strips Markdown fences, extracts a balanced JSON object while respecting quoted braces and escaped characters, and repairs trailing commas before parsing.
4. Zod validates each flashcard, quiz question, and concept independently. Invalid entries are skipped while valid entries are retained; the UI shows an amber, non-blocking partial-salvage warning.
5. Empty text, invalid JSON, empty salvage results, HTTP failures, and timeouts become explicit error states with a diagnostic viewer. Existing input text and the previous committed pack remain available.

### Study interactions

- Flashcards support 3D flipping, previous/next navigation, shuffle, always-available recall hints, mastery filtering, and keyboard controls: `Space`, `←`, `→`, `1` (needs review), `3` (known), `H` (hint), and `S` (shuffle).
- The quiz supports answer-neutral hints before submission, immediate answer feedback and explanations, round scoring, and repeated retesting of only missed questions.
- The concept checklist supports expandable details, key-point review, self-check prompts, and per-concept mastery tracking.
- Refinement requests send the current pack and an instruction to the backend. New and existing content are merged by stable item IDs so existing progress is retained where item identity remains stable.

### Sessions and presentation

- Study packs and flashcard/concept progress are saved automatically in `localStorage` with `try/catch` guards.
- Saved sessions can be selected and restored from the header or the empty-state session list.
- The layout adapts from mobile to desktop, includes light/dark mode, and provides visible keyboard focus styles.
- Three rich sample presets are included for one-click evaluator testing: cell biology, Newton's laws, and the French Revolution.

## Evaluator fault simulator

Open **Evaluator fault simulator** under the input panel and run one of the modes. The simulator executes through the Express endpoint without calling a real AI provider:

- `partial`: returns valid items mixed with broken items to test item-level salvage.
- `malformed`: wraps truncated JSON in prose and a code fence.
- `trailing_comma`: tests trailing-comma repair.
- `empty`: returns an empty model response.
- `invalid_types`: returns malformed top-level fields.
- `server_error`: returns HTTP 500.
- `slow`: waits eight seconds, exercising the six-second slow indicator and cancellation.

Fault simulation is enabled automatically when `NODE_ENV` is not `production`. In production, it is disabled unless `ENABLE_FAULT_SIMULATOR=true` is explicitly configured.

## Architecture

```text
React (Vite :5173)
  └── POST /api/study
        │
        ▼
Vite development proxy (target uses the same PORT from .env)
        │
        ▼
Express API (default :4000)
  ├── middleware/       request logging, validation, errors, 404
  ├── routes/            /health and /study route definitions
  ├── controllers/       HTTP request/response handling
  ├── schemas/           Zod request contract
  ├── services/
  │   ├── study.service.js          generation orchestration + fallback
  │   ├── faultSimulator.service.js evaluator response modes
  │   └── ai/
  │       ├── prompts.js            system and user prompt construction
  │       ├── providerRegistry.js   configured provider order
  │       └── providers/            Gemini, Groq, OpenAI, Ollama adapters
  └── config/            server-only .env loading and configuration
        │
        ▼
Structured JSON text + provider metadata
        │
        ▼
Browser parser + Zod item validation
  ├── FlashcardDeck
  ├── QuizEngine
  └── ConceptChecklist
        │
        ▼
localStorage sessions + mastery state
```

## File map

```text
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── .env.example
├── .gitignore
├── README.md
├── INTERVIEW_NOTES.md
├── server/
│   ├── index.js
│   ├── app.js
│   ├── config/
│   │   └── env.js
│   ├── controllers/
│   │   ├── health.controller.js
│   │   └── study.controller.js
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   ├── notFound.js
│   │   ├── requestLogger.js
│   │   └── validateBody.js
│   ├── routes/
│   │   ├── health.routes.js
│   │   └── study.routes.js
│   ├── schemas/
│   │   ├── env.schema.js
│   │   ├── studyRequest.schema.js
│   │   └── studyRequest.schema.test.js
│   ├── services/
│   │   ├── study.service.js
│   │   ├── faultSimulator.service.js
│   │   └── ai/
│   │       ├── prompts.js
│   │       ├── providerRegistry.js
│   │       └── providers/
│   │           ├── gemini.provider.js
│   │           ├── groq.provider.js
│   │           ├── openai.provider.js
│   │           ├── openaiCompatible.provider.js
│   │           ├── ollama.provider.js
│   │           └── httpResponse.js
│   └── utils/
│       ├── asyncHandler.js
│       ├── httpError.js
│       └── sleep.js
└── src/
    ├── main.tsx
    ├── index.css
    ├── App.tsx
    ├── types/
    │   └── study.ts
    ├── lib/
    │   ├── aiParser.ts
    │   └── samplePresets.ts
    ├── hooks/
    │   ├── useStudyGenerator.ts
    │   └── useLocalStorageDecks.ts
    └── components/
        ├── StudyInputStudio.tsx
        ├── StatusBanners.tsx
        ├── FlashcardDeck.tsx
        ├── QuizEngine.tsx
        ├── ConceptChecklist.tsx
        ├── RefinementBar.tsx
        └── FaultSimulatorBar.tsx
```

## Known limitations

- A provider key and network access are required for live model generation. Ollama requires the local service and selected model to be installed and running.
- The app relies on the provider following the JSON contract. The parser salvages valid items, but it cannot infer missing facts or safely repair every semantic error.
- Stable IDs are generated from item text when the model does not provide IDs. If a refinement substantially rewrites an item, it may receive a new ID and its previous mastery state may not carry over.
- `localStorage` is browser/device-specific, has limited capacity, and is not a cloud backup. Large study packs may exceed browser storage quotas; the app logs storage failures and continues in memory.
- Quiz state is in-memory during the active page session; saved sessions persist the study pack and mastery maps, not a full per-question attempt history.
- The Vite proxy is for local development. In production, Express serves the built `dist/` assets and `/api/*` endpoints from the same port.
- This is a learning tool, not a source-verification system. Review AI-generated answers against trusted course material, especially for high-stakes subjects.

## AI-usage note

AI is used to transform the learner's notes/topic into structured flashcards, multiple-choice questions, explanations, and concept checklist entries, and to apply refinement instructions to an existing pack. The application does not use AI to render a chatbot conversation. The client validates the structured response before displaying it. The learner's source input is sent to the configured server-side model provider when generation is requested; do not paste credentials or sensitive personal data into study notes.

## Time spent

The implementation was assembled as a complete code-generation deliverable in this session. Exact wall-clock development time was not instrumented, so no measured hour count is claimed.

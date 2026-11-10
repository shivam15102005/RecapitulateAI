# RecapitulateAI — Engineering Deep Dive

Use these notes to explain the design decisions, trade-offs, and implementation details during a code review or technical interview.

## 1. Product architecture: structured UI, not a chatbot

**Design decision:** model output is treated as untrusted structured data, not a conversation to display.

- The React app calls `POST /api/study` and receives `rawText` plus provider metadata.
- The parser extracts a JSON object and validates its fields before the application commits it to state.
- The only learner-facing output blocks are `FlashcardDeck`, `QuizEngine`, and `ConceptChecklist`.
- The model prompt prohibits greetings, conversational prose, Markdown, and schema drift, but the frontend still assumes the prompt can fail and validates independently.

**Interview framing:** “The model is a content-generation dependency. It is not the UI. Our application owns the interaction model and only admits data after parsing and validation.”

## 2. API-key security and provider fallback

**Implementation:**

- `server/config/env.js` loads `.env` with `dotenv` and centralizes server-only configuration. Provider keys are never imported into the frontend.
- `server/index.js` only starts the HTTP listener; `server/app.js` composes middleware and route modules.
- The browser requests a same-origin `/api/study` path. `vite.config.ts` reads the same `PORT` value from `.env` that Express uses, then proxies `/api/*` to that port.
- No provider key is exposed through a `VITE_*` variable, React component, or frontend request.
- `server/services/ai/providerRegistry.js` builds the provider plan from configured environment variables in the order Gemini, Groq, OpenAI, Ollama.
- Each provider has a separate adapter under `server/services/ai/providers/`. `study.service.js` applies one total provider-fallback deadline, normalizes output to a single `rawText` contract, records failures, and falls through to the next configured provider while time remains.
- `server/controllers/` owns HTTP response behavior; `server/routes/` maps URLs; `server/middleware/` handles logging, validation, 404s, and errors; `server/schemas/studyRequest.schema.js` validates incoming requests with Zod.

**Interview framing:** “The frontend knows only our API contract. Provider authentication, model choice, and fallback are server concerns, so a key cannot be extracted from the browser bundle.”

## 3. Backend separation of concerns

The Express API is intentionally split by responsibility rather than concentrated in one large entry point:

| Layer | Responsibility |
|---|---|
| `server/index.js` | Starts the listener and handles graceful shutdown. |
| `server/app.js` | Creates the Express app and composes middleware/routes. |
| `server/config/env.js` | Loads `.env` and exposes the parsed server configuration. |
| `server/schemas/env.schema.js` | Validates environment variables and rejects invalid ports/timeouts at startup. |
| `server/routes/` | Declares endpoint paths and middleware/controller order. |
| `server/controllers/` | Translates validated HTTP requests into service calls and HTTP responses. |
| `server/middleware/` | Request IDs/logging, Zod validation, not-found handling, and centralized errors. |
| `server/schemas/` | Defines both the server environment contract and API request contract. |
| `server/services/` | Contains use-case orchestration and fault simulation. |
| `server/services/ai/providers/` | Isolates provider-specific HTTP payloads and response parsing. |
| `server/utils/` | Holds small reusable helpers and HTTP error types. |

This keeps provider changes independent of routing, keeps controllers thin, and makes each layer easier to test in isolation.

## 4. Race conditions and stale responses

**Implementation in `useStudyGenerator.ts`:**

- `activeRequestIdRef` is incremented for every generation and restoration.
- Starting a request aborts the previous `AbortController`.
- Every asynchronous continuation checks that its captured `requestId` still matches the active ID before committing `data`, `error`, `warnings`, `status`, or diagnostics.
- Timers and the active controller are cleared only when the completing request is still current.
- Explicit cancellation increments the request ID before aborting, so the old promise cannot later overwrite the cancelled state.

**Why both mechanisms?** `AbortController` asks the browser to stop work, but a request may already have resolved or the server may continue processing. The request ID is the final correctness guard against stale commits.

## 5. Malformed JSON extraction

**Implementation in `aiParser.ts`:**

1. Remove an outer Markdown JSON fence when present.
2. Scan characters to find a balanced object, tracking brace depth, quoted-string state, and backslash escapes.
3. Parse the extracted block with `JSON.parse`.
4. If parsing fails, retry after removing trailing commas before closing braces/brackets.
5. Return a structured parser error rather than throwing into the React tree.

The scanner respects braces embedded inside JSON string values, which a naive `indexOf('{')` / `lastIndexOf('}')` strategy does not.

## 6. Zod item validation and partial salvage

**Implementation:**

- Each array item is passed through its own Zod schema: `FlashcardSchema`, `QuizQuestionSchema`, or `ConceptSchema`.
- Invalid items are counted and dropped independently; valid siblings remain available.
- A quiz item gets an additional semantic constraint: `correctAnswerIndex` must be within the options array.
- Items missing IDs receive deterministic IDs derived from their content and position.
- Any invalid or missing collection produces an amber warning and `status: 'partial'` if at least one valid content item remains.
- If zero valid items remain across all three sections, the parser returns an explicit error.

**Trade-off:** dropping an invalid item is safer than guessing its missing answer or silently changing the meaning. The warning tells the learner the returned pack is incomplete.

## 7. Slow, timed-out, empty, and failed responses

- A six-second timer sets `isSlowLoading`, which reveals a reassuring status message and a cancel button.
- A twenty-second hard timer aborts the request. The catch handler distinguishes that case from a user cancellation and provides a timeout-specific message.
- HTTP errors include backend error details and diagnostic text in an expandable viewer.
- Empty model output, malformed JSON, and zero salvageable items are parser-level failures with the raw response preserved.
- The hook keeps the last committed `data` when a new request fails. It does not clear the learner's notes. The error panel exposes Retry and Restore Previous Study Pack actions.

## 8. Flashcard interaction and keyboard accessibility

- The deck stores the current order, index, filter, flip state, and hint visibility locally.
- A 3D CSS transform rotates the inner card while the faces use `backface-visibility: hidden`.
- Mastery is stored separately in the parent so it can be saved and restored.
- Keyboard shortcuts are registered at the window level and ignored while focus is inside input, textarea, select, or editable content.
- `Space` flips, arrow keys navigate, `1` marks needs-review, `3` marks known, `H` toggles a hint, and `S` shuffles.

## 9. Adaptive quiz and wrong-answer loop

- The quiz maintains an ordered queue of question IDs, rather than mutating the source question array.
- A round tracks the selected option, whether the answer has been checked, correct count, wrong question IDs, and completion state.
- At the end of a round, the user can start another round using only IDs missed in the previous round.
- The retest queue is filtered from the original validated questions, so the correct answer and explanation are reused rather than reconstructed.
- Retesting can be repeated until the learner gets every question correct in a round.

## 10. Iterative refinement without losing progress

- `RefinementBar.tsx` submits an instruction together with the current StudyPack and source notes.
- The backend prompt asks the model to apply the requested change and return a complete updated StudyPack.
- `mergeStudyPacks` merges incoming items by ID and preserves old items not removed from the response.
- The parent owns mastery maps. Because IDs are retained for unchanged content, progress remains attached to those items.

**Limitation to explain honestly:** when a model rewrites a question enough that its deterministic ID changes, that changed item may not inherit its prior mastery state. This is an explicit trade-off until a server-issued stable identity layer is added.

## 11. Persistence and session restore

- `useLocalStorageDecks.ts` wraps every read and write in `try/catch`.
- Session data includes the StudyPack, flashcard mastery, concept mastery, and timestamps.
- The hook validates the basic stored shape before presenting a session as restorable.
- The app saves after successful or partial generation and whenever the learner changes mastery state.
- A bounded number of recent sessions is retained to reduce quota pressure.

**Trade-off:** browser storage is simple and does not need an account system, but it is device-local and not a cloud backup. A later production iteration could add authenticated server-side persistence.

## 12. Fault simulator and testing strategy

The fault simulator drives the real frontend request path and Express API response contract. It covers:

| Fault mode | Expected behavior |
|---|---|
| `partial` | Valid entries render; invalid siblings are dropped; amber warning appears. |
| `malformed` | Balanced extraction/parse fails cleanly; error state and raw diagnostics appear. |
| `trailing_comma` | Parser repairs the commas and renders the pack. |
| `empty` | Empty-output error with retry and restore actions. |
| `invalid_types` | Invalid top-level arrays become a zero-salvage error. |
| `server_error` | HTTP 500 is shown as a recoverable error without clearing notes or old content. |
| `slow` | Slow message appears after six seconds; cancel remains available. |

Manual evaluator pass:

1. Load a preset and generate with a configured provider.
2. Flip cards, use each keyboard shortcut, change the mastery filter, and reload the page.
3. Complete a quiz with intentional mistakes, run the wrong-answer-only retest, and repeat it.
4. Expand concepts and change mastery; reload to verify persistence.
5. Run every simulator mode and verify the corresponding state.
6. Start a slow request, then immediately start another request; verify the earlier response does not overwrite the later one.
7. Submit a refinement and confirm the pack is updated while unchanged mastery remains.

## 13. Accessibility and responsive behavior

- Inputs and buttons have labels or accessible names; state changes use native button semantics.
- Keyboard focus has a visible outline, and the flashcard keyboard handler does not steal keystrokes from form fields.
- The layout uses responsive grid/flex utilities, with a 375px+ mobile layout and a two-column desktop workspace.
- Dark mode is implemented with Tailwind's class strategy and CSS surface/field overrides.
- Reduced-motion preferences disable non-essential transitions and animations.

## 14. Follow-up engineering improvements

- Add automated unit tests for the JSON extractor, schema salvage, and merge semantics.
- Add Playwright coverage for race conditions, cancellation, retest loops, persistence, and mobile layout.
- Add provider-level structured-output response validation and model token budgeting.
- Add server-side rate limiting, request IDs in logs, and observability for provider latency/fallback frequency.
- Add a stronger stable-ID strategy or explicit item identity mapping for refinements.
- Add authenticated cloud sync if cross-device session persistence becomes a product requirement.

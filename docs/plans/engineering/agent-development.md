# Agent Development Plan

**Status:** Active
**Owner:** Pico engineering
**Related:** [Feature catalogue](../product/feature-catalog.md) (estimates and tool numbers) · [Roadmap](../product/roadmap.md) (deferred tools) · [Agent persona](../modules/agent-persona.md) (persona behavior) · [Testing guide](testing-guide.md)

## 1. Goal

Each agent chats with the user as a distinct persona and has its own set of tools. Each tool can be built quickly. When no agent is selected, the core Pico assistant answers as a helpful newcomer.

This plan covers agents, personas, and tools. Core emotion and persona behavior, modes, and the voice system are specified in [Agent persona](../modules/agent-persona.md) and [Voice mode](../modules/voice-mode.md).

## 2. Working Rules

- Build each tool in small sub-phases: logic, agent UI, then tests.
- Build fast tools first. Sub-phases are ordered by estimated hours, smallest first.
- When a tool is finished, mark its checkbox `[x]`. Unfinished items stay `[ ]` and are picked up in the upgrade list.
- If a tool or mini feature is left out of an agent, or a new one is added, record it in the [Todo list](#10-todo-list-upgrade-backlog) at the end of this document.
- Hour estimates come from the [feature catalogue](../product/feature-catalog.md), section 14. Estimates for new mini features are given here.
- Tools that are risky or deferred live in the [roadmap](../product/roadmap.md). They are built last.

## 3. API Routing Strategy

There are two routes. Both sit behind a single backend entry point, so tool code does not need a separate integration for each provider.

- **Route 1: Direct API (temporary, for development and testing).** Each tool uses an individual free API, for example Open-Meteo for weather, the browser `Intl` API for time, and a free exchange-rate API for currency and gold. The API is chosen per tool. This route is replaced later.
- **Route 2: Unified gateway (final, later).** One endpoint that gives access to many APIs, such as RapidAPI or a similar aggregator. Free and paid options are researched first, and the best options are shortlisted. The final provider is chosen after development.
- **Single entry point:** app tools call only one backend route (`services/api/src/server.js`). That route handles the API each tool needs.
- **Switching:** moving from Route 1 to Route 2 is controlled by a backend environment flag, not a per-tool switch. Frontend tool code never names a provider.
- **Mapping:** each tool's API mapping is listed in the Routing Map below (tool ID, Route 1 API, Route 2 endpoint). A new tool adds a row.

### 3.1 Routing Map

| Tool | Route 1 (direct) | Route 2 (unified) |
|---|---|---|
| Weather (34) | Open-Meteo | TBD |
| Live time (35) | `Intl` (client-side) | Not needed |
| Live currency, crypto, and gold (36) | Free exchange-rate API (TBD) | TBD |
| Chemistry (46) | PubChem | TBD |
| Biology and general knowledge (48) | Wikipedia REST | TBD |
| Stock search (31) | Pexels and Pixabay | TBD |
| Medicine info (52, roadmap) | OpenFDA and RxNorm | TBD |
| Network speed (55) | Own backend or CDN | Not needed |

## 4. Build Order

1. Phase 0: shared agent framework (router, persona, switcher).
2. Lock In agent (Phase 9): simplest, no external API.
3. Live agent (Phase 10): weather, time, and currency and gold ticker, using free APIs.
4. Hacker agent (Phase 5): all client-side.
5. Study agent (Phase 1).
6. Career agent (Phase 4).
7. Business agent (Phase 3).
8. Creative agent (Phase 6).
9. Office agent (Phase 7).
10. Studio agent (Phase 8).
11. Doctor agent (Phase 2): after legal review.

## 5. Phase 0: Shared Agent Framework

Estimate: 8 hours.

- [x] Agent registry: each agent has an `id`, `name`, `persona`, and `tools` list (constant file).
- [x] Agent switcher UI: agent selector in the chat header, with a "Core" (default) option.
- [x] Router: maps the user query to tools using keyword matching (`utils/toolRouter.ts`). LLM classification comes later.
- [x] Persona prompt injector: when an agent is selected, its system prompt is applied to the chat.
- [x] Core fallback: when no agent is selected, the newcomer-style default answers.
- [x] Per-agent chat history: each chat has an `agentId`. The sidebar filters chats by agent, and switching agents opens that agent's latest chat.
- [ ] Test: switch agents, confirm the persona changes, and confirm each agent keeps its own history.

## 6. Agent Personas

Each agent has a default persona. The variant names in the feature catalogue are alternatives. Select one per agent.

| Agent | Default persona (select one) | Role | Attitude and tone |
|---|---|---|---|
| Study | Academic Assistant (or Padhai Ustad) | Teacher and tutor | Patient, step by step, asks questions back |
| Doctor | Health Advisor (or Sehat Sathi) | Health information guide | Careful, adds disclaimers, gives direct emergency warnings |
| Business | Finance Advisor (or Paisa Pandit) | Money and tax expert | Practical, focused on numbers, clear calculations |
| Career | Career Coach (or Naukri Guru) | Hiring and CV expert | Motivating, direct, professional |
| Hacker | Dev Toolkit (or Code Ustad) | Senior developer | Technical, short, code first |
| Creative | Design Studio (or Rang Wala) | Designer | Visual thinking; color and style |
| Office | Document Desk (or Kagaz Wala) | Office clerk and secretary | Organized, formal, quick |
| Studio | Media Studio (or Editing Ustad) | Video and audio editor | Creative, energetic, timeline-minded |
| Lock In | Productivity Coach (or Lock In Sher) | Focus coach | Strict but friendly; reminds the user of deadlines |
| Live | Live Desk (or Hal-Chal Wala) | Live information reporter | Fast, up to date, short updates |

Each persona will get a detailed attitude card covering greeting, limits, and what it will not do. Emotion and reaction rules apply to all personas, as defined in [Agent persona](../modules/agent-persona.md).

## 7. Phase 1: Study Agent

Tools: Chemistry (46), Physics (47), Biology and general knowledge (48), Quiz and flashcards (49), Math solver (45, roadmap), Lesson plan (50), PDF chat (1, roadmap).

- [x] 1.1 Biology and general knowledge (48): 3 hours. Wikipedia REST summary. LLM explanation later.
- [x] 1.2 Lesson plan (50): 3 hours. Structured LLM output for teachers.
- [x] 1.3 Chemistry (46): 4 hours. PubChem data (free, no key).
- [x] 1.4 Quiz and flashcards (49): 4 hours. LLM quiz from text. Flashcards later.
- [x] 1.5 Physics (47): 6 hours. Static constants and four formula calculators (Ohm's law, kinematics, kinetic energy, F = ma). Full formula library later.
- [ ] 1.6 Math solver (45, roadmap): 12 hours. MathJS verification and LLM steps.
- [ ] 1.7 PDF chat (1, roadmap): 10 hours. PDF text chunking and LLM.

Test: ask a question through the Study persona. Confirm the tool result and the persona's reply both appear.

## 8. Phase 2: Doctor Agent

Tools: Sasta Doctor persona (3), Medicine info (52, roadmap), Lab report decoder (51, roadmap).

- [x] 2.1 Sasta Doctor persona (3): 3 hours. Roman Urdu general health information with a disclaimer, applied through the persona prompt.
- [ ] 2.2 Medicine info (52, roadmap): 6 hours. OpenFDA and RxNorm data. Limited for Pakistani brand names.
- [ ] 2.3 Lab report decoder (51, roadmap): 8 hours. Simple explanation of values. No diagnosis.
- [x] 2.4 Emergency warning layer: keyword checks for chest pain, breathing difficulty, and similar phrases return an emergency message. Test this first.

Test: every reply includes a disclaimer. Emergency keywords skip the LLM. Do not launch publicly without legal review.

## 9. Phases 3–10: Remaining Agents

### Phase 3: Business Agent

Tools: Freelance rate (39), Tax calculator (23), QR and barcode (21, 22), Micro-Khata (41, roadmap).

- [x] 3.1 Freelance rate (39): 2 hours. USD to PKR with platform fees.
- [ ] 3.2 Tax calculator (23): 3 hours. Pakistani tax slabs, updated each budget year.
- [x] 3.3 Barcode generator (22): 3 hours. Local library (`jsbarcode`, CODE128 SVG).
- [x] 3.4 QR generator and scanner (21): 4 hours. Generator (`qrcode`) and camera or image scanner (`jsqr`) are done.
- [ ] 3.5 Micro-Khata (41, roadmap): 8 hours. IndexedDB expense and loan tracker.

Test: the tax calculator result matches a hand calculation.

### Phase 4: Career Agent

Tools: Roman Urdu clean-up (15), Roman Urdu to formal email (57), Prompt enhancer (5), CV and cover letter (56).

- [x] 4.1 Roman Urdu clean-up (15): 2 hours. Define the rules first.
- [x] 4.2 Roman Urdu to formal email (57): 2 hours. Tone presets (one default now; tone selection later).
- [x] 4.3 Prompt enhancer (5): 3 hours. Single-sentence transformation.
- [x] 4.4 CV and cover letter (56): 6 hours. Structured LLM output. PDF export later, together with Markdown to PDF.

Test: the formal email's tone matches the selected preset.

### Phase 5: Hacker Agent

Tools: Unit converter (54), Network speed (55), Text diff (17), Code and regex (53), JSON, XML, and SQL formatter (14), Markdown to PDF (16).

- [x] 5.1 Unit converter (54): 2 hours. Pure JavaScript.
- [x] 5.2 Network speed (55): 2 hours. Cloudflare speed endpoints, client-side.
- [x] 5.3 Text diff (17): 3 hours. Diff algorithm.
- [x] 5.4 Code and regex (53): 3 hours. Client-side regex tester. LLM explanation later.
- [x] 5.5 JSON, XML, and SQL formatter (14): 4 hours. JSON, XML, and basic SQL keyword formatting are done.
- [x] 5.6 Markdown to HTML and PDF (16): 4 hours. HTML is done. PDF uses the print dialog (Save as PDF).

Caveat: developer tools only. Do not add offensive hacking or security-bypass features.

Test: each tool works without internet access (only 53 and 55 need the network).

### Phase 6: Creative Agent

Tools: Image converter (6), Image resizer (7), Color palette (33), Stock search (31), Resource library (32, roadmap).

- [x] 6.1 Image converter (6): 3 hours. Canvas API.
- [x] 6.2 Image resizer (7): 4 hours. Shared with the Studio agent's image compressor.
- [x] 6.3 Color palette (33): 4 hours. Canvas-based, from an uploaded image. EyeDropper later.
- [x] 6.4 Stock search (31): 6 hours. Pexels through the backend proxy. Requires `PEXELS_API_KEY` in `services/api/.env`.
- [ ] 6.5 Resource library (32, roadmap): 20 hours. Moderation and license field.

Test: the image resizer gives the same output in the Creative and Studio agents.

### Phase 7: Office Agent

Tools: PDF to JPG (12), Scan to PDF (13), PDF merge and split (10), Document maker (new, 4 hours), PDF compressor (11, roadmap), Background remover (8, roadmap).

- [x] 7.1 PDF to high-resolution JPG (12): 3 hours. `pdf.js` render at 2× scale.
- [x] 7.2 Scan or images to PDF (13): 3 hours. `pdf-lib` (PNG and JPG).
- [x] 7.3 PDF merge and split (10): 4 hours. Merge and split are done with `pdf-lib`.
- [x] 7.4 Document maker (new): 4 hours. Generates a formal document from chat, with PDF and DOCX export.
- [ ] 7.5 PDF compressor (11, roadmap): 10 hours. Image re-encoding. Freeze risk on low-end PCs.
- [ ] 7.6 Background remover (8, roadmap): 12 hours. ONNX or WASM model in a Web Worker.

Test: a large PDF (20 MB) does not freeze the UI, and the progress bar moves.

### Phase 8: Studio Agent

Tools: none yet. Video compress, video trim and edit, video to MP3, audio trimmer, and noise reducer were removed from this phase because they made the browser hang. They are deferred to the roadmap.

- [ ] 8.1 Video compress (roadmap): FFmpeg.wasm is heavy and hangs the browser.
- [ ] 8.2 Noise reducer and gain booster (roadmap).
- [ ] 8.3 Video trim and edit (roadmap): FFmpeg.wasm is heavy and hangs the browser.
- [ ] 8.4 Audio trimmer and cutter (roadmap).
- [ ] 8.5 Video to MP3 (roadmap): FFmpeg.wasm is heavy and hangs the browser.

Note: the image compressor (7) is shared with Phase 6.2.

### Phase 9: Lock In Agent

Tools: Scratchpad (42), Pomodoro (40), Reminders (43), Focus mode (44).

- [x] 9.1 Scratchpad and smart clipboard (42): 4 hours. Tags and search. Stored in `localStorage` through the store; IndexedDB later.
- [x] 9.2 Pomodoro focus timer (40): 4 hours. 25 / 5 timer. The mood hook comes later (Feature 27).
- [x] 9.3 Reminders and alarms (43): 5 hours. Notification API. Works only while the tab is open.
- [x] 9.4 In-app focus mode (44): 5 hours. `visibilitychange` and Fullscreen API. Works only inside the app.

Test: the Pomodoro timer shows the correct time after switching tabs (checks background throttling).

### Phase 10: Live Agent

Tools: Weather (34), Live time (35), Live currency, crypto, and gold ticker (36). Movies, anime, games, and free games are core features (see section 11).

- [x] 10.1 Real-time weather (34): 3 hours. Open-Meteo through the backend proxy, with city search.
- [x] 10.2 Live time and world clock (35): 3 hours. `Intl.DateTimeFormat`, client-side.
- [ ] 10.3 Live currency, crypto, and gold (36): 5 hours. Currency and crypto are done (open.er-api.com and CoinGecko). Gold is pending: no free key-less source has been chosen yet.

Test: after a city search, the weather and time show the correct time zone.

## 10. Todo List (Upgrade Backlog)

Mini features and tools that are not yet built, or were added after this plan, go here. Mark them `[x]` when complete. Pick up agent upgrades from this list.

- [ ] Resource library (Creative 6.5)
- [ ] Background remover (Office 7.6)
- [ ] PDF compressor (Office 7.5)
- [ ] PDF chat (Study 1.7)
- [ ] Math solver (Study 1.6)
- [ ] Micro-Khata (Business 3.5)
- [ ] Medicine info (Doctor 2.2)
- [ ] Lab report decoder (Doctor 2.3)
- [ ] Pomodoro mood hook (Lock In 9.2, after Feature 27)
- [ ] Persona attitude cards (every agent)
- [ ] Core persona emotion system, per [Agent persona](../modules/agent-persona.md)

## 11. Core Features (Outside Agent Scope)

These features run with the core chat in every agent and are not part of this plan's phases: voice notes (4), continuous speech-to-text (25), voice-to-voice (26), animated companion (27), guardrail (29), Pico Voice (24), voice quota (30), movie suggestions (37), anime suggestions (new), game suggestions (new), and free games (38). Voice features are specified in [Voice mode](../modules/voice-mode.md).

## 12. Remaining Build List

Rule: items with no free API (key-less or free tier) are skipped. They appear under Skipped and stay there until a source is found.

### Build now (free source or no API)

- [x] 5.2 Network speed (55): Cloudflare speed endpoints (`__down`, `__up`), client-side.
- [x] 5.5 XML formatter (14): `DOMParser` and pretty printing. SQL formatter is also done.
- [x] 5.4 Code and regex (53): client-side regex tester. LLM explanation later.
- [x] 1.1 Biology and general knowledge (48): Wikipedia REST summary (free, key-less).
- [x] 1.3 Chemistry (46): PubChem (free, key-less).
- [x] 1.2 Lesson plan (50) and 1.4 Quiz and flashcards (49): existing LLM chat with the persona.
- [x] 3.1 Freelance rate (39): existing currency adapter (USD to PKR).
- [x] 4.1 Roman Urdu clean-up (15), 4.2 Roman Urdu to formal email (57), 4.3 Prompt enhancer (5): LLM presets.
- [x] 6.1 Image converter (6) and 6.3 Color palette (33): Canvas API, no package.
- [x] 7.4 Document maker (new): LLM, with PDF and DOCX export.
- [x] 2.4 Doctor emergency warning layer: keyword check, no API.

### Needs a package (installed)

- [x] 5.6 Markdown to PDF (16) and 7.1 PDF to JPG (12): `pdf.js` (npm) and print-to-PDF.
- [x] 7.2 Scan to PDF (13) and 7.3 PDF merge (10): `pdf-lib`.
- [ ] 8.1 Video compress, 8.3 Video trim, 8.5 Video to MP3 (19): `ffmpeg.wasm` (roadmap; removed from the Studio agent).
- [ ] 8.2 Noise reducer (20), 8.4 Audio trimmer (18): Web Audio API (roadmap; removed from the Studio agent).
- [x] 3.3 Barcode (22) and 3.4 QR (21, generator): `jsbarcode` and `qrcode`. QR scanner added later.
- [x] 6.2 Image resizer (7): Canvas API (shared with 8.x).
- [x] 6.4 Stock search (31): Pexels and Pixabay (keys required), backend proxy.

### Skipped (no free API found yet)

- [ ] 10.3 Gold (36): no free key-less source found.
- [ ] 2.2 Medicine info (52, roadmap): OpenFDA is free, but data for Pakistani brands is weak. Later.
- [ ] 2.3 Lab report decoder (51, roadmap): LLM plus legal review. Later.
- [ ] 3.2 Tax calculator (23): the official free source for Pakistani slabs has not been verified.
- [ ] 3.5 Micro-Khata (41, roadmap), 6.5 Resource library (32, roadmap), 1.6 Math solver (45, roadmap), 1.7 PDF chat (1, roadmap), 7.5 PDF compressor (11, roadmap), 7.6 Background remover (8, roadmap): deferred.

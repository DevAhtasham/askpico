# Product Roadmap

**Owner:** Pico product team
**Related:** [Feature catalog](feature-catalog.md) · [Beta launch](beta-launch.md) · [Voice mode](../modules/voice-mode.md)

This document covers features that are complex, costly, or carry legal or platform risk. They are planned for after the beta launch. Each entry gives the motivation, proposed approach, effort, and cost impact.

**Status legend**

- `Planned`: decided, not started.
- `Exploring`: research needed before a decision.
- `Icebox`: good idea, low priority.

## 1. Standalone Project Launcher (`.exe`)

**Status:** `Planned`. **Removed from codebase:** v1.x (November 2026).

### 1.1 Background

Downloaded artifact projects were previously bundled with a C# WinForms launcher (`CoursueLauncher`, published as `Launcher.exe` through `dotnet publish` into `apps/web/public/bin/`). The self-contained .NET single-file build produced a binary of about **100 MB or more**, because `SelfContained=true` embeds the full .NET desktop runtime. That size was unacceptable for a file users download per artifact. As a result:

- `CoursueLauncher/` (C# source and a Go rewrite attempt) and `apps/web/public/bin/` were deleted.
- Exported zips now ship `run.bat` and `HOW_TO_RUN.md` instead (see `RUN_BAT` and `RUN_GUIDE` in `apps/web/src/utils/projectScaffold.ts`).

### 1.2 Goal

Reintroduce a small native launcher (about 1–5 MB) bundled into "Desktop App" exports. It will:

1. Validate `package.json` and a `dev` script next to the executable.
2. Run `npm install` hidden, then `npm run dev`.
3. Poll `http://localhost:5173` (500 ms interval, 2 s request timeout, 5 min deadline).
4. Open the app in the default browser, then exit.
5. Show a small dark-themed status window and native error dialogs.

### 1.3 Proposed approach: Go

- **Why Go:** a single static `.exe` with no .NET dependency. About 2–5 MB with the `walk` GUI library, about 1–2 MB with UPX compression.
- **UI:** `github.com/lxn/walk` (native Win32 controls, dark background). Fallbacks: raw Win32 through `golang.org/x/sys/windows`, then a console UI as a last resort.
- **Processes:** `os/exec` with `cmd /c`, `SysProcAttr.HideWindow`, and the working directory set to the executable's directory.
- **Build:** `GOOS=windows GOARCH=amd64 go build -ldflags "-s -w -H=windowsgui" -o dist/Launcher.exe .`, then `upx --best`.
- **Integration:** Reintroduce the `apps/web/public/bin/Launcher.exe` fetch in `desktopPackage.ts`. The logic was removed; restore it from git history if needed.

### 1.4 Effort and cost

- **Effort:** about 1 day (part of the Go source was written before removal).
- **Cost:** zero. The binary is client-side and needs no infrastructure.

## 2. Native Desktop App (Electron)

**Status:** `Planned`. **Directory:** `apps/desktop/`

- Electron wrapper around `apps/web/` with support for low-spec PCs (see device tiers in the [feature catalog](feature-catalog.md)).
- Reuses the React frontend. Local persistence uses the file system instead of `localStorage`.
- Distribution: Windows installer (NSIS), macOS DMG, Linux AppImage.
- **Cost:** free. Code-signing certificates are the only paid item (about USD 100–300 per year, deferrable).

## 3. Mobile App (Kotlin, Android)

**Status:** `Planned`. **Directory:** `apps/mobile/`

- A native Android app written in Kotlin. It hosts a WebView that loads the same `apps/web/dist` build, so the React code is reused.
- Native features (file save and share, camera, notifications, back button) are bridged to the web app through a `WebView` JavaScript interface.
- Store requirement: Google Play developer account (USD 25, one-time).
- iOS is not part of this plan. It needs a separate decision before any work starts.
- API key security and on-device processing policy: see the [feature catalog](feature-catalog.md), sections 9 and 10.

## 4. Artifact Page-Swap Navigation

**Status:** `Exploring`

- **Current:** The `artifact-navigate` postMessage is intercepted, but real multi-page navigation is not fully implemented. The model is guided toward `useState`-based pages.
- **Future:** Resolve clicked paths against generated `src/pages/*` files. Re-bundle using the `options.entry` override already added to `bundleReactArtifact`, then swap the iframe `srcDoc`. This gives true multi-page navigation inside the preview.
- **Cost:** zero. Runs in the browser only.

## 5. Multi-Model Compare Mode

**Status:** `Icebox`. **Costly.**

- Send one prompt to two or three models side by side. The user picks the best answer.
- Requires multi-provider routing on the backend and a split-view UI.
- **Cost:** multiplies token spend per message by 2–3×. Gate behind a paid tier.

## 6. Document and PDF Chat

**Status:** `Icebox`. Feature F1 in the backlog below.

- Upload a PDF or DOCX, extract text (client-side `pdf.js`), and add it to the context.
- Large documents need chunking and retrieval (Vectorize or a local embedding model).
- **Cost:** embedding and storage infrastructure if retrieval runs in the cloud. Free if client-side only.

## 7. Accounts, Cloud Sync, and Sharing

**Status:** `Icebox`. **Costly.**

- Authentication, server-side chat persistence, cross-device sync, and shareable chat links.
- Candidates: Supabase Auth with Postgres, or Cloudflare D1 with Access.
- Accounts are specified in [Authentication](../engineering/authentication.md) and the database changes in [Database](../engineering/database.md). This item is the cloud-sync extension beyond the beta.
- **Cost:** the first recurring infrastructure cost (database, authentication, storage).

## 8. Offline and On-Device LLM

**Status:** `Icebox`. **Complex.**

- `web-llm` or WebGPU models running fully in the browser. Zero API cost and privacy-first.
- Constraints: 2–4 GB model download and a WebGPU-capable GPU. Realistically desktop only.
- **Cost:** zero per request. High engineering effort.

## 9. Plugin and Tool Ecosystem

**Status:** `Icebox`

- Web search, code execution, and image tools callable from chat through backend function calling.
- **Cost:** per-tool API spend (search APIs, code sandboxes).

## 10. Feature Backlog (Moved from the Feature Catalog)

These features moved out of the feature catalogue because they need heavy compute, paid infrastructure, legal review, or unofficial dependencies. Their numbers match the feature catalogue so cross-references stay valid. Items 1–10 above are not repeated here.

### F1. Document and PDF Chat and Summarizer

**Status:** `Icebox`. **Costly.** Part of item 6.

- Same as item 6 (PDF text extraction and chunking). Retrieving the top two relevant paragraphs adds about 100–200 tokens per query.
- Scanned PDFs need a separate OCR tool.

### F2. Multi-LLM Side-by-Side Comparison

**Status:** `Icebox`. **Costly.** Part of item 5.

- Same as item 5. Cost doubles, so rate limits and a daily cap are required.

### F8. Image Background Remover (WASM)

**Status:** `Exploring`. **Complex.** PC and Mobile (heavy).

- An ONNX or WASM model runs in a Web Worker. Core i3 2nd generation CPUs lack AVX2, so inference is slow. The model is also large.
- On mobile, only Tier 2 and Tier 3 devices.

### F9. Passport-Size Photo Maker

**Status:** `Icebox`. **Complex.** Depends on F8.

- Needs background removal, cropping, and a face-detection model.
- Passport size and background rules differ by country and office. Show a disclaimer that the output is not an official photo.

### F11. PDF Compressor

**Status:** `Exploring`. **Complex.**

- Images must be re-encoded, using WASM or the server. Real compression is difficult in pure JavaScript.
- Files of 20–30 MB risk freezing low-end PCs and mobile devices.

### F19. Video to Audio (MP4 to MP3)

**Status:** `Exploring`. **Complex.**

- `FFmpeg.wasm` is large and slow in a single thread. Test on real PCs. The time estimate is optimistic.
- On mobile, limited to short clips.

### F27. Animated Emoji Head Companion and Mood State Machine

**Status:** `Exploring`. **Art asset work.**

- An expressive head built with Rive, Lottie, or Canvas. Moods (happy, crying, flirty, thinking) are set by `[mood: ...]` tags.
- Art assets must have a clear license.
- Mood tags come from the guardrail layer in [Voice mode](../modules/voice-mode.md) (Feature 29).
- Feature 40 (Pomodoro) depends on this mood state.
- The character direction is specified in [Agent persona](../modules/agent-persona.md) and [Pico character](../modules/pico-character.md).

### F28. Guest Local LLM (WebLLM and WebGPU)

**Status:** `Icebox`. **Complex.** Same as item 8.

- Models: SmolLM-360M (about 200 MB), Qwen2.5-0.5B (about 350 MB), Llama-3.2-1B (about 700 MB), cached in the browser.
- Requires Chrome or Edge 113 or later on desktop, and Chrome 121 or later on Android for WebGPU. Firefox, older iOS, and 2 GB phones are not supported.
- Send complex queries to the backend LLM. Show the download size and progress before downloading.

### F32. Free Design and Code Resource Library

**Status:** `Icebox`. **Costly** (database and moderation).

- Icons, templates, and snippets stored in a database. Community uploads need moderation.
- Each template can have its own license, so upload terms and a license field are required.

### F38. Free Games Tracker

**Status:** `Icebox`. **Risk** (unofficial sources).

- Epic and Steam have no official free-games API. Third-party trackers create dependency risk.
- Link to the store's official page. Do not claim the offer is available.

### F45. Step-by-Step Math Solver (LLM and Wolfram)

**Status:** `Exploring`. **Costly** (Wolfram quota).

- Verify computations with MathJS. LLM-generated steps can be wrong.
- The Wolfram Alpha free quota is limited and requires an AppID.

### F51. Lab Report Decoder

**Status:** `Exploring`. **Legal risk** (health).

- Do not diagnose. Explain report values in simple terms only. Emergency keywords (chest pain, breathing difficulty) trigger an emergency warning instead of an LLM response.
- Do not launch publicly without a legal review against Pakistan's medical regulations (DRAP and PMDC).

### F52. Medicine Basic Info

**Status:** `Exploring`. **Legal risk** (health).

- OpenFDA, RxNorm, and MedlinePlus Connect (NIH) cover mostly US brands. Pakistani brand names will not match.
- Do not give dosage or timing advice. A doctor or pharmacist disclaimer is required.

## Removed and Archived

| Item | Removed | Reason | Where it lived |
|---|---|---|---|
| `CoursueLauncher/` (C# and Go launcher) | November 2026 | Self-contained .NET executable of about 100 MB. Replaced by `run.bat` and `HOW_TO_RUN.md` in exports | Git history before removal |
| `apps/web/public/bin/` (Launcher.exe, icon) | November 2026 | Same as above | Git history |
| Launcher bundling in `desktopPackage.ts` | November 2026 | Fetch logic removed. Zip export is scaffold-only | `apps/web/src/utils/desktopPackage.ts` |
| Voice input and output (item 5), F24 Pico Voice, F26 Voice-to-Voice, F30 Voice Quota | November 2026 | Voice features grouped into one plan | [Voice mode](../modules/voice-mode.md) |

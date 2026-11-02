# FahmChat — Future Roadmap

> Is file mein wo features documented hain jo complex ya costly hain, aur production launch ke baad develop kiye jayenge. Har feature ke saath motivation, proposed approach, effort estimate aur cost impact likha hai.
>
> **Status legend:** `Planned` = decided, not started · `Exploring` = research needed · `Icebox` = good idea, low priority

---

## 1. Standalone Project Launcher (`.exe`)

**Status:** `Planned` · **Removed from codebase:** v1.x (Nov 2026)

### Background

Downloaded artifact projects were previously bundled with a C# WinForms launcher (`CoursueLauncher`, published as `Launcher.exe` via `dotnet publish` into `web/public/bin/`). The self-contained .NET single-file build produced a **~100+ MB** binary because `SelfContained=true` embeds the entire .NET Desktop Runtime. That was unacceptable for a file users download per artifact, so:

- `CoursueLauncher/` (C# source + a Go rewrite attempt) and `web/public/bin/` were **deleted**.
- Zips now ship `run.bat` + `HOW_TO_RUN.md` instead (see `web/src/utils/projectScaffold.ts` → `RUN_BAT`, `RUN_GUIDE`).

### Goal

Re-introduce a tiny native launcher (~1–5 MB) bundled into "Desktop App" exports that:

1. Validates `package.json` and a `dev` script next to the exe
2. Runs `npm install` hidden, then `npm run dev`
3. Polls `http://localhost:5173` (500 ms interval, 2 s request timeout, 5 min deadline)
4. Opens the app in the default browser, then exits
5. Shows a small dark-themed status window + native error dialogs

### Proposed approach — Go

- **Why Go:** single static `.exe`, no .NET/runtime dependency, ~2–5 MB with `walk` GUI, ~1–2 MB with UPX.
- **UI:** `github.com/lxn/walk` (native Win32 controls, dark background). Fallback: raw Win32 via `golang.org/x/sys/windows`; last resort console UI.
- **Processes:** `os/exec` with `cmd /c`, `SysProcAttr.HideWindow`, working dir = `os.Executable()` dir.
- **Build:** `GOOS=windows GOARCH=amd64 go build -ldflags "-s -w -H=windowsgui" -o dist/Launcher.exe .` then `upx --best`.
- **Integration:** reintroduce `web/public/bin/Launcher.exe` fetch in `desktopPackage.ts` (logic removed — restore from git history if needed).

### Effort / Cost

- **Effort:** ~1 day (Go source was partially written before removal).
- **Cost:** zero — client-side binary, no infra.

---

## 2. Native Desktop App (Electron)

**Status:** `Planned` · **Directory:** `desktop/`

- Electron wrapper around `web/` with low-spec PC support targets (see `feature.md` for device tiers).
- Reuses the React frontend; local persistence via file system instead of `localStorage`.
- Distribution: Windows installer (NSIS), macOS DMG, Linux AppImage.
- **Cost:** free — code-signing certificates are the only paid item (~$100–300/yr, deferrable).

## 3. Mobile App (Capacitor — Android & iOS)

**Status:** `Planned` · **Directory:** `app/`

- Capacitor wrapper over the web build for Android + iPhone (see `feature.md`).
- Store requirements: Google Play dev account ($25 once), Apple Developer ($99/yr).
- API key security + on-device processing policy documented in `feature.md`.

## 4. Artifact Page-Swap Navigation

**Status:** `Exploring`

- Current: `artifact-navigate` postMessage is intercepted but multi-page real-navigation is not fully implemented; model is guided toward `useState`-based pages.
- Future: resolve clicked paths against generated `src/pages/*` files, re-bundle with the `options.entry` override already added to `bundleReactArtifact`, and swap the iframe `srcDoc` — giving true multi-page navigation inside the preview.
- **Cost:** zero — browser-side only.

## 5. Voice Input & Output

**Status:** `Exploring` · **Costly**

- Web Speech API (free, browser-native) for dictation; Whisper API or on-device `whisper.cpp`/transformers.js for higher accuracy.
- TTS: browser `speechSynthesis` (free) vs ElevenLabs/Google TTS (paid).
- **Cost:** free with browser APIs; paid tier for premium voices.

## 6. Multi-Model Compare Mode

**Status:** `Icebox` · **Costly**

- Send one prompt to 2–3 models side-by-side; user picks the best answer.
- Requires backend multi-provider routing + UI split view.
- **Cost:** multiplies token spend per message (2–3×) — gate behind paid tier.

## 7. Document & PDF Chat

**Status:** `Icebox`

- Upload PDF/DOCX → extract text (client-side `pdf.js`) → inject into context.
- Large docs need chunking/RAG — Vectorize or a local embedding model.
- **Cost:** embedding/storage infra if cloud RAG; free if client-side only.

## 8. Accounts, Cloud Sync & Sharing

**Status:** `Icebox` · **Costly**

- Auth + server-side chat persistence, cross-device sync, shareable chat links.
- Candidates: Supabase/Auth.js + Postgres, or Cloudflare D1 + Access.
- **Cost:** first recurring infra cost — introduces DB, auth, and storage spend.

## 9. Offline / On-Device LLM

**Status:** `Icebox` · **Complex**

- `web-llm`/WebGPU models running fully in-browser — zero API cost, privacy-first.
- Constraints: 2–4 GB model download, WebGPU hardware requirement; realistically desktop-only.
- **Cost:** zero per-request; high engineering effort.

## 10. Plugin / Tool Ecosystem

**Status:** `Icebox`

- Web search, code execution, image tools callable from chat (function calling on the backend).
- **Cost:** per-tool API spend (search APIs, code sandboxes).

---

## Removed / Archived

| Item | Removed | Reason | Where it lived |
|------|---------|--------|----------------|
| `CoursueLauncher/` (C# + Go launcher) | Nov 2026 | ~100 MB self-contained .NET exe; replaced by `run.bat` + `HOW_TO_RUN.md` in exports | git history pre-removal |
| `web/public/bin/` (Launcher.exe, icon) | Nov 2026 | same as above | git history |
| Launcher bundling in `desktopPackage.ts` | Nov 2026 | fetch logic deleted; zip now scaffold-only | `web/src/utils/desktopPackage.ts` |

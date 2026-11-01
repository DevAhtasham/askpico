# FahmChat: Split-Screen Artifact Workspace Plan

## Goal

Jab AI code, HTML ya document generate kare, to layout single chat view se split-screen workspace mein badal jaye:

- **Left:** chat history aur conversation flow (existing `Chat` UI).
- **Right:** artifact container jo baqi jagah le (tabs, toolbar, Preview / Code viewer).

Reference designs:
- Toolbar icons with mode toggle (globe, file, `Code` active, layers): image 1.
- Code viewer with file tree, file path tab, search box, Download button: image 2.
- Split view with code on left and live preview on right, with `Chat` / `Preview` tabs at top: image 3.

## Current Code Context

- `web/src/components/Chat/Chat.tsx`: single column layout. `ChatHeader`, `ChatContent`, `ChatFooter` stacked inside one card. Ye wrapper split layout ka main change point hai.
- `web/src/components/Chat/ChatContent/ChatContent.tsx`: messages list aur sticky input. Chat column mein yahi rahega.
- `web/src/components/Chat/ChatContent/Message/View/ContentView.tsx`: AI markdown render karta hai (`ReactMarkdown`, `CodeBlock`). Artifact detection ka source yahi hai.
- `web/src/components/Chat/ChatContent/CodeBlock.tsx` (ya equivalent): existing code block component, Copy button aur highlight ke liye reuse ho sakta hai.
- `web/src/store/store.ts` aur slices (`store/*-slice.ts`): naya `artifact-slice.ts` add hoga.
- `web/src/constants/chat.ts`: `codeLanguageSubset` pehle se hai, syntax highlight ke liye reuse hoga.
- `backend/src/server.js`: streaming response yahin se aata hai. Backend changes sirf system prompt mein artifact format guidance ke liye chahiye (optional, Phase 5).

## Architecture Decisions

1. **Artifact source of truth:** store mein `artifacts` array aur `activeArtifactId`, per chat. Chat ke saath persist hoga (`partialize` mein add karna hoga).
2. **Artifact detection:** AI response complete hone par markdown code fences parse karein:
   - ```` ```html ```` ya ```` ```jsx ```` / `html` document -> type `preview` (Preview tab available).
   - Other languages (`ts`, `py`, etc.) -> type `code`.
   - Long document (markdown heading based) -> type `document`.
   - Ek message mein multiple code blocks ho to har block ek file ban sakta hai (Files tab ke liye).
3. **Trigger:** jab artifact pehli dafa detect ho ya user "Open" karein (message ke neeche button), tab workspace open hoga. Streaming ke dauran nahi, sirf complete response par, taake half-written HTML render na ho.
4. **Layout mode:** `artifactPanelOpen` boolean store mein. `Chat.tsx` mein `flex-row` layout; left column `min-w-[360px]`, right column `flex-1`. Mobile (`<md`) par right panel full-screen overlay ban jaye.
5. **Preview safety:** HTML preview `iframe` mein `srcDoc` ke sath `sandbox="allow-scripts"` (bina `allow-same-origin`) taake AI code app ki localStorage/API key tak na pahunche.

## Implementation Phases

### Phase 1: State and artifact parsing

- Add `web/src/types/artifact.ts`:
  - `ArtifactType = 'code' | 'preview' | 'document'`
  - `ArtifactInterface { id, title, type, language, filePath?, content, messageIndex }`
- Add `web/src/store/artifact-slice.ts`:
  - `artifacts`, `activeArtifactId`, `artifactPanelOpen`, `activeTab: 'preview' | 'code' | 'files'`
  - Actions: `openArtifact`, `closeArtifactPanel`, `setActiveTab`, `setArtifacts`.
- Register slice in `web/src/store/store.ts` and add fields to `createPartializedState`.
- Add `web/src/utils/artifactParser.ts`:
  - `extractArtifacts(markdown: string, messageIndex: number): ArtifactInterface[]`
  - Fence regex se code blocks nikalna, language map karna, filename ka hint (`// file: src/x.ts` ya fence info string) parse karna.
- Unit tests: `web/src/utils/artifactParser.test.ts` (Vitest, agar project mein setup nahi to pehle setup karna hoga; warna manual check list).

### Phase 2: Split layout

- `web/src/components/Chat/Chat.tsx`:
  - Main content ko `flex` row mein wrap karna. Left: existing `ChatHeader`, `ChatContent`, `ChatFooter`. Right: `ArtifactPanel` jab `artifactPanelOpen` true ho.
  - Transition: `transition-all duration-300`, width animation.
- `ChatFooter` (language/help footer) ka hide logic chal raha hai, wo left column mein hi rahega.
- Left column ke `ChatContent` ka max width panel open hone par `max-w-3xl` se chhota ho sakta hai (responsive).
- Toggle button: `ChatHeader` mein "Artifacts / Panel" button, taake user panel band/kholen.

### Phase 3: Artifact panel shell and tabs

- New folder: `web/src/components/Artifact/`
  - `ArtifactPanel.tsx`: outer container, header, close button.
  - `ArtifactTabs.tsx`: pill tabs `Preview`, `Code`, `Files` (reference image 1 ke icon-toggle style mein). Files tab sirf multi-file artifact par enable ho.
  - `ArtifactHeader.tsx`: artifact title, file path, version info.
- Tabs ka active state store mein (`activeTab`) rakhna taake reload/switch par kho na jaye.

### Phase 4: Read-only code viewer (Code tab)

- Component: `web/src/components/Artifact/CodeViewer.tsx`.
- Features:
  - Line numbers (CSS counter ya `<pre>` ke saath gutter column).
  - Syntax highlighting: `rehype-highlight` (already installed) ya `highlight.js` ke saath `codeLanguageSubset`.
  - Top toolbar:
    - Search code (input, matches highlight karna, next/prev).
    - File path (`filePath` ya `title`).
    - Copy button (existing `CopyButton` reuse karna).
    - Download button (Blob se `.txt`/file ka actual extension ke sath).
  - **Read-only:** `<pre>` / `<code>` element, `contentEditable` nahi, textarea nahi. Agar Monaco/CodeMirror use karein to `readOnly: true` aur `domReadOnly: true` set karein.
- Files tab (multi-file): left side mein file tree (reference image 2 ki tarah), right side mein selected file ka viewer. Ye Phase 4b mein, pehle single file viewer complete karein.

### Phase 5: Preview tab

- Component: `web/src/components/Artifact/PreviewFrame.tsx`.
- `iframe` with `srcDoc={content}` aur `sandbox="allow-scripts"`.
- Modern frame: rounded border, subtle shadow, toolbar mein `Refresh` aur `Open in new tab` (blob URL se).
- Document type (markdown/plain text): `ContentView` ke markdown renderer se render karna, sandbox ki zarurat nahi.
- Optional: backend `systemPrompt` mein artifact guidance add karna (e.g., "HTML complete ek fence mein de") taake parsing reliable ho. Ye `backend/src/config.js` ke `systemPrompt` mein change hoga.

### Phase 5b: React/JSX preview via esbuild-wasm (user-approved)

- Package: `esbuild-wasm`. WASM file ~8-9MB raw (~2.5-3MB gzip). Ye edit nahi, sirf compile karti hai — Code viewer read-only hi rehta hai.
- **Silent prefetch strategy (user requirement):**
  - Initial website load par `esbuild.wasm` **kabhi** na aaye. Koi blocking import nahi.
  - App idle hone par (`requestIdleCallback`, fallback `setTimeout`) `fetch('esbuild.wasm', { priority: 'low' })` se silently download karke browser cache mein rakhna.
  - `esbuild-wasm` JS module bhi `import('esbuild-wasm')` se lazily aana chahiye — Vite dynamic import.
  - Pehli dafa Preview tab par React artifact khule aur wasm abhi cache mein na ho, tabhi foreground download + loading spinner.
  - Prefetch utility: `web/src/utils/esbuildPrefetch.ts` — app init ke baad idle callback mein chale.
- Bare npm imports resolve karne ke liye esbuild plugin jo `pkg` ko `https://esm.sh/pkg` par map kare (~50-100 lines). CDN responses ko `sessionStorage`/`Cache` mein rakhna taake re-compile tez ho.
- Bundled output ek blob URL/`srcDoc` doc ke andar `type="module"` script ke tor par chale — iframe `sandbox="allow-scripts"`.
- Loading/compile errors Preview tab mein cleanly dikhna chahiye (esbuild error messages).

### Phase 6: Polish and responsiveness

- Mobile (`<md`): panel full-screen overlay, close button, back to chat.
- Dark mode check (existing `dark:` classes).
- Keyboard: Escape se panel band.
- Empty state: panel open ho to "No artifact yet" message.
- Streaming: artifact sirf complete message par create ho.

## Files To Create

- `web/src/types/artifact.ts`
- `web/src/store/artifact-slice.ts`
- `web/src/utils/artifactParser.ts`
- `web/src/components/Artifact/ArtifactPanel.tsx`
- `web/src/components/Artifact/ArtifactTabs.tsx`
- `web/src/components/Artifact/ArtifactHeader.tsx`
- `web/src/components/Artifact/CodeViewer.tsx`
- `web/src/components/Artifact/PreviewFrame.tsx`
- `web/src/utils/esbuildPrefetch.ts` (idle-time wasm prefetch)
- `web/src/utils/esbuildBundler.ts` (lazy import + esm.sh resolver plugin)
- `web/package.json` mein dependencies: `esbuild-wasm`, `fflate`
- `backend/src/config.js` (systemPrompt mein multi-file fence instruction)

## Files To Modify

- `web/src/store/store.ts` (slice register, partialize)
- `web/src/components/Chat/Chat.tsx` (split layout)
- `web/src/components/Chat/ChatHeader.tsx` (panel toggle button)
- `web/src/components/Chat/ChatContent/Message/View/ContentView.tsx` (open artifact button on AI messages)
- `backend/src/config.js` (optional, Phase 5)

## Verification

- `npx tsc --noEmit` in `web/` after every phase.
- Manual test cases:
  1. AI se HTML page maangain, response complete hone par panel auto open ho, Preview tab par page render ho.
  2. Python code maangain, Code tab par line numbers, highlight, search aur Copy/Download kaam karein.
  3. Code viewer mein click/type karne se text change na ho.
  4. Preview iframe mein `parent.localStorage` access na ho (sandbox check).
  5. Panel close/open par chat scroll position aur messages na badlein.
  6. Mobile width par overlay behave kare.
  7. Reload ke baad artifacts aur active tab persist hon.

## Decisions

- **Preview:** HTML pehle (Phase 5), React/JSX `esbuild-wasm` ke saath lazy + idle prefetch (Phase 5b).
- **Multi-file format:** backend `systemPrompt` mein instruction ke AI har code fence mein file path likhe, e.g. ```` ```jsx src/App.jsx ````. Files tab isi path se file tree banayega.
- **Download:** `fflate` se zip banayega (single file aur multi-file dono ke liye support). Single file ka actual extension ho, multi-file ka zip.
- **Code viewer:** `highlight.js` (rehype-highlight ka engine) + `<pre>`, line numbers CSS counter se. Read-only. Monaco nahi.

## Recommended Order

1. Phase 1 (state + parser) aur Phase 2 (split layout) pehle, taake layout dikhne lage.
2. Phase 3 aur Phase 4 (single-file code viewer).
3. Phase 5 (preview).
4. Phase 4b (Files tab) aur Phase 6 (polish).

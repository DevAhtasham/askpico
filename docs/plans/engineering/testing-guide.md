# Feature Testing Guide

This guide provides test steps and ready-to-paste prompts for every agent and tool. Mark each check `[x]` when it passes.

Test inputs are written in the language users actually type (Roman Urdu or English). Expected results are described in English.

## 1. Setup

### 1.1 Backend (`services/api/`)

1. Create `services/api/.env` by copying `services/api/.env.example`, and fill in these keys:
   - `GEMINI_API_KEY`: LLM chat and all text tasks.
   - `PEXELS_API_KEY` and `PIXABAY_API_KEY`: stock photos. Both are optional, but at least one is required.
2. Start the server:

```powershell
cd services/api
npm run dev
```

The backend runs at `http://localhost:3001`.

### 1.2 Frontend (`apps/web/`)

```powershell
cd apps/web
npm run dev
```

Open `http://localhost:5173` in the browser.

### 1.3 Pre-flight checks

- [ ] No red errors in the browser console.
- [ ] Stock photos: `http://localhost:3001/api/tools/stock?query=sunset` returns JSON with a `photos` array.
- [ ] Video tools need an internet connection the first time they run, because the FFmpeg core loads from jsDelivr.

### 1.4 Type check

```powershell
cd apps/web
npx tsc --noEmit
```

Expected: no output and exit code 0.

> **Known issue:** `npm run build` currently fails with an SWC error from `vite-plugin-top-level-await`. The dev server is not affected.

## 2. Agent Selection and Core Features

The agent picker and tool panel are not visible in the UI. Routing happens on the backend and is hidden from the user.

- [ ] **No picker or panel:** the chat header has no agent dropdown, and no tool panel appears above the chat.
- [ ] **Auto routing (Study):** in core chat, paste:
  ```
  Photosynthesis ko simple tareeke se samjhao
  ```
  Expected: the reply appears in the same chat, with no status bar or agent label.
- [ ] **Auto routing (core):** in core chat, type `Hi, kaise ho?`. Expected: the reply streams normally.
- [ ] **Specialist memory:** send a specialist question, then a follow-up (for example `iska aik example do`). Expected: the follow-up uses the earlier question as context. This history is kept only on the backend and must not appear in the UI.
- [ ] **Backend database:** `services/api/data/agents.db` is created (it is git-ignored). The browser `localStorage` has an `pico-anon-id` key.

## 3. Study Agent

Tools: Wikipedia, PubChem, Physics, Lesson plan, Quiz.

- [ ] **Wiki (Biology and general knowledge):** input `Photosynthesis`. Expected: a Wikipedia summary appears.
- [ ] **PubChem (Chemistry):** input `caffeine`. Expected: the compound formula and molecular weight appear.
- [ ] **Physics:** Ohm's law calculator with V = 5 and R = 10. Expected: I = 0.5 A.
- [ ] **Lesson plan:** paste:
  ```
  Photosynthesis, Class 8, 40 min
  ```
  Expected: a structured plan with objectives, materials, timings, and assessment.
- [ ] **Quiz:** paste:
  ```
  Photosynthesis, Class 8, 5 MCQs with answers
  ```
  Expected: 5 MCQs with answers.
- [ ] **Export PDF, Download DOCX, Download:** all three buttons on the lesson plan output work.

## 4. Doctor Agent (Sasta Doctor)

No tool panel. Chat only. Persona: Roman Urdu, general information, disclaimer.

- [ ] **Persona reply:** select the Doctor agent and paste:
  ```
  Mujhe 2 din se bukhar hai, kya karun?
  ```
  Expected: general home-care advice in Roman Urdu, a recommendation to see a doctor, and a disclaimer at the end. No medicine dosage.
- [ ] **Emergency filter:** paste:
  ```
  mujhe chest pain ho raha hai
  ```
  Expected: an immediate emergency message (hospital or Rescue 1122). The backend log shows `emergency keyword matched, LLM skipped`.
- [ ] **Emergency filter (Urdu):** paste:
  ```
  seene mein dard hai aur saans lene mein takleef
  ```
  Expected: the same emergency message.

## 5. Business Agent

Tools: Freelance rate, Barcode, QR generator, QR scanner.

- [ ] **Freelance rate:** enter a USD hourly rate (for example `20`). Expected: PKR conversion using the live rate.
- [ ] **Barcode:** input `ABC-123`. Expected: a CODE128 barcode SVG appears.
- [ ] **QR generator:** input `https://example.com`. Expected: the QR image renders.
- [ ] **QR scanner (image):** upload an image containing a QR code ("Scan from image"). Expected: the same link or text appears under "Result:".
- [ ] **QR scanner (camera):** press "Start camera", grant permission, and hold a QR code in front of the camera. Expected: the result appears and the camera stops. HTTPS or localhost is required.

## 6. Career Agent

Tools: Roman Urdu clean-up, formal email, prompt enhancer, CV and cover letter.

- [ ] **Roman Urdu clean-up:** paste:
  ```
  mjhe kl office nhi aana, thori sik hun
  ```
  Expected: a cleaned sentence such as `Mujhe kal office nahi aana, thori sick hun.` (abbreviations expanded, punctuation fixed). If the input is already clean, the output will be nearly identical. This is normal.
- [ ] **Formal email:** paste:
  ```
  boss ko kal aur parso ki leave ki email likho, bukhar hai
  ```
  Expected: a formal email with a subject line and body.
- [ ] **Prompt enhancer:** paste:
  ```
  write a poem about rain
  ```
  Expected: a clearer, more detailed prompt.
- [ ] **CV and cover letter:** paste:
  ```
  Name: Ali Khan, 2 saal web developer, React aur Node jaante hain, Karachi, Software house ke liye cover letter
  ```
  Expected: a CV or cover letter draft.

## 7. Hacker Agent (Dev Toolkit)

Tools: Unit converter, Text diff, JSON formatter, Markdown to HTML, Network speed, Regex tester, XML formatter, SQL formatter, Markdown to PDF.

- [ ] **Unit converter:** 10 kg to lb. Expected: about 22.05 lb.
- [ ] **Text diff:** paste two different texts. Expected: added and removed lines are highlighted.
- [ ] **JSON formatter:** paste:
  ```
  {"a":1,"b":[2,3]}
  ```
  Expected: indented JSON.
- [ ] **Markdown to HTML:** paste:
  ```
  # Hi
  **bold** text
  ```
  Expected: HTML containing `<h1>` and `<strong>`.
- [ ] **Network speed:** press "Start". Expected: within about 12 seconds, ping (ms), download, and upload (Mbps) values appear. Compare against Ookla (speedtest.net) on the same network. Some difference is normal, but it should not be large.
- [ ] **Regex tester:** pattern `\d{4}-\d{2}-\d{2}`, text `2026-11-03`. Expected: a match.
- [ ] **XML formatter:** paste:
  ```
  <a><b>1</b></a>
  ```
  Expected: indented XML.
- [ ] **SQL formatter:** paste:
  ```
  SELECT id, name, email FROM users WHERE active = 1 ORDER BY name
  ```
  Expected: each column on its own line under `SELECT` (`id,`, `name,`, `email`), followed by `FROM`, `WHERE`, and `ORDER BY`. Commas inside string literals must not be split.
- [ ] **Markdown to PDF:** write some Markdown and press "Export PDF". Expected: a new window opens with the print dialog. "Save as PDF" saves the file. Allow pop-ups for the site.

## 8. Creative Agent

Tools: Image converter, Image resizer, Color palette, Stock photos.

- [ ] **Image converter:** upload a PNG and convert it to JPG. Expected: a downloadable JPG file.
- [ ] **Image resizer:** upload an image and set the width to 300. Expected: a 300 px image downloads.
- [ ] **Color palette:** upload an image. Expected: swatches of the dominant colors.
- [ ] **Stock photos:** search `sunset`. Expected: results from both sources in the grid, labeled `· Pexels` or `· Pixabay`. Clicking a thumbnail opens the original.
- [ ] **Stock photos (no key):** remove the keys from the backend `.env`, then restart. Expected: the error message "PEXELS_API_KEY or PIXABAY_API_KEY...".

## 9. Office Agent

Tools: Document maker, PDF merge, PDF split, PDF to JPG, Scan to PDF.

- [ ] **Document maker:** paste:
  ```
  Leave application for 2 days due to fever, to the principal
  ```
  Expected: a formal leave application. Then **Export PDF** (print dialog) and **Download DOCX** both work. The DOCX opens in Word with correct headings and bold text.
- [ ] **PDF merge:** select two PDFs. Expected: one merged PDF downloads.
- [ ] **PDF split:** select a 5-page PDF and enter the range `1-2, 4`. Expected: a 3-page file. Entering `9` shows an error.
- [ ] **PDF to JPG:** select a multi-page PDF. Expected: a download link for a JPG of each page.
- [ ] **Scan to PDF:** select two images. Expected: one PDF with both pages.

## 10. Studio Agent

No tools yet. Video and audio tools (heavy, and they hung the browser) are deferred to the roadmap.

## 11. Lock In Agent

Tools: Pomodoro, Scratchpad, Reminders, Focus mode.

- [ ] **Pomodoro:** start the timer. A 1-minute focus session runs. When it ends, a 5-minute break starts.
- [ ] **Scratchpad:** add a note with tags `urgent` and `study`. Search filters the list. Delete works.
- [ ] **Reminders:** set a reminder for 1 minute from now. Expected: a notification at that time (grant browser permission). The tab must be open.
- [ ] **Focus mode:** turn it on. Expected: a distraction-free view.

## 12. Live Agent

Tools: Weather, Live time, Currency.

- [ ] **Weather:** enter a city. Expected: current temperature and conditions.
- [ ] **Live time:** the time zone is shown and the time updates.
- [ ] **Currency:** the live USD to PKR rate is shown.

## 13. Backend Checks

- [ ] `GET http://localhost:3001/api/tools/stock?query=sunset` returns JSON with a `photos` array.
- [ ] `GET http://localhost:3001/api/tools/stock` (no query) returns the error `query is required`.
- [ ] `POST http://localhost:3001/api/agent/chat` with body `{"anonId":"testanon1234","agentId":"doctor","message":"chest pain"}` returns an emergency message in `reply`.
- [ ] `POST http://localhost:3001/api/agent/route` with body `{"anonId":"testanon1234","message":"photosynthesis samjhao"}` returns `agentId: "study"`.

## 14. Known Gaps (Not Yet Covered by Tests)

- Tax calculator and gold ticker: not yet built.
- Future items: math solver, PDF chat, PDF compressor, background remover, resource library, Micro-Khata, medicine info, and lab report decoder.
- Pomodoro mood hook and persona attitude cards.
- Audio waveform appears only in trim mode, not in the noise reducer.
- The video timeline has no frame-level precision.
- Production build (`npm run build`) fails because of the SWC issue in section 1.4.

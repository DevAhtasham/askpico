# Feature Catalog

**Status:** Living document
**Owner:** Pico product team
**Related:** [Roadmap](roadmap.md) · [Beta launch](beta-launch.md) · [Voice mode](../modules/voice-mode.md) · [Agent development](../engineering/agent-development.md)

## 1. Purpose

This catalogue lists every planned Pico feature, the platform it runs on, where its logic executes, its cost profile, and its effort estimate. Its goal is to keep cost low: work that a user's device can perform runs on the device, and only language-model work reaches the cloud.

Costly, complex, or legally sensitive features are tracked in the [Roadmap](roadmap.md). Voice features are specified in [Voice mode](../modules/voice-mode.md).

## 2. Platforms

| Platform | Description | Cost model |
|---|---|---|
| **Web** | React and Vite app running in the browser. Uses cloud LLM APIs through the backend | Cost per query |
| **PC** | Electron desktop app for Windows. Runs on the user's CPU and RAM | No cloud cost. Limited by PC specification |
| **Mobile** | Native Android app (Kotlin) that hosts the web build in a WebView. Published on Google Play | No cloud cost. Limited by device specification |

## 3. Monetization

| Plan | Price (PKR) | Limits |
|---|---|---|
| Free | 0 | 30 min/day voice, referral rewards |
| Weekly Pass | 250–350 / week | 2 hr/day voice, all tools |
| Monthly Pro | 799–999 / month | 2 hr/day voice, priority AI |
| Ultra | 1,499–1,999 / month | No daily voice limit, exclusive moods and skins |

- **Payments:** JazzCash, EasyPaisa, and local cards are required. International cards alone would exclude most Pakistani users.
- **iOS (future):** iOS is not in the current plan. Digital purchases on iOS must use Apple In-App Purchase (commission applies). Verify the current Apple policy before any iOS work.
- **Revenue estimate:** 112 Pro users at an average of PKR 899 is about PKR 100k MRR. 1,000 Pro users is about PKR 8–9 lakh MRR. Infrastructure cost (free Edge TTS, guest local LLM, low-cost text LLM) can stay near PKR 15–30k per month.

## 4. Voice Roadmap (Copyright-Safe)

- **Phase 1 (current):** Edge TTS with a filter layer. Specified in [Voice mode](../modules/voice-mode.md).
- **Phase 2 (after revenue):** Record 1–2 hours of clean audio from a professional voice artist under a written contract. Fine-tune an open-source TTS model (F5-TTS, Coqui, or Bark) into a branded "Pico Voice". This avoids licensing risk and gives the same voice on every platform.

## 5. Growth and Cost Controls

### Viral growth

- **Shareable cards:** Each strong response, PDF summary, or code output can be exported as an image with the app logo and link.
- **Referral loop:** Voice minutes are rewarded for joining, for daily activity, and for upgrades (Feature 30, [Voice mode](../modules/voice-mode.md)).
- **No credit card required:** Google sign-in or one-click guest session. Rate limits are required to prevent guest abuse.

### Cost controls

- **Near zero is not zero:** Calculate cost per query for every feature.
- **Verify pricing:** Check provider price pages (for example, Llama 3.1 8B at USD 0.02 / 0.04 per million tokens) and the PKR exchange rate before each estimate.
- **Keep keys off the client:** The LLM key stays on the backend. The backend is the only proxy.
- **Per-user daily limits:** Apply token or message caps to guest and free users.
- **Caching:** Cache identical PDFs and prompts to avoid repeat spend.
- **Model routing:** Send simple requests to a small model and complex requests to a larger one. See [Beta launch](beta-launch.md) for the auto-routing design.

## 6. Desktop (PC) Compatibility

These figures are estimates. Validate them on real hardware before making public claims.

### 6.1 Minimum specification

- **CPU:** Intel Core i3 or i5 (2nd or 3rd generation, for example i3-2100 or i5-3320M), or AMD A-Series or FX-Series.
- **RAM:** 4 GB runs the app, but 8 GB is recommended. Each Electron process has its own memory, so 4 GB fills quickly with browser tabs open.
- **Storage:** HDD works. SSD gives much faster startup and file loading.
- **OS:** Windows 10 (64-bit) or Windows 11.
- **Windows 7 and 8.1:** The project uses Electron `^23.2.0` (`apps/web/package.json`). Electron 23 does not support Windows 7 or 8.1, and older Electron versions no longer receive security updates. Windows 7 support is not planned.

### 6.2 Tool performance (estimate)

| Feature | Expected on low-end PC | Technique | Caveat |
|---|---|---|---|
| AI chat UI | Smooth | Responses come from the server; the PC only renders | Speed depends on network and provider |
| Image converter (JPG to WebP or PNG) | 1–2 s for small files | Canvas API or light JS | Large images spike memory. Set a size limit |
| PDF merge and split | Smooth, 1–3 s | `pdf-lib` | Does not compress images inside the PDF |

### 6.3 Electron optimization rules

1. **Use Chromium flags carefully.**
   - `no-sandbox` is a security risk. Do not enable it by default.
   - `disable-http-cache` slows repeat loads. It is not a benefit.
   - Disabling background throttling increases CPU use.
   - If an older GPU causes rendering problems, `app.disableHardwareAcceleration()` is the safer option. Measure first, then apply the flag.
2. **Single window.** Switch tools with tabs or the sidebar. Do not open a new window per tool.
3. **Heavy work in Web Workers.** PDF and image processing belongs in a renderer Web Worker, not the main process, which manages windows and UI.
4. **Lazy loading.** Use Vite `import()` so tool-specific libraries load in separate chunks. Load WASM only when its tool opens.

### 6.4 Performance checklist

- Measure total app RAM across all Electron processes, at idle and while a tool runs.
- Check UI freezes with a 20–30 MB PDF and a large image.
- Measure startup on a 4 GB, HDD-based PC.

### 6.5 Summary

Electron with the chat UI and light tools (image conversion, PDF merge) can run on 4 GB RAM and a Core i3 2nd generation CPU. Heavy tools (PDF compression, background removal) need 8 GB RAM and a faster CPU. Test on a real older PC before making performance claims.

## 7. Utility Tools (PC and Mobile)

Features listed here were not in the platform catalogue above. Image format conversion, PDF compression, and background removal are listed in their own sections, and PDF merge is combined with split.

| Feature | Category | Estimated time | Technique | Caveat |
|---|---|---|---|---|
| Bulk image resizer and compressor (WhatsApp sizes) | File and image | 3–8 s for 10–15 images | Canvas resize | Manage memory in large batches |
| PDF to high-resolution JPG | PDF and document | 4–10 s for 10 pages | `pdf.js` renders pages to canvas | High DPI needs more memory. Set a DPI limit |
| Images or scanned pages to PDF | PDF and document | 2–5 s | Embed images with `pdf-lib` | Scanned text is not searchable. OCR is a separate tool |
| JSON, XML, and SQL formatter and minifier | Developer tools | Instant | Local parsers | SQL dialect support may be limited |
| Case converter and Roman Urdu clean-up | Text utility | Instant | String rules | Define Roman Urdu rules first |
| Markdown to HTML and PDF | Developer tools | About 1 s | Markdown parser and PDF export | Complex layouts and math need extra setup |
| Text diff checker | Developer tools | 1–2 s | Diff algorithm | Very large files slow the UI |
| MP3 and audio trimmer | Audio and media | 3–8 s | Waveform UI, buffer crop | The browser decodes the whole file into memory |
| Voice note noise reducer and gain booster | Audio and media | 5–15 s | Web Audio API filters | Not a replacement for AI noise removal |
| Offline QR code generator and scanner | Business utility | 0.5 s | Local QR library | Scanner needs camera permission. Check Electron camera access |
| Barcode generator | Business utility | 0.5 s | Local barcode library | Choose the format (EAN, Code128) to match the use |
| Salary and tax calculator (Pakistan slabs) | Business utility | Instant | Local calculation | Slabs change each budget year. Show a disclaimer that this is not official advice |

### 7.1 Architecture rule

Run all conversion and heavy processing in a Web Worker, never on the main UI thread. This keeps progress bars (20%, 60%, 100%) smooth and prevents freezes.

### 7.2 Notes

- The time values are estimates. Do not claim "under 30 seconds" until the feature is tested on a 4 GB, Core i3 2nd or 3rd generation PC.
- Set a file size limit for every tool to reduce crashes on low-end machines.

## 8. Mobile Features

### 8.1 Approach

The cheapest mobile option is a progressive web app (PWA). It installs the same React code from the mobile browser through "Add to Home Screen", with no app store fees and no separate codebase. The native Android app is the planned store release (see [Android app stack](#9-android-app-stack)).

### 8.2 Device tiers (estimate)

- **Tier 1 (entry):** 2 GB RAM, budget Android (MediaTek Helio or Snapdragon 4xx class).
- **Tier 2 (mid):** 3–4 GB RAM, Android 11 or later.
- **Tier 3 (modern):** 6 GB or more RAM, modern chipset.

Mobile browsers have stricter memory limits. Android Chrome can reload a tab when memory runs low. Test each limit on real devices.

### 8.3 Feature feasibility

| Feature | Tier 1 (2 GB) | Tier 2 (3–4 GB) | Tier 3 (6 GB+) | Note |
|---|---|---|---|---|
| AI chat UI | Yes | Yes | Yes | Depends on cloud API |
| Text tools (JSON, case, diff, Markdown) | Yes | Yes | Yes | Instant |
| QR and barcode generator | Yes | Yes | Yes | Instant |
| QR scanner | Limited | Yes | Yes | Needs camera permission |
| Tax calculator | Yes | Yes | Yes | Keep slabs up to date |
| Image converter | Limited (small images) | Yes | Yes | Large camera photos hit memory limits |
| Bulk image resizer | Limited (small batches) | Yes | Yes | Set a batch size limit |
| PDF merge and split | Limited (small PDFs) | Yes | Yes | Large PDFs exhaust memory |
| Images or scans to PDF | Limited | Yes | Yes | Camera scans are large |
| PDF to high-resolution JPG | Limited (few pages) | Yes | Yes | Set a DPI limit |
| MP3 and audio trimmer | Yes | Yes | Yes | Short audio files |
| Voice note noise reducer | Limited | Yes | Yes | Web Audio API |

### 8.4 Mobile rules

- **Device check:** Estimate capability with `navigator.deviceMemory` (Chromium only) and `navigator.hardwareConcurrency`. On low-tier devices, disable heavy features and show "Use the PC app for this".
- **File size limit:** Set a limit per tool (for example 10 MB).
- **Server fallback:** Offer a server fallback for heavy tasks as an opt-in option only, because it increases cost.
- **Web Worker:** Run all processing in a Web Worker on mobile too.

### 8.5 Mobile summary

Tier 1 devices can run AI chat, text tools, QR, the tax calculator, and image or PDF tools on small files. Background removal, PDF compression, and video-to-MP3 need Tier 2 or Tier 3 devices. All of these are estimates and must be tested on real devices.

## 9. Android App Stack

The recommended approach is a Kotlin Android application that loads the `apps/web/dist` build in a WebView. The existing React, Vite, and TypeScript code is reused.

### 9.1 Stack

- **App shell:** Kotlin. Android Studio project in `apps/mobile/`. The WebView loads the web build from app assets.
- **Frontend:** React, TypeScript, Vite, Tailwind, Zustand (existing).
- **Native features (Kotlin):** file save and read, share, camera, back button and lifecycle, notifications. Exposed to the web app through a `WebView` JavaScript bridge with an allow-list of methods.
- **Build:** Android Studio, Gradle, `.aab` bundle.
- **Store:** Google Play Console (internal testing track first).
- **Backend:** the existing `services/api/` Node server, hosted separately.

### 9.2 Responsibilities

- **Android:** Build on Windows with Android Studio.
- **Sign-in:** Verify the Google sign-in flow in the official Android documentation.
- **Dependencies:** Verify Kotlin, AndroidX, and WebView versions in the official Android documentation.

### 9.3 Costs

- **Google Play:** USD 25, one-time.
- **Cloud CI:** Check free-tier limits and prices with the provider.

### 9.4 Store requirements

- A privacy policy URL is required.
- Google Play minimum functionality: a plain web wrapper can be rejected. Add native features such as camera, file access, share, and offline tools.
- AI content: provide moderation and a report option, as the store policy requires.

### 9.5 Security

- The Gemini API key must not be in the app. `GEMINI_API_KEY` stays on the backend, and the app only calls the backend.

## 10. Device Usage Policy

On-device processing is permitted when the user is informed and consents. Before final review, check Google Play's "Device and Network Abuse" policy.

### 10.1 Allowed

- Image, PDF, and text tools running on the device when the user starts them.
- Local work through Canvas, Web Audio, and Web Workers.
- Small on-device ML models, if the license allows and the app size stays within limits.
- A progress bar and a cancel button for all on-device processing.

### 10.2 Not allowed

- **Cryptocurrency mining or hidden computation.** Explicitly banned by Google Play.
- **Background work without consent.** Using CPU or battery after the app closes without informing the user.
- **Distributed compute.** Running LLM calls for other users or for the company server on the user's device.
- **Excessive resource use.** Heavy battery drain or device overheating.

### 10.3 Platform restrictions

- **Android:** Background execution limits (Doze, WorkManager) apply. On low-memory devices, the system can kill the app.
- **All platforms:** Sustained heavy work causes thermal throttling, which slows older phones.
- **App size:** Large on-device models must fit within store size limits. Verify the limits in the official documentation.

### 10.4 Store disclosure

- **Google Play:** The data safety form must state which data stays on the device and which is sent to the server.
- The listing should state "Files are processed on your phone" only if that is true.

## 11. Next Steps

1. Build the quick client-side tools first, because their cost is lowest. Build voice features using [Voice mode](../modules/voice-mode.md).
2. Set up the backend proxy and rate limits.
3. Measure cost per query for each feature and update this document with real numbers.
4. Review costly and complex features in the [Roadmap](roadmap.md).

## 12. Feature Index

Features 0 to 57 are grouped by category in section 14. Features that are costly or complex are listed in the [Roadmap](roadmap.md). Voice features (4, 24, 25, 26, 29, 30) are in [Voice mode](../modules/voice-mode.md).

## 13. Features by Platform

### 13.1 Web features that call a cloud LLM

| # | Feature | Viral hook | Why it matters | Cost control | Risk |
|---|---|---|---|---|---|
| 3 | Localized personas (Sasta Doctor, Challan and Legal Explainer) | Generic chatbots feel impersonal. Roman Urdu help with local context | Easy Roman Urdu explanations | Hard-coded system prompts on the backend. `max_tokens: 100` | Health and legal answers need disclaimers. Do not promote academic-evasion uses |
| 5 | AI prompt enhancer and essay expansion | "One-click prompt perfector" | A better prompt improves every answer | Small model; one-sentence transform (10–20 tokens per run) | Essay expansion raises academic integrity concerns |

### 13.2 Documents and PDF

| # | Feature | Platform | Runs on | Cost |
|---|---|---|---|---|
| 10 | PDF merger and splitter | PC, Mobile | Device | Device |
| 12 | PDF to high-resolution JPG | PC, Mobile | Device | Device |
| 13 | Images or scanned documents to PDF | PC, Mobile | Device | Device |

### 13.3 Image tools

| # | Feature | Platform | Runs on | Cost |
|---|---|---|---|---|
| 6 | Image format converter (JPG or PNG to WebP or AVIF) | PC, Mobile | Device | Device |
| 7 | Bulk image resizer and compressor (WhatsApp sizes) | PC, Mobile | Device | Device |

### 13.4 Audio and video

| # | Feature | Platform | Runs on | Cost |
|---|---|---|---|---|
| 18 | MP3 and audio trimmer | PC, Mobile | Device | Device |
| 20 | Voice note noise reducer and gain booster | PC, Mobile | Device | Device |

### 13.5 Developer and text tools

| # | Feature | Platform | Runs on | Cost |
|---|---|---|---|---|
| 14 | JSON, XML, and SQL formatter and minifier | PC, Mobile | Device | Device |
| 15 | Case converter and Roman Urdu clean-up | PC, Mobile | Device | Device |
| 16 | Markdown to HTML and PDF | PC, Mobile | Device | Device |
| 17 | Text diff checker | PC, Mobile | Device | Device |
| 53 | Code snippet and regex generator | Web, PC, Mobile | LLM plus optional client-side test runner | LLM tokens |
| 54 | Unit, currency, and timezone converter (chat card) | Web, PC, Mobile | Pure JavaScript; rate API for currency | Zero |
| 55 | Network speed and ping tester | Web, PC, Mobile | Timed `fetch` to own backend or CDN | Small bandwidth cost |

### 13.6 Business and money

| # | Feature | Platform | Runs on | Cost |
|---|---|---|---|---|
| 21 | Offline QR code generator and scanner | PC, Mobile | Device | Device |
| 22 | Barcode generator | PC, Mobile | Device | Device |
| 23 | Salary and tax calculator (Pakistan slabs) | PC, Mobile | Device | Device |
| 36 | Live currency, crypto, and gold ticker | Web, PC, Mobile | Exchange rate API; CoinGecko through backend proxy | Free within limits |
| 39 | Freelance rate calculator: USD to PKR, with Upwork and Fiverr fees | Web, PC, Mobile | Client math plus rate API | Zero (rate API limits) |
| 41 | Micro-Khata: expense and loan tracker | Web, PC, Mobile | IndexedDB; chat entry (LLM used for parsing only) | Low LLM tokens |

### 13.7 Productivity and focus

| # | Feature | Platform | Runs on | Cost |
|---|---|---|---|---|
| 40 | Pomodoro focus timer (25 / 5 min) with companion mood | Web, PC, Mobile | Client timer; Feature 27 mood state | Zero |
| 42 | Quick scratchpad and smart clipboard (tagged snippets) | Web, PC, Mobile | IndexedDB, localStorage | Zero |
| 43 | Reminders and alarms | Web (tab open), PC, Mobile | Browser Notification API; Android local notifications on mobile | Zero |
| 44 | In-app focus mode (full-screen lock and tab-switch alert) | Web, PC, Mobile | `visibilitychange` and `blur` events; Fullscreen API | Zero |

### 13.8 Creative and design

| # | Feature | Platform | Runs on | Cost |
|---|---|---|---|---|
| 31 | Pexels and Pixabay stock image and video search ("Pico Vault") | Web, PC, Mobile | Backend proxy to Pexels and Pixabay | Free within limits |
| 33 | Color picker, palette generator, and image-to-palette | Web, PC, Mobile | Canvas API; EyeDropper API (Chromium) | Device |

### 13.9 Live information and entertainment

| # | Feature | Platform | Runs on | Cost |
|---|---|---|---|---|
| 34 | Real-time weather (city search) | Web, PC, Mobile | Open-Meteo through backend proxy | Free; check commercial terms |
| 35 | Multi-country world clock and timezone converter | Web, PC, Mobile | `Intl.DateTimeFormat` and `Date` | Zero |
| 37 | Movie data (poster, rating, cast, trailer link) | Web, PC, Mobile | TMDb API (free key) | Free |

### 13.10 Education and science

| # | Feature | Platform | Runs on | Cost |
|---|---|---|---|---|
| 46 | Chemistry data (element info, molecular weight) | Web, PC, Mobile | PubChem PUG REST (free, no key) | Free |
| 47 | Physics constants and formula solver | Web, PC, Mobile | CODATA constants (static JSON); client solver | Zero |
| 48 | Biology and general knowledge | Web, PC, Mobile | Wikipedia REST, Wikidata | Free |
| 49 | Quiz and flashcard generator | Web, PC, Mobile | LLM (from text or PDF text) | LLM tokens |
| 50 | Lesson plan and test paper generator (teachers) | Web, PC | LLM with structured output | LLM tokens |

### 13.11 Career and writing

| # | Feature | Platform | Runs on | Cost |
|---|---|---|---|---|
| 56 | Smart CV and cover letter generator | Web, PC, Mobile | LLM; PDF or DOCX export through Feature 16 | LLM tokens |
| 57 | Roman Urdu to formal English or Urdu email and leave application | Web, PC, Mobile | LLM with tone presets | LLM tokens |

### 13.12 Caveats (Features 31–57)

- **Pexels and Pixabay:** Rate limits and attribution apply. Check the dashboard limits. Each asset can have its own license.
- **Gold rate:** No official free API has been found. Label it "Beta / verify".
- **Commercial use:** Check the terms of Open-Meteo, TMDb, CoinGecko, and Wolfram before a paid launch.
- **Browser blocking:** Feature 44 works only inside the app. Blocking other websites requires Electron, an extension, or native permissions.
- **Pro plan:** Free users have daily limits on quizzes, Vault downloads, and LLM tools. Referral unlocks are in [Voice mode](../modules/voice-mode.md).
- **Duplicates:** Text tools (14, 15, 16) already exist. Do not build duplicates.

## 14. Development Time Estimate (AI-Assisted)

Estimates assume a developer using an AI coding assistant. They cover coding, basic UI, and unit tests. They exclude design polish, real-device QA, store submission, API approval, and legal review. Feature 0 (AI chat UI) is already built, so its estimate is 0 hours. Items moved to the roadmap are included in the totals.

| # | Feature | Location | Hours |
|---|---|---|---|
| 0 | AI chat UI | Built | 0 |
| 1 | Document and PDF chat and summarizer | Roadmap | 10 |
| 2 | Multi-LLM side-by-side comparison | Roadmap | 8 |
| 3 | Localized personas | Feature catalogue | 3 |
| 5 | AI prompt enhancer and essay expansion | Feature catalogue | 3 |
| 6 | Image format converter | Feature catalogue | 3 |
| 7 | Bulk image resizer and compressor | Feature catalogue | 4 |
| 8 | Image background remover (WASM) | Roadmap | 12 |
| 9 | Passport-size photo maker | Roadmap | 10 |
| 10 | PDF merger and splitter | Feature catalogue | 4 |
| 11 | PDF compressor | Roadmap | 10 |
| 12 | PDF to high-resolution JPG | Feature catalogue | 3 |
| 13 | Images or scanned documents to PDF | Feature catalogue | 3 |
| 14 | JSON, XML, and SQL formatter | Feature catalogue | 4 |
| 15 | Case converter and Roman Urdu clean-up | Feature catalogue | 2 |
| 16 | Markdown to HTML and PDF | Feature catalogue | 4 |
| 17 | Text diff checker | Feature catalogue | 3 |
| 18 | MP3 and audio trimmer | Feature catalogue | 8 |
| 19 | Video to audio (MP4 to MP3) | Roadmap | 8 |
| 20 | Voice note noise reducer and gain booster | Feature catalogue | 6 |
| 21 | Offline QR generator and scanner | Feature catalogue | 4 |
| 22 | Barcode generator | Feature catalogue | 3 |
| 23 | Salary and tax calculator | Feature catalogue | 3 |
| 27 | Animated emoji head companion and mood state machine | Roadmap | 20 |
| 28 | Guest local LLM (WebLLM) | Roadmap | 16 |
| 31 | Pexels and Pixabay stock search | Feature catalogue | 6 |
| 32 | Free design and code resource library | Roadmap | 20 |
| 33 | Color picker and palette generator | Feature catalogue | 4 |
| 34 | Real-time weather | Feature catalogue | 3 |
| 35 | World clock and timezone converter | Feature catalogue | 3 |
| 36 | Live currency, crypto, and gold ticker | Feature catalogue | 5 |
| 37 | Movie data | Feature catalogue | 4 |
| 38 | Free games tracker | Roadmap | 5 |
| 39 | Freelance rate calculator | Feature catalogue | 2 |
| 40 | Pomodoro focus timer | Feature catalogue | 4 |
| 41 | Micro-Khata expense tracker | Feature catalogue | 8 |
| 42 | Scratchpad and smart clipboard | Feature catalogue | 4 |
| 43 | Reminders and alarms | Feature catalogue | 5 |
| 44 | In-app focus mode | Feature catalogue | 5 |
| 45 | Step-by-step math solver | Roadmap | 12 |
| 46 | Chemistry data (PubChem) | Feature catalogue | 4 |
| 47 | Physics constants and formula solver | Feature catalogue | 6 |
| 48 | Biology and general knowledge | Feature catalogue | 3 |
| 49 | Quiz and flashcard generator | Feature catalogue | 4 |
| 50 | Lesson plan and test paper generator | Feature catalogue | 3 |
| 51 | Lab report decoder | Roadmap | 8 |
| 52 | Medicine basic info | Roadmap | 6 |
| 53 | Code snippet and regex generator | Feature catalogue | 3 |
| 54 | Unit, currency, and timezone converter | Feature catalogue | 2 |
| 55 | Network speed and ping tester | Feature catalogue | 2 |
| 56 | Smart CV and cover letter generator | Feature catalogue | 6 |
| 57 | Roman Urdu to formal English email | Feature catalogue | 2 |

### 14.1 Totals

| Group | Hours | Working days (8 h/day) |
|---|---|---|
| Quick-to-build features (feature catalogue) | 148 | About 19 |
| Costly and complex features (roadmap) | 145 | About 18 |
| **Non-voice features (0–57)** | **293** | **About 37** |
| Voice features ([Voice mode](../modules/voice-mode.md)) | 69 | About 9 |

These are estimates. They exclude real-device testing, bug fixing, and API approval. The largest risks are Features 27 and 32. Voice estimates are in [Voice mode](../modules/voice-mode.md).

## 15. Website Quick Features

This list covers features that run in the browser and have an estimate of 6 hours or less. Roadmap features are excluded. Feature 0 is already built.

### 15.1 Group A: marked for web

| # | Feature | Hours |
|---|---|---|
| 3 | Localized personas | 3 |
| 5 | AI prompt enhancer and essay expansion | 3 |
| 31 | Pexels and Pixabay stock search | 6 |
| 33 | Color picker and palette generator | 4 |
| 34 | Real-time weather | 3 |
| 35 | World clock and timezone converter | 3 |
| 36 | Live currency, crypto, and gold ticker | 5 |
| 37 | Movie data | 4 |
| 39 | Freelance rate calculator | 2 |
| 40 | Pomodoro focus timer | 4 |
| 42 | Scratchpad and smart clipboard | 4 |
| 43 | Reminders and alarms | 5 |
| 44 | In-app focus mode | 5 |
| 46 | Chemistry data (PubChem) | 4 |
| 47 | Physics constants and formula solver | 6 |
| 48 | Biology and general knowledge | 3 |
| 49 | Quiz and flashcard generator | 4 |
| 50 | Lesson plan and test paper generator | 3 |
| 53 | Code snippet and regex generator | 3 |
| 54 | Unit, currency, and timezone converter | 2 |
| 55 | Network speed and ping tester | 2 |
| 56 | Smart CV and cover letter generator | 6 |
| 57 | Roman Urdu to formal English email | 2 |

Group A: **23 features, 86 hours**.

### 15.2 Group B: runs in the browser (catalogue lists PC and Mobile)

These tools use client-side JavaScript, so they also run in the browser. The catalogue lists only PC and Mobile, so the web platform must be added.

| # | Feature | Hours |
|---|---|---|
| 6 | Image format converter | 3 |
| 7 | Bulk image resizer and compressor | 4 |
| 10 | PDF merger and splitter | 4 |
| 12 | PDF to high-resolution JPG | 3 |
| 13 | Images or scanned documents to PDF | 3 |
| 14 | JSON, XML, and SQL formatter | 4 |
| 15 | Case converter and Roman Urdu clean-up | 2 |
| 16 | Markdown to HTML and PDF | 4 |
| 17 | Text diff checker | 3 |
| 20 | Voice note noise reducer and gain booster | 6 |
| 21 | Offline QR generator and scanner | 4 |
| 22 | Barcode generator | 3 |
| 23 | Salary and tax calculator | 3 |

Group B: **13 features, 46 hours**.

### 15.3 Totals

- **Quick web features (A + B):** 36 features, **132 hours** (about 16.5 working days).
- **Excluded:** Feature 18 (audio trimmer, 8 h) and Feature 41 (Micro-Khata, 8 h) exceed the 6-hour threshold.
- **Browser limits:** Feature 44 works only inside the app. Feature 43 notifies only while the tab is open.

## 16. Agent Structure

Each agent acts as a chat persona. It routes the user's query to its related tools. Tool numbers refer to the feature catalogue and the roadmap.

Agent development, routing rules, and build order are in [Agent development](../engineering/agent-development.md). Persona behavior is in [Agent persona](../modules/agent-persona.md).

### 16.1 Core (default, in every agent)

These features always run with the core chat, not inside one agent:

- Animated companion (27, roadmap)
- Movie suggestions (37)
- Anime suggestions (new mini feature)
- Game suggestions (new mini feature)
- Free games (38, roadmap)
- Voice features (4, 24, 25, 26, 29, 30), specified in [Voice mode](../modules/voice-mode.md)

Sources: AniList or Jikan for anime (free), TMDb for movies, RAWG for games (free key). Verify each source's terms.

API routing: Route 1 (direct free APIs, temporary, for development) and Route 2 (a unified gateway such as RapidAPI or another aggregator, chosen after cost research). Both sit behind one backend entry point. See the API routing section of [Agent development](../engineering/agent-development.md).

### 16.2 Agents

- **Study agent (education):** Chemistry (46), Physics (47), Biology and general knowledge (48), Quiz and flashcards (49), Math solver (45, roadmap), Lesson plan (50), PDF chat (1, roadmap).
  - Personas: **Padhai Ustad** (playful), **Exam Dost** (playful), **Study Guide** (professional), **Academic Assistant** (professional).
- **Doctor agent (health):** Sasta Doctor persona (3), Lab report decoder (51, roadmap), Medicine info (52, roadmap). Every reply needs a disclaimer and an emergency warning.
  - Personas: **Dard Dawa Dost** (playful), **Sehat Sathi** (playful), **Health Advisor** (professional), **Clinical Info Desk** (professional).
- **Business agent (money):** Tax calculator (23), Freelance rate (39), Micro-Khata (41, roadmap), QR and barcode (21, 22).
  - Personas: **Paisa Pandit** (playful), **Munshi Ji** (playful), **Finance Advisor** (professional), **Business Desk** (professional).
- **Career agent (writing):** CV and cover letter (56), Roman Urdu to formal email (57), Prompt enhancer (5), Roman Urdu clean-up (15).
  - Personas: **Naukri Guru** (playful), **CV Wala** (playful), **Career Coach** (professional), **Writing Studio** (professional).
- **Hacker agent (tech):** Code and regex (53), JSON formatter (14), Text diff (17), Markdown to PDF (16), Network speed (55), Unit converter (54).
  - Personas: **Code Ustad** (playful), **Bug Shikari** (playful), **Dev Toolkit** (professional), **Engineering Assistant** (professional).
  - Scope: developer tools only. Do not include offensive hacking or security bypass features, which create policy and store review risk.
- **Creative agent (design):** Color palette (33), Stock search (31), Image converter (6), Image resizer (7), Resource library (32, roadmap).
  - Personas: **Rang Wala** (playful), **Design Chacha** (playful), **Design Studio** (professional), **Brand Assistant** (professional).
- **Office agent (files):** PDF merge and split (10), PDF compressor (11, roadmap), PDF to JPG (12), Scan to PDF (13), Background remover (8, roadmap), Document maker (new mini feature).
  - Personas: **Kagaz Wala** (playful), **PDF Munshi** (playful), **Document Desk** (professional), **Doc Assistant** (professional).
- **Studio agent (media editing):** Audio trimmer (18), Video to MP3 (19, roadmap), Noise reducer (20), Image compressor (7), Video compressor (new mini feature), Video trim and edit (new mini feature).
  - Personas: **Editing Ustad** (playful), **Reel Wala** (playful), **Media Studio** (professional), **Media Editor** (professional).
- **Lock In agent (productivity):** Pomodoro (40), Scratchpad (42), Reminders (43), Focus mode (44).
  - Personas: **Lock In Sher** (playful), **Bhaag Mat Bhai** (playful), **Productivity Coach** (professional), **Focus Manager** (professional).
- **Live agent (live information):** Weather (34), Live time (35), Live ticker (36).
  - Personas: **Hal-Chal Wala** (playful), **Duniya Ka Update** (playful), **Live Desk** (professional), **Live Info Assistant** (professional).

### 16.3 Notes

- The Document Maker in the Office agent replaces the earlier "Assignment Rephraser" idea.
- Each agent has a primary name and variants. Select one final name for each agent before release.

# FahmChat: Feature Platform Plan aur Cost Strategy

Ye file har feature ko uske platform ke hisaab se group karti hai: Web, PC aur Mobile. Maqsad ye hai ke jo kaam user ka device kar sakta hai wo device par ho, taake aap ki API aur server cost kam rahe.

## Platform Legend

- **Web:** React + Vite web app browser mein chalti hai. Cloud LLM API use karta hai, is liye cost har query par lagti hai.
- **PC:** Electron desktop app (Windows) user ke CPU aur RAM par chalti hai. Cloud cost nahi, lekin PC ki specs ki limit hai.
- **Mobile:** Capacitor se bani Android aur iPhone app user ke phone par chalti hai. Google Play aur App Store par publish hogi. Cloud cost nahi, lekin phone ki specs ki limit hai.

## Feature Index

| # | Feature | Platform | Kahan Chalega | Cost Kon Uthata Hai |
|---|---------|----------|---------------|---------------------|
| 0 | AI Chat UI | Web, PC, Mobile | UI device par, response API se | LLM API |
| 1 | Document / PDF Chat & Summarizer | Web | Text parse device par, summary LLM par | LLM API (chhota) |
| 2 | Multi-LLM Side-by-Side Comparison | Web | Cloud | LLM API (double) |
| 3 | Localized Personas (Sasta Doctor, Assignment Rephraser, Challan Explainer) | Web | Cloud | LLM API |
| 4 | Voice Notes Chat (Mic Button) | Web, PC, Mobile | Browser speech API (device) | Almost free, LLM API |
| 5 | AI Prompt Enhancer & Essay Expansion | Web | Cloud | LLM API (chhota) |
| 6 | Image Format Converter (JPG/PNG to WebP/AVIF) | PC, Mobile | Device | Device |
| 7 | Bulk Image Resizer / Compress for WhatsApp | PC, Mobile | Device | Device |
| 8 | Image Background Remover (WASM) | PC, Mobile (heavy) | Device | Device |
| 9 | Passport Size Photo Maker | PC, Mobile (heavy) | Device | Device |
| 10 | PDF Merger & Splitter | PC, Mobile | Device | Device |
| 11 | PDF Compressor | PC, Mobile (heavy) | Device | Device |
| 12 | PDF to High-Res JPG | PC, Mobile | Device | Device |
| 13 | Image / Scanned Documents to PDF | PC, Mobile | Device | Device |
| 14 | JSON / XML / SQL Formatter & Minifier | PC, Mobile | Device | Device |
| 15 | Case Converter & Roman Urdu Text Clean-up | PC, Mobile | Device | Device |
| 16 | Markdown to HTML / PDF Generator | PC, Mobile | Device | Device |
| 17 | Text Diff Checker | PC, Mobile | Device | Device |
| 18 | MP3 / Audio Trimmer & Cutter | PC, Mobile | Device | Device |
| 19 | Video to Audio (MP4 to MP3) | PC, Mobile (heavy) | Device (FFmpeg.wasm) | Device |
| 20 | Voice Note Noise Reducer / Gain Booster | PC, Mobile | Device | Device |
| 21 | Offline QR Code Generator & Scanner | PC, Mobile | Device | Device |
| 22 | BarCode Generator (Local Shopkeepers) | PC, Mobile | Device | Device |
| 23 | Salary / Tax Calculator (Pakistani Tax Slabs) | PC, Mobile | Device | Device |
| 24 | Text-to-Voice "Omni Voice" (Edge TTS + Filter Layer) | Web, PC, Mobile | Base voice backend se, filters device par | Near free (sirf LLM text tokens) |
| 25 | Voice-to-Text Continuous (STT Voice Mode) | Web (Chrome/Edge), PC, Mobile (Android) | Browser speech API (device) | Almost free |
| 26 | Voice-to-Voice (Jarvis Loop) | Web (Chrome/Edge), PC, Mobile (Android) | STT device + TTS backend + LLM | LLM API (chhota) |
| 27 | Animated Emoji Head Companion + Mood Machine | Web, PC, Mobile | Device (Rive/Canvas) | Device |
| 28 | Guest Local LLM (WebLLM / WebGPU) | Web (WebGPU browsers), PC | User ka device | Free (device) |
| 29 | Text + Voice Guardrail & Persona Layer | Web, PC, Mobile | Client + Backend middleware | LLM API (chhota) |
| 30 | Voice Quota + Gamified Referral System | Web, PC, Mobile | Backend + DB | Server |

Note: Feature 4 (Voice Notes Chat) aur desktop table ka Voice Input ek hi feature hai. Feature 25 isi ka continuous voice-mode extension hai.

## Web Features (LLM API par chalne wale)

In features ko cloud LLM API ki zaroorat hai, is liye inka cost sab se zyada hai.

### Features Table

| # | Feature | Viral Hook | Kyun achha hai | Cost kaise kam rahegi | Risk / Caveat |
|---|---------|-----------|----------------|------------------------|---------------|
| 1 | Document / PDF Chat & Summarizer | ChatPDF aur AskYourPDF $15/month lete hain aur 10 page limit lagate hain | Students, lawyers aur accounts walon ko free unlimited PDF chat milta hai | PDF text local parse hota hai, sirf top 2 relevant paragraphs LLM ko jate hain (100-200 tokens per query) | PDF parsing ke liye `pdf-parse` Node library hai, is liye backend ya browser-side `pdf.js` chahiye. Scanned PDFs OCR ke bagair nahi chalenge |
| 2 | Multi-LLM Side-by-Side Comparison | Poe aur TypingMind ki tarah do models ka jawab ek sath, share karne layak screenshot | Log screenshot share karte hain, is se free marketing hoti hai | Dono models cheap ya open-source endpoints par rakhein. Har query par cost 2 guna hoti hai | Cost double hogi. Rate limit aur daily cap zaroori hai |
| 3 | Localized Personas (Sasta Doctor, Assignment Rephraser, Challan/Legal Explainer) | Generic ChatGPT boring lagta hai, Roman Urdu mein specific help milti hai | Roman Urdu mein aasan explanation, local context | System prompts backend mein hard-coded hon, `max_tokens: 100` set ho | Health aur legal advice par disclaimer zaroori hai. Assignment Rephraser ka Turnitin evasion wala use academic integrity aur policy risk hai, ise is tarah promote na karein |
| 4 | Voice Notes Chat (Mic Button) | Pakistan mein log lambay prompts type nahi karte, WhatsApp jaisa voice input chahte hain | ChatGPT Plus ka feature free mein milta hai | Browser ki `webkitSpeechRecognition` use karein, server par Whisper ki zaroorat nahi | Ye sirf Chrome aur Edge mein kaam karta hai, Firefox mein nahi. Chrome mein speech audio Google ke servers par jati hai, to "fully client-side" kehna sahi nahi. Privacy notice likhein |
| 5 | AI Prompt Enhancer aur Essay Expansion | "1-Click Prompt Perfector" aur "Assignment Humanizer" | Chhote prompt se achha prompt banta hai, naye users ke liye aasan | Chote model par single-sentence transformation (10-20 tokens per execution) | Humanizer ke liye bhi academic integrity ka masla hai |

## Voice Companion Features (Naye — Finalized)

Ye features voice mode, animated companion, guest-local-AI aur growth system ka complete package banate hain. Har feature ke sath likha hai ke wo kis device par chalega, kis par nahi aur kyun, aur hamari existing web app (React + Vite frontend + Node `backend/` server) mein chalega ya nahi aur kyun.

### Feature 24: Text-to-Voice "Omni Voice" (Edge TTS + Audio Filter Layer)

Do hisse hain: (a) backend par Edge TTS se natural base voice, (b) client par Web Audio API filter layer (EQ, reverb, pitch, playbackRate) jo har platform par ek jaisi branded voice deti hai. Downloadable audio ke liye backend par FFmpeg chain (atempo, equalizer, highpass, loudnorm).

- **Kahan chalega:** Web, PC (Electron), Mobile — sab jagah, kyunki audio backend se aata hai aur filters standard Web Audio API hain jo har modern browser aur WebView mein chalti hai.
- **Kahan nahi / limit:** Bohat purane browsers (IE, purana Android WebView) mein Web Audio filters limited hain — wahan raw audio play hogi, filter skip hoga.
- **Edge browser zaroori nahi:** `edge-tts` user ke device par Edge nahi kholta; backend Microsoft ke public speech endpoint ko direct call karta hai. Chrome/Firefox/app sab par same voice aayegi.
- **Hamari web app mein:** Haan, chal sakta hai. Backend Node server par `msedge-tts` ya `edge-tts` microservice lagakar `.mp3` stream ban sakti hai, aur frontend par `AudioContext`, `BiquadFilterNode`, `ConvolverNode` se filter layer apply hogi.
- **Caveat:** Edge TTS unofficial/undocumented hai — Microsoft kabhi bhi endpoint change ya block kar sakta hai, aur commercial use par unki ToS ka risk hai. Fallback ke tor par browser `speechSynthesis` rakhein. Note: browser `speechSynthesis` asli SSML parse nahi karti (sirf rate/pitch/volume params hain) — pauses punctuation (`...`, commas) se simulate karein. Edge TTS par asli SSML chal jati hai.
- **Cost:** Base voice $0, filters client-side $0. Sirf text LLM token cost lagegi.

### Feature 25: Voice-to-Text Continuous (STT Voice Mode)

Browser `webkitSpeechRecognition` se user ki awaz real-time text mein. Feature 4 (Voice Notes Chat) ka extended form — continuous listening, silence detection aur auto-restart ke sath.

- **Kahan chalega:** Desktop Chrome/Edge aur Android Chrome — achha support. PC (Electron) par chal sakta hai lekin Google speech endpoint ki wajah se network chahiye aur kabhi kabhi fail hota hai — alag se test zaroori.
- **Kahan nahi:** Firefox (support nahi), iOS Safari (limited/none — real device par verify karein). In par text-input fallback dikhana hoga.
- **Privacy note:** Ye "fully local" nahi hai — Chrome speech audio Google ke servers ko bhejta hai. Privacy notice zaroori.
- **Hamari web app mein:** Haan — Feature 4 already planned hai; continuous mode ke liye auto-restart + endpointing add karna hoga.

### Feature 26: Voice-to-Voice (Jarvis Loop)

STT → LLM → TTS ka continuous loop: user bolta hai, AI jawab deta hai, Omni Voice sunati hai. Siri/Jarvis jaisi feel ke liye barge-in (AI bolte waqt user interrupt kar sake) aur low-latency routing chahiye.

- **Kahan chalega:** Wahan jahan STT + TTS dono hon — Desktop Chrome/Edge, Android Chrome, PC (Electron, test ke baad).
- **Kahan nahi:** Firefox aur iOS Safari par STT ki wajah se poora loop nahi chalega — wahan "type karo, voice reply suno" fallback hoga.
- **Hamari web app mein:** Haan — teeno pieces is stack mein mumkin hain.

### Feature 27: Animated Emoji Head Companion + Mood State Machine

Poori body nahi — sirf ek expressive animated head (Rive/Lottie/Canvas) jo moods (happy, crying, flirty, thinking) ke hisaab se expressions badalta hai. Mood AI ke response ke sath aane wale tag se set hota hai (e.g. `[mood: caring]`) — user ko mode manually switch nahi karna, aur neutral text bhi current mood ke lehje mein adapt hoga.

- **Kahan chalega:** Web, PC, Mobile — sab jagah. Rive/Lottie/Canvas lightweight hain, 2 GB RAM wale Tier 1 phone par bhi chal jayenge.
- **Kahan nahi:** Kahin nahi — ye pure client-side animation hai.
- **Hamari web app mein:** Haan, bilkul. React mein `@rive-app/react-canvas` ya Lottie component + Zustand mood state lag sakta hai. Mood tag guardrail layer (Feature 29) se aayega aur voice filters ke sath sync hoga (happy = pitch up, sad = slow/low).
- **Caveat:** Art assets ka license clean rakhna; kal ko custom model train karne ke liye yahi mood tags dataset ka hissa banenge.

### Feature 28: Guest Local LLM (Browser mein chalne wala chhota model)

Guest/casual users ke liye chhota model unke hi browser mein (`@mlc-ai/web-llm` / WebGPU) chalega — server cost $0. Models: SmolLM-360M (~200 MB), Qwen2.5-0.5B (~350 MB), Llama-3.2-1B (~700 MB). Complex ya signed-in queries backend LLM par jayengi (hybrid routing).

- **Kahan chalega:** Chrome/Edge 113+ desktop (WebGPU), Chrome Android 121+, PC (Electron — Chromium hai is liye WebGPU milta hai). 4 GB+ RAM realistic minimum; 1B+ models ke liye 6-8 GB better.
- **Kahan nahi:** Firefox (WebGPU flag ke peeche), purana iOS/Safari (WebGPU iOS 26+ par aya — purane devices par nahi), Tier 1 (2 GB) phones — model hi load nahi hoga. In sab par backend ya sign-up prompt fallback.
- **Hamari web app mein:** Haan — ye web app ke liye hi designed hai. Model pehli baar download hota hai aur browser cache mein rehta hai. Local reply bhi hamari filter/persona layers se guzrega, is liye branded lagega.
- **Device policy:** User ke device par model chalana "distributed compute" nahi hai kyunki kaam user ke apne fayde ke liye hai aur wo khud chat kar raha hai — lekin pehli download se pehle size (~MB) batayein aur progress dikhayein.
- **Caveat:** Chhote models ki quality limited hai — sirf casual Q&A ke liye; useful/complex query detect karke backend route karein.

### Feature 29: Text + Voice Guardrail & Persona Layer (Middleware)

Har response — chahe local model se aaye ya backend se — user ko dikhne se pehle layers se guzrega: (1) local sanity fix (formatting, broken JSON, half text), (2) persona/tone injector (mood ke hisaab se rewrite + `[mood]` tag), (3) server-side corrective (safety, format repair, fallback rewrite) jab request backend par ho.

- **Kahan chalega:** Sab devices — Layer 1-2 client-side JS hain, Layer 3 backend par.
- **Hamari web app mein:** Haan — frontend mein post-process function + `backend/src/server.js` mein middleware dono mumkin hain. Is se UI kabhi broken JSON ya tute text ki wajah se crash nahi hogi aur persona har platform par same rahega.

### Feature 30: Voice Quota + Gamified Referral System

Free: 30 min/day voice. Pro: 2 hr/day. Referral rewards: join karwane par +10 min; referred user ke roz active hone par +1 min/day; referred user ke Pro upgrade + use par +5 min/use. Har raat quota reset.

- **Kahan chalega:** Sab platforms — ye pure backend + database logic hai (Supabase ya hamara Node backend + DB).
- **Hamari web app mein:** Haan, lekin ek requirement hai — abhi app guest/localStorage-based hai, referral tracking ke liye user accounts (auth + DB) chahiye. Google OAuth (GoogleSync) already hai, us par build ho sakta hai. Voice timer client par chale lekin balance server verify kare (client-side timer easily hack ho sakta hai).
- **Fraud caveat:** Fake referrals/sybil abuse rokne ke liye device fingerprint ya email/phone verification lagayein, warna log khud ko refer karke unlimited minutes le lenge.

## Monetization (Pakistan Pricing — Finalized)

| Plan | Price | Limit |
|------|-------|-------|
| Free | Rs. 0 | 30 min/day voice + referral rewards |
| Weekly Pass | Rs. 250-350/week | 2 hr/day voice, sab tools |
| Monthly Pro | Rs. 799-999/month | 2 hr/day voice, priority AI |
| Ultra | Rs. 1,499-1,999/month | No daily limit, exclusive moods/skins |

- **Payments:** JazzCash / EasyPaisa / local cards zaroori — sirf international card rakhne par 90% Pakistani users drop ho jayenge.
- **iOS caveat:** iPhone app mein digital content JazzCash se bechna Apple rules ke khilaf hai — iOS par Apple IAP (30% cut) mandatory hoga, ya iOS app mein purchase option hi na rakhein (web se buy karwaein). Apple policy official docs se verify karein.
- **Revenue math:** Rs. 899 avg par ~112 Pro users = Rs. 100k MRR; 1,000 Pro users ≈ Rs. 8-9 lakh MRR. Infra cost (Edge TTS free + guest local LLM + cheap text LLM) approx Rs. 15-30k/month tak reh sakta hai.

## Voice Roadmap (Copyright-Safe)

- **Phase 1 (abhi):** Edge TTS + hamari filter layer — free, fast launch. Copyright risk low lekin zero nahi (unofficial API), is liye filter layer se voice ko uniquely transform karein.
- **Phase 2 (revenue ke baad):** Professional voice artist se 1-2 hr clean recording + written contract → open-source TTS (F5-TTS / Coqui / Bark) fine-tune → apni "Omni Voice" model. Is se 100% copyright-safe, har platform par identical branded voice milegi.

## Viral Growth Checklist

- **Watermarked Social Sharing Cards:** Har acha response, PDF summary ya code output "Share as Image" ke sath, neeche app ka logo aur link.
- **Referral Credit Loop:** Voice minutes wala detailed system Feature 30 mein hai — join par +10 min, roz active use par +1 min/day, Pro upgrade par +5 min/use. Ye organic loop banata hai.
- **No Credit Card Required:** Google OAuth ya One-Click Guest Session. Guest abuse rokne ke liye rate limit zaroori hai.

## Cost Control Zaroori Baatein

- **"PKR 0" ka matlab "near zero" hai:** Ye API cost bilkul zero nahi hogi. Har feature ke liye cost per query calculate karein.
- **Pricing verify karein:** Llama 3.1 8B ($0.02 / $0.04) aur PKR conversion ke numbers provider ki current pricing page se check karein. Prices aur exchange rate badalte rehte hain.
- **API key browser mein expose na ho:** Ye app abhi frontend-only (React + Vite) hai. LLM calls ke liye backend proxy (jaise Cloudflare Worker) banayein taake key chhupi rahe.
- **Per-user daily limit:** Guest aur free users par token ya message cap lagayein, warna koi bhi bot ya heavy user cost badha sakta hai.
- **Caching:** Same PDF aur same prompt ke jawab cache karein, is se repeat cost kam hogi.
- **Model routing:** Simple kaam ke liye chota model, complex kaam ke liye bada model.

## PC Features: Low-End PC Compatibility (Electron Desktop App)

Ye numbers estimates hain. Inhe real purane PC par test karna zaroori hai.

### Minimum Specs (Realistic)

- **CPU:** Intel Core i3 / i5 (2nd ya 3rd Gen, e.g. i3-2100, i5-3320M) ya AMD A-Series / FX-Series.
- **RAM:** 4 GB chal sakta hai, lekin 8 GB behtar hai. Electron ka har process alag memory leta hai, aur browser tabs ya doosre apps ke sath 4 GB jaldi bhar jati hai.
- **Storage:** HDD chal jayegi, SSD se app start aur file loading kaafi tez hogi.
- **OS:** Windows 10 (64-bit) ya Windows 11.
- **Windows 7 / 8.1 ke baare mein:** Project abhi `electron` `^23.2.0` use karta hai (`web/package.json`). Electron 23 Windows 7 aur 8.1 support nahi karta. In OS ke liye Electron 22 ya purana version chahiye, jo security updates ke bagair hota hai. Is liye Windows 7 support ka fayda kam aur risk zyada hai.

### Tools ki Performance (Estimate)

| Tool / Feature | Low-End PC Par Expected | Technique | Caveat |
|----------------|-------------------------|-----------|--------|
| AI Chat UI | Smooth | API response server se aata hai, local PC sirf render karta hai | Response speed internet aur provider par depend karti hai |
| Image Converter (JPG to WebP/PNG) | 1-2 sec (chhoti files) | Canvas API ya light JS | Badi images par memory spike ho sakti hai, is liye size limit lagayein |
| PDF Merger & Splitter | Smooth (1-3 sec) | `pdf-lib` se merge aur split | `pdf-lib` merge kar sakti hai, lekin PDF ke andar ki images ko compress nahi karti |
| PDF Compressor | Slow ho sakta hai | Images ko re-encode karna padta hai, WASM ya server chahiye | Pure JS se asli compression mushkil hai. 20-30 MB files par low-end PC par freeze ka risk hai |
| Voice Input | Instant (agar kaam kare) | `webkitSpeechRecognition` | Electron mein ye Google API keys ki wajah se fail ho sakta hai aur network chahiye. Pehle test karein |
| Background Remover (WASM) | 3-5 sec ka andaza, shayad zyada | Web Worker mein ONNX / WASM model | Core i3 2nd Gen mein AVX2 nahi hota, is liye WASM slow chalega. Model size bhi bada hota hai |

### Electron Optimization Rules

1. **Chromium flags ehtiyat se lagayein:**
   - `no-sandbox` security risk hai. Is ko default mein na lagayein.
   - `disable-http-cache` se repeat loads slow hote hain, faida nahi.
   - Background throttling band karne se CPU zyada use hota hai.
   - Agar purane GPU par graphics ka masla ho to `app.disableHardwareAcceleration()` zyada safe option hai. Pehle measure karein, phir flag lagayein.
2. **Single window:** Ye sahi hai. Ek window mein tabs ya sidebar se tools switch karein, har tool ke liye nayi window na kholein.
3. **Heavy kaam Web Worker mein:** Ye sahi approach hai. Lekin PDF aur image processing main process ke bajaye renderer ke Web Worker mein hona chahiye, kyunki main process UI aur windows sambhalta hai.
4. **Lazy loading:** Vite ke `import()` se tool-specific libraries alag chunks mein load hongi. Is se startup tez hoga. WASM files bhi tool open hone par hi load karein.

### Performance Testing Checklist

- Task Manager mein app ki total RAM (saare Electron processes milake) measure karein. Idle aur tool chalne ke waqt dono.
- 20-30 MB PDF aur badi image par UI freeze check karein.
- Startup time ko 4 GB RAM aur HDD wale PC par measure karein.
- Voice input ko Electron build mein alag se test karein.

### Bottom Line

Electron chat app aur light tools (image convert, PDF merge) ke liye 4 GB RAM aur Core i3 2nd Gen par chal sakta hai. Heavy tools (PDF compression, background removal) ke liye 8 GB aur behtar CPU safe hai. Final claim karne se pehle asli purane PC par test karna zaroori hai.

## PC + Mobile Features: Utility Tools (Mazeed)

Is section mein sirf wo features hain jo upar ki list mein pehle se nahi the. Duplicate items hata diye gaye hain: Image Format Converter, PDF Compressor aur Image Background Remover pehle se Desktop table mein hain, PDF Merger ko Splitter ke sath merge kar diya gaya hai.

| Feature | Category | Expected Time (Estimate) | Technique | Caveat |
|---------|----------|--------------------------|-----------|--------|
| Bulk Image Resizer / Compress for WhatsApp | File & Image | 3-8 sec (10-15 images) | Canvas API se resolution resize | Resize se CPU load kam hota hai, lekin bade batch par memory dhyan se manage karein |
| Passport Size Photo Maker (Background Change + Auto Crop) | File & Image | 8-15 sec | Background remover + crop logic | Passport ke size aur background rules country aur office ke hisaab se alag hote hain. Face detection ke liye alag model chahiye |
| PDF to High-Res JPG | PDF & Document | 4-10 sec (10 pages) | `pdf.js` pages ko canvas par render karta hai | High resolution par memory zyada lagti hai, DPI limit lagayein |
| Image / Scanned Documents to PDF | PDF & Document | 2-5 sec | Images ko `pdf-lib` mein embed karna | Scanned text searchable nahi hoga, OCR alag tool hai |
| JSON / XML / SQL Formatter & Minifier | Developer Tools | 0.1 sec (instant) | Local JS parsers | SQL formatter ke liye dialect support limited ho sakta hai |
| Case Converter & Roman Urdu Text Clean-up | Text Utility | 0.1 sec | String transformations | Roman Urdu clean-up rules pehle define karne honge |
| Markdown to HTML / PDF Generator | Developer Tools | 1 sec | Markdown parser aur PDF export | Complex layouts ya math ke liye extra setup chahiye |
| Text Diff Checker | Developer Tools | 1-2 sec | Diff algorithm | Bahut badi files par UI slow ho sakti hai |
| MP3 / Audio Trimmer & Cutter | Audio & Media | 3-8 sec | Waveform UI, buffer crop | Browser audio decode ke liye file ko memory mein load karna padta hai |
| Video to Audio (MP4 to MP3) | Audio & Media | 10-20 sec (5 min clip) | `FFmpeg.wasm` | FFmpeg.wasm bada hai (kaafi MB) aur single-thread mein slow ho sakta hai. Ye time estimate optimistic hai, real PC par test karein |
| Voice Note Noise Reducer / Gain Booster | Audio & Media | 5-15 sec | Web Audio API filters | Quality noise type par depend karti hai. Ye AI noise removal ka replacement nahi hai |
| Offline QR Code Generator & Scanner | Business Utility | 0.5 sec | Local QR library | Scanner ko camera permission chahiye. Electron mein camera access ka setup check karein |
| BarCode Generator (Local Shopkeepers) | Business Utility | 0.5 sec | Local barcode library | Barcode type (EAN, Code128) ke hisaab se format choose karein |
| Salary / Tax Calculator (Pakistani Tax Slabs) | Business Utility | Instant | Local calculation logic | Tax slabs har budget mein badalte hain. Har saal update karna zaroori hai. Disclaimer lagayein ke ye official advice nahi hai |

### Architecture Rule

Saare conversion aur heavy kaam Web Worker mein chalayein, main UI thread par nahi. Is se progress bar (20% -> 60% -> 100%) smooth rahega aur app freeze nahi hogi. Ye rule upar `Electron Optimization Rules` mein bhi hai.

### Notes

- Ye time values estimates hain. "Guaranteed under 30 seconds" ka claim tab tak nahi karein jab tak 4 GB RAM aur Core i3 2nd/3rd Gen par asli test na ho jaye.
- Har tool ke liye file size limit rakhein, taake low-end PC par crash ka risk kam ho.

## Mobile Features: Feasibility (Lowest Spec Tiers)

Mobile ke liye sab se sasta option PWA hai. Ye same React code ko mobile browser mein "Add to Home Screen" se install karta hai. App store fees aur alag codebase ki zaroorat nahi. `app/` folder README mein mobile app ke liye future mein rakha gaya hai.

### Device Tiers (Estimate)

- **Tier 1 (Entry):** 2 GB RAM, budget Android (MediaTek Helio / Snapdragon 4xx class) ya purane iPhone.
- **Tier 2 (Mid):** 3-4 GB RAM, Android 11+ ya naya iPhone.
- **Tier 3 (Modern):** 6 GB+ RAM, modern chipset.

Mobile browsers mein RAM limit aur tab reload ka risk zyada hota hai. Android Chrome memory kam hone par tab reload kar sakta hai, aur iPhone Safari per-tab memory limit lagata hai. Ye limits real device par test karein.

### Feature Feasibility

| Feature | Tier 1 (2 GB) | Tier 2 (3-4 GB) | Tier 3 (6 GB+) | Note |
|---------|---------------|-----------------|----------------|------|
| AI Chat UI | Yes | Yes | Yes | Cloud API par depend |
| Voice Notes Chat | Limited | Yes | Yes | Android Chrome mein achha support hai, iOS Safari mein verify karein |
| Text tools (JSON, Case, Diff, Markdown) | Yes | Yes | Yes | Instant |
| QR / Barcode Generator | Yes | Yes | Yes | Generator instant hai |
| QR Scanner | Limited | Yes | Yes | Camera permission zaroori |
| Tax Calculator | Yes | Yes | Yes | Tax slabs update karte rahein |
| Image Converter | Limited (chhoti images) | Yes | Yes | Badi camera photos par memory limit |
| Bulk Image Resizer | Limited (chhota batch) | Yes | Yes | Batch size limit lagayein |
| Passport Photo Maker | No | Limited | Yes | Background removal ki wajah se heavy |
| PDF Merger & Splitter | Limited (chhoti PDFs) | Yes | Yes | Bari PDFs memory khatam kar sakti hain |
| Image / Scanned to PDF | Limited | Yes | Yes | Camera scan se bari images aati hain |
| PDF to High-Res JPG | Limited (few pages) | Yes | Yes | DPI limit lagayein |
| PDF Compressor | No | Limited (chhoti files) | Limited | Bari PDF par freeze ka risk |
| Background Remover | No | Limited (WASM slow) | Yes | Model size aur speed ki limit |
| MP3 / Audio Trimmer | Yes | Yes | Yes | Chhoti audio files |
| Video to MP3 (FFmpeg.wasm) | No | Limited (short clips) | Limited | FFmpeg.wasm bada hai, mobile par slow |
| Voice Note Noise Reducer | Limited | Yes | Yes | Web Audio API |

### Mobile Ke Liye Rules

- **Device check:** `navigator.deviceMemory` (sirf Chromium browsers mein) aur `navigator.hardwareConcurrency` se device ka andaza lagayein. Low-tier device par heavy feature disable karke "PC app par chalayein" ka message dikhayein.
- **File size limit:** Mobile par har tool ke liye size limit lagayein (jaise 10 MB).
- **Fallback:** Heavy kaam ke liye server fallback rakhein, lekin ye cost barhayega. Is liye sirf opt-in rakhein.
- **Web Worker:** Mobile par bhi processing Web Worker mein hi karein.

### Bottom Line (Mobile)

Tier 1 (2 GB RAM) par AI chat, text tools, QR, tax calculator aur chhoti files wale image/PDF tools chal sakte hain. Background remover, PDF compression aur video to MP3 ke liye Tier 2 ya Tier 3 device behtar hai. Ye sab estimates hain aur asli devices par test karna zaroori hai.

## Android aur iPhone App: Tech Stack

Recommended rasta: Capacitor. Existing React + Vite + TypeScript code reuse hoga.

### Stack

- **App shell:** Capacitor (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/ios`)
- **Frontend:** React, TypeScript, Vite, Tailwind, Zustand (existing)
- **Native plugins:** `@capacitor/preferences` (settings), `@capacitor/filesystem` (file save/read), `@capacitor/share`, `@capacitor/camera`, `@capacitor/app`, `@capacitor/status-bar`, `@capacitor/keyboard`
- **Android build:** Android Studio, Gradle, `.aab` file
- **iOS build:** Xcode (Mac zaroori) ya cloud CI (Codemagic, GitHub Actions macOS runner)
- **Store upload:** Google Play Console aur App Store Connect (TestFlight testing ke liye)
- **Backend:** Existing `backend/` Node server, alag host par deploy

### Platform Responsibilities

- **Android:** Windows par Android Studio se build hoga.
- **iPhone:** Windows par build nahi hoga. Mac ya cloud CI chahiye.
- **Login:** Google login ho to iOS par Sign in with Apple bhi chahiye.
- **Packages:** Capacitor plugin versions aur install steps official Capacitor docs se verify karein.

### Costs

- **Google Play:** $25 ek dafa.
- **Apple Developer Program:** $99 per year.
- **Cloud CI:** Free tier limits aur prices provider ki official pricing se check karein.

### Store Requirements

- Privacy policy URL (dono stores ko chahiye).
- Apple review ke liye test account.
- Apple Guideline 4.2: Sirf web wrapper reject ho sakta hai, native features (camera, file access, share, offline tools) add karein.
- Apple Guideline 4.8: Google login ho to Sign in with Apple zaroori hai.
- AI content: Moderation aur report option dono stores ki policy ke mutabiq rakhein.

### Security

- Gemini API key app mein nahi honi chahiye. `GEMINI_API_KEY` sirf backend mein rahe. App sirf aap ke backend ko call kare.

## Device Usage Policy

Device ka processing use karna policy ke against nahi hai, lekin user ki jaankari aur consent ke sath hona chahiye. Final review se pehle Google Play "Device and Network Abuse" aur Apple App Review Guidelines official pages par verify karein.

### Allowed

- Image, PDF aur text tools ka processing user ke device par, jab user khud feature chalaye.
- Browser ya native APIs (Canvas, Web Audio, Web Workers) se local kaam.
- Small on-device ML model (agar license allow kare aur app size limit mein ho).
- Processing ke dauran progress bar aur cancel button.

### Not Allowed

- **Crypto mining ya hidden computation:** Google Play mein clearly banned hai.
- **Background kaam bina consent ke:** User ko bataye baghair app band hone ke baad CPU ya battery use karna.
- **Distributed compute:** User ke phone se doosre users ya aap ke server ke liye LLM calls chalana.
- **Excess resource use:** Battery zyada drain karna ya phone garam karna.

### Platform Restrictions

- **Android:** Background execution limits (Doze, WorkManager) lagte hain. Low-memory devices par system app ko kill kar sakta hai.
- **iPhone:** Memory limit chhoti hai aur bhari app jaldi kill hoti hai. Lambi background processing mumkin nahi, is liye kaam foreground mein ho.
- **Dono:** Heavy kaam par thermal throttling hoti hai, jo purane phones par speed ghata deti hai.
- **App size:** Bade on-device models store size limit ke andar hone chahiye. Limits official docs se verify karein.

### Store Disclosure

- **Google Play:** Data safety form mein batayein ke kaunsa data device par rehta hai aur kaunsa server par jata hai.
- **Apple:** App Privacy labels aur privacy policy mein wahi info dein.
- Listing mein likhein: "Files aap ke phone par process hoti hain" (agar aisa hi hai).

## Next Steps

1. Pehle Feature 1 (PDF Chat) aur Feature 4 (Voice Input) implement karein, kyunki inki cost sab se kam hai.
2. Backend proxy aur rate limit setup karein.
3. Har feature ke liye cost per query ka test karein aur is file ko actual numbers se update karein.
4. Voice system (Feature 24-26) aur Guest Local LLM (Feature 28) implement karein — near-zero cost ke sath sab se bada differentiation denge.
5. Referral/quota system (Feature 30) ke liye auth + DB schema pehle design karein.

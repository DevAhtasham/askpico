# Voice Mode

**Status:** Planning. Build in the order below, from easiest to hardest.
**Owner:** Pico product team
**Source:** Consolidated from the feature catalogue and the roadmap.
**Out of scope:** Voice model training (Voice Roadmap Phase 2, fine-tuning an open-source TTS on recorded audio). It is described in the [feature catalogue](../product/feature-catalog.md), section 4.
**Related:** [Beta launch](../product/beta-launch.md) · [Agent persona](agent-persona.md) · [Authentication](../engineering/authentication.md)

## 1. Feature Inventory

| # | Feature | Previous location | Estimate (hours) | Depends on |
|---|---|---|---|---|
| 4 | Voice notes chat (mic button) | Feature catalogue | 3 | None |
| 25 | Continuous voice-to-text (voice mode) | Feature catalogue | 6 | 4 |
| 29 | Text and voice guardrail and persona layer | Feature catalogue | 6 | Chat response flow |
| 24 | Text-to-voice "Pico Voice" (Edge TTS and filter layer) | Roadmap | 10 | 29 (mood tags) |
| 30 | Voice quota and gamified referral system | Roadmap | 30 | Accounts and database |
| 26 | Voice-to-voice loop | Roadmap | 14 | 24, 25 |
| (none) | Voice input and output (dictation and TTS options) | Roadmap, item 5 (removed) | Included in 4, 24, 25 | Browser APIs first |

**Total:** 69 hours (about 8.6 working days at 8 hours per day). Estimates are AI-assisted and exclude real-device QA.

## 2. Build Order

### Step 1: Mic Button (Feature 4, about 3 hours)

- Add a mic button next to the chat input.
- Use `window.SpeechRecognition` or `webkitSpeechRecognition` (Chrome and Edge).
- Insert the recognized text into the input. Do not auto-send.
- Hide the button when the API is not supported, and show a short text-only note.
- Show a privacy notice. In Chrome, speech audio is sent to Google's servers, so recognition is not fully on-device.

**Done when:** a sentence spoken into the mic appears in the input, nothing is sent automatically, and the button is hidden on Firefox.

### Step 2: Continuous Listening (Feature 25, about 6 hours)

- Use `continuous = true` and `interimResults = true`.
- Restart automatically on `onend` while the user has not stopped the mode.
- Use a silence timeout to finalize each utterance.
- Provide a stop button and a visible listening state.
- Handle `not-allowed`, `no-speech`, and `network` errors with a clear message. Never show raw error text.
- Electron: test separately, because the Google speech endpoint needs network access and can fail. Check the microphone permission handler in `apps/web/electron/index.cjs`.

**Done when:** a two-minute dictation produces text without manual restarts, and stopping leaves no active recognition session.

### Step 3: Guardrail and Persona Layer (Feature 29, about 6 hours)

Every response passes these layers before display, whether it came from the local path or the backend:

1. **Client sanity fix:** formatting, broken JSON, half-finished text.
2. **Persona and tone injector:** applies the selected mood and reads the `[mood: ...]` tag. See [Agent persona](agent-persona.md), section 3.
3. **Server-side corrective** (in `services/api/src/server.js`, only when the request goes to the backend): safety, format repair, and fallback rewrite.

- Layers 1 and 2 are plain client-side functions and can be unit tested.
- Layer 3 is backend middleware. Keep it small and log only request IDs.

**Done when:** a broken JSON reply is repaired on screen, and the mood tag is removed from the displayed text.

### Step 4: Pico Voice, Phase 1 (Feature 24, about 10 hours)

Build in this order, so the feature works before any unofficial dependency is added:

1. `speechSynthesis` first. It is free, built into the browser, and needs no backend. Pauses are simulated from punctuation because it does not parse SSML.
2. Backend Edge TTS proxy behind a feature flag, with per-user rate limits. Edge TTS is unofficial: the endpoint can block requests, and commercial terms are a risk.
3. Client audio filters (EQ, pitch, `playbackRate`) with Web Audio, applied to the `<audio>` element. Skip filters on older browsers.
4. Downloadable audio (optional, later): an FFmpeg chain using `atempo`, `equalizer`, `highpass`, and `loudnorm`.

**Done when:** a reply plays through the `speechSynthesis` fallback, and voice still works with the backend flag turned off.

### Step 5: Voice Quota and Referral (Feature 30, about 30 hours)

**Prerequisite:** accounts, a database, and server-side verification (see [Authentication](../engineering/authentication.md)). Do not build this on the client alone, because a client timer can be changed.

- **Limits:** Free 30 minutes per day. Pro 2 hours per day. Weekly Pass and Ultra limits are in the [feature catalogue](../product/feature-catalog.md), section 3.
- **Referral rewards:** +10 minutes on join, +1 minute per day when a referred user is active, +5 minutes per use after a Pro upgrade.
- **Reset:** the quota resets every night.
- **Fraud controls:** device fingerprint, or email or phone verification, to block fake and sybil referrals.
- **Enforcement:** the balance is checked and debited on the server for every voice session.

**Done when:** a free user at 30 minutes is blocked by the server, and a modified client timer does not extend the quota.

### Step 6: Voice-to-Voice Loop (Feature 26, about 14 hours)

- Loop: speech-to-text (Step 2), then the LLM through the existing chat path and Step 3, then text-to-speech (Step 4).
- Split streamed LLM output into sentences, and send each sentence to TTS as soon as it arrives, to lower latency.
- **Barge-in:** when the user starts speaking, cancel current TTS playback.
- **Fallback:** on Firefox and iOS Safari, where speech recognition is missing, use "type the question, hear the reply".

**Done when:** a spoken question gets a spoken answer, and speaking during the answer stops playback.

### Step 7: Accuracy Upgrade (Optional)

- Whisper API, or on-device `whisper.cpp` or transformers.js, for better accuracy than the browser API.
- This is speech-to-text only. It is not voice model training.
- Only after Steps 1 to 6 are stable, and only if browser accuracy is not enough. Check the cost per minute.

## 3. Platform Matrix

| Feature | Web (Chrome, Edge) | Web (Firefox) | Web (iOS Safari) | PC (Electron) | Mobile (Android) | Mobile (iOS) |
|---|---|---|---|---|---|---|
| Mic button (Step 1) | Yes | No, hide | Verify on device | Test separately | Yes, Chrome | Verify, limited |
| Continuous (Step 2) | Yes | No | Limited | Needs network | Yes | Verify |
| Speech output (Step 4) | Yes | Yes | Yes | Yes | Yes | Yes |
| Voice-to-voice (Step 6) | Yes | Type-and-hear fallback | Type-and-hear fallback | Test | Yes | Fallback |

Low-end devices: Mobile Tier 1 (2 GB RAM) is "Limited" for voice notes, per the [feature catalogue](../product/feature-catalog.md), section 8. Test on real devices.

## 4. Acceptance Checklist

- Step 1: no auto-send, no console errors, button hidden when unsupported.
- Step 2: no recognition sessions left running after stop, and error messages are generic.
- Step 3: layers run in order, and mood tags are never shown to the user.
- Step 4: works with the flag off, and the fallback is used when Edge TTS fails.
- Step 5: quota enforced only on the server.
- Step 6: barge-in cancels audio within one second.

## 5. Risks

- **Privacy:** Chrome and Edge send speech audio to Google. Show a privacy notice, and update the privacy policy before store submission (see the [feature catalogue](../product/feature-catalog.md), section 10.4).
- **Unofficial TTS:** Edge TTS can stop working or break its terms. Keep the `speechSynthesis` fallback.
- **Platform gaps:** Firefox and iOS Safari have limited speech APIs. Always provide a text fallback.
- **Cost:** Voice minutes multiply LLM and TTS spend. Enforce quotas on the server (Step 5) before enabling Step 6.
- **Electron:** Google speech keys may fail inside Electron. Test in the packaged build.
- **Store policy:** Google Play reviews AI and voice features. Keep moderation and report options.

## 6. Open Decisions

- Which TTS provider replaces Edge TTS if its terms block commercial use.
- Whether voice minutes are shown in Weekly Pass and Ultra, or only in Pro.
- Whether Step 7 (Whisper) is needed, based on Step 2 accuracy tests.

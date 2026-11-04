# Beta Launch Plan

**Status:** Planning
**Owner:** Pico product team
**Platforms:** Web (browser) and Mobile (Android, Kotlin WebView)
**Related:** [Feature catalog](feature-catalog.md) · [Roadmap](roadmap.md) · [Voice mode](../modules/voice-mode.md) · [Agent persona](../modules/agent-persona.md) · [Pico character](../modules/pico-character.md) · [Authentication](../engineering/authentication.md) · [Branching strategy](../engineering/branching-strategy.md)

## 1. Summary

The beta launches Pico on the web and on Android. It includes the full voice mode, automatic model routing on the backend, a persona system that gives the agent emotions and reactions, and an anime-inspired chibi character for animation.

Everything else in the [feature catalogue](feature-catalog.md) that is not listed in this document is post-beta. Agent tools and their status are tracked in [Agent development](../engineering/agent-development.md).

## 2. Scope

| Area | In beta | Post-beta | Notes |
|---|---|---|---|
| Voice mode (Steps 1–6) | Yes | Step 7 (Whisper accuracy upgrade) | Step 7 only if browser speech accuracy is not enough |
| Model auto-routing (backend) | Yes | Multi-model compare (roadmap item 5) | See section 4.2 |
| Persona system with emotions and reactions | Yes | Per-agent attitude cards (detail) | See [Agent persona](../modules/agent-persona.md) |
| Anime-style chibi character and animation | Yes | Extra outfits, skins, and moods | See section 4.4 |
| Authentication (guest, Google sign-in) | Yes | Email magic link, if not in beta | See [Authentication](../engineering/authentication.md) |
| Subscriptions and plan limits | Yes (manual plan flag at minimum) | Webhook-driven billing if not ready | Payment provider is an open decision |
| Referral system | Decide before launch | Voice minute rewards if deferred | Requires anti-abuse controls before launch |
| Agent tools (Study, Business, Creative, and others) | Current tools only | Remaining tools per the roadmap | Not part of beta acceptance |
| Pico Vault (tokenized personal data) | Decide before launch | Default post-beta | See [Pico vault](../modules/pico-vault.md) |
| Desktop (Electron) and iOS | No | Yes | See the [roadmap](roadmap.md) |

## 3. Pages by Platform

The web and mobile apps have different page sets. Both are built from the same React code where possible.

### 3.1 Web (3 pages)

| Page | Purpose | Key elements |
|---|---|---|
| **Landing** | Explain the product and drive sign-up | Hero, feature highlights, voice and persona preview, plan summary, sign-in and "Try as guest" buttons |
| **Auth** | Sign in or create an account | Google sign-in, guest continuation, legal links (privacy policy, terms) |
| **Chat** | Main product screen | Sidebar (new chat, history, agents), greeting and orb, composer with mic and tools, account card |

### 3.2 Mobile (3 pages)

| Page | Purpose | Key elements |
|---|---|---|
| **Auth** | Sign in or continue as guest | Google sign-in, guest continuation, legal links |
| **Chat** | Main product screen | Same as web Chat, with a mobile layout and voice button |
| **Profile** | Account and settings | Name and avatar, plan, voice minutes used, referral code and reward summary, log out, delete account |

### 3.3 Page rules

- Web Landing is public. Auth and Chat are reachable by URL. The app redirects signed-out users to Auth, except guests who continue from Auth.
- Mobile has no Landing page. The first screen is Auth.
- Profile on web is the account card menu inside Chat (Account, Referral, Plan, Log out), not a separate page. This matches [Authentication](../engineering/authentication.md) section 7.
- Account deletion is available on both platforms. Google Play requires it.

## 4. Core Beta Features

### 4.1 Voice mode (full)

Implements the six steps in [Voice mode](../modules/voice-mode.md):

1. Mic button (speech to text, insert only, no auto-send).
2. Continuous listening with silence timeout and clear errors.
3. Guardrail and persona layer (sanity fix, mood tags stripped from display).
4. Speech output (`speechSynthesis` fallback first, then Edge TTS proxy behind a flag, then audio filters).
5. Voice quota and referral enforced on the server.
6. Voice-to-voice loop with sentence-level streaming and barge-in.

**Done when:** a spoken question gets a spoken answer on Chrome Android and desktop Chrome or Edge, speaking during an answer stops playback, the quota blocks a free user at the limit, and the text fallback works on Firefox and iOS Safari.

### 4.2 Model auto-routing (backend)

The user chooses an agent or asks in plain language. The backend chooses the model. The client does not pick a model, unless a paid plan allows it.

**Routing inputs**

- Request type: plain text, attachment, tool request, or voice turn.
- Complexity estimate: message length, number of attachments, and task keywords.
- Latency priority: voice turns get a lower latency target.
- Plan tier: caps the highest model tier a user can reach.

**Routing output**

- A tier: `fast`, `standard`, or `advanced`. Each tier maps to a configurable provider and model.
- A fallback chain. If the primary call times out, returns HTTP 429, or returns 5xx, the backend tries the next model in the chain.

**Rules**

- Tier mapping lives in configuration, not in client code.
- The provider switch (`LLM_PROVIDER`: Gemini or OpenRouter) continues to work. Auto-routing sits above it.
- Routing decisions are logged with the request ID and tier only. Message text is not logged.
- Rate limits apply per user and per plan, enforced on the server.
- The client receives the final model name for display only, never as a control input.

**Done when:** a simple query uses the `fast` tier, a long document task uses `advanced`, a forced primary failure falls back to the next model, and a free user cannot reach `advanced` through a client change.

### 4.3 Persona system with emotions and reactions

Defined in [Agent persona](../modules/agent-persona.md). Summary:

- Each agent has a persona with a defined role and tone.
- The persona has an emotional state (for example neutral, happy, excited, sad, concerned, thinking) that changes with the conversation.
- Reactions are short, human-style responses: acknowledging good news, showing empathy when the user is stressed, admitting uncertainty, and using light humor where it fits.
- Humanized touches: natural pacing (typing indicator length follows reply length), using the user's name when known, and never pretending to be a human when a user sincerely asks.
- Emotion tags are produced by the model as `[mood: ...]` and are removed by the guardrail layer before display.

**Done when:** the same question in two different moods gets two appropriate tones, mood tags never appear in the UI, and reactions match the persona card for each agent.

### 4.4 Anime-style chibi character and animation

Defined in [Agent persona](../modules/agent-persona.md) (visual style and animation) and [Pico character](../modules/pico-character.md) (layers and state).

- **Style:** Chibi: a large head, a small body, large expressive eyes, minimal line work, and a soft pastel palette. The character is original. Do not copy existing anime characters.
- **Animation:** Idle breathing, random blinking every 3–5 seconds, smooth mood transitions (200–300 ms), a speaking mouth synced to the voice output, and short reaction animations (bounce for happy, a sweat drop for stress, sparkles for excitement).
- **Implementation:** SVG layers and CSS keyframes. No animation library. Respect `prefers-reduced-motion`. Pause animation when the tab is hidden.

**Done when:** the character reacts to every mood in the persona card, runs at 60 fps on a Tier 1 Android device, and stops animating when reduced motion is on.

## 5. Launch Scenarios

| # | Scenario | Expected result | Owner |
|---|---|---|---|
| S1 | New visitor on the web opens Landing and clicks "Try as guest" | Guest session created. Chat opens with "Hello, Guest" and the Free plan label | Auth |
| S2 | Guest signs in with Google | Guest chats are shown after sign-in. The user is asked before any chats are merged | Auth |
| S3 | Mobile user opens the app for the first time | Auth screen first. Guest continuation or Google sign-in works | Mobile |
| S4 | Free user uses voice until the daily limit | Voice stops at the limit with a clear message. The limit is enforced by the server | Voice |
| S5 | Free user changes the client timer or local storage | Quota does not change. Server rejects the voice session | Voice and Auth |
| S6 | User asks a simple question by text | Routed to the `fast` tier. Reply appears in the chat | Backend |
| S7 | User uploads a large document and asks for analysis | Routed to `advanced` only if the plan allows it. Otherwise the user sees an upgrade prompt | Backend |
| S8 | Primary model times out | Fallback model answers. The user sees no error. The log contains a request ID only | Backend |
| S9 | Speech recognition is unsupported (Firefox, iOS Safari) | Mic button is hidden. Type-and-hear fallback works | Voice |
| S10 | Network drops during a voice reply | Playback stops. A retry message appears. No recognition session stays active | Voice |
| S11 | User says "stop" or speaks during a reply | Playback stops within one second | Voice |
| S12 | Persona reacts to bad news from the user | Empathetic reply with the agent's mood changing to concerned. Mood tag is hidden | Persona |
| S13 | User asks "are you a real person?" sincerely | The agent says it is an AI assistant. It does not claim to be human | Persona |
| S14 | Paid user is upgraded through the webhook | Plan label and locked tools update only after the server writes the subscription | Auth and billing |
| S15 | Referral link is used by the same account, or by a repeat account | Zero reward. Recorded in the database | Auth |
| S16 | User deletes the account from Profile | User, sessions, and linked data are removed. User is logged out | Auth |
| S17 | Reduced motion is enabled | Orb and character animations stop. Content stays readable | UI |
| S18 | Low-memory Android device | Heavy tools are disabled with a message. Chat and voice keep working | Mobile |

## 6. Milestones

| Milestone | Contents | Exit condition |
|---|---|---|
| M1: Foundations | Auth Phases 1–2 (guest session, home UI), auto-routing skeleton | S1 and S6 pass |
| M2: Voice | Voice Steps 1–4 | S9, S10, and S11 pass on Chrome, Edge, and Android Chrome |
| M3: Accounts and limits | Auth Phases 3–4 (Google sign-in, subscriptions), voice Step 5 | S2, S4, S5, S14 pass |
| M4: Persona and character | Persona system, chibi character, reactions | S12, S13, S17 pass |
| M5: Voice loop and routing | Voice Step 6, full routing with fallback | S7, S8 pass |
| M6: Mobile beta | Kotlin WebView shell, Profile page, Google Play internal testing | S3, S16, S18 pass |
| M7: Launch readiness | Privacy policy, terms, account deletion, store checklist, landing page | All scenarios pass. Store review checklist complete |

M1 to M5 are web-first. M6 can begin once the web Chat page is stable.

## 7. Exit Criteria

- All scenarios in section 5 pass on the target devices (Chrome and Edge desktop, Chrome on Android, one iPhone for the web fallback check).
- No raw personal data appears in outbound requests (see [Pico vault](../modules/pico-vault.md) section 9 if the vault is included).
- No console errors on the Landing, Auth, and Chat pages.
- Privacy policy lists every stored field: email, name, plan, referral, and usage counts.
- Account deletion works end to end.
- Backend tests (routing, quota, and auth) pass. Frontend tests (voice states, persona mood handling, orb states) pass. See [Testing guide](../engineering/testing-guide.md).

## 8. Release Process

- **Branches:** beta work is merged into `release` after review. Only `release` is deployed to beta. See [Branching strategy](../engineering/branching-strategy.md).
- **Web:** deployed by the existing GitHub Pages workflow (`.github/workflows/deploy.yml`). The backend is hosted separately.
- **Android:** Google Play internal testing track for beta testers, then closed testing before public release.
- **Rollback:** Redeploy the previous `release` commit. Revert the backend environment flag first when the cause is a feature flag, such as Edge TTS.

## 9. Risks

- **Browser speech support:** Firefox and iOS Safari lack full speech APIs. Keep the text fallback as a first-class flow.
- **Edge TTS terms:** Unofficial, can break. Keep `speechSynthesis` as the default fallback.
- **Routing cost:** A wrong tier assignment increases cost. Cap `advanced` for free users, and monitor the cost per tier weekly.
- **Store review:** Google Play requires account deletion, a privacy policy, and a native feature beyond a plain web wrapper.
- **Payments:** JazzCash and EasyPaisa onboarding can take weeks. A manual plan flag is the fallback.

## 10. Open Decisions

- Is the referral system part of beta, or only the voice quota?
- Is the Pico Vault part of beta?
- Email magic link at beta, or Google sign-in only?
- Which payment provider launches first, and whether beta users are charged at all?
- Which model providers fill the `fast`, `standard`, and `advanced` tiers?
- Is the landing page built in the same React app, or as a separate static site?

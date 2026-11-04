# Pico Character and Agent Router

**Status:** Planning. Web first, then mobile and desktop.
**Owner:** Pico product team
**Scope:** Two modules: the Pico character (state and visuals) and the multi-agent router. The vault is specified in [Pico vault](pico-vault.md). Persona behavior and chibi animation style are specified in [Agent persona](agent-persona.md).

## 1. Goals

- Ship the web version first, in `apps/web/src`.
- Keep the current stack: React, Vite, Tailwind, Zustand. No Next.js.
- Build modules that plug into the existing chat container.
- Add no heavy dependencies. Use React hooks and Tailwind only.
- Reuse the same web build on mobile and desktop (see section 8).

## 2. Path Mapping

| Spec path | Actual path |
|---|---|
| `/src/components/PicoCharacter` | `apps/web/src/components/PicoCharacter/` |
| `/src/modules/agents` | `apps/web/src/modules/agents/` |

Notes:

- `apps/web/src/constants/agents.ts` already exists. Keep it for the current agent list, or merge it into `modules/agents/` so there is one source of truth.
- `apps/web/src/utils/toolRouter.ts` and `apps/web/src/utils/physics.ts` already exist. Check them for overlap with the new router before writing `agentRouter.ts`.
- Use the existing path aliases (`@utils`, `@type`, `@store`, `@api`) in new imports. Verify each alias in `apps/web/vite.config` and `apps/web/tsconfig.json` first.

## 3. Target File Tree

```text
apps/web/src/
  components/PicoCharacter/
    PicoCharacter.tsx        # renders layered SVG, reads state
    PicoLayers.tsx           # base body, face, outfit, overlays
    usePicoState.ts          # state and recovery state machine hook
    picoStateMachine.ts      # pure functions, unit testable
    index.ts                 # public exports
    types.ts
  modules/agents/
    types.ts
    agentRouter.ts           # route(query, context) -> AgentResult
    personas.ts              # tone rules per agent and tier
    repeatTracker.ts         # counts identical queries per session
    index.ts
public/assets/pico/
  base.svg
  face/neutral.svg  face/tired.svg  face/sad.svg  face/cheerful.svg
  outfit/clean.svg  outfit/torn.svg  outfit/tattered.svg
  overlay/dark-circles.svg  overlay/dust.svg
```

## 4. Module 1: Pico Character

### 4.1 State

```ts
export type Tier = 'free' | 'paid';

export interface PicoState {
  daysActive: number;      // 1 to 7+, increments per calendar day of use
  isPaid: boolean;         // read from server subscription status, never from localStorage
  hungerLevel: number;     // 0 to 100, rises with days inactive or unpaid
  recoveryStep: number;    // 0 to N, advances per paid session
  lastSessionDate: string; // ISO date, used for day counting
}
```

### 4.2 Visual Rules

The character is a layered SVG with one overlay per condition. No raster assets are required for the MVP.

| Condition | Layer | Visual |
|---|---|---|
| `daysActive` 1 to 2 | Face | `neutral` |
| `daysActive` 3 to 4 | Face, overlay | `tired` plus `dark-circles` |
| `daysActive` 5 to 7+ | Face, outfit, overlay | `sad`, `torn`, `dust` |
| `hungerLevel` above 70 | Face | `sad`, regardless of day |
| Recovery step 1 to N | Outfit, face | Outfit steps `tattered` to `torn` to `clean`; face steps `sad` to `tired` to `cheerful` |

The mood expressions used by the persona (see [Agent persona](agent-persona.md), section 3) are drawn on the same face layer.

### 4.3 Recovery State Machine (Paid)

Rules:

- Switching `isPaid` to true does not repair Pico immediately.
- Recovery advances one step per paid session. It is not based on wall-clock time, so changing the device clock cannot skip it.
- Each step is a pure function in `picoStateMachine.ts`:

```text
tattered -> torn -> clean           (outfit)
sad      -> tired -> cheerful       (face)
recoveryStep = 0 means no recovery yet
recoveryStep = max means fully healed
```

- A free user's `recoveryStep` freezes. It does not reset, so re-subscribing resumes recovery.
- `hungerLevel` drops by a fixed amount per paid session.

### 4.4 Integration

```tsx
import { PicoCharacter } from '@components/PicoCharacter';

<PicoCharacter
  daysActive={session.daysActive}
  isPaid={session.isPaid}
  hungerLevel={session.hungerLevel}
  recoveryStep={session.recoveryStep}
  size={96}
/>
```

The component is presentational. The `usePicoState` hook owns persistence and tier changes.

### 4.5 Acceptance

- Each condition in section 4.2 renders with no console errors.
- Setting `isPaid` to true advances `recoveryStep` by exactly one per simulated session.
- Unit tests cover the step functions in `picoStateMachine.ts`.

## 5. Module 2: Agent Router

### 5.1 Contract

```ts
export type AgentName = 'OfficeAgent' | 'StudyAgent' | 'HealthAgent' | 'VaultAgent';
export type OutputType = 'text' | 'document' | 'math' | 'ocr' | 'token';

export interface AgentResult {
  agentName: AgentName;
  agentToneBubble: string;  // persona line shown in the chat bubble
  taskOutput: string;       // the real answer; always correct
  outputType: OutputType;
}

export function route(query: string, ctx: { tier: Tier }): Promise<AgentResult>;
```

### 5.2 Routing

- Use keyword or intent classification first. No extra LLM call is needed for this step. Examples: "email" and "document" go to `OfficeAgent`; "integral" and "equation" go to `StudyAgent`; "lab", "report", and "scan" go to `HealthAgent`; "CNIC", "phone", and "token" go to `VaultAgent`.
- Ambiguous queries go to the general chat path. They are not assigned to a guessed agent.

Model selection for the chat path is covered by the auto-routing design in [Beta launch](../product/beta-launch.md), section 4.2.

### 5.3 Tone Matrix

| Tier | Tone | Example bubble |
|---|---|---|
| Free | Grumpy, complaining, sarcastic about the lack of paid features | "Fine. Pico is starving again, and I'm doing this for free too." |
| Paid | Friendly, professional, or light humor | "Here you go, all sorted." |
| Paid, repeated query | Lighthearted annoyance | "Again? We just did this! Here it is once more." |

Rules:

- Tone changes only the bubble. `taskOutput` is identical in both tiers.
- Repeat detection hashes the normalized query (lowercase, trimmed, whitespace collapsed). The count is kept in `repeatTracker.ts` for the session.
- The free-tier tone mocks the app, not the user's intelligence or identity. See section 11.

### 5.4 Integration

```tsx
import { route } from '@modules/agents';

const result = await route(input, { tier: isPaid ? 'paid' : 'free' });
// render result.agentToneBubble beside PicoCharacter, then result.taskOutput
```

### 5.5 Acceptance

- Each agent returns a valid `AgentResult` for its keyword set.
- Free and paid runs of the same query produce identical `taskOutput`.
- The third identical paid query contains the annoyance line.

## 6. Assets

The MVP needs no generated images. The character is drawn in SVG.

Sources:

1. **Code-drawn SVG (recommended for MVP).** Each layer is an SVG component. It stays sharp and needs no licensing.
2. **Free-license kits.** Check each license and keep attribution where it is required. Options include Kenney.nl (CC0), OpenGameArt (check per asset), and LottieFiles (check per asset).
3. **AI-generated (only if a raster look is wanted).** Use the image provider from the image generation plan, then vectorize the result before use.

Prompts for optional raster versions (flat style, transparent background, the same canvas size for all layers):

```text
Flat 2D vector character, front view, full body, simple rounded shapes, pastel
grey skin, transparent background, no text, same proportions as a friendly
mascot named Pico, 512x512 px, PNG with alpha.
```

```text
Facial expression sheet for the same mascot: neutral, tired (half-closed eyes,
dark circles), sad (downturned mouth), cheerful (wide smile). Flat style,
transparent background, same head size, separate files.
```

```text
Torn outfit overlay for the same mascot, clothing with holes and tears, same
palette as the clean outfit, transparent background.
```

Store raw assets in `apps/web/public/assets/pico/`. Keep the licensed source and the license note in `apps/web/public/assets/pico/LICENSES.md`.

## 7. Dependencies

- No new dependencies for the MVP. Use React hooks and Tailwind only.

## 8. Platform Plan

| Platform | Approach | Timing |
|---|---|---|
| Web | Existing Vite build | Now |
| Mobile | Kotlin Android app loads the same `apps/web/dist` build in a WebView (iOS not planned) | After web MVP |
| Desktop | Existing `apps/web/electron/index.cjs` wraps the same build | After web MVP |

Rules:

- No platform-specific code inside the modules. Platform checks live in `apps/web/src/platform/` if needed.
- Use `localStorage` only for non-sensitive UI preferences.

## 9. Security

- `isPaid` must come from the backend (subscription status in the session). Anyone can edit a `localStorage` flag, so paid tone and recovery must not rely on it alone.
- Rate limit `/api/chat` before shipping paid features.
- Sanitize any text rendered from the AI. Use React text nodes, not `dangerouslySetInnerHTML`.

## 10. Phases and Milestones

1. **Phase 1: Character MVP.** Layers, state machine, unit tests. Milestone: all conditions in section 4.2 render.
2. **Phase 2: Agent router.** Routing, tone matrix, repeat tracker. Milestone: section 5.5 acceptance passes.
3. **Phase 3: Integration.** Chat container wiring, backend `isPaid` check, rate limit.
4. **Phase 4: Platforms.** Kotlin Android and Electron builds.

The vault phases are in [Pico vault](pico-vault.md).

## 11. Specification Corrections

- **Free-tier tone.** Mocking the app and its free plan is acceptable. Insulting the user damages trust and risks store review. Keep bullying language out of user-facing text.
- **Paid state.** `isPaid` requires server verification (section 9).

## 12. Open Decisions

- Where `isPaid` comes from (which billing provider or backend flag).
- Asset style: code-drawn SVG (recommended) or generated raster.
- Whether agents can call different models, or all use the existing chat endpoint. The beta routing design is in [Beta launch](../product/beta-launch.md), section 4.2.

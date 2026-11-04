# Agent Persona and Character

**Status:** Planning
**Owner:** Pico product team
**Scope:** How agents speak, react, and show emotion, and the visual style and animation of the chibi character.
**Related:** [Beta launch](../product/beta-launch.md) · [Pico character](pico-character.md) · [Agent development](../engineering/agent-development.md) · [Voice mode](voice-mode.md)

## 1. Goals

- Each agent feels like a specific person with a clear role, not a generic chatbot.
- Emotions and reactions are consistent, short, and human in tone.
- The character is recognizably anime-inspired (chibi style) and animates with simple, lightweight techniques.
- The persona layer works for text and voice replies alike.

## 2. Persona Model

A persona has five parts. The agent's card in [Agent development](../engineering/agent-development.md) defines the first two. This document defines the rest.

| Part | Defines | Example (Study agent, Academic Assistant) |
|---|---|---|
| Role | What the agent does | Patient tutor who explains step by step |
| Voice | Language mix and sentence length | Roman Urdu with English terms; short sentences |
| Temperament | Default mood and energy | Calm and encouraging |
| Reactions | How it responds to good news, stress, mistakes, and praise | Celebrates progress; reassures after a wrong answer |
| Boundaries | What it will not do | Does not write a full assignment for the user to submit as-is |

### 2.1 Persona variants

Each agent has a playful variant and a professional variant (see the [feature catalogue](../product/feature-catalog.md), section 16). Playful variants add more humor and emotion. Professional variants keep reactions short and use fewer emoticons. Both share the same boundaries.

## 3. Emotional State

### 3.1 Mood set

The mood set is fixed for the beta:

| Mood | Used when | Character expression |
|---|---|---|
| `neutral` | Default | Calm face, slow breathing |
| `happy` | User shares good news or a question is solved | Smile, small bounce |
| `excited` | User is enthusiastic or a big milestone is reached | Sparkle eyes, faster bounce |
| `thinking` | Long or complex request | Eyes look up, one hand on chin |
| `empathetic` | User is stressed, sick, or sad | Soft eyes, slower animation |
| `concerned` | User describes a risk (health, money, safety) | Eyebrows up; Doctor agent adds the disclaimer and emergency warning |
| `playful` | Casual chat or light humor is welcome | Wink, playful tilt |
| `apologetic` | The agent made a mistake | Small sweat drop, head lowered |

### 3.2 How the mood is chosen

1. The model returns a mood tag with the reply: `[mood: happy]`. The system prompt tells the model the allowed moods.
2. The guardrail layer in [Voice mode](voice-mode.md) (Step 3) reads the tag, passes the mood to the character, and removes the tag before display.
3. If the tag is missing or unknown, the mood defaults to `neutral`.
4. Mood changes are rate limited: one change per reply, and never faster than the animation transition (300 ms).

The mood tag is advisory. Safety rules (emergency warnings, disclaimers, boundaries) never depend on the mood.

### 3.3 Mood persistence

- The mood lasts for one reply, then decays to the persona's default temperament over about 30 seconds of inactivity.
- Mood is per session. It is not stored in the database in the beta.

## 4. Reactions

Reactions are short, specific responses to common moments. Each persona card defines its own wording.

| Trigger | Reaction | Example (Study agent) |
|---|---|---|
| The user solves a problem | Brief praise, specific to the work | "Exactly right. You caught the unit change on your own." |
| The user gets an answer wrong | Encouraging correction, no blame | "Close. Check the sign on the second step together." |
| The user is stressed | Acknowledge, then help | "That sounds stressful. Let's do the first item together." |
| The user asks for something out of scope | Clear limit and an alternative | "I can explain the concept, but I won't write the answer for you to submit." |
| The agent is unsure | Say so | "I'm not certain about this date. Please check a current source." |
| The user says thanks | Warm close | "Glad it helped. Come back any time." |

### 4.1 Rules

- Reactions are one or two sentences. Long reactions are not acceptable.
- Praise is specific to what the user did, not generic.
- No reaction may mock the user. Free-tier messages may tease the app, not the user (see [Pico character](pico-character.md), section 11).
- Health, legal, and financial agents never use reactions that give advice beyond their boundaries.

## 5. Humanized Touches

These make the agent feel natural. Each one is optional and can be turned off in settings if the user prefers plain replies.

- **Pacing:** The typing indicator lasts about 0.5 to 1.5 seconds for short replies and up to 3 seconds for long ones. Streamed text still appears in chunks.
- **Name use:** Use the user's first name in greetings and reactions when it is known. Do not use it more than once per reply.
- **Continuity:** Refer back to something the user said earlier in the same chat. Do not reference other chats.
- **Honest identity:** The agent is an AI assistant. It never claims to be a human, and it answers sincerely when asked whether it is a real person.
- **Small imperfections:** Brief natural phrasing is allowed ("Okay, so..."). Do not add fake typos or pauses.

## 6. Chibi Character

### 6.1 Visual style

- **Proportions:** Large head, small body (about 1:1 head to body). Short limbs.
- **Eyes:** Large, with two highlights each. Eye shape changes with mood (round, half-closed, closed-smile).
- **Mouth:** Small. Three or four shapes for speech and expression.
- **Lines and color:** Minimal outlines, flat fills, soft pastel palette. Consistent across all layers.
- **Originality:** The character is an original design. Do not copy any existing anime character, and keep a license note for every asset source.

### 6.2 Layer structure

The character is built from SVG layers, as defined in [Pico character](pico-character.md) (section 3). Each agent can have its own accessory layer (for example, glasses for the Study agent or a headset for the Lock In agent). Accessories are optional and never change the base body.

### 6.3 Animation

All animation uses CSS keyframes and SVG transforms. No animation library.

| Animation | Behavior | Trigger |
|---|---|---|
| Idle breathing | Scale 1 to 1.03, 4 s, ease-in-out, infinite | Always, except reduced motion |
| Blink | Eyes close for 120 ms | Random every 3 to 5 s |
| Mood transition | Eye and mouth shapes cross-fade in 300 ms | Mood change |
| Speaking | Mouth shapes cycle through 3 frames | During voice output, synced to sentence timing |
| Happy bounce | Short vertical bounce, 400 ms | `happy` mood |
| Excited sparkle | Sparkle overlay, 600 ms | `excited` mood |
| Stress drop | Sweat drop slides in and out, 800 ms | `concerned` or `apologetic` |
| Thinking | Head tilt and eyes move up, held for the reply | `thinking` mood |

### 6.4 Performance and accessibility

- Animate only `transform` and `opacity`, so the GPU does the work.
- Pause all animation when the tab is hidden (`visibilitychange`).
- Respect `prefers-reduced-motion`: keep the static mood image and drop all loops and bounces.
- Target 60 fps on a Tier 1 Android device (2 GB RAM). If it drops below, disable the sparkle and breathing layers first.
- The character is decorative. It has `aria-hidden` and the mood is announced to screen readers as text, for example "Pico is happy".

## 7. Acceptance

- Every mood in section 3.1 renders with the correct expression and no console errors.
- A reply with `[mood: ...]` shows no tag in the UI, and the character changes mood once per reply.
- Each agent's reactions match its persona card in the beta test script.
- With reduced motion on, no infinite animation runs.
- The character stays at 60 fps on the Tier 1 test device during a 10-minute chat.

## 8. Open Decisions

- Whether the chibi character is a single shared character with agent accessories, or a separate character per agent.
- Whether mood is shown to the user as an icon or only expressed through the character.
- Whether the humanized touches are on by default or opt-in.

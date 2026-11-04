# Authentication, Database, and Home Page

**Status:** Planning. Build in the order below, from easiest to hardest.
**Owner:** Pico product team
**Scope:** Accounts, database, home (default) page UI, the guest-to-account flow, animation, and referral attribution.
**Related:** [Voice mode](../modules/voice-mode.md) (voice quota and referral rewards, Step 5) · [Agent development](agent-development.md) (API routing) · [Roadmap](../product/roadmap.md), item 7 (accounts and cloud sync) · [Beta launch](../product/beta-launch.md)

## 1. Current State

- **Guest identity:** `apps/web/src/store/profile-store.ts` shows "Guest" when no name is set. No real user account exists yet.
- **Google login:** `apps/web/src/store/cloud-auth-store.ts` stores Google access and refresh tokens, used only for Google Drive sync. It is not an app login.
- **Backend identity:** `services/api/src/server.js` uses an anonymous `anonId` for agent routes. There are no user accounts, sessions, or subscription checks.
- **Backend storage:** `services/api/src/agentStore.js` uses `node:sqlite` for agent messages. It is a good base for the user database, but it stores agent chat only.
- **Home screen (reference screenshot):** a sidebar with New Chat, Explore, Library, Project, and Studio; the greeting "Hello, Guest" with "How can I assist you today?"; a glowing purple orb; a chat input with Deeper Research, web, zoom, Image, mic, Saved prompts, and Attach file; a bottom-left account card showing "Guest, Free plan" with a logout icon.

## 2. Goals

- Real accounts: guest first, then sign up or log in without losing guest chats.
- One database for users, sessions, subscriptions, and referrals.
- The home page shows the correct state for guest, free, and paid users.
- Animation on the orb and greeting, driven by state, with no heavy libraries.
- Referral links grant rewards on the server, not on the client.
- Keep the stack: React, Vite, Tailwind, Zustand, Express, and Node. Add a database driver only where needed.

## 3. Decisions to Make First

| Decision | Options | Recommendation |
|---|---|---|
| Database | SQLite (`node:sqlite`, already used) or Postgres (Supabase, Neon) | SQLite for the MVP on one server. Move to Postgres before running multiple servers or scaling. See [Database](database.md) |
| Login method | Email and password, Google OAuth, guest only | Google OAuth first (already in the project), email magic link second |
| Session | JWT in a cookie, or a server session ID in an HttpOnly cookie | Server session ID in an HttpOnly, SameSite cookie. Easier to revoke |
| Payments | JazzCash, EasyPaisa, cards (see [Feature catalogue](../product/feature-catalog.md), section 3) | Decide before Phase 4. `isPaid` depends on this |
| Guest data | Keep in the browser, or migrate to the server on sign-up | Migrate on sign-up. Keep a 30-day guest expiry |

## 4. Database Design

Tables (SQLite first; column names are the same for Postgres):

- `users`: `id` (UUID), `email` (unique, nullable for guests), `display_name`, `avatar_url`, `created_at`, `last_active_date`, `days_active` (integer).
- `auth_identities`: `id`, `user_id`, `provider` (`google` | `email`), `provider_subject`. Unique on (`provider`, `provider_subject`).
- `sessions`: `id` (random token hash), `user_id`, `created_at`, `expires_at`, `revoked_at`, `user_agent_hash`.
- `guests`: `anon_id` (the existing `anonId`), `user_id` (nullable), `created_at`. Links guest data to an account after sign-up.
- `subscriptions`: `id`, `user_id`, `plan` (`free` | `weekly` | `pro` | `ultra`), `status` (`active` | `past_due` | `canceled`), `current_period_end`, `provider_ref`.
- `pico_state`: `user_id`, `hunger_level`, `recovery_step`, `last_session_date`, `updated_at`. The server owns this, matching [Pico character](../modules/pico-character.md), section 4.
- `referrals`: `id`, `referrer_user_id`, `referred_user_id` (unique), `code`, `created_at`, `rewarded_at`.
- `referral_codes`: `user_id` (unique), `code` (unique, short, case-insensitive).
- `voice_ledger` (for [Voice mode](../modules/voice-mode.md) Step 5): `id`, `user_id`, `delta_seconds`, `reason`, `created_at`. Append-only. The balance is the sum.

Rules:

- Never store passwords in plain text. For email login, use `scrypt` from Node's `crypto` module (no new dependency), with a per-user salt.
- Store session tokens as hashes, not raw values.
- All queries use parameters. No string concatenation.
- Migrations live in `services/api/src/db/migrations/`, with a version number, applied at startup.

## 5. Backend API

| Method | Path | Purpose | Auth |
|---|---|---|---|
| GET | `/api/me` | Current user, plan, days active, Pico state, referral code | Session cookie or guest |
| POST | `/api/auth/guest` | Create or resume a guest session (`anonId`) | None, rate limited |
| GET | `/api/auth/google/start` | Start Google OAuth | None |
| GET | `/api/auth/google/callback` | Finish OAuth, create session, link guest data | None, state check |
| POST | `/api/auth/email/request` | Send magic link | None, rate limited |
| POST | `/api/auth/email/verify` | Verify link, create session | Token |
| POST | `/api/auth/logout` | Revoke session | Session |
| POST | `/api/referral/apply` | Apply referral code (once per account) | Session |
| POST | `/api/pico/session` | Count a session, advance recovery if paid | Session |
| POST | `/api/billing/webhook` | Provider webhook that updates `subscriptions` | Signed webhook |

Rules:

- `isPaid` and plan come only from `subscriptions`, never from the request body.
- `/api/pico/session` advances `recovery_step` by one per paid session, on the server.
- Rate limit every auth route. The project already has a rate-limit pattern for images in `server.js`.
- Session cookie: `HttpOnly`, `Secure`, `SameSite=Lax`, path `/`.
- Set CORS only for the known origin. Keep `Access-Control-Allow-Credentials` off unless the frontend and backend are on different origins that need cookies. If so, set it explicitly.

## 6. Frontend Structure (Target)

```text
apps/web/src/
  store/
    auth-slice.ts              # existing: API key and endpoint (keep)
    user-slice.ts              # new: user, plan, days active, referral code
  components/Auth/
    AuthModal.tsx              # sign up and log in tabs
    GoogleButton.tsx           # Google sign-in button
    EmailLinkForm.tsx          # email input and "check your inbox" state
    GuestBanner.tsx            # "Save your chats: sign up" banner
  components/Home/
    HomeGreeting.tsx           # "Hello, {name}" and the question line
    HomeOrb.tsx                # animated orb, reads state
    HomeComposer.tsx           # input, tools, mic, attach (reuses chat input)
    HomeSuggestions.tsx        # saved prompts and starter chips
  components/Account/
    AccountCard.tsx            # bottom-left card: avatar, name, plan, logout
    ReferralCard.tsx           # code, copy link, reward summary
  hooks/
    useMe.ts                   # loads /api/me once, caches it in the store
  modules/referral/
    referralCode.ts            # client-side format validation only
```

Notes:

- Reuse the existing sidebar and chat input. Do not copy them.
- `profileDisplayName` in `profile-store.ts` stays as the fallback for guests.
- Do not store the session token in `localStorage`. The cookie is enough.

## 7. Home Page Elements (From Screenshot)

| Element | State | Behavior |
|---|---|---|
| Greeting line | Guest: "Hello, Guest". Signed in: "Hello, {first name}" | Fades in on load |
| Orb | Idle, thinking, happy, or tired (from Pico state) | Slow breathing animation (CSS keyframes). Speeds up while a reply streams |
| Question line | Always "How can I assist you today?" | Localized through `i18n.ts` |
| Model selector | Current model | Unchanged |
| Composer tools | Deeper Research, web, zoom, Image | Shows a locked badge when the plan does not allow it |
| Mic button | Shows only when speech is supported | Connects to [Voice mode](../modules/voice-mode.md) Step 1 |
| Saved prompts | Guest and signed-in | Stored per account on the server later; local for guests now |
| Attach file | Always | Same limits as chat |
| Account card | Avatar, name, plan label, logout icon | Click opens the account menu (Account, Referral, Plan, Log out) |
| Guest banner | Guest only | Dismissible; reappears every 3 days |

## 8. Animation Plan

Use CSS keyframes and Tailwind arbitrary animation classes. No animation library.

- **Orb:** `@keyframes orb-breathe` (scale 1 to 1.04, 6 s, ease-in-out, infinite). The class changes by state:
  - Idle: breathe.
  - Streaming a reply: faster pulse (2.5 s).
  - Tired (from Pico `daysActive` 3 and up): slower, lower opacity.
- **Greeting:** fade and rise on mount (`opacity` and `translateY`, 400 ms).
- **Composer:** focus ring transition only.
- **Account menu:** scale and fade, 150 ms.
- Respect `prefers-reduced-motion`: disable infinite animations with the `motion-reduce:` Tailwind variant.
- Keep the orb a single element, using GPU-friendly properties only (`transform`, `opacity`).

Acceptance: no layout shift on load, and CPU use stays low when the tab is hidden (pause on `visibilitychange`).

## 9. Referral System

Flow:

1. Each account gets a short code (for example, 8 characters with no ambiguous letters).
2. The user shares `https://<domain>/?ref=<code>`.
3. On first visit, the frontend keeps the code in memory and sends it with `/api/auth/guest` or sign-up. It is not stored in `localStorage` as a trusted value.
4. The server checks the code, links `referrals`, and rejects self-referrals and duplicates.
5. Rewards are added to `voice_ledger` on the server (amounts in [Voice mode](../modules/voice-mode.md), Step 5).

Anti-abuse (required before launch):

- One referral reward per referred account, ever. Unique index on `referred_user_id`.
- Reward only after the referred account completes a real action (for example, one completed chat or a verified email), not on sign-up alone.
- Limit referrals per IP address and per device fingerprint (see [Voice mode](../modules/voice-mode.md), Step 5).
- Show the referrer only a count, never the referred users' emails.

Acceptance: a self-referral and a second use of the same account both give zero reward, checked in the database.

## 10. Guest to Account Migration

- On sign-up or login, the server links the current `anon_id` to the new `user_id` in `guests`.
- Local chats stay in the browser until the user confirms "Save my chats". The frontend then uploads them in one request, with a size limit.
- If the browser holds chats from another account, ask before merging. Never merge silently.
- Guest data expires after 30 days of inactivity. Delete it on the server and tell the user before expiry.

## 11. Security

- HttpOnly cookies for sessions. Logout revokes the server session.
- `isPaid`, plan, voice balance, and referral rewards are checked on the server only.
- Google OAuth: validate `state` and `nonce`, and verify the ID token signature and `aud`.
- Magic links: single use, expire in 15 minutes, stored as hashes.
- Rate limit `/api/auth/*`, `/api/referral/apply`, and `/api/pico/session`.
- Never render user names or emails with `dangerouslySetInnerHTML`. Use React text nodes.
- Account deletion route (required for Google Play): deletes the user, sessions, and linked data.
- The privacy policy must list every stored field (email, name, plan, referral, usage counts). Keep it in sync with the [feature catalogue](../product/feature-catalog.md), section 10.4 (Store Disclosure).

## 12. Phases and Milestones

1. **Phase 1: Guest session and `/api/me`.** Server guest session, `users` and `sessions` tables, `useMe` hook. Milestone: the home page shows "Hello, Guest" and "Free plan" from the server.
2. **Phase 2: Home UI and animation.** Greeting, orb states, composer layout, account card, reduced-motion support. Milestone: the home page matches the screenshot on desktop and mobile with no console errors.
3. **Phase 3: Google login and guest migration.** OAuth flow, `auth_identities`, chat upload on sign-up. Milestone: a guest chat is visible after login.
4. **Phase 4: Subscriptions and `isPaid`.** `subscriptions` table, webhook, plan label, and locked tools. Milestone: a paid plan changes the UI only after the webhook writes the row.
5. **Phase 5: Referral system.** Codes, apply route, rewards ledger, anti-abuse checks. Milestone: the abuse cases in section 9 are rejected in tests.
6. **Phase 6: Pico state on server.** `pico_state`, `/api/pico/session`, and the orb reads state from `/api/me`. Milestone: recovery advances once per paid session (see [Pico character](../modules/pico-character.md), section 4.5).
7. **Phase 7: Email login and account deletion.** Magic link, account deletion route. Milestone: the store review checklist passes.

## 13. Testing

- Backend: unit tests for session hashing, the scrypt password check, referral rules, and rate limits. Follow the existing `services/api/test/` pattern.
- Backend: integration tests for `/api/me` (guest, signed in, paid), and for the webhook signature check.
- Frontend: component tests for the orb states and greeting text. Check reduced-motion output.
- Manual: Chrome and Edge on desktop, Android Chrome, and one iPhone (Safari). Check that the cookie is set and cleared.

## 14. Risks

- **Google OAuth in Electron and the Android WebView:** the redirect flow differs per platform. Plan it with Phase 4 of [Pico character](../modules/pico-character.md) (platforms), not now.
- **Payment provider approval:** JazzCash and EasyPaisa onboarding can take weeks. Phase 4 can start with a manual plan flag set in the database by an admin script, then switch to the webhook.
- **SQLite on a single host:** back up the database file. Move to Postgres when there is more than one server.
- **Referral fraud:** the reward system attracts abusers. Ship with limits from day one.

## 15. Open Decisions

- Which payment provider launches first.
- Whether email login is needed at launch, or Google only.
- Whether guest chats expire after 30 days or are kept until the browser clears them.
- Whether saved prompts are per account only, or also local for guests.

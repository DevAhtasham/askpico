# Database Inventory and Supabase Migration Plan

**Status:** Living document
**Owner:** Pico engineering
**Purpose:** Record where Pico stores data today, what shape it has, and how it migrates to Supabase (Postgres). Every new feature or page that saves data must be added here (see [Rules for new features](#rules-for-new-features)).
**Related:** [Authentication](authentication.md) · [Agent development](agent-development.md)

## 1. Current Storage Summary

Pico has no server database yet. The backend (`services/api/src/server.js`) is stateless apart from its in-memory rate limiter and form log. It proxies LLM, image, and Tailwind requests. All user data lives in the browser or in the user's Google Drive.

| # | Storage | Technology | Owner | Contents | Supabase target |
|---|---|---|---|---|---|
| 1 | Main app state | `localStorage` key `free-chat-gpt` (zustand persist, version 9) | Browser | Chats, folders, settings, prompts, artifacts, studio items, token usage | `users`, `chats`, `messages`, `folders`, `settings`, `prompts`, `artifacts`, `studio_items` |
| 2 | Generated images | IndexedDB `pico-images`, store `images` (key = image ID, value = Blob) | Browser | Image Studio output | Supabase Storage bucket `images` and `studio_items.image_path` |
| 3 | Artifact state | `localStorage` key `artifactState` | Browser | Per-chat artifact sub-state (`Record<key, string>`), pruned after 7 days inactive | `artifact_state` table |
| 4 | Profile | `localStorage` key `pico-profile` (zustand persist) | Browser | `name`, `email` | `profiles` table (linked to `auth.users`) |
| 5 | Cloud sync settings | `localStorage` key `cloud` (zustand persist, version 1) | Browser | `cloudSync`, `fileId` | `user_settings` table |
| 6 | Google Drive sync file | Google Drive JSON file (`drive.file` scope, user's own file) | Google | Full app state exported as JSON | Replaced by the database. Keep only for import and export, if at all |
| 7 | Google tokens | Zustand `cloud` store: `googleAccessToken`, `googleRefreshToken` (not persisted; memory only) | Browser memory | OAuth tokens | Supabase Auth session |
| 8 | Backend | No database | Server | In-memory rate limit (`imageRequestLog` map), form submission log | Rate limits in a Supabase table or Redis; form data in a `submissions` table |

## 2. Current Data Shapes

### 2.1 Main App State (`apps/web/src/store/store.ts`, `createPartializedState`)

Persist key `free-chat-gpt`, version `9`. Fields saved to `localStorage`:

- `chats`: `ChatInterface[]` (`apps/web/src/types/chat.ts`)
  - `id`, `title`, `folder?`, `messages: MessageInterface[]`, `config: ConfigInterface`, `titleSet`, `createdAt?`, `updatedAt?`. The old `agentId` field is no longer used.
  - `MessageInterface`: `role` (`user` | `assistant` | `system`), `content`, `image?` (`ImageMessageInterface`: `provider`, `prompt`, `aspectRatio`, `status`, `imageId?`, `mimeType?`, `error?`).
  - `ConfigInterface`: `model`, `max_tokens`, `temperature`, `presence_penalty`, `top_p`, `frequency_penalty`.
- `currentChatIndex`: number (an index, not a UUID).
- `apiKey`, `apiEndpoint`: settings. The API key is sensitive and must be encrypted or kept server-side in Supabase.
- `theme`, `autoTitle`, `advancedMode`, `enterToSubmit`, `inlineLatex`, `markdownMode`, `countTotalTokens`, `hideMenuOptions`, `firstVisit`, `hideSideMenu`.
- `prompts`: saved prompts (`Prompt[]`, `apps/web/src/types/prompt.ts`).
- `defaultChatConfig`: `ConfigInterface`.
- `defaultSystemMessage`: string.
- `folders`: `FolderCollection` (`{ [id]: { id, name, expanded, order, color? } }`).
- `totalTokenUsed`: `{ [model]: { promptTokens, completionTokens } }`.
- `artifacts`: `ArtifactInterface[]` (`apps/web/src/types/artifact.ts`): `id`, `chatId`, `messageIndex`, `title`, `type` (`code` | `preview`), `language`, `filePath?`, `content`, `createdAt`.
- `activeArtifactId`, `activeArtifactTab` (`preview` | `code`).
- `studioItems`: `StudioItemInterface[]` (`apps/web/src/store/image-slice.ts`): `id`, `prompt`, `provider`, `aspectRatio`, `status`, `imageId?`, `mimeType?`, `error?`.

Not persisted (memory only): `generating`, `error`, `imageMode`, `projectMode`, `imageProvider`, `imageAspectRatio`, toast state, `googleAccessToken`, `googleRefreshToken`, `syncStatus`.

### 2.2 Images (`apps/web/src/utils/imageStore.ts`)

- Database `pico-images` (version 1), object store `images`. Key = `imageId` string, value = `Blob`.
- Fallback: if IndexedDB is unavailable, an in-memory `Map` (current session only).

### 2.3 Artifact State (`apps/web/src/utils/artifactState.ts`)

- `localStorage` key `artifactState`.
- Shape: `{ [chatId]: { updatedAt: number, data: { [key]: string } } }`.
- Limits: pruned after 7 days of inactivity (`INACTIVE_TTL_MS`); maximum 200,000 characters per chat (`MAX_CHARS_PER_CHAT`).

### 2.4 Profile (`apps/web/src/store/profile-store.ts`)

- `localStorage` key `pico-profile`.
- Shape: `{ name: string, email: string }`.

### 2.5 Cloud Sync (`apps/web/src/store/cloud-auth-store.ts`)

- `localStorage` key `cloud`, version 1.
- Persisted: `cloudSync: boolean`, `fileId?: string`.

### 2.6 Google Drive Sync (`apps/web/src/components/GoogleSync/*`, `apps/web/src/store/storage/GoogleCloudStorage`)

- Scope: `https://www.googleapis.com/auth/drive.file`.
- When sync is on, the zustand storage switches to `createGoogleCloudStorage()`, and the full app state (the same shape as `free-chat-gpt`) is saved as one Drive JSON file.
- File functions: `createDriveFile`, `updateDriveFileName`, `deleteDriveFile`, `getFiles` (`apps/web/src/api/google-api.ts`).

### 2.7 Backend (`services/api/src/`)

- No database library. `package.json` has no SQL or ORM package.
- In memory only: `imageRequestLog` (`server.js`), a per-IP image rate limit of 10 requests. This does not work across multiple instances, as the code comment notes.
- Form submissions (`submitArtifactForm`): suspicious-pattern check, then logged. Not saved to a database.

### 2.8 Agent Chat History (`services/api/src/agentStore.js`)

- SQLite through `node:sqlite`, file `services/api/data/agents.db` (git-ignored).
- Table `agent_messages`: `id` (autoincrement), `anon_id`, `agent_id`, `role`, `content`, `created_at`.
- Read only by backend specialists for routing context. The frontend never receives this data.

## 3. Supabase Target Schema (Draft)

This is a draft. Each new feature adds or updates tables in this section.

```sql
-- Auth: Supabase Auth (auth.users). Google OAuth runs through Supabase.

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text,
  auto_title boolean default true,
  advanced_mode boolean default false,
  enter_to_submit boolean default true,
  inline_latex boolean default false,
  markdown_mode boolean default true,
  count_total_tokens boolean default false,
  hide_menu_options boolean default false,
  hide_side_menu boolean default false,
  first_visit boolean default true,
  default_chat_config jsonb,
  default_system_message text,
  api_endpoint text,
  updated_at timestamptz default now()
);
-- api_key: keep in the browser, or encrypt server-side with Supabase Vault. Never store it as a plain column.

create table folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  expanded boolean default true,
  "order" int default 0,
  color text,
  created_at timestamptz default now()
);

create table chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  folder_id uuid references folders(id) on delete set null,
  title text not null default '',
  title_set boolean default false,
  config jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references chats(id) on delete cascade,
  position int not null,
  role text not null check (role in ('user','assistant','system')),
  content text not null default '',
  image jsonb,
  created_at timestamptz default now(),
  unique (chat_id, position)
);

create table prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null,
  created_at timestamptz default now()
);

create table token_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  model text not null,
  prompt_tokens bigint default 0,
  completion_tokens bigint default 0,
  primary key (user_id, model)
);

create table artifacts (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  chat_id uuid not null references chats(id) on delete cascade,
  message_index int not null,
  title text,
  type text not null check (type in ('code','preview')),
  language text,
  file_path text,
  content text not null,
  created_at timestamptz default now()
);

create table artifact_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  chat_id uuid not null references chats(id) on delete cascade,
  key text not null,
  value text,
  updated_at timestamptz default now(),
  primary key (user_id, chat_id, key)
);

create table studio_items (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  prompt text not null,
  provider text,
  aspect_ratio text,
  status text not null check (status in ('loading','done','error')),
  image_path text,
  mime_type text,
  error text,
  created_at timestamptz default now()
);

-- Storage bucket: images (private). image_path = '<user_id>/<id>.<ext>'
-- RLS: enable on every table. Policy: auth.uid() = user_id

create table rate_limits (
  key text primary key,
  window_start timestamptz not null,
  count int not null default 0
);
```

## 4. Migration Plan (Local to Supabase)

1. **Export:** from the browser console or an export button, save the `free-chat-gpt`, `pico-profile`, `cloud`, and `artifactState` JSON. Also export the `pico-images` IndexedDB blobs.
2. **Transform:** use the `migrate` functions (`apps/web/src/store/migrate.ts`) and their version rules to convert camelCase to snake_case, split nested arrays into rows, and keep `messages` ordered by `position`. Convert client IDs (UUID or `Date.now` strings) to UUIDs. Keep IDs that are already UUIDs.
3. **Load:** use the Supabase service role in a one-time script only (never in the client), inserting in this order: `profiles`, `folders`, `chats`, `messages`, `prompts`, `artifacts`, `studio_items`, then images (Storage upload). Foreign keys require this order.
4. **Verify:** match each user's chat count, message count, and image count before and after migration.
5. **Switch:** replace the zustand persist storage with a Supabase adapter. Run dual writes (localStorage and Supabase) first, then stop reading from localStorage.
6. **Google Drive:** turn Drive sync into an optional export or backup feature after Supabase is live, or remove it.

## 5. Rules for New Features

Any new feature or page that stores data must add an entry to this document:

- The data (fields and types).
- Where it is stored (localStorage key, IndexedDB store, Drive, or backend).
- The Supabase table name and columns (in the draft schema).
- The RLS policy and storage bucket, if files are involved.
- The migration step (export key and transform rule).
- A persist version bump and a `migrate.ts` step if the shape changes.

### 5.1 Pending Entries (Planned Features)

These features are planned, and their data is not yet saved. Add each one to the schema when it is built.

- **Agent chat history:** backend SQLite (`agent_messages`, section 2.8). Migrates to `agent_messages` with `user_id` after sign-in is built.
- **Anonymous browser ID:** `localStorage` key `pico-anon-id` (UUID). Sent with each agent request as `anonId`, so history stays separate per browser. Replaced by `user_id` after sign-in.
- **Agent picker state (`selectedAgentId`):** no longer persisted. Old data was removed.
- **Document Maker (Office agent):** table `documents` (`id`, `user_id`, `title`, `body`, `format`, `created_at`).
- **Video compress and video trim (Studio agent):** temporary files only. Only metadata goes to `studio_items`.
- **Micro-Khata (Business agent):** table `khata_entries` (`id`, `user_id`, `type` (`expense` | `udhar`), `amount`, `currency`, `person`, `note`, `created_at`). Planned in IndexedDB first; create the table during the Supabase migration.
- **Freelance rate and tax calculator:** calculation only. No data is saved.
- **Pomodoro, scratchpad, and reminders (Lock In agent):** `scratchpad_items` (`id`, `user_id`, `title`, `body`, `tags text[]`, `created_at`); `reminders` (`id`, `user_id`, `text`, `remind_at`, `done`). Pomodoro sessions: `focus_sessions` (`user_id`, `started_at`, `minutes`).
- **Voice quota (Feature 30):** `voice_usage` (`user_id`, `day`, `seconds_used`); `referrals` (`referrer_id`, `referred_id`, `created_at`). See [Authentication](authentication.md) for the full referral tables.
- **Document and PDF chat (Study agent):** `documents` and `document_chunks` (`id`, `document_id`, `position`, `text`, `embedding vector` if pgvector is used).
- **Image Studio background remover and PDF tools:** client-side only. Output is downloaded, not stored.

## 6. Open Questions

- Where the API key is stored: Supabase Vault, or the browser's `localStorage` only. Decision pending.
- Whether Google Drive sync stays after Supabase or is removed.
- Image size limits and retention (Storage cost).
- Guest users (no login): Supabase anonymous auth, or local-only storage.

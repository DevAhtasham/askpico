# Pico Vault

**Status:** Planning. Web first, then mobile and desktop.
**Owner:** Pico product team
**Parent:** [Pico character and agent router](pico-character.md)
**Scope:** A client-side vault that keeps raw personal data out of AI prompts.

## 1. Goals

- Store personal values (CNIC, phone, email, and other values) encrypted on the device.
- Replace raw values with readable tokens before any text reaches `/api/chat`.
- Restore raw values only for display in the chat bubble, on the client.
- Use WebCrypto and the browser IndexedDB API. Add no heavy dependencies.

## 2. Path Mapping

| Spec path | Actual path |
|---|---|
| `/src/modules/vault` | `apps/web/src/modules/vault/` |

Notes:

- The `VaultAgent` in `apps/web/src/modules/agents/` (see [Pico character](pico-character.md)) calls this module. Keep the agent a thin caller, and keep all vault logic here.
- Use the existing path aliases (`@utils`, `@type`, `@store`, `@api`). Verify them in `apps/web/vite.config` and `apps/web/tsconfig.json` first.

## 3. Target File Tree

```text
apps/web/src/modules/vault/
  types.ts
  vaultEngine.ts           # store, encrypt, tokenize, detokenize
  patterns.ts              # CNIC, phone, and email regex
  vaultStore.ts            # IndexedDB access
  index.ts
```

## 4. Purpose

Keep raw personal data (CNIC, phone, email) out of prompts sent to the AI server. The model sees only tokens such as `{{vault:cnic_1}}`.

## 5. Storage

- IndexedDB store `pico-vault`. Entries have the shape `{ token, label, ciphertext, iv, createdAt }`.
- Encryption uses WebCrypto AES-GCM. The key is derived from a user passphrase with PBKDF2 (a high iteration count and a random salt stored with the vault).
- Do not store the raw key in `localStorage`. If the user chooses "remember on this device", store a non-extractable `CryptoKey` in IndexedDB.

**Honest limit:** client-side encryption protects data at rest against someone who copies the browser profile. It does not protect against XSS or malicious browser extensions, because the page can read decrypted values while the vault is unlocked. Do not describe this as "zero-knowledge" in UI copy. Use "encrypted on this device".

## 6. API

```ts
export function addEntry(label: string, value: string, kind: 'cnic' | 'phone' | 'email' | 'other'): Promise<string>; // returns token
export function sanitizePromptForAI(text: string): Promise<string>;     // raw values to tokens
export function detokenizeForDisplay(text: string): Promise<string>;    // tokens to raw values, UI only
```

Token format: `{{vault:<kind>_<n>}}`, or `{{vault:<label>}}` for user-named entries. Examples: `{{vault:cnic_1}}`, `{{vault:phone_ali}}`.

## 7. Detection Patterns (Pakistan First)

- **CNIC:** `\b\d{5}-\d{7}-\d\b`, and 13 digits without dashes (validate the length before replacing).
- **Phone:** `\+92\d{10}` and `03\d{2}-?\d{7}`.
- **Email:** standard pattern, followed by a second check to avoid matching tokens.

## 8. Send Flow (Corrected)

1. The user types a message containing raw values.
2. `sanitizePromptForAI` replaces matches with tokens.
3. Only the tokenized text is sent to `/api/chat`.
4. The AI response may contain tokens.
5. `detokenizeForDisplay` restores raw values for display in the chat bubble only.

Raw values must never be included in the outbound request. The earlier spec's `swapTokensBeforeSend` (replace tokens with raw data before sending) is not used, because it would send raw data to the server and defeat the module.

## 9. Acceptance

- A prompt containing a CNIC or phone number is sent with tokens only (check the Network tab payload).
- The response shows the raw value in the bubble, and the stored entry is encrypted (check IndexedDB).
- Locking the vault makes `detokenizeForDisplay` return tokens unchanged.

## 10. Dependencies and Platforms

- No new dependencies. Use WebCrypto and IndexedDB directly, or add `idb` (small and optional) if the helper grows large.
- **Mobile (Android, Kotlin WebView):** same module and IndexedDB storage, running inside the WebView.
- **Desktop (Electron):** use Electron `safeStorage` to protect the vault key. Do not store the key in a plain file.

## 11. Security

- Vault data never leaves the device. Only tokenized text goes to `/api/chat`.
- Sanitize any text rendered from the AI or the vault. Use React text nodes, not `dangerouslySetInnerHTML`.
- Test that the request payload contains no raw CNIC, phone, or email values.

## 12. Phases and Milestones

1. **Vault engine.** Encryption, IndexedDB store, `addEntry`. Milestone: entries are stored encrypted.
2. **Tokenize and detokenize.** `sanitizePromptForAI`, `detokenizeForDisplay`, and patterns. Milestone: section 9 acceptance passes.
3. **Chat integration.** Wire into the send flow and the `VaultAgent`. Milestone: outbound payload contains tokens only.
4. **Desktop key protection.** Electron `safeStorage`. Milestone: the vault key is not stored in plain text.

## 13. Specification Corrections

- **Send flow.** `swapTokensBeforeSend`, as first described, would send raw data to the server. It is replaced by `detokenizeForDisplay` (section 8).
- **"Zero-knowledge".** This is not accurate for a client-only vault. The accurate description is "encrypted on this device" (section 5).

## 14. Open Decisions

- Whether the vault is passphrase-based or device-key-based.
- Whether "remember on this device" is offered on the web or only in the desktop app.
- Whether the vault ships in the beta. See [Beta launch](../product/beta-launch.md), section 2.

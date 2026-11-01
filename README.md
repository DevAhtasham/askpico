# FahmChat

> A fast, polished AI chat platform for Urdu, Hindi, and Roman Urdu speakers — with a live, interactive code-preview workspace built in.

FahmChat is a ChatGPT-style assistant web application with a built-in artifact system: generated React apps, landing pages, and documents are compiled and previewed directly in the browser — fully interactive, no server-side builds required.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Repository Layout](#repository-layout)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Security Model](#security-model)
- [Tech Stack](#tech-stack)
- [Roadmap](#roadmap)
- [License](#license)
- [Acknowledgements](#acknowledgements)

---

## Overview

FahmChat pairs a modern chat interface with an in-browser development preview:

- Users chat with the assistant in their preferred language (Urdu, Hindi, Roman Urdu, English, and more).
- When the assistant outputs code — a todo app, a landing page, a multi-section site — it appears as an **artifact** in a side-by-side panel with **Preview** and **Code** tabs.
- The preview is a real, running application: buttons, forms, state, section navigation, and page switching all work inside the sandboxed preview.
- Artifacts can be browsed as a file tree and exported as a ZIP or desktop-app scaffold.

The preview is powered by **esbuild-wasm** — every project is bundled on-device in the user's browser. There are no build servers, no per-user compute cost, and nothing for the end user to install.

## Key Features

### Chat

- Multi-model chat via the backend proxy (primary model + automatic fallback chain)
- Streaming responses with stop-generation support
- Markdown rendering, syntax highlighting, and KaTeX math
- Chat folders, history search, and a prompt library
- Per-chat configuration: model, system message, temperature, token limits
- Token usage and cost tracking
- Chat export (Markdown, JSON, image) and ShareGPT publishing
- Multi-language UI (i18next)

### Artifacts & Interactive Preview

- Automatic artifact detection from fenced code blocks, streamed live during generation
- In-browser React bundling via `esbuild-wasm` with a virtual file system
- Sandboxed `iframe` preview (`sandbox="allow-scripts"`) — generated code can never reach app storage or parent origin
- Intercepted navigation: in-page `#anchor` scrolling works; external links open in a new tab via `postMessage` bridge; form submissions are safely contained
- In-memory `localStorage`/`sessionStorage` shim so generated apps using storage don't crash in the sandbox
- Automatic scaffolding: missing entry files, stylesheets, `index.html`, and `package.json` are generated for multi-file projects
- File-tree browsing, per-file code viewer, ZIP export, and desktop-app scaffold export
- Runtime error surface inside the preview with step-by-step diagnostics

### Backend

- Lightweight Express proxy — keeps the `GEMINI_API_KEY` server-side, never exposed to the client
- Automatic model fallback chain on upstream failure
- Streaming (SSE) passthrough with request-scoped logging
- Server-side system prompt with artifact-authoring instructions

## Repository Layout

```text
chatpt/
├── web/            # Web app — React + Vite + TypeScript (active)
├── backend/        # Express API proxy — Gemini upstream (active)
├── app/            # Mobile app — Capacitor, Android/iOS (planned)
├── desktop/        # Desktop app — Electron (planned)
├── .github/        # CI/CD workflows
├── feature.md      # Feature plan across platforms
└── plan.md         # Implementation planning notes
```

| Directory   | Status      | Purpose                                   |
|-------------|-------------|-------------------------------------------|
| `web/`      | Active      | Browser chat application                  |
| `backend/`  | Active      | API key proxy, model routing, streaming   |
| `app/`      | Planned     | Capacitor wrapper for Android & iOS       |
| `desktop/`  | Planned     | Electron wrapper for Windows/macOS/Linux  |

## Architecture

```text
┌─────────────┐   SSE/POST /api/chat   ┌──────────────┐   ┌──────────────────┐
│  web/       │ ────────────────────▶  │  backend/    │──▶│  Gemini API      │
│  React+Vite │ ◀────────────────────  │  Express     │◀──│  (model chain)   │
└─────────────┘                        └──────────────┘   └──────────────────┘
       │
       │  artifact code blocks
       ▼
┌─────────────────────────────┐
│ esbuild-wasm bundler        │  virtual FS → bundle → HTML doc
│ sandboxed iframe preview    │  sandbox="allow-scripts"
└─────────────────────────────┘
```

## Getting Started

### Prerequisites

- **Node.js** 18+
- **Yarn** (`npm install -g yarn`)
- A **Google Gemini API key**

### 1. Backend

```bash
cd backend
cp .env.example .env   # add your GEMINI_API_KEY
npm install
npm run dev            # http://localhost:3001
```

### 2. Web app

```bash
cd web
yarn install
cp .env.example .env   # point to your backend endpoint
yarn dev               # http://localhost:5173
```

### Production build

```bash
cd web
yarn build
yarn preview
```

Docker is also supported — see [`web/Dockerfile`](web/Dockerfile) and [`web/docker-compose.yml`](web/docker-compose.yml).

## Environment Variables

### Backend (`backend/.env`)

| Variable                 | Required | Description                                  |
|--------------------------|----------|----------------------------------------------|
| `GEMINI_API_KEY`         | Yes      | Google Gemini API key                        |
| `GEMINI_MODEL`           | No       | Primary model override                       |
| `GEMINI_FALLBACK_MODELS` | No       | Comma-separated fallback chain               |
| `GEMINI_BASE_URL`        | No       | Custom upstream base URL                     |
| `SYSTEM_PROMPT`          | No       | Override the default system prompt           |
| `PORT`                   | No       | Server port (default `3001`)                 |
| `CORS_ORIGIN`            | No       | Allowed origin for the web app               |

### Web (`web/.env`)

See [`web/.env.example`](web/.env.example) for the endpoint configuration.

## Security Model

- **API keys stay on the server.** The browser never sees `GEMINI_API_KEY`; all model calls go through `backend/`.
- **Preview sandboxing.** Generated code runs in an iframe with only `allow-scripts`. `allow-same-origin`, `allow-top-navigation`, `allow-forms`, and `allow-popups` are intentionally absent — artifact code is fully isolated from app storage and the parent document.
- **No real navigation.** Link clicks and form submits inside the preview are intercepted and routed through a `postMessage` bridge.
- **Never commit `.env`.** Secrets live in environment files excluded from version control.

## Tech Stack

| Layer        | Technology                                        |
|--------------|---------------------------------------------------|
| Frontend     | React 18, TypeScript, Vite                        |
| Styling      | Tailwind CSS                                      |
| State        | Zustand (persisted)                               |
| Preview      | esbuild-wasm, sandboxed iframe, esm.sh CDN        |
| Backend      | Node.js, Express                                  |
| i18n         | i18next                                           |
| Desktop      | Electron (planned)                                |
| Mobile       | Capacitor — Android & iOS (planned)               |

## Roadmap

- [ ] Electron desktop app (`desktop/`) with low-spec PC support
- [ ] Capacitor mobile app (`app/`) for Android and iOS
- [ ] Voice input and richer attachment handling
- [ ] Artifact page-swap navigation for true multi-page generated sites
- [ ] Additional LLM providers behind the same proxy interface

Platform-level detail lives in [`feature.md`](feature.md); implementation notes in [`plan.md`](plan.md).

## License

The base of this project is released under **CC0 1.0 Universal**. See [`web/LICENSE`](web/LICENSE).

## Acknowledgements

FahmChat is built on top of [BetterChatGPT](https://github.com/ztjhz/BetterChatGPT). Credit to the original project and its contributors.

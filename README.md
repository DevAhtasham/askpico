# 💬 FahmChat

> Urdu, Hindi aur Roman Urdu ke liye ek sundar, tez aur bharosemand AI chat platform.

FahmChat ek ChatGPT-style chat interface hai jo Pakistan aur India ke users ko dhyan mein rakh kar banaya ja raha hai. Is repository mein web app, desktop app aur mobile app ke liye alag jagah rakhi gayi hai.

---

## 📂 Project Structure

```text
chatpt/
├── web/        # Web application (React + Vite + TypeScript)
├── app/        # Mobile app (future)
├── desktop/    # Desktop app (future)
├── .git/       # Git repository
└── .github/    # GitHub workflows aur settings
```

| Folder     | Status        | Maqsad                              |
|------------|---------------|-------------------------------------|
| `web/`     | ✅ Active     | Browser par chalne wali chat app    |
| `app/`     | ⏳ Khali      | Mobile app (baad mein)              |
| `desktop/` | ⏳ Khali      | Desktop app (baad mein)             |

---

## 🚀 Web App Shuru Karein

### Zaroori cheezein

- **Node.js** (version 18 ya zyada)
- **Yarn** (`npm install -g yarn`)

### Setup

```bash
cd web
yarn install
cp .env.example .env
yarn dev
```

Browser mein `http://localhost:5173` kholein.

### Production build

```bash
cd web
yarn build
yarn preview
```

---

## ✨ Features

- 🧠 Multiple AI providers ke saath chat
- 📝 Markdown, code highlighting aur math (KaTeX) support
- 🗂️ Chat folders aur prompt library
- 🌐 Multi-language interface (i18next)
- 📤 Chat export (Markdown, JSON, PDF, image)
- 🧮 Token count aur cost tracking
- 🔐 Google login support

---

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite 4
- **Styling:** Tailwind CSS
- **State:** Zustand
- **Desktop (baad mein):** Electron

---

## 🔒 Privacy aur Security

- API keys aur chats ka data `.env` aur browser local storage mein rehta hai.
- `.env` file ko kabhi bhi Git par commit na karein.

---

## 📜 License

Is project ka base code **CC0 1.0 Universal** ke tehat hai. Details ke liye [`web/LICENSE`](web/LICENSE) dekhein.

---

## 🙏 Shukriya

Yeh project [BetterChatGPT](https://github.com/ztjhz/BetterChatGPT) par mabni hai. Asal project ka sharukriya.

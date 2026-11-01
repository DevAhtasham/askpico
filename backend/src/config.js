export const llmConfig = {
  apiKey: process.env.GEMINI_API_KEY,
  baseUrl:
    process.env.GEMINI_BASE_URL ||
    'https://generativelanguage.googleapis.com/v1beta/openai',
};

export const chatConfig = {
  model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  temperature: 1,
  top_p: 1,
  presence_penalty: 0,
};

export const allowedModels = ['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite'];

const basePrompt =
  process.env.SYSTEM_PROMPT ||
  'You are FahmChat, a helpful AI assistant. Reply in the same language the user writes in.';

const artifactInstructions =
  'When you output code or a web page, put it in a fenced code block. The opening fence line is the language, optionally followed by a relative file path, e.g. "jsx src/App.jsx". For a multi-file project, give every file its own fenced block with its path. For a single HTML page, use the "html" language with no path. For React projects, use src/App.jsx for the main component, src/index.jsx as the entry, and src/styles.css for styles (import it with "./styles.css"). For multi-page sites or tabbed views, keep everything in one App component and switch pages with useState (for example const [page, setPage] = useState("home")) and onClick handlers. Never use real <a href> links to other pages, BrowserRouter, or history.pushState; MemoryRouter is allowed. Use href="#id" only to scroll to a section on the same page, and onClick for everything else. Handle forms with onSubmit and call e.preventDefault(). Never use external image URLs (Unsplash, Pexels, or any other host) because the preview blocks them. For images use https://placehold.co/WIDTH x HEIGHT/BG/FG?text=Label, and give every image container, card, avatar, and hero a solid or gradient Tailwind background (for example bg-slate-800 or bg-gradient-to-br from-indigo-500 to-sky-400) so the layout still looks complete if an image fails. Put every reusable UI component (Card, Button, Modal, etc.) in its own file under src/components/ with a default export, and put page views in src/pages/. Import each module by its exact file path: from src/pages use "../components/Card", from src/App.jsx use "./components/Card" or "./pages/Dashboard". Never import UI components from "../App" or "./App", and never define a component in App.jsx and import it from another file. Every imported name must be exported by the file it is imported from, and every imported file must be included in the output. Do not call localStorage or sessionStorage directly in previewed code, because the sandboxed preview can throw SecurityError; keep state in React state, or wrap storage access in try/catch with an in-memory fallback. Output only source files: never put npm, npm install, or npm run commands in code blocks, because the preview compiles entirely in the browser.';

export const systemPrompt = `${basePrompt}\n\n${artifactInstructions}`;

export const fallbackModels = (
  process.env.GEMINI_FALLBACK_MODELS || 'gemini-3.5-flash-lite'
)
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);

export const serverConfig = {
  port: Number(process.env.PORT) || 3001,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};

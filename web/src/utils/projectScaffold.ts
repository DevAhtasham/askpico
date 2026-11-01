const SOURCE_FILE = /\.(jsx|tsx|js|ts)$/;
const APP_CANDIDATES = ['src/App.jsx', 'src/App.tsx', 'src/App.js', 'src/App.ts'];
const ENTRY_PATHS = ['src/index.jsx', 'src/index.tsx', 'src/index.js', 'src/index.ts', 'src/main.jsx', 'src/main.tsx'];
const STYLESHEET = 'src/styles.css';
const LEGACY_STYLESHEET = 'src/index.css';
const STYLESHEET_CONTENT = ['*, *::before, *::after {', '  box-sizing: border-box;', '}', '', 'body {', '  margin: 0;', '  font-family: system-ui, sans-serif;', '}'].join('\n');

const normalize = (path: string) =>
  path
    .split('/')
    .filter((part) => part !== '' && part !== '.')
    .join('/');

const INDEX_HTML = [
  '<!DOCTYPE html>',
  '<html lang="en">',
  '  <head>',
  '    <meta charset="UTF-8" />',
  '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
  '    <title>React App</title>',
  '  </head>',
  '  <body>',
  '    <div id="root"></div>',
  '    <script type="module" src="/src/index.jsx"></script>',
  '  </body>',
  '</html>',
].join('\n');

const PACKAGE_JSON =
  JSON.stringify(
    {
      name: 'ai-generated-app',
      private: true,
      version: '1.0.0',
      type: 'module',
      scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        'lucide-react': '^0.263.1',
      },
      devDependencies: {
        '@vitejs/plugin-react': '^4.2.1',
        autoprefixer: '^10.4.18',
        postcss: '^8.4.35',
        tailwindcss: '^3.4.1',
        vite: '^5.1.4',
      },
    },
    null,
    2
  ) + '\n';

const VITE_CONFIG = [
  "import { defineConfig } from 'vite';",
  "import react from '@vitejs/plugin-react';",
  '',
  'export default defineConfig({',
  '  plugins: [react()],',
  '});',
  '',
].join('\n');

const TAILWIND_CONFIG = [
  "/** @type {import('tailwindcss').Config} */",
  'export default {',
  "  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],",
  '  theme: {',
  '    extend: {},',
  '  },',
  '  plugins: [],',
  '};',
  '',
].join('\n');

const POSTCSS_CONFIG = [
  'export default {',
  '  plugins: {',
  '    tailwindcss: {},',
  '    autoprefixer: {},',
  '  },',
  '};',
  '',
].join('\n');

const TAILWIND_DIRECTIVES = '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n';

export interface ProjectFile {
  path: string;
  content: string;
}

export const normalizeProjectFiles = (files: ProjectFile[]): ProjectFile[] => {
  const hasStylesheet = files.some((file) => normalize(file.path) === STYLESHEET);
  const renameLegacy =
    !hasStylesheet && files.some((file) => normalize(file.path) === LEGACY_STYLESHEET);
  return files.map((file) => ({
    path: renameLegacy && normalize(file.path) === LEGACY_STYLESHEET ? STYLESHEET : file.path,
    content: renameLegacy ? file.content.replace(/\.\/index\.css/g, './styles.css') : file.content,
  }));
};

export const buildScaffoldFiles = (paths: string[]): Record<string, string> => {
  const known = new Set(paths.map(normalize));
  if (![...known].some((path) => SOURCE_FILE.test(path))) return {};

  const scaffold: Record<string, string> = {};
  const app =
    APP_CANDIDATES.find((path) => known.has(path)) ??
    [...known].find(
      (path) =>
        path.startsWith('src/') &&
        /\.(jsx|tsx)$/.test(path) &&
        !/\/(index|main)\.(jsx|tsx)$/.test(path)
    );

  if (app && !ENTRY_PATHS.some((path) => known.has(path))) {
    const cssPaths = [...known].filter((path) => path.startsWith('src/') && path.endsWith('.css'));
    if (cssPaths.length === 0) {
      cssPaths.push(STYLESHEET);
      scaffold[STYLESHEET] = STYLESHEET_CONTENT;
    }
    const cssImports = cssPaths.map((path) => `import './${path.slice('src/'.length)}';`);
    scaffold['src/index.jsx'] = [
      "import React from 'react';",
      "import { createRoot } from 'react-dom/client';",
      `import * as AppModule from './${app.slice('src/'.length).replace(SOURCE_FILE, '')}';`,
      ...cssImports,
      "const App = AppModule.default ?? Object.values(AppModule).find((value) => typeof value === 'function');",
      `if (!App) throw new Error('No React component is exported from ${app}.');`,
      "createRoot(document.getElementById('root')).render(",
      '  <React.StrictMode>',
      '    <App />',
      '  </React.StrictMode>',
      ');',
    ].join('\n');
  }

  if (!known.has('index.html')) scaffold['index.html'] = INDEX_HTML;
  if (!known.has('package.json')) scaffold['package.json'] = PACKAGE_JSON;

  return scaffold;
};

export const buildExportFiles = (files: ProjectFile[]): ProjectFile[] => {
  const byPath = new Map<string, string>();
  files.forEach((file) => byPath.set(normalize(file.path), file.content));

  const cssPaths = [...byPath.keys()].filter((path) => path.startsWith('src/') && path.endsWith('.css'));
  if (cssPaths.length === 0) {
    cssPaths.push(STYLESHEET);
    byPath.set(STYLESHEET, STYLESHEET_CONTENT);
  }
  cssPaths.forEach((path) => {
    const css = byPath.get(path) ?? '';
    if (!css.includes('@tailwind base')) byPath.set(path, `${css}\n${TAILWIND_DIRECTIVES}`);
  });

  if (!byPath.has('src/index.jsx')) {
    const cssImports = cssPaths.map((path) => `import './${path.slice('src/'.length)}';`);
    const entry = ENTRY_PATHS.find((path) => byPath.has(path));
    const indexContent = entry
      ? [...cssImports, `import './${entry.slice('src/'.length)}';`, ''].join('\n')
      : buildScaffoldFiles([...byPath.keys()])['src/index.jsx'] ?? [...cssImports, ''].join('\n');
    byPath.set('src/index.jsx', indexContent);
  }

  byPath.set('index.html', INDEX_HTML);
  byPath.set('package.json', PACKAGE_JSON);
  byPath.set('vite.config.js', VITE_CONFIG);
  byPath.set('tailwind.config.js', TAILWIND_CONFIG);
  byPath.set('postcss.config.js', POSTCSS_CONFIG);

  return [...byPath].map(([path, content]) => ({ path, content }));
};

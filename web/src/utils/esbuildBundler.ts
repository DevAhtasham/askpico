import type * as Esbuild from 'esbuild-wasm';
import { buildScaffoldFiles, normalizeProjectFiles } from '@utils/projectScaffold';
import { fetchWithRetry } from '@api/api';

export interface SourceFile {
  filePath?: string;
  language: string;
  content: string;
}

const ENTRY_CANDIDATES = [
  'src/main.jsx',
  'src/main.tsx',
  'src/main.js',
  'src/index.jsx',
  'src/index.tsx',
  'main.jsx',
  'main.tsx',
  'App.jsx',
  'App.tsx',
];

const MOUNT_HINT = /createRoot|ReactDOM\.render/;
const EXTENSIONS = ['', '.jsx', '.tsx', '.js', '.ts', '.css', '/index.jsx', '/index.tsx', '/index.js'];
const CDN_BASE = 'https://esm.sh/';
const PREVIEW_TIMEOUT_MS = 5000;

const moduleCache = new Map<string, string>();
let initPromise: Promise<typeof Esbuild> | null = null;

const ensureInitialized = (): Promise<typeof Esbuild> => {
  if (!initPromise) {
    initPromise = (async () => {
      const esbuild = await import('esbuild-wasm');
      const { default: wasmURL } = await import('esbuild-wasm/esbuild.wasm?url');
      try {
        await esbuild.initialize({ wasmURL });
      } catch (err) {
        if (!String(err).includes('more than once')) {
          initPromise = null;
          throw err;
        }
      }
      return esbuild;
    })();
  }
  return initPromise;
};

const normalizePath = (path: string) => {
  const out: string[] = [];
  for (const segment of path.split('/')) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') out.pop();
    else out.push(segment);
  }
  return out.join('/');
};

const UNSPLASH_URL = /https?:\/\/(?:images|source|plus)\.unsplash\.com\/[^\s"'`)]*/g;

const replaceBlockedImages = (content: string) =>
  content.replace(UNSPLASH_URL, 'https://placehold.co/600x400/1e293b/38bdf8?text=Preview');

const dirOf = (path: string) =>
  path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';

const pickEntry = (files: Map<string, string>): string => {
  const found = ENTRY_CANDIDATES.find((candidate) => files.has(candidate));
  if (found) return found;
  const first = [...files.keys()].find((path) => /\.(jsx|tsx)$/.test(path));
  return first ?? [...files.keys()][0];
};

const toVirtualPath = (file: SourceFile) =>
  normalizePath(file.filePath ?? `App.${file.language || 'jsx'}`);

const buildEntryContent = (files: Map<string, string>, entry: string) => {
  if (MOUNT_HINT.test(files.get(entry) ?? '')) return null;
  return [
    `import * as Mod from './${entry.replace(/\.(jsx|tsx|js|ts)$/, '')}';`,
    "import React from 'react';",
    "import { createRoot } from 'react-dom/client';",
    "const Component = Mod.default ?? Object.entries(Mod).find(([name, value]) => typeof value === 'function' && /^[A-Z]/.test(name))?.[1];",
    "if (!Component) throw new Error('No exported React component found in " + entry + ". Add export default or export a capitalized component.');",
    "const rootElement = document.getElementById('root');",
    "if (rootElement) createRoot(rootElement).render(React.createElement(Component));",
  ].join('\n');
};

const resolveVirtual = (files: Map<string, string>, base: string, request: string) => {
  const target = normalizePath(base ? `${base}/${request}` : request);
  for (const ext of EXTENSIONS) {
    if (files.has(target + ext)) return target + ext;
  }
  return null;
};

const stemOf = (path: string) => (path.split('/').pop() ?? '').replace(/\.[^.]+$/, '');

const resolveByBasename = (files: Map<string, string>, request: string) => {
  const stem = stemOf(normalizePath(request));
  if (!stem) return null;
  const matches = [...files.keys()].filter((path) => /\.(jsx|tsx|js|ts|css)$/.test(path) && stemOf(path) === stem);
  return matches.length === 1 ? matches[0] : null;
};

const loaderFor = (path: string): Esbuild.Loader => {
  if (path.endsWith('.css')) return 'css';
  if (path.endsWith('.tsx')) return 'tsx';
  if (path.endsWith('.ts')) return 'ts';
  if (path.endsWith('.js')) return 'js';
  return 'jsx';
};

const injectStyleModule = (css: string) =>
  `const style=document.createElement('style');style.textContent=${JSON.stringify(css)};document.head.appendChild(style);`;

const REACT_EXPORTS = ['Children', 'Fragment', 'StrictMode', 'Suspense', 'cloneElement', 'createContext', 'createElement', 'forwardRef', 'isValidElement', 'lazy', 'memo', 'startTransition', 'useCallback', 'useContext', 'useDebugValue', 'useDeferredValue', 'useEffect', 'useId', 'useImperativeHandle', 'useInsertionEffect', 'useLayoutEffect', 'useMemo', 'useReducer', 'useRef', 'useState', 'useSyncExternalStore', 'useTransition'];

const ERROR_BOUNDARY_SOURCE = `
const __wrapRoot = (node) => window.React.createElement(__PreviewBoundary, null, node);
class __PreviewBoundary extends window.React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('[preview] render error', error, info && info.componentStack); }
  render() {
    const error = this.state.error;
    if (!error) return this.props.children;
    const R = window.React;
    return R.createElement('div', { style: { fontFamily: 'system-ui, sans-serif', margin: '24px auto', maxWidth: '520px', padding: '20px', borderRadius: '12px', border: '1px solid #fecaca', background: '#fef2f2', color: '#991b1b' } },
      R.createElement('p', { style: { fontWeight: 600, margin: '0 0 8px' } }, 'Something went wrong while rendering this preview.'),
      R.createElement('p', { style: { fontSize: '13px', margin: 0, color: '#7f1d1d' } }, String((error && error.message) || error)),
      R.createElement('button', { onClick: () => this.setState({ error: null }), style: { marginTop: '12px', padding: '6px 12px', borderRadius: '8px', border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer' } }, 'Try again'));
  }
}
`;

const SHIM_MODULES: Record<string, string> = {
  react: `const R = window.React;\nexport default R;\n${REACT_EXPORTS.map((name) => `export const ${name} = R.${name};`).join('\n')}`,
  'react/jsx-runtime': "const R = window.React;\nexport const Fragment = R.Fragment;\nconst withKey = (props, key) => (key === undefined ? props : { ...props, key });\nexport const jsx = (type, props, key) => { const { children, ...rest } = props; return children === undefined ? R.createElement(type, withKey(rest, key)) : R.createElement(type, withKey(rest, key), children); };\nexport const jsxs = (type, props, key) => { const { children = [], ...rest } = props; return R.createElement(type, withKey(rest, key), ...children); };",
  'react-dom': `const D = window.ReactDOM;${ERROR_BOUNDARY_SOURCE}
export default D;
export const render = (node, el, cb) => D.render(__wrapRoot(node), el, cb);
export const createPortal = (...args) => D.createPortal(...args);`,
  'react-dom/client': `const D = window.ReactDOM;${ERROR_BOUNDARY_SOURCE}
export default D;
export const createRoot = (el) => { const root = D.createRoot(el); return { render: (node) => root.render(__wrapRoot(node)), unmount: () => root.unmount() }; };
export const hydrateRoot = (el, node) => D.hydrateRoot(el, __wrapRoot(node));`,
};

const BRAND_ICON_PATHS: Record<string, string[]> = {
  Github: [
    'M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4',
    'M9 18c-4.51 2-5-2-7-2',
  ],
  Linkedin: [
    'M2 9h4v12H2z',
    'M4 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
    'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z',
  ],
  Twitter: [
    'M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z',
  ],
};

const GENERIC_ICON_PATH = ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3', 'M12 17h.01'];

const iconSource = (paths: string[]) =>
  `({ size = 24, ...props }) => window.React.createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', ...props }, ${paths
    .map((d) => `window.React.createElement('path', { d: ${JSON.stringify(d)} })`)
    .join(', ')})`;

const fallbackSource = (spec: string, name: string) =>
  spec.includes('lucide-react') ? iconSource(BRAND_ICON_PATHS[name] ?? GENERIC_ICON_PATH) : '() => null';

const patchCdnModule = (spec: string, text: string, names: string[]): string => {
  const missing = names.filter((name) => !new RegExp(`(\\bas\\s+|export\\s*\\{[^}]*\\b)${name}\\b`).test(text));
  if (missing.length === 0) return text;
  const defs = missing.map((name, i) => `const __fallback${i} = ${fallbackSource(spec, name)};`).join('\n');
  const exports = missing.map((name, i) => `__fallback${i} as ${name}`).join(', ');
  return `${text}\n${defs}\nexport { ${exports} };`;
};

const createPlugin = (files: Map<string, string>, entryContent: string | null, signal: AbortSignal): Esbuild.Plugin => ({
  name: 'artifact-files',
  setup(build) {
    const requested = new Map<string, Set<string>>();
    const namedImport = /import\s+(?:[\w$]+\s*,\s*)?\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g;
    files.forEach((content) => {
      for (const match of content.matchAll(namedImport)) {
        const names = requested.get(match[2]) ?? new Set<string>();
        match[1]
          .split(',')
          .map((part) => part.trim().split(/\s+as\s+/)[0])
          .filter((name) => name && name !== 'default')
          .forEach((name) => names.add(name));
        requested.set(match[2], names);
      }
    });

    build.onResolve({ filter: /.*/ }, (args) => {
      if (args.path === '__entry__') {
        return { path: '__entry__', namespace: 'virtual' };
      }

      if (args.path in SHIM_MODULES) {
        return { path: args.path, namespace: 'react-shim' };
      }

      if (args.namespace === 'cdn') {
        return { path: new URL(args.path, args.importer).href, namespace: 'cdn' };
      }

      if (args.path.startsWith('.') || args.path.startsWith('/')) {
        const base = args.path.startsWith('/') || args.importer === '__entry__' ? '' : dirOf(normalizePath(args.importer));
        const resolved = resolveVirtual(files, base, args.path) ?? resolveByBasename(files, args.path);
        if (resolved) return { path: resolved, namespace: 'virtual' };
        if (args.path.endsWith('.css')) return { path: normalizePath(base ? `${base}/${args.path}` : args.path), namespace: 'empty-css' };
        return { errors: [{ text: `Cannot resolve "${args.path}" from "${args.importer}". Available files: ${[...files.keys()].join(', ')}` }] };
      }

      const localMatch =
        resolveVirtual(files, '', args.path) ??
        resolveVirtual(files, dirOf(normalizePath(args.importer)), args.path);
      if (localMatch) return { path: localMatch, namespace: 'virtual' };

      return { path: `${CDN_BASE}${args.path}?external=react,react-dom`, namespace: 'cdn', pluginData: { spec: args.path } };
    });

    build.onLoad({ filter: /.*/, namespace: 'virtual' }, (args) => {
      if (args.path === '__entry__') {
        return { contents: entryContent ?? '', loader: 'jsx', resolveDir: '/' };
      }
      if (args.path.endsWith('.css')) {
        return { contents: injectStyleModule(files.get(args.path) ?? ''), loader: 'js' };
      }
      return { contents: files.get(args.path) ?? '', loader: loaderFor(args.path) };
    });

    build.onLoad({ filter: /.*/, namespace: 'react-shim' }, (args) => ({ contents: SHIM_MODULES[args.path], loader: 'js' }));

    build.onLoad({ filter: /.*/, namespace: 'empty-css' }, () => ({ contents: injectStyleModule(''), loader: 'js' }));

    build.onLoad({ filter: /.*/, namespace: 'cdn' }, async (args) => {
      let raw = moduleCache.get(args.path);
      if (raw === undefined) {
        const response = await fetchWithRetry(args.path, { signal });
        if (!response.ok) throw new Error(`Could not load "${args.path}" (HTTP ${response.status}). Check the package name.`);
        raw = await response.text();
        moduleCache.set(args.path, raw);
      }
      const spec = (args.pluginData as { spec?: string } | undefined)?.spec ?? '';
      return { contents: patchCdnModule(spec, raw, Array.from(requested.get(spec) ?? [])), loader: 'js' };
    });
  },
});

const withTimeout = <T>(promise: Promise<T>, ms: number, onTimeout: () => void) =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      onTimeout();
      reject(new Error(`Preview timed out after ${ms / 1000}s. The code may be too large or an import may be hanging. Click Refresh to retry.`));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err: unknown) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });

const logStep = (step: string, detail: unknown = '') => console.log(`[preview] ${step}`, detail);

const escapeForScript = (code: string) => code.replace(/<\/script/gi, '<\\/script');

const FALLBACK_SCRIPT = `(function(){var box=document.getElementById('fallback'),root=document.getElementById('root');function show(msg,color){box.style.display='block';box.style.color=color||'#b91c1c';box.textContent=msg;}function fail(msg){console.error('[preview] step 4 failed: '+msg);show(msg);}console.log('[preview] step 4: iframe document started');if(!window.React||!window.ReactDOM){fail('React UMD failed to load from unpkg. Check the network connection or the CDN.');}window.addEventListener('error',function(e){if(e.target&&e.target!==window){fail('Failed to load resource: '+(e.target.src||e.target.href));return;}fail('Preview runtime error: '+((e.error&&e.error.stack)||e.message));},true);window.addEventListener('unhandledrejection',function(e){var r=e.reason;fail('Unhandled promise rejection: '+((r&&r.stack)||String(r)));});new MutationObserver(function(_,obs){if(root.hasChildNodes()){console.log('[preview] step 4: React mounted into #root');obs.disconnect();}}).observe(root,{childList:true});setTimeout(function(){if(!root.hasChildNodes()&&box.style.display!=='block'){show('Step 4: the bundle ran but #root is empty, so the component rendered nothing. Make sure it returns JSX and is exported (default or named).','#b45309');console.warn('[preview] step 4: #root is empty after 1.5s');}},1500);})();`;

const STORAGE_SHIM_SCRIPT = `(function(){function memoryStorage(){var m={};return{getItem:function(k){return Object.prototype.hasOwnProperty.call(m,k)?m[k]:null;},setItem:function(k,v){m[k]=String(v);},removeItem:function(k){delete m[k];},clear:function(){m={};},key:function(i){return Object.keys(m)[i]||null;},get length(){return Object.keys(m).length;}};}['localStorage','sessionStorage'].forEach(function(name){try{var s=window[name];s.setItem('__probe__','1');s.removeItem('__probe__');}catch(e){try{Object.defineProperty(window,name,{value:memoryStorage(),configurable:true});}catch(_){}console.warn('[preview] '+name+' unavailable in sandbox, using in-memory fallback');}});})();`;

const INTERCEPTOR_SCRIPT = `(function(){if(window.parent===window)return;function post(m){parent.postMessage(m,'*');}document.addEventListener('click',function(e){var t=e.target;var a=t&&t.closest?t.closest('a'):null;if(!a)return;var href=a.getAttribute('href');if(!href)return;if(href.charAt(0)==='#'){e.preventDefault();var id=decodeURIComponent(href.slice(1));var el=id?document.getElementById(id):document.body;if(el)el.scrollIntoView({behavior:'smooth',block:'start'});return;}e.preventDefault();if(a.target==='_blank'||/^(https?:|mailto:|tel:)/i.test(href)){post({type:'artifact-external-link',url:href});return;}post({type:'artifact-navigate',path:href});},true);document.addEventListener('submit',function(e){e.preventDefault();post({type:'artifact-form-submit'});},true);})();`;

export const bundleReactArtifact = async (sources: SourceFile[], options: { entry?: string } = {}): Promise<string> => {
  let step = 'Step 1: virtual file system mapping';
  try {
    logStep(step, { inputs: sources.map((file) => file.filePath ?? file.language) });
    const files = new Map<string, string>();
    normalizeProjectFiles(sources.map((file) => ({ path: toVirtualPath(file), content: replaceBlockedImages(file.content) }))).forEach((file) =>
      files.set(file.path, file.content)
    );
    if (files.size === 0) throw new Error('No source files to preview');
    Object.entries(buildScaffoldFiles([...files.keys()])).forEach(([path, content]) => files.set(path, content));
    logStep(step, { virtualFiles: [...files.keys()] });

    const entry = options.entry && files.has(options.entry) ? options.entry : pickEntry(files);
    const entryContent = buildEntryContent(files, entry);
    logStep(step, { entry, mountWrapper: entryContent !== null });

    step = 'Step 2: esbuild initialization and build';
    const controller = new AbortController();
    const esbuild = await withTimeout(ensureInitialized(), PREVIEW_TIMEOUT_MS, () => controller.abort());
    logStep(step, 'esbuild-wasm initialized, invoking esbuild.build');
    const result = await withTimeout(
      esbuild.build({
        entryPoints: [entryContent ? '__entry__' : entry],
        bundle: true,
        write: false,
        format: 'esm',
        jsx: 'automatic',
        banner: { js: 'var process = { env: { NODE_ENV: "development" } };' },
        plugins: [createPlugin(files, entryContent, controller.signal)],
      }),
      PREVIEW_TIMEOUT_MS,
      () => controller.abort()
    );

    step = 'Step 3: bundle output extraction';
    const outputs = result.outputFiles ?? [];
    logStep(step, outputs.map((file) => ({ path: file.path, chars: file.text.length })));
    const js = outputs.find((file) => !file.path.endsWith('.css'))?.text ?? '';
    if (!js) throw new Error('esbuild produced no JavaScript output');
    const css = outputs.find((file) => file.path.endsWith('.css'))?.text ?? '';

    step = 'Step 4: iframe HTML injection';
    logStep(step, { jsChars: js.length, cssChars: css.length });
    return `<!doctype html><html><head><meta charset="utf-8"><script src="https://unpkg.com/react@18.3.1/umd/react.development.js"></script><script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js"></script><script src="https://cdn.tailwindcss.com"></script><script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script><script>${STORAGE_SHIM_SCRIPT}</script><script>${INTERCEPTOR_SCRIPT}</script><style>${css}</style></head><body><div id="root"></div><pre id="fallback" style="display:none;position:fixed;inset:0;margin:0;overflow:auto;background:#fef2f2;color:#b91c1c;padding:16px;font:12px/1.5 monospace;white-space:pre-wrap"></pre><script>${FALLBACK_SCRIPT}</script><script type="module">${escapeForScript(js)}</script></body></html>`;
  } catch (err) {
    console.error(`[preview] failed at ${step}`, err);
    throw new Error(`Failed at ${step}\n\n${err instanceof Error ? err.stack || err.message : String(err)}`);
  }
};

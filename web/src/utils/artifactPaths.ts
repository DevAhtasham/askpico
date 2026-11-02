export interface ProjectPathFile {
  path: string;
  content: string;
}

const CODE_FILE = /\.(jsx|tsx|js|ts)$/;
const SYSTEM_GENERATED = new Set([
  'src/index.jsx',
  'src/index.tsx',
  'src/main.jsx',
  'src/main.tsx',
  'src/styles.css',
  'index.html',
  'package.json',
]);
const APP_FILE = /^src\/App\.(jsx|tsx)$/;
const TOP_LEVEL_SRC_FILE = /^src\/[^/]+\.(jsx|tsx|js|ts)$/;
const COMPONENT_FILE = /^src\/([A-Z][\w$]*)\.(jsx|tsx|js|ts)$/;
const IMPORT_SPECIFIER = /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(['"])(\.{1,2}\/[^'"]*)\2/g;

const stripExt = (path: string) => path.replace(CODE_FILE, '');
const dirOf = (path: string) => (path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '');

const resolveSegments = (base: string, spec: string) => {
  const out: string[] = [];
  for (const segment of `${base}/${spec}`.split('/')) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') out.pop();
    else out.push(segment);
  }
  return out.join('/');
};

const relativeSpecifier = (fromDir: string, toStem: string) => {
  const from = fromDir ? fromDir.split('/') : [];
  const to = toStem.split('/');
  let common = 0;
  while (common < from.length && common < to.length - 1 && from[common] === to[common]) common++;
  const ups = from.length - common;
  const rest = to.slice(common).join('/');
  return ups === 0 ? `./${rest}` : `${'../'.repeat(ups)}${rest}`;
};

const importedStems = (file: ProjectPathFile) =>
  [...file.content.matchAll(IMPORT_SPECIFIER)].map((m) => stripExt(resolveSegments(dirOf(file.path), m[3])));

export const normalizeProjectPaths = <T extends ProjectPathFile>(input: T[]): T[] => {
  if (!input.some((file) => /\.(jsx|tsx)$/.test(file.path))) return input;

  const files = input
    .map((file) => ({
      ...file,
      path: CODE_FILE.test(file.path) && !file.path.startsWith('src/') ? `src/${file.path}` : file.path,
    }))
    .filter((file) => !SYSTEM_GENERATED.has(file.path));

  const newPaths = new Map<string, string>(files.map((file) => [file.path, file.path]));
  const taken = new Set(newPaths.values());

  if (!files.some((file) => APP_FILE.test(file.path))) {
    const incoming = (file: ProjectPathFile) =>
      files.filter((other) => other !== file && importedStems(other).includes(stripExt(file.path))).length;
    const outgoing = (file: ProjectPathFile) =>
      importedStems(file).filter((stem) => files.some((other) => stripExt(other.path) === stem)).length;
    const [entry] = files
      .filter((file) => TOP_LEVEL_SRC_FILE.test(file.path) && /export\s+default/.test(file.content))
      .sort((a, b) => outgoing(b) - outgoing(a) || incoming(a) - incoming(b));
    if (entry) {
      const ext = /tsx?$/.test(entry.path) ? 'tsx' : 'jsx';
      const target = `src/App.${ext}`;
      taken.delete(newPaths.get(entry.path)!);
      taken.add(target);
      newPaths.set(entry.path, target);
    }
  }

  const dropped = new Set<string>();
  for (const file of files) {
    const current = newPaths.get(file.path)!;
    const match = COMPONENT_FILE.exec(current);
    if (!match || APP_FILE.test(current)) continue;
    const target = `src/components/${match[1]}.${match[2]}`;
    if (taken.has(target)) {
      dropped.add(file.path);
      newPaths.set(file.path, target);
      continue;
    }
    taken.delete(current);
    taken.add(target);
    newPaths.set(file.path, target);
  }

  const stemMoves = new Map<string, string>();
  for (const file of files) {
    const from = file.path;
    const to = newPaths.get(from)!;
    if (from !== to) stemMoves.set(stripExt(from), stripExt(to));
  }

  return files
    .filter((file) => !dropped.has(file.path))
    .map((file) => {
      const newPath = newPaths.get(file.path)!;
      const content = file.content.replace(
        IMPORT_SPECIFIER,
        (match: string, prefix: string, quote: string, spec: string) => {
          const moved = stemMoves.get(stripExt(resolveSegments(dirOf(file.path), spec)));
          if (!moved) return match;
          return `${prefix}${quote}${relativeSpecifier(dirOf(newPath), moved)}${quote}`;
        }
      );
      return { ...file, path: newPath, content };
    });
};

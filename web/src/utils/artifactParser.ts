import { ArtifactInterface, ArtifactType } from '@type/artifact';

export const FENCE_REGEX = /```([^\n`]*)\n([\s\S]*?)(?:```|$)/g;

const PREVIEW_LANGUAGES = ['html', 'jsx', 'tsx'];

const getArtifactType = (language: string): ArtifactType =>
  PREVIEW_LANGUAGES.includes(language) ? 'preview' : 'code';

const UNFENCED_HEADER =
  /^(jsx|tsx|js|ts|css|html|json)[ \t]+([\w./-]+\.(?:jsx|tsx|js|ts|css|html|json))[ \t]*$/i;

export const fenceUnfencedBlocks = (markdown: string): string => {
  const out: string[] = [];
  let inFence = false;
  let openedUnfenced = false;
  for (const line of markdown.split('\n')) {
    if (line.trimStart().startsWith('```')) {
      if (openedUnfenced) {
        out.push('```');
        openedUnfenced = false;
      }
      inFence = !inFence;
      out.push(line);
      continue;
    }
    const header = inFence ? null : UNFENCED_HEADER.exec(line.trim());
    if (header) {
      if (openedUnfenced) out.push('```');
      out.push(`\`\`\`${header[1].toLowerCase()} ${header[2]}`);
      openedUnfenced = true;
      continue;
    }
    out.push(line);
  }
  if (openedUnfenced) out.push('```');
  return out.join('\n');
};

const parseInfo = (info: string) => {
  const [rawLanguage = '', ...pathParts] = info.trim().split(/\s+/);
  return {
    language: rawLanguage.toLowerCase(),
    filePath: pathParts.join(' ') || undefined,
  };
};

const LANGUAGE_ALIAS: Record<string, string> = {
  javascript: 'js',
  typescript: 'ts',
  plaintext: 'txt',
  text: 'txt',
};

const SOURCE_EXTENSIONS = ['jsx', 'tsx', 'js', 'ts'];

const extensionOf = (language: string) => LANGUAGE_ALIAS[language] ?? (language || 'txt');

const inferFilePath = (language: string, content: string): string | null => {
  const ext = extensionOf(language);
  if (ext === 'css') return 'src/styles.css';
  if (ext === 'html') return 'index.html';
  if (ext === 'json') return /"dependencies"|"scripts"/.test(content) ? 'package.json' : null;
  if (!SOURCE_EXTENSIONS.includes(ext)) return null;
  if (/createRoot\(|ReactDOM\.render\(/.test(content)) return `src/index.${ext}`;
  const name =
    /export\s+default\s+function\s+([A-Za-z]\w*)/.exec(content)?.[1] ??
    /export\s+default\s+([A-Za-z]\w*)\s*;/.exec(content)?.[1] ??
    /function\s+([A-Z]\w*)\s*\(/.exec(content)?.[1] ??
    'App';
  return `src/${name}.${ext}`;
};

type CodeBlock = { language: string; filePath?: string; content: string };

const toCodeBlock = (match: RegExpMatchArray): CodeBlock => ({
  ...parseInfo(match[1]),
  content: match[2].replace(/\n$/, ''),
});

const resolveBlockPaths = (blocks: CodeBlock[]): string[] => {
  const used = new Set(blocks.map((block) => block.filePath).filter(Boolean) as string[]);
  return blocks.map(({ language, filePath, content }) => {
    if (filePath) return filePath;
    const inferred = inferFilePath(language, content) ?? `src/snippet.${extensionOf(language)}`;
    let candidate = inferred;
    for (let n = 2; used.has(candidate); n++) candidate = inferred.replace(/(\.\w+)$/, `${n}$1`);
    used.add(candidate);
    return candidate;
  });
};

export type MarkdownSegment =
  | { type: 'text'; value: string }
  | { type: 'code'; language: string; filePath?: string; content: string };

export const splitFences = (markdown: string): MarkdownSegment[] => {
  const source = fenceUnfencedBlocks(markdown);
  const matches = [...source.matchAll(FENCE_REGEX)];
  const blocks = matches.map(toCodeBlock);
  const paths = resolveBlockPaths(blocks);
  const segments: MarkdownSegment[] = [];
  let last = 0;
  matches.forEach((match, i) => {
    const index = match.index ?? 0;
    if (index > last)
      segments.push({ type: 'text', value: source.slice(last, index) });
    segments.push({ type: 'code', ...blocks[i], filePath: paths[i] });
    last = index + match[0].length;
  });
  if (last < source.length)
    segments.push({ type: 'text', value: source.slice(last) });
  return segments;
};

export const extractArtifacts = (
  markdown: string,
  chatId: string,
  messageIndex: number
): ArtifactInterface[] => {
  const artifacts: ArtifactInterface[] = [];
  const createdAt = Date.now();
  const source = fenceUnfencedBlocks(markdown);
  const blocks = [...source.matchAll(FENCE_REGEX)].map(toCodeBlock);
  const paths = resolveBlockPaths(blocks);

  blocks.forEach((block, blockIndex) => {
    if (block.content.trim() === '') return;
    artifacts.push({
      id: `${chatId}-${messageIndex}-${blockIndex}`,
      chatId,
      messageIndex,
      title: paths[blockIndex],
      type: getArtifactType(block.language),
      language: block.language || 'plaintext',
      filePath: paths[blockIndex],
      content: block.content,
      createdAt,
    });
  });

  return artifacts;
};

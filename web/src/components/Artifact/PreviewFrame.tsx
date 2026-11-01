import React, { useEffect, useRef, useState } from 'react';

import useStore from '@store/store';
import { ArtifactInterface } from '@type/artifact';
import { bundleReactArtifact } from '@utils/esbuildBundler';
import { logger } from '@utils/logger';

const REACT_LANGUAGES = ['jsx', 'tsx'];
const PAGE_DIRS = ['src/pages/', 'src/', ''];
const PAGE_EXTS = ['.jsx', '.tsx', '.js', '.ts'];

const resolvePage = (
  sources: ArtifactInterface[],
  href: string
): { entry: string | null } | null => {
  const target = href.split(/[?#]/)[0].replace(/^\.?\/+/, '').replace(/\.html?$/i, '');
  if (target === '' || target === 'index') return { entry: null };
  const stem = target.split('/').pop() ?? target;
  const names = [target, stem, stem.charAt(0).toUpperCase() + stem.slice(1)];
  for (const dir of PAGE_DIRS)
    for (const name of names)
      for (const ext of PAGE_EXTS) {
        const path = `${dir}${name}${ext}`;
        if (sources.some((s) => s.filePath === path)) return { entry: path };
      }
  return null;
};

const PreviewFrame = ({
  artifact,
  sources,
}: {
  artifact: ArtifactInterface;
  sources: ArtifactInterface[];
}) => {
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [reactDoc, setReactDoc] = useState<string | null>(null);
  const [compiling, setCompiling] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [entryOverride, setEntryOverride] = useState<string | null>(null);
  const generating = useStore((state) => state.generating);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const sourcesRef = useRef(sources);
  sourcesRef.current = sources;

  const isReact = REACT_LANGUAGES.includes(artifact.language);
  const sourceKey = JSON.stringify(
    sources.map((s) => [s.filePath, s.language, s.content])
  );

  useEffect(() => {
    if (!isReact) return;
    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data as { type?: string; url?: string; path?: string } | null;
      if (data?.type === 'artifact-external-link' && data.url) {
        window.open(data.url, '_blank', 'noopener,noreferrer');
      } else if (data?.type === 'artifact-navigate' && data.path) {
        const page = resolvePage(sourcesRef.current, data.path);
        if (page) setEntryOverride(page.entry);
        else logger.warn(`No page component found for "${data.path}"`);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [isReact]);

  useEffect(() => {
    if (!isReact || generating) return;
    let cancelled = false;
    setCompiling(true);
    setError(null);
    bundleReactArtifact(sources, { entry: entryOverride ?? undefined })
      .then((doc) => {
        if (!cancelled) setReactDoc(doc);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setCompiling(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReact, generating, sourceKey, reloadKey, entryOverride]);

  const srcDoc = isReact ? reactDoc ?? '' : artifact.content;

  const openFullPage = () => {
    if (!srcDoc) return;
    const url = URL.createObjectURL(new Blob([srcDoc], { type: 'text/html' }));
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 5 * 60 * 1000);
  };

  return (
    <div className='flex min-h-0 flex-1 flex-col bg-surface-muted'>
      <div className='flex items-center justify-end gap-2 border-b border-surface-line bg-white px-3 py-2 text-xs'>
        <button
          className='flex items-center gap-1 rounded-lg border border-surface-line bg-white px-2 py-1 text-ink-soft hover:bg-surface-muted'
          onClick={() => setReloadKey((prev) => prev + 1)}
          aria-label='refresh preview'
        >
          <svg
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            className='h-3.5 w-3.5'
          >
            <path d='M21 12a9 9 0 1 1-2.64-6.36L21 8M21 3v5h-5' />
          </svg>
          Refresh
        </button>
        <button
          className='flex items-center gap-1 rounded-lg border border-surface-line bg-white px-2 py-1 text-ink-soft hover:bg-surface-muted disabled:opacity-50'
          onClick={openFullPage}
          disabled={!srcDoc}
          aria-label='open full page preview'
          title='Open full page preview'
        >
          <svg
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            className='h-3.5 w-3.5'
          >
            <path d='M14 3h7v7M10 14L21 3M21 14v7H3V3h7' />
          </svg>
          Full page
        </button>
      </div>
      <div className='min-h-0 flex-1 p-3'>
        {error && (
          <pre className='h-full overflow-auto whitespace-pre-wrap rounded-xl border border-red-200 bg-red-50 p-3 font-mono text-xs text-red-700'>
            {error}
          </pre>
        )}
        {!error && isReact && generating && (
          <div className='flex h-full items-center justify-center text-sm text-ink-muted'>
            Reply still generating. Preview compiles when it finishes.
          </div>
        )}
        {!error && isReact && !generating && compiling && !reactDoc && (
          <div className='flex h-full items-center justify-center text-sm text-ink-muted'>
            Compiling...
          </div>
        )}
        {!error && (!isReact || (reactDoc && !generating)) && (
          <iframe
            key={reloadKey}
            ref={iframeRef}
            title={artifact.title}
            srcDoc={srcDoc}
            sandbox='allow-scripts'
            className='h-full w-full rounded-xl border border-surface-line bg-white'
          />
        )}
      </div>
    </div>
  );
};

export default PreviewFrame;

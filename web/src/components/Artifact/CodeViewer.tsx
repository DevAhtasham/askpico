import React, { useEffect, useMemo, useRef, useState } from 'react';

import useStore from '@store/store';

import { ArtifactInterface } from '@type/artifact';
import { highlightToLines } from '@utils/highlightLines';
import { getArtifactLabel, getArtifactPath } from '@utils/artifactTree';

import CopyIcon from '@icon/CopyIcon';

const CodeViewer = ({
  artifact,
  tabs,
  onSelect,
}: {
  artifact: ArtifactInterface;
  tabs?: ArtifactInterface[];
  onSelect?: (artifactId: string) => void;
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const generating = useStore((state) => state.generating);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (generating && scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [artifact.content, generating]);

  const highlightedLines = useMemo(
    () => highlightToLines(artifact.content, artifact.language),
    [artifact.content, artifact.language]
  );

  const path = getArtifactPath(artifact);
  const fileName = path.split('/').pop() ?? path;

  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    const blob = new Blob([artifact.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <div className='flex items-center gap-2 border-b border-surface-line bg-surface-muted px-3 py-2 text-xs'>
        {tabs && tabs.length > 1 ? (
          <div className='flex min-w-0 flex-1 gap-1.5 overflow-x-auto'>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`shrink-0 rounded-lg px-2.5 py-1 font-mono text-xs transition-colors ${
                  tab.id === artifact.id
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-ink-soft hover:bg-white'
                }`}
                onClick={() => onSelect?.(tab.id)}
                title={getArtifactLabel(tab)}
              >
                {getArtifactLabel(tab)}
              </button>
            ))}
          </div>
        ) : (
          <span className='min-w-0 flex-1 truncate font-mono text-ink-soft'>{getArtifactLabel(artifact)}</span>
        )}
        <button
          className='flex shrink-0 items-center gap-1 rounded-lg border border-surface-line bg-white px-2 py-1 text-ink-soft hover:bg-surface-muted'
          onClick={handleCopy}
          aria-label='copy code'
        >
          <CopyIcon />
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button
          className='flex items-center gap-1 rounded-lg border border-surface-line bg-white px-2 py-1 text-ink-soft hover:bg-surface-muted'
          onClick={handleDownload}
          aria-label='download code'
        >
          <svg
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            className='h-3.5 w-3.5'
          >
            <path d='M12 3v12m0 0l-4-4m4 4l4-4M5 21h14' />
          </svg>
          Download
        </button>
      </div>

      <div
        ref={scrollRef}
        className='min-h-0 flex-1 overflow-auto bg-black font-mono text-xs leading-5 text-gray-200'
      >
        <table className='w-full border-collapse'>
          <tbody>
            {highlightedLines.map((html, index) => {
              return (
                <tr key={index}>
                  <td className='sticky left-0 select-none bg-black pl-3 pr-4 text-right text-gray-500'>
                    {index + 1}
                  </td>
                  <td className='whitespace-pre pr-4'>
                    <span dangerouslySetInnerHTML={{ __html: html }} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CodeViewer;

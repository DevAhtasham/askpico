import React, { useMemo, useState } from 'react';

import { ArtifactInterface } from '@type/artifact';
import { FileEntry, buildFileTree } from '@utils/artifactTree';

import CodeViewer from './CodeViewer';
import DownloadModal from './DownloadModal';
import FileTree from './FileTree';

const ArtifactFiles = ({
  entries,
  selected,
  onSelect,
}: {
  entries: FileEntry[];
  selected: ArtifactInterface;
  onSelect: (artifactId: string) => void;
}) => {
  const tree = useMemo(() => buildFileTree(entries), [entries]);
  const [downloadOpen, setDownloadOpen] = useState(false);

  return (
    <div className='flex min-h-0 flex-1'>
      <div className='flex w-56 shrink-0 flex-col border-r border-surface-line bg-surface-muted'>
        <div className='flex items-center justify-between gap-2 border-b border-surface-line px-3 py-2 text-xs text-ink-muted'>
          <span>{entries.length} files</span>
          <button
            className='rounded-lg border border-surface-line bg-white px-2 py-1 text-ink-soft hover:bg-surface-muted'
            onClick={() => setDownloadOpen(true)}
            aria-label='download'
          >
            Download
          </button>
        </div>
        <div className='min-h-0 flex-1 overflow-y-auto'>
          <FileTree nodes={tree} selectedId={selected.id} onSelect={onSelect} />
        </div>
      </div>
      <CodeViewer artifact={selected} />
      {downloadOpen && (
        <DownloadModal files={entries} onClose={() => setDownloadOpen(false)} />
      )}
    </div>
  );
};

export default ArtifactFiles;

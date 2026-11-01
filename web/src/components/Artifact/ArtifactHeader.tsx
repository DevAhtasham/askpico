import React from 'react';

import { ArtifactInterface } from '@type/artifact';
import { getArtifactLabel } from '@utils/artifactTree';

const ArtifactHeader = ({
  artifacts,
  activeArtifactId,
  onSelect,
}: {
  artifacts: ArtifactInterface[];
  activeArtifactId: string | null;
  onSelect: (artifactId: string) => void;
}) => {
  if (artifacts.length < 2) return null;

  return (
    <div className='flex gap-1.5 overflow-x-auto border-b border-surface-line px-4 py-2'>
      {artifacts.map((artifact) => (
        <button
          key={artifact.id}
          className={`shrink-0 rounded-lg px-2.5 py-1 font-mono text-xs transition-colors ${
            artifact.id === activeArtifactId
              ? 'bg-brand-50 text-brand-700'
              : 'text-ink-soft hover:bg-surface-muted'
          }`}
          onClick={() => onSelect(artifact.id)}
        >
          {getArtifactLabel(artifact)}
        </button>
      ))}
    </div>
  );
};

export default ArtifactHeader;

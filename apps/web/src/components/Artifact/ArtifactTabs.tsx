import React from 'react';

import { ArtifactTab } from '@type/artifact';

const tabs: { value: ArtifactTab; label: string }[] = [
  { value: 'preview', label: 'Preview' },
  { value: 'code', label: 'Code' },
];

const ArtifactTabs = ({
  activeTab,
  onChange,
}: {
  activeTab: ArtifactTab;
  onChange: (tab: ArtifactTab) => void;
}) => {
  return (
    <div className='inline-flex items-center gap-1 rounded-full border border-surface-line bg-surface-muted p-1'>
      {tabs.map((tab) => {
        return (
          <button
            key={tab.value}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeTab === tab.value
                ? 'bg-white text-ink shadow-soft'
                : 'text-ink-soft hover:text-ink'
            }`}
            onClick={() => onChange(tab.value)}
            aria-pressed={activeTab === tab.value}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default ArtifactTabs;

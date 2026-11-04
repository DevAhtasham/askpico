import React from 'react';

import useStore from '@store/store';

const ArtifactCard = ({
  language,
  filePath,
  content,
}: {
  language: string;
  filePath?: string;
  content: string;
}) => {
  const chatId = useStore((state) => state.chats?.[state.currentChatIndex]?.id);
  const artifact = useStore((state) =>
    state.artifacts.find((a) => a.chatId === chatId && a.content === content)
  );
  const artifactPanelOpen = useStore((state) => state.artifactPanelOpen);
  const activeArtifactId = useStore((state) => state.activeArtifactId);
  const openArtifactPanel = useStore((state) => state.openArtifactPanel);
  const closeArtifactPanel = useStore((state) => state.closeArtifactPanel);
  const setActiveArtifactTab = useStore((state) => state.setActiveArtifactTab);

  const isOpen = artifactPanelOpen && artifact?.id === activeArtifactId;
  const title = filePath ?? (language || 'code');
  const lineCount = content.split('\n').length;

  const handleClick = () => {
    if (!artifact) return;
    if (isOpen) {
      closeArtifactPanel();
      return;
    }
    setActiveArtifactTab(artifact.type === 'code' ? 'code' : 'preview');
    openArtifactPanel(artifact.id);
  };

  return (
    <button
      type='button'
      onClick={handleClick}
      disabled={!artifact}
      aria-label={`open artifact ${title}`}
      className='group relative my-3 flex h-40 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 via-red-600 to-red-800 text-white shadow-card transition hover:brightness-110 disabled:opacity-70'
    >
      <div className='absolute inset-0 bg-black/10' />
      <span className='relative flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-red-600 shadow-xl transition group-hover:scale-110'>
        <svg viewBox='0 0 24 24' fill='currentColor' className='h-8 w-8 translate-x-0.5'>
          <path d='M8 5v14l11-7z' />
        </svg>
      </span>
      <div className='absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2 text-left'>
        <span className='truncate font-mono text-sm font-medium'>{title}</span>
        <span className='shrink-0 text-xs text-white/80'>
          {lineCount} lines{isOpen ? ' · open' : ''}
        </span>
      </div>
    </button>
  );
};

export default ArtifactCard;

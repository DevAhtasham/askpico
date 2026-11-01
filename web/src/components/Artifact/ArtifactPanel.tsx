import React, { useState } from 'react';
import useStore from '@store/store';
import { ArtifactInterface } from '@type/artifact';

import CrossIcon from '@icon/CrossIcon';
import ArtifactTabs from './ArtifactTabs';
import PreviewFrame from './PreviewFrame';
import ArtifactFiles from './ArtifactFiles';
import { getArtifactPath, toFileEntries } from '@utils/artifactTree';
import { buildScaffoldFiles, normalizeProjectFiles } from '@utils/projectScaffold';

const SOURCE_LANGUAGES = ['jsx', 'tsx', 'js', 'ts', 'css'];

const ArtifactPanel = () => {
  const artifacts = useStore((state) => state.artifacts);
  const chatId = useStore((state) => state.chats?.[state.currentChatIndex]?.id);
  const activeArtifactId = useStore((state) => state.activeArtifactId);
  const activeArtifactTab = useStore((state) => state.activeArtifactTab);
  const setActiveArtifactId = useStore((state) => state.setActiveArtifactId);
  const setActiveArtifactTab = useStore((state) => state.setActiveArtifactTab);
  const closeArtifactPanel = useStore((state) => state.closeArtifactPanel);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const chatArtifacts = artifacts.filter((artifact) => artifact.chatId === chatId);
  const activeArtifact =
    chatArtifacts.find((artifact) => artifact.id === activeArtifactId) ??
    chatArtifacts[0] ??
    null;
  const fileGroup = activeArtifact
    ? chatArtifacts.filter(
        (artifact) => artifact.messageIndex === activeArtifact.messageIndex
      )
    : [];
  const displayGroup = normalizeProjectFiles(
    fileGroup.map((artifact) => ({ path: getArtifactPath(artifact), content: artifact.content }))
  ).map((file, index) => ({ ...fileGroup[index], filePath: file.path, content: file.content }));
  const scaffoldArtifacts: ArtifactInterface[] = activeArtifact
    ? Object.entries(buildScaffoldFiles(displayGroup.map(getArtifactPath))).map(
        ([path, content]) => ({
          id: `${activeArtifact.id}-scaffold-${path}`,
          chatId: activeArtifact.chatId,
          messageIndex: activeArtifact.messageIndex,
          title: path,
          type: 'code',
          language: path.split('.').pop() ?? 'txt',
          filePath: path,
          content,
          createdAt: activeArtifact.createdAt,
        })
      )
    : [];
  const codeGroup = [...displayGroup, ...scaffoldArtifacts];
  const fileEntries = toFileEntries(codeGroup);
  const selectedFile =
    codeGroup.find((artifact) => artifact.id === selectedFileId) ??
    displayGroup.find((artifact) => artifact.id === activeArtifact?.id) ??
    displayGroup[0];
  const handleFileSelect = (artifactId: string) => {
    setSelectedFileId(artifactId);
    if (fileGroup.some((artifact) => artifact.id === artifactId)) setActiveArtifactId(artifactId);
  };
  const previewSources = activeArtifact
    ? chatArtifacts.filter(
        (artifact) =>
          artifact.messageIndex === activeArtifact.messageIndex &&
          SOURCE_LANGUAGES.includes(artifact.language)
      )
    : [];

  return (
    <aside className='fixed inset-0 z-30 flex min-h-0 flex-col overflow-hidden border-surface-line bg-white transition-all duration-300 ease-in-out md:relative md:inset-auto md:z-auto md:w-[70%] md:min-w-0 md:flex-1 md:rounded-2xl md:border md:shadow-card'>
      <div className='flex items-center justify-between gap-2 border-b border-surface-line px-4 py-3'>
        <ArtifactTabs activeTab={activeArtifactTab} onChange={setActiveArtifactTab} />
        <button
          className='icon-btn !h-8 !w-8 !border-transparent !bg-transparent'
          onClick={closeArtifactPanel}
          aria-label='close artifact panel'
        >
          <CrossIcon />
        </button>
      </div>
      {!activeArtifact && (
        <div className='flex flex-1 items-center justify-center p-4 text-sm text-ink-muted'>
          No artifact yet
        </div>
      )}
      {activeArtifact &&
        activeArtifactTab === 'preview' &&
        (activeArtifact.type === 'preview' ? (
          <PreviewFrame
            key={activeArtifact.id}
            artifact={activeArtifact}
            sources={previewSources}
          />
        ) : (
          <div className='flex flex-1 items-center justify-center p-4 text-sm text-ink-muted'>
            Is artifact ka preview available nahi hai. Code tab dekhein.
          </div>
        ))}
      {activeArtifact && activeArtifactTab === 'code' && selectedFile && (
        <ArtifactFiles
          entries={fileEntries}
          selected={selectedFile}
          onSelect={handleFileSelect}
        />
      )}
    </aside>
  );
};

export default ArtifactPanel;

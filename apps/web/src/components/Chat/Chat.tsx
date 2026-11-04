import React from 'react';
import useStore from '@store/store';

import ChatContent from './ChatContent';
import ChatHeader from './ChatHeader';
import ChatFooter from './ChatFooter';
import MobileBar from '@components/MobileBar';
import ArtifactPanel from '@components/Artifact/ArtifactPanel';
import ImageStudio from '@components/Image/ImageStudio';
import ProjectPage from '@components/Project/ProjectPage';

const Chat = () => {
  const hideSideMenu = useStore((state) => state.hideSideMenu);
  const artifactPanelOpen = useStore((state) => state.artifactPanelOpen);
  const setHideSideMenu = useStore((state) => state.setHideSideMenu);
  const closeArtifactPanel = useStore((state) => state.closeArtifactPanel);
  const imageMode = useStore((state) => state.imageMode);
  const projectMode = useStore((state) => state.projectMode);
  const saveRef = React.useRef<HTMLDivElement>(null);

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, textarea, select, iframe')) return;
    setHideSideMenu(true);
    closeArtifactPanel();
  };

  return (
    <div
      className={`flex h-full flex-1 flex-col ${
        hideSideMenu ? 'md:pl-0' : 'md:pl-[280px]'
      } transition-all`}
    >
      <MobileBar />
      <main className='relative flex h-full w-full flex-1 flex-row gap-3 overflow-hidden px-2 pb-2 pt-2 sm:px-3 sm:pb-3 sm:pt-3'>
        <div
          onDoubleClick={handleDoubleClick}
          className={`relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-surface-line bg-white shadow-card transition-all duration-300 ease-in-out ${
            artifactPanelOpen ? 'w-full md:w-[30%] md:flex-none' : 'flex-1'
          }`}
        >
          {projectMode ? (
            <ProjectPage />
          ) : imageMode ? (
            <ImageStudio />
          ) : (
            <>
              <ChatHeader saveRef={saveRef} />
              <ChatContent saveRef={saveRef} />
              <ChatFooter />
            </>
          )}
        </div>
        {artifactPanelOpen && <ArtifactPanel />}
      </main>
    </div>
  );
};

export default Chat;

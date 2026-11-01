import React from 'react';
import useStore from '@store/store';

import ChatContent from './ChatContent';
import ChatHeader from './ChatHeader';
import ChatFooter from './ChatFooter';
import MobileBar from '@components/MobileBar';
import StopGeneratingButton from '@components/StopGeneratingButton/StopGeneratingButton';
import ArtifactPanel from '@components/Artifact/ArtifactPanel';

const Chat = () => {
  const hideSideMenu = useStore((state) => state.hideSideMenu);
  const artifactPanelOpen = useStore((state) => state.artifactPanelOpen);
  const saveRef = React.useRef<HTMLDivElement>(null);

  return (
    <div
      className={`flex h-full flex-1 flex-col ${
        hideSideMenu ? 'md:pl-0' : 'md:pl-[280px]'
      } transition-all`}
    >
      <MobileBar />
      <main className='relative flex h-full w-full flex-1 flex-row gap-3 overflow-hidden px-2 pb-2 pt-2 sm:px-3 sm:pb-3 sm:pt-3'>
        <div
          className={`relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-surface-line bg-white shadow-card transition-all duration-300 ease-in-out ${
            artifactPanelOpen ? 'w-full md:w-[30%] md:flex-none' : 'flex-1'
          }`}
        >
          <ChatHeader saveRef={saveRef} />
          <ChatContent saveRef={saveRef} />
          <ChatFooter />
        </div>
        {artifactPanelOpen && <ArtifactPanel />}
        <StopGeneratingButton />
      </main>
    </div>
  );
};

export default Chat;

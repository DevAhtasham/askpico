import React from 'react';
import useStore from '@store/store';
import PlusIcon from '@icon/PlusIcon';
import { PanelLeftIcon } from '@icon/ui';
import useAddChat from '@hooks/useAddChat';
import { useTranslation } from 'react-i18next';

const MobileBar = () => {
  const generating = useStore((state) => state.generating);
  const setHideSideMenu = useStore((state) => state.setHideSideMenu);
  const chatTitle = useStore((state) =>
    state.chats &&
    state.chats.length > 0 &&
    state.currentChatIndex >= 0 &&
    state.currentChatIndex < state.chats.length
      ? state.chats[state.currentChatIndex].title
      : 'New Chat'
  );

  const addChat = useAddChat();
  const { t } = useTranslation();

  return (
    <div className='sticky left-0 top-0 z-10 flex w-full items-center gap-1 border-b border-surface-line bg-[#f8f8fa]/90 p-2 text-ink backdrop-blur md:hidden'>
      <button
        className='-ml-0.5 -mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:bg-black/5 hover:text-ink'
        onClick={() => {
          setHideSideMenu(false);
        }}
        aria-label='menu'
      >
        <PanelLeftIcon className='h-4 w-4' />
      </button>
      <h1 className='flex-1 text-center text-sm font-medium truncate px-2'>
        {chatTitle}
      </h1>
      <button
        className='-mr-0.5 -mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:bg-black/5 hover:text-ink'
        onClick={() => {
          if (!generating) addChat();
        }}
        aria-label={t('newChat') as string}
      >
        <PlusIcon className='h-4 w-4' />
      </button>
    </div>
  );
};

export default MobileBar;

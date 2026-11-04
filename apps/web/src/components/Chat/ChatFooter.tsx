import React from 'react';
import useStore from '@store/store';
import LanguageSelector from '@components/LanguageSelector';
import { HelpIcon } from '@icon/ui';

const ChatFooter = () => {
  const hasMessages = useStore((state) => {
    const chat = state.chats?.[state.currentChatIndex];
    return (
      chat?.messages.some((m, i) => i !== 0 || m.role !== 'system') ?? false
    );
  });

  if (hasMessages) return null;

  return (
    <div className='flex w-full shrink-0 items-center justify-end px-4 pb-3 pt-1'>
      <div className='flex items-center gap-2'>
        <LanguageSelector iconOnly />
        <a
          className='flex h-10 w-10 items-center justify-center rounded-full border border-surface-line bg-white text-ink-muted transition-colors hover:text-ink'
          href='https://github.com/ztjhz/BetterChatGPT'
          target='_blank'
          rel='noreferrer'
          aria-label='help'
        >
          <HelpIcon className='h-5 w-5' />
        </a>
      </div>
    </div>
  );
};

export default ChatFooter;

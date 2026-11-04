import React from 'react';
import { useTranslation } from 'react-i18next';
import useStore from '@store/store';

import PlusIcon from '@icon/PlusIcon';

import useAddChat from '@hooks/useAddChat';

const NewChat = ({ folder }: { folder?: string }) => {
  const { t } = useTranslation();
  const generating = useStore((state) => state.generating);
  const addChat = useAddChat();

  return (
    <button
      className={`flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-3 py-2 text-sm font-medium text-white transition-all hover:bg-ink-soft ${
        generating
          ? 'cursor-not-allowed opacity-40'
          : 'cursor-pointer shadow-soft'
      }`}
      onClick={() => {
        if (!generating) addChat(folder);
      }}
      aria-label={t('newChat') as string}
    >
      <PlusIcon className='h-4 w-4' />
      {t('newChat')}
    </button>
  );
};

export default NewChat;

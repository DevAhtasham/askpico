import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import useStore from '@store/store';

import ChatIcon from '@icon/ChatIcon';
import { SearchIcon } from '@icon/ui';

const SearchModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const chats = useStore((state) => state.chats);
  const generating = useStore((state) => state.generating);
  const setCurrentChatIndex = useStore((state) => state.setCurrentChatIndex);
  const [query, setQuery] = useState<string>('');

  useEffect(() => {
    if (isOpen) setQuery('');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const normalized = query.trim().toLowerCase();
  const results = (chats ?? [])
    .map((chat, index) => ({ title: chat.title, index }))
    .filter((chat) => chat.title.toLowerCase().includes(normalized));

  return createPortal(
    <div
      className='fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm'
      onMouseDown={onClose}
    >
      <div
        className='mx-4 w-full max-w-lg rounded-2xl border border-surface-line bg-white p-4 shadow-2xl'
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className='flex items-center gap-2 border-b border-surface-line pb-2'>
          <span className='text-ink-muted'>
            <SearchIcon className='h-4 w-4' />
          </span>
          <input
            autoFocus
            type='text'
            className='h-12 w-full bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none'
            placeholder={t('search') as string}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className='mt-2 max-h-80 overflow-y-auto'>
          {results.length === 0 ? (
            <div className='px-3 py-6 text-center text-sm text-ink-muted'>
              No chats found
            </div>
          ) : (
            results.map((result) => (
              <button
                key={`${result.title}-${result.index}`}
                className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink-soft hover:bg-black/5 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40'
                disabled={generating}
                onClick={() => {
                  setCurrentChatIndex(result.index);
                  onClose();
                }}
              >
                <ChatIcon />
                <span className='min-w-0 truncate'>{result.title}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SearchModal;

import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import SearchModal from './SearchModal';
import SidebarNav from './SidebarNav';
import ChatHistory from './ChatHistory';
import ChatFolder from './ChatFolder';
import NewChat from './NewChat';

import { SearchIcon } from '@icon/ui';

import {
  ChatHistoryInterface,
  ChatHistoryFolderInterface,
  ChatInterface,
  FolderCollection,
} from '@type/chat';

import useStore from '@store/store';

const MAX_RECENT_CHATS = 5;

const getRecency = (chat: { updatedAt?: number; createdAt?: number }) =>
  chat.updatedAt ?? chat.createdAt ?? 0;

const getDayStart = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

type DateGroup =
  | 'today'
  | 'yesterday'
  | 'sevenDays'
  | 'older';

const groupChatsByDate = (chats: ChatHistoryInterface[]) => {
  const now = new Date();
  const todayStart = getDayStart(now);
  const yesterdayStart = todayStart - 86400000;
  const sevenDaysStart = todayStart - 6 * 86400000;

  const groups: Record<DateGroup, ChatHistoryInterface[]> = {
    today: [],
    yesterday: [],
    sevenDays: [],
    older: [],
  };

  chats.forEach((chat) => {
    if (getRecency(chat) === 0) {
      groups.older.push(chat);
      return;
    }
    const d = new Date(getRecency(chat));
    if (isNaN(d.getTime())) {
      groups.older.push(chat);
      return;
    }
    const dayStart = getDayStart(d);
    if (dayStart >= todayStart) groups.today.push(chat);
    else if (dayStart >= yesterdayStart) groups.yesterday.push(chat);
    else if (dayStart >= sevenDaysStart) groups.sevenDays.push(chat);
    else groups.older.push(chat);
  });

  return groups;
};

const SECTION_LABELS: { key: DateGroup; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'sevenDays', label: '7 days' },
  { key: 'older', label: 'Older' },
];

const ChatHistoryList = () => {
  const { t } = useTranslation();
  const [chatFolders, setChatFolders] = useState<ChatHistoryFolderInterface>(
    {}
  );
  const [noChatFolders, setNoChatFolders] = useState<ChatHistoryInterface[]>(
    []
  );
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  const updateFolders = useRef(() => {
    const _folders: ChatHistoryFolderInterface = {};
    const _noFolders: ChatHistoryInterface[] = [];
    const chats = useStore.getState().chats;
    const folders = useStore.getState().folders;

    if (chats) {
      chats.forEach((chat: ChatInterface, index: number) => {
        if (!chat.folder) {
          _noFolders.push({
            title: chat.title,
            index: index,
            id: chat.id,
            createdAt: chat.createdAt,
            updatedAt: chat.updatedAt,
          });
        } else {
          if (!_folders[chat.folder]) _folders[chat.folder] = [];
          _folders[chat.folder].push({
            title: chat.title,
            index: index,
            id: chat.id,
            createdAt: chat.createdAt,
            updatedAt: chat.updatedAt,
          });
        }
      });
    }

    const _chatFolders: ChatHistoryFolderInterface = {};
    for (const folderId in _folders) {
      if (!folders[folderId]) continue;
      _chatFolders[folderId] = _folders[folderId];
    }

    _noFolders.sort((a, b) => getRecency(b) - getRecency(a));

    setChatFolders(_chatFolders);
    setNoChatFolders(_noFolders.slice(0, MAX_RECENT_CHATS));
  }).current;

  useEffect(() => {
    updateFolders();

    return useStore.subscribe((state, prev) => {
      if (state.generating) return;
      if (state.chats !== prev.chats || state.generating !== prev.generating) {
        updateFolders();
      }
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className='flex flex-col min-h-0 flex-1'>
      <div className='mb-2 flex items-center gap-2'>
        <div className='min-w-0 flex-1'>
          <NewChat />
        </div>
        <button
          className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-surface-line bg-white text-ink-muted transition-colors hover:text-ink'
          onClick={() => setIsSearchOpen(true)}
          aria-label='search chats'
        >
          <SearchIcon className='h-4 w-4' />
        </button>
      </div>
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
      <SidebarNav />
      <div
        id='chat-history-scroll'
        className='flex-1 min-h-0 overflow-y-auto pt-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
      >
        {Object.keys(chatFolders).map((folderId) => (
          <ChatFolder
            folderChats={chatFolders[folderId]}
            folderId={folderId}
            key={folderId}
          />
        ))}
        <ChatSectionList chats={noChatFolders} />
      </div>
    </div>
  );
};

const ChatSectionList = ({ chats }: { chats: ChatHistoryInterface[] }) => {
  const groups = groupChatsByDate(chats);

  return (
    <>
      {SECTION_LABELS.map(({ key, label }) => {
        const groupChats = groups[key];
        if (groupChats.length === 0) return null;
        return (
          <div key={key} className='mb-2'>
            <div className='px-3 pb-0.5 text-[11px] font-medium uppercase tracking-wider text-ink-muted'>
              {label}
            </div>
            {groupChats.map((chat) => (
              <ChatHistory
                title={chat.title}
                chatIndex={chat.index}
                key={`${chat.title}-${chat.index}`}
              />
            ))}
          </div>
        );
      })}
    </>
  );
};

export default ChatHistoryList;

import React, { useEffect, useRef, useState } from 'react';

import ChatIcon from '@icon/ChatIcon';
import CrossIcon from '@icon/CrossIcon';
import DeleteIcon from '@icon/DeleteIcon';
import EditIcon from '@icon/EditIcon';
import TickIcon from '@icon/TickIcon';
import useStore from '@store/store';
import { clearArtifactState } from '@utils/artifactState';

const ChatHistoryClass = {
  normal:
    'flex py-1.5 px-2 items-center gap-2 relative rounded-lg text-ink-soft hover:bg-black/5 hover:text-ink break-all hover:pr-4 group transition-all',
  active:
    'flex py-1.5 px-2 items-center gap-2 relative rounded-lg break-all pr-14 bg-white border border-surface-line text-ink shadow-soft group transition-all',
};

const ChatHistory = React.memo(
  ({ title, chatIndex }: { title: string; chatIndex: number }) => {
    const setCurrentChatIndex = useStore((state) => state.setCurrentChatIndex);
    const setChats = useStore((state) => state.setChats);
    const active = useStore((state) => state.currentChatIndex === chatIndex);
    const generating = useStore((state) => state.generating);

    const [isDelete, setIsDelete] = useState<boolean>(false);
    const [isEdit, setIsEdit] = useState<boolean>(false);
    const [_title, _setTitle] = useState<string>(title);
    const inputRef = useRef<HTMLInputElement>(null);

    const editTitle = () => {
      const updatedChats = JSON.parse(
        JSON.stringify(useStore.getState().chats)
      );
      updatedChats[chatIndex].title = _title;
      setChats(updatedChats);
      setIsEdit(false);
    };

    const deleteChat = () => {
      const updatedChats = JSON.parse(
        JSON.stringify(useStore.getState().chats)
      );
      const deletedChatId = updatedChats[chatIndex]?.id;
      if (deletedChatId) clearArtifactState(deletedChatId);
      updatedChats.splice(chatIndex, 1);
      if (updatedChats.length > 0) {
        setCurrentChatIndex(0);
        setChats(updatedChats);
      } else {
        setCurrentChatIndex(-1);
        setChats([]);
      }
      setIsDelete(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        editTitle();
      }
    };

    const handleTick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();

      if (isEdit) editTitle();
      else if (isDelete) deleteChat();
    };

    const handleCross = () => {
      setIsDelete(false);
      setIsEdit(false);
    };

    const handleDragStart = (e: React.DragEvent<HTMLAnchorElement>) => {
      if (e.dataTransfer) {
        e.dataTransfer.setData('chatIndex', String(chatIndex));
      }
    };

    useEffect(() => {
      if (inputRef && inputRef.current) inputRef.current.focus();
    }, [isEdit]);

    return (
      <a
        className={`${
          active ? ChatHistoryClass.active : ChatHistoryClass.normal
        } ${
          generating
            ? 'cursor-not-allowed opacity-40'
            : 'cursor-pointer opacity-100'
        }`}
        onClick={() => {
          if (!generating) setCurrentChatIndex(chatIndex);
        }}
        draggable
        onDragStart={handleDragStart}
      >
        <ChatIcon />
        <div
          className='min-w-0 flex-1 truncate text-[13px] leading-5'
          title={title}
        >
          {isEdit ? (
            <input
              type='text'
              className='focus:outline-brand-400 text-[13px] border-none bg-transparent p-0 m-0 w-full'
              value={_title}
              onChange={(e) => {
                _setTitle(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              ref={inputRef}
            />
          ) : (
            _title
          )}

        </div>
        {active && (
          <div className='absolute flex right-1 z-10 text-ink-muted visible scale-90'>
            {isDelete || isEdit ? (
              <>
                <button
                  className='p-1 hover:text-brand-600'
                  onClick={handleTick}
                  aria-label='confirm'
                >
                  <TickIcon />
                </button>
                <button
                  className='p-1 hover:text-ink'
                  onClick={handleCross}
                  aria-label='cancel'
                >
                  <CrossIcon />
                </button>
              </>
            ) : (
              <>
                <button
                  className='p-1 hover:text-brand-600'
                  onClick={() => setIsEdit(true)}
                  aria-label='edit chat title'
                >
                  <EditIcon />
                </button>
                <button
                  className='p-1 hover:text-red-500'
                  onClick={() => setIsDelete(true)}
                  aria-label='delete chat'
                >
                  <DeleteIcon />
                </button>
              </>
            )}
          </div>
        )}
      </a>
    );
  }
);

export default ChatHistory;

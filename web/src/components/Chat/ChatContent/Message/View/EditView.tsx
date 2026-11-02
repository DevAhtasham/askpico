import React, { memo, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useStore from '@store/store';
import useDraftStore from '@store/draft-store';

import useSubmit from '@hooks/useSubmit';
import { selectOrCreateChat } from '@hooks/useAddChat';

import { ChatInterface } from '@type/chat';

import PopupModal from '@components/PopupModal';
import CommandPrompt from '../CommandPrompt';

import SendIcon from '@icon/SendIcon';
import {
  BookmarkIcon,
  DeepResearchIcon,
  GlobeIcon,
  MicIcon,
  PaperclipIcon,
  SparkleIcon,
} from '@icon/ui';
import DownChevronArrow from '@icon/DownChevronArrow';

const EditView = ({
  content,
  setIsEdit,
  messageIndex,
  sticky,
}: {
  content: string;
  setIsEdit: React.Dispatch<React.SetStateAction<boolean>>;
  messageIndex: number;
  sticky?: boolean;
}) => {
  const setChats = useStore((state) => state.setChats);
  const currentChatIndex = useStore((state) => state.currentChatIndex);
  const setImageMode = useStore((state) => state.setImageMode);

  const [_content, _setContent] = useState<string>(content);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [deepResearch, setDeepResearch] = useState<boolean>(false);
  const [webSearch, setWebSearch] = useState<boolean>(false);
  const [reasoning, setReasoning] = useState<boolean>(false);
  const [promptsOpen, setPromptsOpen] = useState<boolean>(false);
  const textareaRef = React.createRef<HTMLTextAreaElement>();
  const fileInputRef = React.createRef<HTMLInputElement>();

  const { t } = useTranslation();
  const generating = useStore((state) => state.generating);
  const draftContent = useDraftStore((state) => state.content);
  const setDraftContent = useDraftStore((state) => state.setContent);

  const resetTextAreaHeight = () => {
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|playbook|silk/i.test(
        navigator.userAgent
      );

    if (e.key === 'Enter' && !isMobile && !e.shiftKey) {
      if (sticky && _content === '') return;
      if (sticky) ensureActiveChat();
      const updatedChats: ChatInterface[] = JSON.parse(
        JSON.stringify(useStore.getState().chats)
      );
      const chatIndex = useStore.getState().currentChatIndex;
      const updatedMessages = updatedChats[chatIndex].messages;

      if (sticky) {
        updatedMessages.push({ role: 'user', content: _content });
        _setContent('');
        resetTextAreaHeight();
      } else {
        updatedMessages[messageIndex].content = _content;
        setIsEdit(false);
      }
      setChats(updatedChats);
      handleSubmit();
    }
  };

  const ensureActiveChat = () => {
    const { chats, currentChatIndex: index } = useStore.getState();
    if (!chats || !(index >= 0 && index < chats.length)) selectOrCreateChat();
  };

  const handleSave = () => {
    if (sticky && _content === '') return;
    if (sticky) ensureActiveChat();
    const updatedChats: ChatInterface[] = JSON.parse(
      JSON.stringify(useStore.getState().chats)
    );
    const chatIndex = useStore.getState().currentChatIndex;
    const updatedMessages = updatedChats[chatIndex].messages;

    if (sticky) {
      updatedMessages.push({ role: 'user', content: _content });
      _setContent('');
      resetTextAreaHeight();
    } else {
      updatedMessages[messageIndex].content = _content;
      setIsEdit(false);
    }
    setChats(updatedChats);
  };

  const { handleSubmit } = useSubmit();

  const handleGenerate = () => {
    if (useStore.getState().apiKey === '') {
      setIsModalOpen(true);
    } else {
      handleSave();
      handleSubmit();
    }
  };

  const handleAttachFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      _setContent((prev) =>
        prev ? `${prev}\n\n[File: ${file.name}]\n${text}` : `[File: ${file.name}]\n${text}`
      );
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDraftSync = (value: string) => {
    if (value === '') return;
    _setContent((prev) => {
      const next = prev ? `${prev}${value}` : value;
      return next;
    });
    setDraftContent('');
    textareaRef.current?.focus();
  };

  useEffect(() => {
    if (sticky && draftContent !== '') handleDraftSync(draftContent);
  }, [draftContent]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      textareaRef.current.style.maxHeight = '7.5rem';
    }
  }, [_content]);

  useEffect(() => {
    if (sticky && textareaRef.current) textareaRef.current.focus();
  }, []);

  const pillClass = (active: boolean) =>
    `flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
      active
        ? 'border-brand-200 bg-brand-50 text-brand-700'
        : 'border-surface-line bg-white text-ink-soft hover:bg-surface-muted'
    }`;

  return (
    <>
      <div
        className={`${
          sticky
            ? 'w-full'
            : 'w-full max-w-2xl'
        }`}
      >
        <div
          className='flex flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-card transition-shadow focus-within:shadow-[0_2px_6px_rgba(17,12,46,0.06),0_16px_48px_rgba(80,60,140,0.12)]'
        >
          <div className='p-4'>
            <textarea
            ref={textareaRef}
            className='m-0 max-h-[7.5rem] w-full resize-none overflow-y-auto border-0 bg-transparent p-1 px-2 text-sm leading-5 text-ink placeholder:text-ink-muted focus:outline-none focus:ring-0'
            style={{ minHeight: '40px' }}
            onChange={(e) => {
              _setContent(e.target.value);
            }}
            value={_content}
            placeholder={t('submitPlaceholder') as string}
            onKeyDown={handleKeyDown}
            rows={1}
          />

          <div className='mt-1 flex items-center justify-between gap-2'>
            <div className='flex flex-wrap items-center gap-1.5'>
              {sticky && (
                <button
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                    deepResearch
                      ? 'border-brand-300 bg-brand-50 text-brand-600'
                      : 'border-surface-line bg-white text-ink-soft hover:bg-surface-muted'
                  }`}
                  onClick={() => setDeepResearch((p) => !p)}
                  aria-label='deeper research'
                >
                  <SparkleIcon className='h-3.5 w-3.5 text-brand-500' />
                  Deeper Research
                </button>
              )}
              {sticky && (
                <button
                  className={`icon-btn !h-8 !w-8 ${
                    webSearch ? '!border-brand-200 !bg-brand-50 !text-brand-600' : ''
                  }`}
                  onClick={() => setWebSearch((p) => !p)}
                  aria-label='web search'
                >
                  <GlobeIcon className='h-4 w-4' />
                </button>
              )}
              {sticky && (
                <button
                  className={pillClass(reasoning)}
                  onClick={() => setReasoning((p) => !p)}
                  aria-label='reasoning mode'
                >
                  <DeepResearchIcon className='h-3.5 w-3.5' />
                </button>
              )}
              {sticky && (
                <button
                  className={pillClass(false)}
                  onClick={() => setImageMode(true)}
                  aria-label='image mode'
                >
                  Image
                </button>
              )}
              <input
                ref={fileInputRef}
                type='file'
                className='hidden'
                onChange={handleAttachFile}
                accept='.txt,.md,.json,.csv,.log,.py,.js,.ts,.tsx,.html,.css'
              />
            </div>

            <div className='flex items-center gap-1'>
              <button
                className='flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-white shadow-soft transition-all hover:bg-brand-600 disabled:opacity-50'
                onClick={
                  generating
                    ? () => useStore.getState().setGenerating(false)
                    : handleGenerate
                }
                aria-label={generating ? 'stop generating' : 'send message'}
              >
                {generating ? (
                  <svg
                    stroke='currentColor'
                    fill='none'
                    strokeWidth='1.5'
                    viewBox='0 0 24 24'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    className='h-3 w-3'
                    height='1em'
                    width='1em'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <rect x='3' y='3' width='18' height='18' rx='2' ry='2'></rect>
                  </svg>
                ) : _content.trim() === '' ? (
                  <MicIcon className='h-4 w-4' />
                ) : (
                  <SendIcon />
                )}
              </button>
            </div>
          </div>
          </div>

          {sticky && (
            <div className='flex items-center justify-between border-t border-gray-100 bg-gray-50/80 px-4 py-2.5'>
            <button
              className='flex items-center gap-1.5 text-xs font-medium text-ink-soft transition-colors hover:text-ink'
              onClick={() => setPromptsOpen((p) => !p)}
            >
              <BookmarkIcon className='h-3.5 w-3.5' />
              Saved prompts
              <DownChevronArrow />
            </button>
            <button
              className='flex items-center gap-1.5 text-xs font-medium text-ink-soft transition-colors hover:text-ink'
              onClick={() => fileInputRef.current?.click()}
            >
              <PaperclipIcon className='h-3.5 w-3.5' />
              Attach file
            </button>
            </div>
          )}
        </div>

        {sticky && promptsOpen && (
          <div className='mt-2'>
            <CommandPrompt _setContent={_setContent} expanded />
          </div>
        )}
      </div>

      {isModalOpen && (
        <PopupModal
          setIsModalOpen={setIsModalOpen}
          title={t('noAPIKeyWarning') as string}
          message={t('noAPIKeySubtitle') as string}
          handleConfirm={() => {
            setIsModalOpen(false);
            document.getElementById('api-menu')?.click();
          }}
        />
      )}
    </>
  );
};

export default memo(EditView);

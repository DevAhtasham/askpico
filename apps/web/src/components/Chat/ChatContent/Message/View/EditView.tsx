import React, { memo, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useStore from '@store/store';
import useDraftStore from '@store/draft-store';

import useSubmit from '@hooks/useSubmit';
import { selectOrCreateChat } from '@hooks/useAddChat';
import { extractAttachmentText } from '@api/api';
import { attachmentBlockReason } from '@constants/attachments';
import {
  convertImageFile,
  createThumbnailDataUrl,
  parseConvertTarget,
} from '@utils/imageConvert';

import { ChatInterface, MessageAttachmentInterface } from '@type/chat';
import {
  fileExtensionOf,
  registerAttachmentFile,
} from '@utils/attachmentStore';

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

const ATTACH_MAX_BYTES = 10 * 1024 * 1024;
const TEXT_EXTENSIONS = new Set([
  '.txt', '.md', '.json', '.csv', '.log', '.py', '.js', '.jsx', '.ts', '.tsx', '.html', '.css',
  '.xml', '.yaml', '.yml', '.sql', '.sh', '.java', '.c', '.cpp', '.h', '.go', '.rs', '.rb',
  '.php', '.swift', '.kt',
]);

interface PendingAttachment {
  id: string;
  name: string;
  status: 'loading' | 'ready' | 'error';
  isImage?: boolean;
  file?: File;
  text?: string;
  error?: string;
}

const extensionOf = (name: string) => {
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot).toLowerCase();
};

const readAsText = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      if (text.includes('\u0000') || text.includes('\uFFFD')) reject(new Error('text file nahi hai'));
      else resolve(text);
    };
    reader.onerror = () => reject(new Error('file parh nahi saki'));
    reader.readAsText(file);
  });

const readAsBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? '').split(',')[1] ?? '');
    reader.onerror = () => reject(new Error('file parh nahi saki'));
    reader.readAsDataURL(file);
  });

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
  const setError = useStore((state) => state.setError);
  const currentModel = useStore((state) => state.chats?.[state.currentChatIndex]?.config.model);

  const [_content, _setContent] = useState<string>(content);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [deepResearch, setDeepResearch] = useState<boolean>(false);
  const [webSearch, setWebSearch] = useState<boolean>(false);
  const [reasoning, setReasoning] = useState<boolean>(false);
  const [promptsOpen, setPromptsOpen] = useState<boolean>(false);
  const textareaRef = React.createRef<HTMLTextAreaElement>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const outgoingContent = [
    _content.trim(),
    ...attachments
      .filter((a) => a.status === 'ready' && a.text)
      .map((a) => `[File: ${a.name}]\n${a.text}`),
  ]
    .filter(Boolean)
    .join('\n\n');
  const attachmentsPending = attachments.some((a) => a.status === 'loading');
  const sendBlocked = () => {
    if (outgoingContent === '' || attachmentsPending) return true;
    const reason = attachmentBlockReason(_content, attachments, currentModel);
    if (reason) setError(reason);
    return reason !== null;
  };

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
      if (sticky) {
        void sendSticky();
      } else {
        handleSave();
        handleSubmit();
      }
    }
  };

  const ensureActiveChat = () => {
    const { chats, currentChatIndex: index } = useStore.getState();
    if (!chats || !(index >= 0 && index < chats.length)) selectOrCreateChat();
  };

  const handleSave = () => {
    const updatedChats: ChatInterface[] = JSON.parse(
      JSON.stringify(useStore.getState().chats)
    );
    const chatIndex = useStore.getState().currentChatIndex;
    updatedChats[chatIndex].messages[messageIndex].content = _content;
    updatedChats[chatIndex].messages = updatedChats[chatIndex].messages.slice(0, messageIndex + 1);
    setChats(updatedChats);
    setIsEdit(false);
  };

  const { handleSubmit } = useSubmit();

  const prepareOutgoing = async (): Promise<{
    content: string;
    fileContext: string;
    images: { name: string; url: string }[];
    files?: { name: string; url: string }[];
    attachments: MessageAttachmentInterface[];
    modelNote?: string;
  }> => {
    const text = _content.trim();
    const images = attachments.flatMap((a) =>
      a.isImage && a.status === 'ready' && a.file ? [{ name: a.name, file: a.file }] : []
    );
    const documents: MessageAttachmentInterface[] = attachments.flatMap((a) => {
      if (a.isImage || a.status === 'loading' || !a.file) return [];
      registerAttachmentFile(a.id, a.file);
      return [{ id: a.id, name: a.name, ext: fileExtensionOf(a.name) }];
    });
    const textParts = attachments
      .filter((a) => a.status === 'ready' && a.text)
      .map((a) => `[File: ${a.name}]\n${a.text}`);
    const content = text;
    const fileContext = textParts.join('\n\n');

    const previews = await Promise.all(
      images.map((image) =>
        createThumbnailDataUrl(image.file)
          .then((url) => ({ name: image.name, url }))
          .catch(() => null)
      )
    );
    const shownImages = previews.filter((p): p is { name: string; url: string } => p !== null);

    const target = images.length > 0 ? parseConvertTarget(text) : null;
    if (!target) {
      const modelNote =
        images.length > 0
          ? `Attached image(s): ${images.map((i) => i.name).join(', ')}. You cannot view image contents; say so briefly if the request needs visual analysis.`
          : undefined;
      return { content, fileContext, images: shownImages, attachments: documents, modelNote };
    }

    const results = await Promise.all(
      images.map((image) => convertImageFile(image.file, target).catch(() => null))
    );
    const files = results.filter((r): r is { name: string; url: string } => r !== null);
    const modelNote =
      files.length > 0
        ? `Tool note: the app has already converted the attached image(s) to ${target.toUpperCase()}, and the download card is shown to the user. Reply with one short sentence of at most 8 words confirming the conversion, for example: Your image has been converted to JPG. Do not ask for clarification and do not describe the image.`
        : `Tool note: converting the attached image(s) to ${target.toUpperCase()} failed in the browser. Tell the user briefly that the conversion failed.`;
    return { content, fileContext, images: shownImages, files, attachments: documents, modelNote };
  };

  const sendSticky = async () => {
    if (sendBlocked()) return;
    ensureActiveChat();
    const { content, fileContext, images, files, attachments: documents, modelNote } =
      await prepareOutgoing();
    const updatedChats: ChatInterface[] = JSON.parse(
      JSON.stringify(useStore.getState().chats)
    );
    const chatIndex = useStore.getState().currentChatIndex;
    updatedChats[chatIndex].messages.push({
      role: 'user',
      content,
      images,
      files,
      attachments: documents,
      fileContext,
      modelNote,
    });
    _setContent('');
    setAttachments([]);
    resetTextAreaHeight();
    setChats(updatedChats);
    handleSubmit();
  };

  const handleGenerate = () => {
    if (useStore.getState().apiKey === '') {
      setIsModalOpen(true);
    } else if (sticky) {
      void sendSticky();
    } else {
      handleSave();
      handleSubmit();
    }
  };

  const addAttachment = async (file: File) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const update = (patch: Partial<PendingAttachment>) =>
      setAttachments((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));

    setAttachments((prev) => [...prev, { id, name: file.name, status: 'loading', file }]);
    try {
      if (file.size > ATTACH_MAX_BYTES) throw new Error('10 MB se bari hai');
      if (file.type.startsWith('image/')) {
        update({ status: 'ready', isImage: true });
        return;
      }
      const text =
        file.type.startsWith('text/') || TEXT_EXTENSIONS.has(extensionOf(file.name))
          ? await readAsText(file)
          : await extractAttachmentText(file.name, await readAsBase64(file));
      update({ status: 'ready', text });
    } catch (err) {
      update({ status: 'error', error: (err as Error).message });
    }
  };

  const handleAttachFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    files.forEach((file) => {
      void addAttachment(file);
    });
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
            {attachments.length > 0 && (
              <div className='mb-2 flex flex-wrap gap-2 px-2'>
                {attachments.map((a) => (
                  <span
                    key={a.id}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
                      a.status === 'error'
                        ? 'border-red-200 bg-red-50 text-red-600'
                        : 'border-surface-line bg-surface-muted text-ink-soft'
                    }`}
                  >
                    {`${a.name}${
                      a.status === 'loading' ? ' (loading...)' : a.status === 'error' ? ` - ${a.error}` : ''
                    }`}
                    <button
                      type='button'
                      aria-label={`remove ${a.name}`}
                      onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== a.id))}
                    >
                      x
                    </button>
                  </span>
                ))}
              </div>
            )}
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
                onChange={handleAttachFiles}
                multiple
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

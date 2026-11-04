import React, { useState } from 'react';
import useStore from '@store/store';

import { MessageInterface, ToolJobInterface } from '@type/chat';
import { getAttachmentFile } from '@utils/attachmentStore';
import { convertPdfPages, parsePageSelection } from '@utils/pdfToPng';

const PdfPageSelector = ({
  toolJob,
  messageIndex,
}: {
  toolJob: ToolJobInterface;
  messageIndex: number;
}) => {
  const setChats = useStore((state) => state.setChats);
  const [input, setInput] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const patchMessage = (patch: Partial<MessageInterface>) => {
    const chats = JSON.parse(JSON.stringify(useStore.getState().chats));
    const chatIndex = useStore.getState().currentChatIndex;
    Object.assign(chats[chatIndex].messages[messageIndex], patch);
    setChats(chats);
  };

  const handleConvert = async () => {
    const file = getAttachmentFile(toolJob.fileId);
    if (!file) {
      setError('Ye PDF ab available nahi hai (page refresh ho gaya). Please dobara attach karein.');
      return;
    }
    const pages = parsePageSelection(input, toolJob.pageCount);
    if (!pages) {
      setError('Pages sahi nahi lage. Examples: all, 2, 1-3, 2,5');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const baseName = file.name.replace(/\.[^.]+$/, '');
      const files = await convertPdfPages(file, pages, baseName);
      patchMessage({
        content: `Converted ${pages.length} page(s) to PNG.`,
        files,
        toolJob: { ...toolJob, status: 'done' },
      });
    } catch (e: unknown) {
      setError(`Conversion failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className='mt-2 w-full max-w-xl rounded-2xl border border-brand-200 bg-brand-50 p-4 shadow-soft'>
      <p className='text-xs text-ink-soft'>
        Pages: <span className='font-medium'>all</span>, <span className='font-medium'>2</span> (first 2),{' '}
        <span className='font-medium'>1-3</span>, or <span className='font-medium'>2,5</span>
      </p>
      <div className='mt-2 flex items-center gap-2'>
        <input
          type='text'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !busy) void handleConvert();
          }}
          placeholder='all'
          className='min-w-0 flex-1 rounded-lg border border-surface-line bg-white px-3 py-2 text-sm text-ink focus:outline-none'
        />
        <button
          type='button'
          disabled={busy}
          onClick={() => void handleConvert()}
          className='rounded-full bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-soft transition-all hover:bg-brand-600 disabled:opacity-50'
        >
          {busy ? 'Converting...' : 'Convert'}
        </button>
      </div>
      {error && <p className='mt-2 text-xs text-red-600'>{error}</p>}
    </div>
  );
};

export default PdfPageSelector;

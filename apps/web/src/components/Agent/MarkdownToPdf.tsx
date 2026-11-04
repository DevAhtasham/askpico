import React, { useMemo, useState } from 'react';
import { markdownToHtml, printHtmlAsPdf } from '@utils/printDocument';

const MarkdownToPdf = () => {
  const [markdown, setMarkdown] = useState<string>('# Title\n\nYour **markdown** content here.');
  const [error, setError] = useState<string>('');
  const html = useMemo(() => markdownToHtml(markdown), [markdown]);

  const exportPdf = () => {
    setError('');
    if (!printHtmlAsPdf('document', html)) setError('Popup block hai. Is site ke liye popups allow karein.');
  };

  return (
    <div className='flex flex-col gap-3 rounded-2xl border border-surface-line bg-white p-4 text-sm'>
      <div className='grid gap-3 md:grid-cols-2'>
        <textarea
          aria-label='markdown input'
          className='min-h-[220px] rounded-lg border border-surface-line px-3 py-2 font-mono'
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
        />
        <div
          aria-label='markdown preview'
          className='min-h-[220px] overflow-auto rounded-lg border border-surface-line bg-white p-3'
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
      <button type='button' className='btn btn-primary self-start' onClick={exportPdf} disabled={!markdown.trim()}>
        Export PDF
      </button>
      {error && <p className='text-red-600'>{error}</p>}
      <p className='text-xs text-gray-500'>Browser print dialog mein "Save as PDF" chunein.</p>
    </div>
  );
};

export default MarkdownToPdf;

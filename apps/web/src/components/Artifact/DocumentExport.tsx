import React from 'react';

import { markdownToDocxBlob } from '@utils/docx';
import { markdownToHtml, printHtmlAsPdf } from '@utils/printDocument';

const buttonClass =
  'flex items-center gap-1 rounded-lg border border-surface-line bg-white px-2 py-1 text-xs text-ink-soft hover:bg-surface-muted';

const DocumentExport = ({ title, content }: { title: string; content: string }) => {
  const baseName = title.replace(/\.[^.]+$/, '') || 'document';

  const downloadDocx = async () => {
    const blob = await markdownToDocxBlob(content);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${baseName}.docx`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className='flex w-full items-center justify-end gap-2'>
      <button type='button' className={buttonClass} onClick={() => printHtmlAsPdf(baseName, markdownToHtml(content))}>
        Download PDF
      </button>
      <button type='button' className={buttonClass} onClick={() => void downloadDocx()}>
        Download DOCX
      </button>
    </div>
  );
};

export default DocumentExport;

import React, { useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MarkdownToHtml = () => {
  const [markdown, setMarkdown] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [html, setHtml] = useState<string>('');

  const convert = () => {
    const body = renderToStaticMarkup(
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    );
    setHtml(`<!doctype html>\n<html><head><meta charset="utf-8"><title>Document</title></head><body>\n${body}\n</body></html>`);
  };

  const download = () => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className='flex flex-col gap-3 text-sm'>
      <textarea
        aria-label='markdown input'
        className='min-h-[140px] rounded-lg border border-surface-line px-3 py-2 font-mono'
        placeholder='# Heading\n\nMarkdown yahan likhein'
        value={markdown}
        onChange={(e) => setMarkdown(e.target.value)}
      />
      <div className='flex gap-2'>
        <button className='btn btn-primary' onClick={convert}>
          Convert
        </button>
        <button className='btn btn-neutral' onClick={copy} disabled={!html}>
          {copied ? 'Copied' : 'Copy HTML'}
        </button>
        <button className='btn btn-neutral' onClick={download} disabled={!html}>
          Download .html
        </button>
      </div>
    </div>
  );
};

export default MarkdownToHtml;

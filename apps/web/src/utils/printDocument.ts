import { createElement, FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Markdown = ReactMarkdown as unknown as FunctionComponent<{
  remarkPlugins: unknown[];
  children: string;
}>;

export const markdownToHtml = (markdown: string): string =>
  renderToStaticMarkup(createElement(Markdown, { remarkPlugins: [remarkGfm], children: markdown }));

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Opens a print-friendly window; the user picks "Save as PDF" in the browser print dialog.
export const printHtmlAsPdf = (title: string, bodyHtml: string): boolean => {
  const win = window.open('', '_blank');
  if (!win) return false;
  win.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 800px; margin: 24px auto; padding: 0 16px; line-height: 1.5; color: #111; }
  pre, code { white-space: pre-wrap; }
  table { border-collapse: collapse; }
  td, th { border: 1px solid #ccc; padding: 4px 8px; }
  @media print { body { margin: 0; } }
</style>
</head>
<body>
${bodyHtml}
<script>window.onload = function () { setTimeout(function () { window.print(); }, 200); };</script>
</body>
</html>`);
  win.document.close();
  return true;
};

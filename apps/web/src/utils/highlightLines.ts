import hljs from 'highlight.js/lib/common';

const TAG_REGEX = /<span[^>]*>|<\/span>/g;

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const highlightToLines = (content: string, language: string): string[] => {
  const html = hljs.getLanguage(language)
    ? hljs.highlight(content, { language, ignoreIllegals: true }).value
    : escapeHtml(content);

  const openTags: string[] = [];
  return html.split('\n').map((line) => {
    const prefix = openTags.join('');
    for (const match of line.matchAll(TAG_REGEX)) {
      if (match[0].startsWith('</')) openTags.pop();
      else openTags.push(match[0]);
    }
    return `${prefix}${line}${'</span>'.repeat(openTags.length)}`;
  });
};

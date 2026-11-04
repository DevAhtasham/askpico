import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';

const HEADINGS: Array<[RegExp, (typeof HeadingLevel)[keyof typeof HeadingLevel]]> = [
  [/^###\s+/, HeadingLevel.HEADING_3],
  [/^##\s+/, HeadingLevel.HEADING_2],
  [/^#\s+/, HeadingLevel.HEADING_1],
];

// Splits **bold** segments into bold TextRuns; everything else is plain text.
const inlineRuns = (text: string): TextRun[] =>
  text
    .split(/(\*\*[^*]+\*\*)/)
    .filter((part) => part !== '')
    .map((part) =>
      part.startsWith('**') && part.endsWith('**')
        ? new TextRun({ text: part.slice(2, -2), bold: true })
        : new TextRun({ text: part })
    );

const toParagraph = (line: string): Paragraph | null => {
  const trimmed = line.trim();
  if (trimmed === '') return null;

  const heading = HEADINGS.find(([pattern]) => pattern.test(trimmed));
  if (heading) {
    const [pattern, level] = heading;
    return new Paragraph({ heading: level, children: inlineRuns(trimmed.replace(pattern, '')) });
  }

  if (/^[-*]\s+/.test(trimmed)) {
    return new Paragraph({ bullet: { level: 0 }, children: inlineRuns(trimmed.replace(/^[-*]\s+/, '')) });
  }

  return new Paragraph({ children: inlineRuns(trimmed) });
};

// Line-based Markdown subset (headings, bullets, bold, paragraphs) converted to a .docx Blob.
export const markdownToDocxBlob = async (markdown: string): Promise<Blob> => {
  const children = markdown
    .split('\n')
    .map(toParagraph)
    .filter((paragraph): paragraph is Paragraph => paragraph !== null);

  const doc = new Document({ sections: [{ children: children.length > 0 ? children : [new Paragraph('')] }] });
  return Packer.toBlob(doc);
};

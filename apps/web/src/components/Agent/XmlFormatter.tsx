import React, { useState } from 'react';

const INDENT = '  ';

// Pretty-prints well-formed XML by walking the parsed DOM tree.
const formatNode = (node: Node, depth: number): string => {
  const pad = INDENT.repeat(depth);
  if (node.nodeType === Node.TEXT_NODE) {
    const value = (node.textContent ?? '').trim();
    return value ? `${pad}${value}\n` : '';
  }
  if (node.nodeType === Node.COMMENT_NODE) return `${pad}<!--${node.textContent}-->\n`;
  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const el = node as Element;
  const attrs = Array.from(el.attributes)
    .map((a) => ` ${a.name}="${a.value}"`)
    .join('');
  const children = Array.from(el.childNodes);
  if (children.length === 0) return `${pad}<${el.tagName}${attrs} />\n`;
  if (children.length === 1 && children[0].nodeType === Node.TEXT_NODE) {
    return `${pad}<${el.tagName}${attrs}>${(children[0].textContent ?? '').trim()}</${el.tagName}>\n`;
  }
  const inner = children.map((c) => formatNode(c, depth + 1)).join('');
  return `${pad}<${el.tagName}${attrs}>\n${inner}${pad}</${el.tagName}>\n`;
};

const formatXml = (source: string): string => {
  const doc = new DOMParser().parseFromString(source, 'application/xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError) throw new Error(parseError.textContent?.split('\n')[0] ?? 'Invalid XML');
  return Array.from(doc.childNodes)
    .map((n) => formatNode(n, 0))
    .join('')
    .trimEnd();
};

const XmlFormatter = () => {
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string>('');

  const run = () => {
    try {
      setOutput(formatXml(input));
      setError('');
    } catch (e: unknown) {
      setOutput('');
      setError((e as Error).message);
    }
  };

  return (
    <div className='flex flex-col gap-3 text-sm'>
      <textarea
        aria-label='xml input'
        className='min-h-[120px] rounded-lg border border-surface-line px-3 py-2 font-mono'
        placeholder='Paste XML here'
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button className='btn btn-primary self-start' onClick={run}>
        Format XML
      </button>
      {error && <p className='text-red-600'>{error}</p>}
      {output && (
        <pre className='max-h-72 overflow-auto rounded-lg border border-surface-line bg-white p-3 font-mono text-xs'>
          {output}
        </pre>
      )}
    </div>
  );
};

export default XmlFormatter;

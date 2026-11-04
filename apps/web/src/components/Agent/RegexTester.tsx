import React, { useMemo, useState } from 'react';

const RegexTester = () => {
  const [pattern, setPattern] = useState<string>('');
  const [flags, setFlags] = useState<string>('g');
  const [text, setText] = useState<string>('');

  const result = useMemo(() => {
    if (pattern === '') return { error: '', matches: [] as string[] };
    try {
      const re = new RegExp(pattern, flags.includes('g') ? flags : `${flags}g`);
      const matches = Array.from(text.matchAll(re), (m) => m[0]);
      return { error: '', matches };
    } catch (e: unknown) {
      return { error: (e as Error).message, matches: [] as string[] };
    }
  }, [pattern, flags, text]);

  return (
    <div className='flex flex-col gap-3 text-sm'>
      <div className='flex gap-2'>
        <input
          aria-label='regex pattern'
          className='flex-1 rounded-lg border border-surface-line px-3 py-2 font-mono'
          placeholder='Pattern (e.g. \d{3}-\d{4})'
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
        />
        <input
          aria-label='regex flags'
          className='w-20 rounded-lg border border-surface-line px-3 py-2 font-mono'
          placeholder='gi'
          value={flags}
          onChange={(e) => setFlags(e.target.value.replace(/[^dgimsuy]/g, ''))}
        />
      </div>
      <textarea
        aria-label='test text'
        className='min-h-[100px] rounded-lg border border-surface-line px-3 py-2 font-mono'
        placeholder='Test text'
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {result.error && <p className='text-red-600'>{result.error}</p>}
      {!result.error && pattern !== '' && (
        <p className='text-ink-soft'>
          {result.matches.length} match{result.matches.length === 1 ? '' : 'es'}
        </p>
      )}
      {result.matches.length > 0 && (
        <ul className='flex flex-wrap gap-1'>
          {result.matches.map((m, i) => (
            <li key={i} className='rounded bg-brand-50 px-2 py-0.5 font-mono text-xs text-brand-700'>
              {m}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RegexTester;

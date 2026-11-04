import React, { useState } from 'react';
import { formatSql, minifySql } from '@utils/sqlFormat';

const SqlFormatter = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  return (
    <div className='flex flex-col gap-3 rounded-2xl border border-surface-line bg-white p-4 text-sm'>
      <textarea
        aria-label='sql input'
        className='min-h-[100px] rounded-lg border border-surface-line px-3 py-2 font-mono'
        placeholder='SELECT id, name FROM users WHERE active = 1 ORDER BY name'
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <div className='flex gap-2'>
        <button
          type='button'
          className='rounded-lg border border-surface-line px-3 py-1.5'
          onClick={() => setOutput(formatSql(input))}
          disabled={!input.trim()}
        >
          Format
        </button>
        <button
          type='button'
          className='rounded-lg border border-surface-line px-3 py-1.5'
          onClick={() => setOutput(minifySql(input))}
          disabled={!input.trim()}
        >
          Minify
        </button>
        <button
          type='button'
          className='rounded-lg border border-surface-line px-3 py-1.5'
          onClick={() => navigator.clipboard?.writeText(output)}
          disabled={!output}
        >
          Copy
        </button>
      </div>
      <pre className='max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-surface-muted p-3 font-mono'>
        {output || '—'}
      </pre>
    </div>
  );
};

export default SqlFormatter;

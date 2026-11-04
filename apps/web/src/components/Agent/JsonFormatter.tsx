import React, { useState } from 'react';

const JsonFormatter = () => {
  const [input, setInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string>('');

  const run = (mode: 'format' | 'minify') => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, mode === 'format' ? 2 : 0));
      setError('');
    } catch (e: unknown) {
      setOutput('');
      setError((e as Error).message);
    }
  };

  return (
    <div className='flex flex-col gap-3 text-sm'>
      <textarea
        aria-label='json input'
        className='min-h-[120px] rounded-lg border border-surface-line px-3 py-2 font-mono'
        placeholder='Paste JSON here'
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <div className='flex gap-2'>
        <button className='btn btn-primary' onClick={() => run('format')}>
          Format
        </button>
        <button className='btn btn-neutral' onClick={() => run('minify')}>
          Minify
        </button>
      </div>
      {error && <p className='text-red-600'>{error}</p>}
      {output && (
        <pre className='max-h-72 overflow-auto rounded-lg border border-surface-line bg-white p-3 font-mono text-xs'>
          {output}
        </pre>
      )}
    </div>
  );
};

export default JsonFormatter;

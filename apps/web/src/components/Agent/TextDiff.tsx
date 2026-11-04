import React, { useMemo, useState } from 'react';

type DiffLine = { type: 'same' | 'add' | 'remove'; text: string };

// Line-based LCS diff. Fine for the short texts this tool is meant for.
const diffLines = (a: string[], b: string[]): DiffLine[] => {
  const n = a.length;
  const m = b.length;
  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] =
        a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ type: 'same', text: a[i] });
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      out.push({ type: 'remove', text: a[i++] });
    } else {
      out.push({ type: 'add', text: b[j++] });
    }
  }
  while (i < n) out.push({ type: 'remove', text: a[i++] });
  while (j < m) out.push({ type: 'add', text: b[j++] });
  return out;
};

const rowClass: Record<DiffLine['type'], string> = {
  same: 'text-ink-soft',
  add: 'bg-green-50 text-green-700',
  remove: 'bg-red-50 text-red-700',
};

const rowPrefix: Record<DiffLine['type'], string> = {
  same: '  ',
  add: '+ ',
  remove: '- ',
};

const TextDiff = () => {
  const [left, setLeft] = useState<string>('');
  const [right, setRight] = useState<string>('');

  const lines = useMemo(
    () => diffLines(left.split('\n'), right.split('\n')),
    [left, right]
  );

  return (
    <div className='flex flex-col gap-3 text-sm'>
      <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
        <textarea
          aria-label='original text'
          className='min-h-[120px] rounded-lg border border-surface-line px-3 py-2 font-mono'
          placeholder='Original'
          value={left}
          onChange={(e) => setLeft(e.target.value)}
        />
        <textarea
          aria-label='changed text'
          className='min-h-[120px] rounded-lg border border-surface-line px-3 py-2 font-mono'
          placeholder='Changed'
          value={right}
          onChange={(e) => setRight(e.target.value)}
        />
      </div>
      {(left || right) && (
        <pre className='max-h-72 overflow-auto rounded-lg border border-surface-line bg-white p-3 font-mono text-xs'>
          {lines.map((line, index) => (
            <div key={index} className={rowClass[line.type]}>
              {rowPrefix[line.type]}
              {line.text}
            </div>
          ))}
        </pre>
      )}
    </div>
  );
};

export default TextDiff;

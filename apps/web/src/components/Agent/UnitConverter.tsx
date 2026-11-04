import React, { useState } from 'react';
import { UnitCategory, convert, unitsFor } from '@utils/unitConverter';

const categories: UnitCategory[] = ['length', 'mass', 'data', 'temperature'];

const UnitConverter = () => {
  const [category, setCategory] = useState<UnitCategory>('length');
  const units = unitsFor(category);
  const [from, setFrom] = useState<string>(units[0]);
  const [to, setTo] = useState<string>(units[1]);
  const [input, setInput] = useState<string>('1');

  const changeCategory = (next: UnitCategory) => {
    const list = unitsFor(next);
    setCategory(next);
    setFrom(list[0]);
    setTo(list[1]);
  };

  const value = Number(input);
  const result =
    input.trim() !== '' && Number.isFinite(value)
      ? convert(category, value, from, to)
      : null;

  return (
    <div className='flex flex-col gap-3 rounded-2xl border border-surface-line bg-white p-4 text-sm'>
      <select
        aria-label='category'
        className='rounded-lg border border-surface-line px-2 py-1.5'
        value={category}
        onChange={(e) => changeCategory(e.target.value as UnitCategory)}
      >
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <div className='flex gap-2'>
        <input
          className='flex-1 rounded-lg border border-surface-line px-3 py-2'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          inputMode='decimal'
        />
        <select
          aria-label='from unit'
          className='rounded-lg border border-surface-line px-2'
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        >
          {units.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>
      <div className='flex gap-2'>
        <div className='flex-1 rounded-lg border border-surface-line bg-surface-muted px-3 py-2 font-mono'>
          {result === null ? '—' : Number(result.toPrecision(10)).toString()}
        </div>
        <select
          aria-label='to unit'
          className='rounded-lg border border-surface-line px-2'
          value={to}
          onChange={(e) => setTo(e.target.value)}
        >
          {units.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default UnitConverter;

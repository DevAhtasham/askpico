import React, { useMemo, useState } from 'react';
import { formulas, physicsConstants } from '@utils/physics';

const formatNumber = (n: number) => {
  if (!Number.isFinite(n)) return '—';
  if (n !== 0 && (Math.abs(n) >= 1e6 || Math.abs(n) < 1e-3)) return n.toExponential(6);
  return Number(n.toPrecision(8)).toString();
};

const Physics = () => {
  const [mode, setMode] = useState<'constants' | 'formula'>('constants');
  const [query, setQuery] = useState('');
  const [formulaId, setFormulaId] = useState(formulas[0].id);
  const [values, setValues] = useState<Record<string, string>>({});

  const filteredConstants = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return physicsConstants;
    return physicsConstants.filter(
      (c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)
    );
  }, [query]);

  const formula = formulas.find((f) => f.id === formulaId) ?? formulas[0];
  const numeric = formula.inputs.map((input) => Number(values[input.key]));
  const allFilled = formula.inputs.every((input) => (values[input.key] ?? '').trim() !== '');
  const allValid = numeric.every((n) => Number.isFinite(n));
  const result = allFilled && allValid
    ? formula.compute(Object.fromEntries(formula.inputs.map((input, i) => [input.key, numeric[i]])))
    : null;

  return (
    <div className='flex flex-col gap-3 rounded-2xl border border-surface-line bg-white p-4 text-sm'>
      <div className='flex gap-2'>
        <button
          type='button'
          className={`rounded-lg px-3 py-1.5 ${mode === 'constants' ? 'bg-surface-muted font-semibold' : ''}`}
          onClick={() => setMode('constants')}
        >
          Constants
        </button>
        <button
          type='button'
          className={`rounded-lg px-3 py-1.5 ${mode === 'formula' ? 'bg-surface-muted font-semibold' : ''}`}
          onClick={() => setMode('formula')}
        >
          Formula
        </button>
      </div>

      {mode === 'constants' && (
        <>
          <input
            className='rounded-lg border border-surface-line px-3 py-2'
            placeholder='Search (e.g. Planck, c, gravity)'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <ul className='flex max-h-64 flex-col gap-1 overflow-auto'>
            {filteredConstants.map((c) => (
              <li key={c.symbol + c.name} className='flex justify-between gap-2 rounded-lg bg-surface-muted px-3 py-2'>
                <span>
                  {c.name} <span className='text-gray-500'>({c.symbol})</span>
                </span>
                <span className='font-mono'>
                  {c.value.toExponential(6)} {c.unit}
                </span>
              </li>
            ))}
            {filteredConstants.length === 0 && <li className='text-gray-500'>Koi constant nahi mila.</li>}
          </ul>
        </>
      )}

      {mode === 'formula' && (
        <>
          <select
            aria-label='formula'
            className='rounded-lg border border-surface-line px-2 py-1.5'
            value={formulaId}
            onChange={(e) => {
              setFormulaId(e.target.value as typeof formulaId);
              setValues({});
            }}
          >
            {formulas.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
          {formula.inputs.map((input) => (
            <label key={input.key} className='flex flex-col gap-1'>
              <span>{input.label}</span>
              <input
                className='rounded-lg border border-surface-line px-3 py-2'
                inputMode='decimal'
                value={values[input.key] ?? ''}
                onChange={(e) => setValues((prev) => ({ ...prev, [input.key]: e.target.value }))}
              />
            </label>
          ))}
          <div className='rounded-lg border border-surface-line bg-surface-muted px-3 py-2 font-mono'>
            {formula.output.label}: {result === null ? '—' : `${formatNumber(result)} ${formula.output.unit}`}
          </div>
        </>
      )}
    </div>
  );
};

export default Physics;

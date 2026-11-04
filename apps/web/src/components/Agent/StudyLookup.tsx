import React, { useState } from 'react';
import { fetchTool } from '@api/tools';

type Mode = 'wiki' | 'pubchem';

interface WikiResult {
  title: string;
  extract: string;
  url: string | null;
}

interface PubchemResult {
  cid: number;
  formula: string;
  molecularWeight: number;
  iupacName: string;
}

const StudyLookup = ({ mode }: { mode: Mode }) => {
  const [query, setQuery] = useState<string>('');
  const [wiki, setWiki] = useState<WikiResult | null>(null);
  const [chem, setChem] = useState<PubchemResult | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const search = async () => {
    if (query.trim() === '') return;
    setLoading(true);
    setError('');
    setWiki(null);
    setChem(null);
    try {
      if (mode === 'wiki') {
        setWiki(await fetchTool<WikiResult>('wiki', { topic: query.trim() }));
      } else {
        setChem(await fetchTool<PubchemResult>('pubchem', { name: query.trim() }));
      }
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex flex-col gap-3 text-sm'>
      <div className='flex gap-2'>
        <input
          className='flex-1 rounded-lg border border-surface-line px-3 py-2'
          placeholder={mode === 'wiki' ? 'Topic (e.g. Photosynthesis)' : 'Compound name (e.g. caffeine)'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
        />
        <button className='btn btn-primary' onClick={search} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>
      {error && <p className='text-red-600'>{error}</p>}
      {wiki && (
        <div className='rounded-xl border border-surface-line bg-white p-3'>
          <p className='font-medium'>{wiki.title}</p>
          <p className='mt-1 text-ink-soft'>{wiki.extract}</p>
          {wiki.url && (
            <a className='mt-2 inline-block text-xs text-brand-700 underline' href={wiki.url} target='_blank' rel='noreferrer'>
              Wikipedia par padhein
            </a>
          )}
        </div>
      )}
      {chem && (
        <div className='rounded-xl border border-surface-line bg-white p-3'>
          <p className='font-medium'>{chem.iupacName}</p>
          <p className='text-ink-soft'>Formula: {chem.formula}</p>
          <p className='text-ink-soft'>Molecular weight: {chem.molecularWeight} g/mol</p>
          <p className='text-xs text-ink-muted'>PubChem CID {chem.cid}</p>
        </div>
      )}
    </div>
  );
};

export default StudyLookup;

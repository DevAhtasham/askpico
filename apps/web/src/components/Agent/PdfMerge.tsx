import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';

const downloadBlob = (bytes: Uint8Array, name: string) => {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
};

const PdfMerge = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const pdfs = Array.from(list).filter((f) => f.type === 'application/pdf');
    setFiles((prev) => [...prev, ...pdfs]);
  };

  const move = (index: number, delta: number) => {
    setFiles((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const merge = async () => {
    if (files.length < 2) return;
    setBusy(true);
    setError(null);
    try {
      const merged = await PDFDocument.create();
      for (const file of files) {
        const source = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
        const pages = await merged.copyPages(source, source.getPageIndices());
        pages.forEach((page) => merged.addPage(page));
      }
      downloadBlob(await merged.save(), 'merged.pdf');
    } catch (err) {
      setError(`Merge failed: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className='flex flex-col gap-3 rounded-2xl border border-surface-line bg-white p-4 text-sm'>
      <input type='file' accept='application/pdf' multiple onChange={(e) => addFiles(e.target.files)} />
      <ol className='flex flex-col gap-1'>
        {files.map((file, index) => (
          <li key={`${file.name}-${index}`} className='flex items-center justify-between gap-2 rounded-lg bg-surface-muted px-3 py-2'>
            <span className='truncate'>
              {index + 1}. {file.name}
            </span>
            <span className='flex gap-1'>
              <button type='button' onClick={() => move(index, -1)} aria-label='move up'>↑</button>
              <button type='button' onClick={() => move(index, 1)} aria-label='move down'>↓</button>
              <button type='button' onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))} aria-label='remove'>✕</button>
            </span>
          </li>
        ))}
      </ol>
      {error && <p className='text-red-600'>{error}</p>}
      <div className='flex gap-2'>
        <button
          type='button'
          className='rounded-lg border border-surface-line px-3 py-1.5'
          onClick={merge}
          disabled={busy || files.length < 2}
        >
          {busy ? 'Merging…' : 'Merge PDFs'}
        </button>
        <button type='button' className='rounded-lg border border-surface-line px-3 py-1.5' onClick={() => setFiles([])}>
          Clear
        </button>
      </div>
    </div>
  );
};

export default PdfMerge;

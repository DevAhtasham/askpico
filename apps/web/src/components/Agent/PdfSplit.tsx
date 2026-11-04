import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';

// Accepts ranges like "1-3, 5, 8-9" (1-based). Returns zero-based page indexes or null if invalid.
export const parsePageRanges = (spec: string, pageCount: number): number[] | null => {
  const pages = new Set<number>();
  for (const part of spec.split(',').map((s) => s.trim()).filter(Boolean)) {
    const match = part.match(/^(\d+)(?:-(\d+))?$/);
    if (!match) return null;
    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : start;
    if (start < 1 || end > pageCount || start > end) return null;
    for (let page = start; page <= end; page += 1) pages.add(page - 1);
  }
  return pages.size > 0 ? [...pages].sort((a, b) => a - b) : null;
};

const PdfSplit = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [ranges, setRanges] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const loadFile = async (selected: File | undefined) => {
    setError('');
    setFile(selected ?? null);
    setPageCount(0);
    if (!selected) return;
    try {
      const doc = await PDFDocument.load(await selected.arrayBuffer(), { ignoreEncryption: true });
      setPageCount(doc.getPageCount());
    } catch (err) {
      setError(`PDF load nahi hui: ${(err as Error).message}`);
      setFile(null);
    }
  };

  const extract = async () => {
    if (!file) return;
    const indexes = parsePageRanges(ranges, pageCount);
    if (!indexes) {
      setError(`Page range galat hai. 1 se ${pageCount} ke darmiyan likhein (e.g. 1-3, 5).`);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const source = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      const output = await PDFDocument.create();
      const pages = await output.copyPages(source, indexes);
      pages.forEach((page) => output.addPage(page));
      const bytes = await output.save();
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${file.name.replace(/\.pdf$/i, '')}-split.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(`Split fail hua: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className='flex flex-col gap-3 rounded-2xl border border-surface-line bg-white p-4 text-sm'>
      <input type='file' accept='application/pdf' onChange={(e) => loadFile(e.target.files?.[0])} />
      {file && <p className='text-gray-500'>{file.name} · {pageCount} pages</p>}
      <input
        aria-label='page ranges'
        className='rounded-lg border border-surface-line px-3 py-2'
        placeholder='Pages (e.g. 1-3, 5)'
        value={ranges}
        onChange={(e) => setRanges(e.target.value)}
        disabled={!file}
      />
      {error && <p className='text-red-600'>{error}</p>}
      <button
        type='button'
        className='btn btn-primary self-start'
        onClick={extract}
        disabled={!file || busy || ranges.trim() === ''}
      >
        {busy ? 'Working…' : 'Extract pages'}
      </button>
    </div>
  );
};

export default PdfSplit;

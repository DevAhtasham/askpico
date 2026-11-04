import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

interface RenderedPage {
  name: string;
  url: string;
}

const RENDER_SCALE = 2;

const PdfToJpg = () => {
  const [pages, setPages] = useState<RenderedPage[]>([]);
  const [progress, setProgress] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const urlsRef = useRef<string[]>([]);

  const revokeAll = () => {
    urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    urlsRef.current = [];
  };

  useEffect(() => revokeAll, []);

  const convert = async (file: File | undefined) => {
    if (!file) return;
    revokeAll();
    setPages([]);
    setError('');
    setBusy(true);
    try {
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
      const rendered: RenderedPage[] = [];
      for (let number = 1; number <= pdf.numPages; number += 1) {
        setProgress(`Page ${number} / ${pdf.numPages}`);
        const page = await pdf.getPage(number);
        const viewport = page.getViewport({ scale: RENDER_SCALE });
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas context available nahi');
        await page.render({ canvasContext: context, viewport }).promise;
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
        if (!blob) throw new Error(`Page ${number} export fail hua`);
        const url = URL.createObjectURL(blob);
        urlsRef.current.push(url);
        rendered.push({ name: `${file.name.replace(/\.pdf$/i, '')}-page-${number}.jpg`, url });
        page.cleanup();
      }
      setPages(rendered);
    } catch (err) {
      setError(`Conversion fail hua: ${(err as Error).message}`);
    } finally {
      setBusy(false);
      setProgress('');
    }
  };

  return (
    <div className='flex flex-col gap-3 rounded-2xl border border-surface-line bg-white p-4 text-sm'>
      <input
        type='file'
        accept='application/pdf'
        disabled={busy}
        onChange={(e) => convert(e.target.files?.[0])}
      />
      {busy && <p className='text-gray-500'>{progress || 'Converting…'}</p>}
      {error && <p className='text-red-600'>{error}</p>}
      <ul className='flex flex-col gap-1'>
        {pages.map((page) => (
          <li key={page.url} className='flex items-center justify-between gap-2 rounded-lg bg-surface-muted px-3 py-2'>
            <span className='truncate'>{page.name}</span>
            <a className='btn btn-neutral' href={page.url} download={page.name}>
              Download
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PdfToJpg;

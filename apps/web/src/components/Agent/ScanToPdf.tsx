import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';

const ScanToPdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const images = Array.from(list).filter((f) => f.type === 'image/png' || f.type === 'image/jpeg');
    setFiles((prev) => [...prev, ...images]);
  };

  const convert = async () => {
    if (files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const pdf = await PDFDocument.create();
      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const image = file.type === 'image/png' ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
        const page = pdf.addPage([image.width, image.height]);
        page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
      }
      const url = URL.createObjectURL(new Blob([(await pdf.save()) as BlobPart], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'scan.pdf';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(`Conversion failed: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className='flex flex-col gap-3 rounded-2xl border border-surface-line bg-white p-4 text-sm'>
      <input type='file' accept='image/png,image/jpeg' multiple onChange={(e) => addFiles(e.target.files)} />
      <p className='text-gray-500'>PNG aur JPG images, jis tarteeb se select karein usi tarteeb se PDF pages banenge.</p>
      <ul className='flex flex-col gap-1'>
        {files.map((file, index) => (
          <li key={`${file.name}-${index}`} className='truncate rounded-lg bg-surface-muted px-3 py-2'>
            {index + 1}. {file.name}
          </li>
        ))}
      </ul>
      {error && <p className='text-red-600'>{error}</p>}
      <div className='flex gap-2'>
        <button
          type='button'
          className='rounded-lg border border-surface-line px-3 py-1.5'
          onClick={convert}
          disabled={busy || files.length === 0}
        >
          {busy ? 'Converting…' : 'Create PDF'}
        </button>
        <button type='button' className='rounded-lg border border-surface-line px-3 py-1.5' onClick={() => setFiles([])}>
          Clear
        </button>
      </div>
    </div>
  );
};

export default ScanToPdf;

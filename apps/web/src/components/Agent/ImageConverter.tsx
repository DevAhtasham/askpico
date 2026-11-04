import React, { useState } from 'react';

const FORMATS = ['image/png', 'image/jpeg', 'image/webp'] as const;
type Format = (typeof FORMATS)[number];

const extFor: Record<Format, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

const ImageConverter = () => {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<Format>('image/png');
  const [quality, setQuality] = useState<number>(0.9);
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const convert = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas is not available in this browser');
      if (format === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, format, format === 'image/png' ? undefined : quality)
      );
      if (!blob) throw new Error('Conversion failed');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const base = file.name.replace(/\.[^.]+$/, '') || 'image';
      a.href = url;
      a.download = `${base}.${extFor[format]}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className='flex flex-col gap-3 text-sm'>
      <input
        type='file'
        accept='image/*'
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <div className='flex flex-wrap items-center gap-2'>
        <select
          aria-label='output format'
          className='rounded-lg border border-surface-line px-2 py-1.5'
          value={format}
          onChange={(e) => setFormat(e.target.value as Format)}
        >
          {FORMATS.map((f) => (
            <option key={f} value={f}>
              {extFor[f].toUpperCase()}
            </option>
          ))}
        </select>
        {format !== 'image/png' && (
          <label className='flex items-center gap-2 text-ink-soft'>
            Quality
            <input
              type='range'
              min={0.1}
              max={1}
              step={0.05}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
            />
            {Math.round(quality * 100)}%
          </label>
        )}
        <button className='btn btn-primary' onClick={convert} disabled={!file || busy}>
          {busy ? 'Converting...' : 'Convert & download'}
        </button>
      </div>
      {error && <p className='text-red-600'>{error}</p>}
    </div>
  );
};

export default ImageConverter;

import React, { useState } from 'react';

const ImageResizer = () => {
  const [file, setFile] = useState<File | null>(null);
  const [width, setWidth] = useState<string>('800');
  const [keepRatio, setKeepRatio] = useState<boolean>(true);
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const resize = async () => {
    if (!file) return;
    const targetWidth = Number(width);
    if (!Number.isFinite(targetWidth) || targetWidth <= 0) {
      setError('Width ek positive number hona chahiye');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const bitmap = await createImageBitmap(file);
      const ratio = keepRatio ? bitmap.height / bitmap.width : null;
      const targetHeight = ratio === null ? bitmap.height : Math.round(targetWidth * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(targetWidth);
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas is not available in this browser');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );
      if (!blob) throw new Error('Resize failed');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.replace(/\.[^.]+$/, '') || 'image'}-${canvas.width}x${canvas.height}.png`;
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
      <input type='file' accept='image/*' onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      <div className='flex flex-wrap items-center gap-2'>
        <input
          aria-label='target width'
          className='w-28 rounded-lg border border-surface-line px-3 py-2'
          inputMode='numeric'
          value={width}
          onChange={(e) => setWidth(e.target.value)}
        />
        <span className='text-ink-soft'>px width</span>
        <label className='flex items-center gap-1 text-ink-soft'>
          <input type='checkbox' checked={keepRatio} onChange={(e) => setKeepRatio(e.target.checked)} />
          Aspect ratio rakhein
        </label>
        <button className='btn btn-primary' onClick={resize} disabled={!file || busy}>
          {busy ? 'Resizing...' : 'Resize & download'}
        </button>
      </div>
      {error && <p className='text-red-600'>{error}</p>}
    </div>
  );
};

export default ImageResizer;

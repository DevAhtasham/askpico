import React, { useState } from 'react';

const toHex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;

// Quantizes pixels into coarse buckets and returns the most frequent colors.
const extractPalette = async (file: File, count: number): Promise<string[]> => {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 200 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available in this browser');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const buckets = new Map<string, { count: number; r: number; g: number; b: number }>();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const key = `${r >> 4},${g >> 4},${b >> 4}`;
    const entry = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
    entry.count++;
    entry.r += r;
    entry.g += g;
    entry.b += b;
    buckets.set(key, entry);
  }

  return Array.from(buckets.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, count)
    .map((e) => toHex(Math.round(e.r / e.count), Math.round(e.g / e.count), Math.round(e.b / e.count)));
};

const ColorPalette = () => {
  const [palette, setPalette] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<string>('');

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    try {
      setPalette(await extractPalette(file, 6));
    } catch (e: unknown) {
      setPalette([]);
      setError((e as Error).message);
    }
  };

  const copy = async (hex: string) => {
    await navigator.clipboard.writeText(hex);
    setCopied(hex);
    setTimeout(() => setCopied(''), 1200);
  };

  return (
    <div className='flex flex-col gap-3 text-sm'>
      <input type='file' accept='image/*' onChange={(e) => onFile(e.target.files?.[0])} />
      {error && <p className='text-red-600'>{error}</p>}
      {palette.length > 0 && (
        <div className='flex flex-wrap gap-2'>
          {palette.map((hex) => (
            <button
              key={hex}
              onClick={() => copy(hex)}
              className='flex flex-col items-center gap-1 rounded-lg border border-surface-line bg-white p-2'
            >
              <span className='h-10 w-14 rounded' style={{ backgroundColor: hex }} />
              <span className='font-mono text-xs'>{copied === hex ? 'Copied' : hex}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ColorPalette;

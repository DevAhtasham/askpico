export type ConvertTarget = 'jpg' | 'png' | 'webp';

const MIME_BY_TARGET: Record<ConvertTarget, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export const parseConvertTarget = (text: string): ConvertTarget | null => {
  const lower = text.toLowerCase();
  const match = lower.match(/\b(jpe?g|png|webp)\b/);
  if (!match) return null;
  if (!/\b(convert|change|badal|into|to)\b/.test(lower)) return null;
  return match[1].startsWith('jp') ? 'jpg' : (match[1] as ConvertTarget);
};

export const createThumbnailDataUrl = async (file: File, maxSize = 160): Promise<string> => {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas is not available');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.8);
};

export const convertImageFile = async (
  file: File,
  target: ConvertTarget
): Promise<{ name: string; url: string }> => {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas is not available');
  if (target === 'jpg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const base = file.name.replace(/\.[^.]+$/, '');
  return {
    name: `${base}.${target}`,
    url: canvas.toDataURL(MIME_BY_TARGET[target], 0.92),
  };
};

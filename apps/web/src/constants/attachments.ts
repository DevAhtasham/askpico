export const VISION_MODELS: string[] = [];

const IMAGE_TOOL_INTENTS = [
  'convert',
  'resize',
  'scan',
  'qr',
  'background',
  'compress',
  'palette',
  'jpg',
  'png',
  'webp',
  'pdf',
  'ocr',
  'crop',
  'extract',
  'analy',
  'open',
  'kholo',
  'dekh',
  'batao',
  'badal',
  'size',
];

interface AttachmentLike {
  isImage?: boolean;
  status: string;
}

export const attachmentBlockReason = (
  text: string,
  attachments: AttachmentLike[],
  model: string | undefined
): string | null => {
  const hasImage = attachments.some((a) => a.isImage && a.status === 'ready');
  if (!hasImage) return null;

  const lower = text.toLowerCase();
  if (IMAGE_TOOL_INTENTS.some((keyword) => lower.includes(keyword))) return null;
  if (model && VISION_MODELS.includes(model)) return null;

  return `Current model (${model ?? 'unknown'}) image support nahi karta. Image par tool chalane ke liye message mein convert, resize, scan, QR, background, OCR ya analyze jaisa lafz likhein, ya vision model select karein.`;
};

import React, { useEffect, useState } from 'react';
import { getImage } from '@utils/imageStore';
import { ImageAspectRatio } from '@type/chat';

export type ImageCardState = 'idle' | 'loading' | 'success' | 'error';

interface ImageGenerateCardProps {
  prompt: string;
  provider: string;
  aspectRatio: ImageAspectRatio;
  state: ImageCardState;
  imageId?: string;
  mimeType?: string;
  errorMessage?: string;
  onGenerate: () => void;
}

const buttonClass =
  'rounded-lg border border-surface-line bg-white px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-surface-muted disabled:opacity-50';

const ImageGenerateCard = ({
  prompt,
  provider,
  aspectRatio,
  state,
  imageId,
  mimeType,
  errorMessage,
  onGenerate,
}: ImageGenerateCardProps) => {
  const [objectUrl, setObjectUrl] = useState<string>('');
  const [missing, setMissing] = useState<boolean>(false);

  useEffect(() => {
    if (state !== 'success' || !imageId) return;
    let url: string | undefined;
    let cancelled = false;
    getImage(imageId).then((blob) => {
      if (cancelled) return;
      if (!blob) {
        setMissing(true);
        return;
      }
      setMissing(false);
      url = URL.createObjectURL(blob);
      setObjectUrl(url);
    });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
      setObjectUrl('');
    };
  }, [state, imageId]);

  const extension = mimeType?.split('/')[1] ?? 'png';
  const aspectStyle = { aspectRatio: aspectRatio.replace(':', ' / ') };

  return (
    <div
      className={
        state === 'success'
          ? 'w-full overflow-hidden rounded-xl shadow-[0_4px_18px_rgba(17,12,46,0.10)]'
          : 'w-full max-w-md overflow-hidden rounded-2xl border border-surface-line bg-white p-3 shadow-card'
      }
    >
      {state !== 'success' && (
        <div className='mb-2 flex items-center justify-between text-xs text-ink-muted'>
          <span>Image · {provider}</span>
          <span>{aspectRatio}</span>
        </div>
      )}

      {state === 'loading' && (
        <div
          className='flex w-full flex-col items-center justify-center gap-3 rounded-xl bg-surface-muted'
          style={aspectStyle}
        >
          <span className='h-6 w-6 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500' />
          <p className='text-sm text-ink-soft'>Generating image...</p>
        </div>
      )}

      {state === 'success' && objectUrl && (
        <div className='group relative overflow-hidden rounded-xl'>
          <img src={objectUrl} alt={prompt} className='block w-full' />
          <a
            href={objectUrl}
            download={`fahmchat-image.${extension}`}
            aria-label='Download image'
            title='Download'
            className='absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink opacity-0 shadow-card transition-opacity hover:bg-white focus:opacity-100 group-hover:opacity-100'
          >
            <svg
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              className='h-4 w-4'
              aria-hidden='true'
            >
              <path d='M12 3v12' />
              <path d='m7 10 5 5 5-5' />
              <path d='M5 21h14' />
            </svg>
          </a>
        </div>
      )}

      {state === 'success' && !objectUrl && (
        <div className='flex flex-col items-start gap-2'>
          <p className='text-sm text-ink-soft'>
            {missing
              ? 'This image is no longer stored on this device.'
              : 'Loading image...'}
          </p>
          {missing && (
            <button onClick={onGenerate} className={buttonClass}>
              Generate again
            </button>
          )}
        </div>
      )}

      {state === 'error' && (
        <div className='flex flex-col items-start gap-2'>
          <p className='text-sm text-red-600'>
            {errorMessage || 'Image generation failed. Please try again.'}
          </p>
          <button onClick={onGenerate} className={buttonClass}>
            Try again
          </button>
        </div>
      )}

      {state === 'idle' && (
        <div className='flex flex-col items-start gap-2'>
          <p className='text-sm text-ink-soft'>{prompt}</p>
          <button onClick={onGenerate} className={buttonClass}>
            Generate image
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageGenerateCard;

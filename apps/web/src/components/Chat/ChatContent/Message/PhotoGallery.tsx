import React from 'react';

import { StockPhoto } from '@type/chat';

const triggerDownload = (href: string, name: string) => {
  const link = document.createElement('a');
  link.href = href;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
};

const downloadPhoto = async (photo: StockPhoto) => {
  const name = `${photo.source.toLowerCase()}-${photo.id}.jpg`;
  try {
    const response = await fetch(photo.download);
    if (!response.ok) throw new Error(`status ${response.status}`);
    const url = URL.createObjectURL(await response.blob());
    triggerDownload(url, name);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    window.open(photo.download, '_blank', 'noopener');
  }
};

const DownloadIcon = () => (
  <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2} className='h-5 w-5' aria-hidden='true'>
    <path strokeLinecap='round' strokeLinejoin='round' d='M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2' />
  </svg>
);

const PhotoGallery = ({ photos }: { photos: StockPhoto[] }) => (
  <div className='grid w-full grid-cols-2 gap-2'>
    {photos.map((photo) => (
      <div
        key={photo.id}
        className='group relative aspect-square overflow-hidden rounded-xl border border-surface-line bg-white shadow-soft'
      >
        <img
          src={photo.thumbnail}
          alt={photo.alt}
          loading='lazy'
          className='h-full w-full object-cover'
        />
        <div className='absolute inset-x-0 bottom-0 flex justify-center p-2'>
          <button
            type='button'
            aria-label='Download'
            title='Download'
            onClick={() => void downloadPhoto(photo)}
            className='flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-white shadow-soft transition-opacity hover:bg-brand-600 md:opacity-0 md:group-hover:opacity-100'
          >
            <DownloadIcon />
          </button>
        </div>
      </div>
    ))}
  </div>
);

export default PhotoGallery;

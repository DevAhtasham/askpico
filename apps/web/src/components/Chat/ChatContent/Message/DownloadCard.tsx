import React from 'react';

import { MessageFileInterface } from '@type/chat';

const DownloadCard = ({
  file,
  children,
}: {
  file: MessageFileInterface;
  children?: React.ReactNode;
}) => {
  const format = file.name.split('.').pop()?.toUpperCase() ?? 'FILE';

  return (
    <div className='relative flex h-14 w-full items-center rounded-2xl border border-brand-200 bg-brand-50 pl-16 pr-36 shadow-soft'>
      <span className='absolute left-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-white text-[10px] font-semibold text-brand-700 shadow-soft'>
        {format}
      </span>
      <p className='min-w-0 flex-1 truncate text-sm text-ink'>{children}</p>
      <a
        href={file.url}
        download={file.name}
        className='absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-2 rounded-full bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-soft transition-all hover:bg-brand-600'
      >
        <svg
          className='h-4 w-4'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
          aria-hidden='true'
        >
          <path d='M12 4v12m0 0l-5-5m5 5l5-5M5 20h14' />
        </svg>
        Download
      </a>
    </div>
  );
};

export default DownloadCard;

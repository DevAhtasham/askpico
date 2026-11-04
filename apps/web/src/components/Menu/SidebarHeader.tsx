import React from 'react';
import useStore from '@store/store';

import { PanelLeftIcon } from '@icon/ui';

const SidebarHeader = () => {
  const setHideSideMenu = useStore((state) => state.setHideSideMenu);

  return (
    <div className='flex items-center justify-between px-1 pb-2 pt-0'>
      <div className='flex items-center gap-2.5'>
        <div className='flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-soft'>
          <svg
            viewBox='0 0 24 24'
            fill='none'
            className='h-4.5 w-4.5'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <path d='M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.4L12 3z' />
            <path d='M19 14l1 2.6L22.6 18l-2.6 1-1 2.6-1-2.6-2.6-1 2.6-1.4L19 14z' />
          </svg>
        </div>
        <span className='text-[15px] font-semibold text-ink'>Pico</span>
      </div>
      <button
        className='flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-black/5 hover:text-ink'
        onClick={() => setHideSideMenu(true)}
        aria-label='close sidebar'
      >
        <PanelLeftIcon className='h-4 w-4' />
      </button>
    </div>
  );
};

export default SidebarHeader;

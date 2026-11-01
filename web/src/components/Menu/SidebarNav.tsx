import React, { useState } from 'react';

import { PromptLibraryMenuPopUp } from '@components/PromptLibraryMenu/PromptLibraryMenu';
import {
  CompassIcon,
  ClockIcon,
  FileIcon,
  LibraryIcon,
} from '@icon/ui';

const SidebarNav = () => {
  const [libraryOpen, setLibraryOpen] = useState<boolean>(false);

  const items: {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
  }[] = [
    {
      label: 'Explore',
      icon: <CompassIcon className='h-4 w-4' />,
      onClick: () => {
        window.dispatchEvent(new CustomEvent('fahmchat:focus-composer'));
      },
    },
    {
      label: 'Library',
      icon: <LibraryIcon className='h-4 w-4' />,
      onClick: () => setLibraryOpen(true),
    },
    {
      label: 'Files',
      icon: <FileIcon className='h-4 w-4' />,
      onClick: () => {
        window.dispatchEvent(new CustomEvent('fahmchat:attach-file'));
      },
    },
    {
      label: 'History',
      icon: <ClockIcon className='h-4 w-4' />,
      onClick: () => {
        document
          .getElementById('chat-history-scroll')
          ?.scrollTo({ top: 0, behavior: 'smooth' });
      },
    },
  ];

  return (
    <>
      <div className='flex flex-col gap-0 pb-1'>
        {items.map((item) => (
          <button
            key={item.label}
            className='sidebar-link w-full'
            onClick={item.onClick}
          >
            <span className='text-ink-muted'>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
      {libraryOpen && (
        <PromptLibraryMenuPopUp setIsModalOpen={setLibraryOpen} />
      )}
    </>
  );
};

export default SidebarNav;

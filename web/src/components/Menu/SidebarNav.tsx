import React, { useState } from 'react';

import useStore from '@store/store';
import { PromptLibraryMenuPopUp } from '@components/PromptLibraryMenu/PromptLibraryMenu';
import { CompassIcon, FileIcon, LibraryIcon, SparkleIcon } from '@icon/ui';

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
      label: 'Project',
      icon: <FileIcon className='h-4 w-4' />,
      onClick: () => useStore.getState().setProjectMode(true),
    },
    {
      label: 'Studio',
      icon: <SparkleIcon className='h-4 w-4' />,
      onClick: () => useStore.getState().setImageMode(true),
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

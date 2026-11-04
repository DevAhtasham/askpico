import React, { useEffect, useRef } from 'react';

import useStore from '@store/store';

import SidebarHeader from './SidebarHeader';
import ChatHistoryList from './ChatHistoryList';
import ProfileCard from './ProfileCard';

import CrossIcon2 from '@icon/CrossIcon2';

const Menu = () => {
  const hideSideMenu = useStore((state) => state.hideSideMenu);
  const setHideSideMenu = useStore((state) => state.setHideSideMenu);

  const windowWidthRef = useRef<number>(window.innerWidth);

  useEffect(() => {
    if (window.innerWidth < 768) setHideSideMenu(true);
    window.addEventListener('resize', () => {
      if (
        windowWidthRef.current !== window.innerWidth &&
        window.innerWidth < 768
      )
        setHideSideMenu(true);
    });
  }, []);

  return (
    <>
      <div
        id='menu'
        className={`group/menu fixed md:flex md:w-[264px] md:flex-col transition-transform z-[999] top-0 left-0 h-full md:h-auto md:inset-y-2 md:left-2 md:bg-transparent max-md:w-3/4 max-md:bg-white max-md:border-r max-md:border-surface-line ${
          hideSideMenu ? 'translate-x-[-100%]' : 'translate-x-[0%]'
        }`}
      >
        <div className='flex h-full min-h-0 flex-col'>
          <nav className='flex h-full flex-1 flex-col space-y-1 pl-3 pr-3 pt-3'>
            <SidebarHeader />
            <ChatHistoryList />
            <ProfileCard />
          </nav>
        </div>
        <div
          id='menu-close'
          className={`${
            hideSideMenu ? 'hidden' : ''
          } md:hidden absolute z-[999] right-0 translate-x-full top-10 bg-ink p-2 cursor-pointer text-white`}
          onClick={() => {
            setHideSideMenu(true);
          }}
        >
          <CrossIcon2 />
        </div>
      </div>
      <div
        id='menu-backdrop'
        className={`${
          hideSideMenu ? 'hidden' : ''
        } md:hidden fixed top-0 left-0 h-full w-full z-[60] bg-gray-900/70`}
        onClick={() => {
          setHideSideMenu(true);
        }}
      />
    </>
  );
};

export default Menu;

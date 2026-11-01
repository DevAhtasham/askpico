import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
import useStore from '@store/store';

import ConfigMenu from '@components/ConfigMenu';
import { SettingsPopup } from '@components/SettingsMenu/SettingsMenu';
import DownloadChat from './ChatContent/DownloadChat';
import CloneChat from './ChatContent/CloneChat';
import ShareGPT from '@components/ShareGPT';
import UpgradeModal from '@components/UpgradeModal/UpgradeModal';
import useHideOnOutsideClick from '@hooks/useHideOnOutsideClick';

import { ChatInterface, ConfigInterface, ModelOptions } from '@type/chat';
import { modelOptions } from '@constants/chat';
import {
  ExportUpIcon,
  GearIcon,
  PanelLeftIcon,
  ShareLinkIcon,
} from '@icon/ui';
import DownChevronArrow from '@icon/DownChevronArrow';

const ChatHeader = ({
  saveRef,
}: {
  saveRef: React.RefObject<HTMLDivElement>;
}) => {
  const { t } = useTranslation();
  const hideSideMenu = useStore((state) => state.hideSideMenu);
  const setHideSideMenu = useStore((state) => state.setHideSideMenu);
  const setChats = useStore((state) => state.setChats);
  const currentChatIndex = useStore((state) => state.currentChatIndex);
  const artifactPanelOpen = useStore((state) => state.artifactPanelOpen);
  const openArtifactPanel = useStore((state) => state.openArtifactPanel);
  const closeArtifactPanel = useStore((state) => state.closeArtifactPanel);
  const hasArtifacts = useStore((state) =>
    state.artifacts.some(
      (artifact) =>
        state.chats?.[state.currentChatIndex]?.id === artifact.chatId
    )
  );

  const config = useStore(
    (state) =>
      state.chats &&
      state.chats.length > 0 &&
      state.currentChatIndex >= 0 &&
      state.currentChatIndex < state.chats.length
        ? state.chats[state.currentChatIndex].config
        : undefined,
    shallow
  );

  const [modelDrop, setModelDrop, modelDropRef] = useHideOnOutsideClick();
  const [isSettingsOpen, setIsSettingsOpen] = React.useState<boolean>(false);
  const [isConfigOpen, setIsConfigOpen] = React.useState<boolean>(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] =
    React.useState<boolean>(false);

  const setConfig = (cfg: ConfigInterface) => {
    const updatedChats: ChatInterface[] = JSON.parse(
      JSON.stringify(useStore.getState().chats)
    );
    updatedChats[currentChatIndex].config = cfg;
    setChats(updatedChats);
  };

  const setModel = (model: ModelOptions) => {
    if (!config) return;
    setConfig({ ...config, model });
    setModelDrop(false);
  };

  return (
    <>
      <div className='relative z-40 flex items-center justify-between gap-2 bg-white/80 px-4 py-3 backdrop-blur'>
        <div className='flex min-w-0 items-center gap-2'>
          {hideSideMenu && (
            <button
              className='icon-btn !border-transparent !bg-transparent'
              onClick={() => setHideSideMenu(false)}
              aria-label='open sidebar'
            >
              <PanelLeftIcon className='h-4 w-4' />
            </button>
          )}

          {config && (
            <div className='relative' ref={modelDropRef}>
              <button
                className='flex items-center gap-2 rounded-xl border border-surface-line bg-white px-3 py-1.5 text-sm font-medium text-ink shadow-soft transition-colors hover:bg-surface-muted'
                onClick={() => setModelDrop((prev) => !prev)}
                aria-label='model selector'
              >
                <span className='flex h-5 w-5 items-center justify-center rounded-md bg-brand-100 text-brand-600'>
                  <svg
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    className='h-3 w-3'
                  >
                    <path d='M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.4L12 3z' />
                  </svg>
                </span>
                <span className='max-w-[140px] truncate'>{config.model}</span>
                <DownChevronArrow />
              </button>
              {modelDrop && (
                <div className='absolute left-0 top-full z-50 mt-1 max-h-72 w-56 overflow-y-auto rounded-xl border border-surface-line bg-white p-1 shadow-card'>
                  {modelOptions.map((m) => (
                    <button
                      key={m}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-surface-muted ${
                        m === config.model
                          ? 'bg-brand-50 text-brand-700'
                          : 'text-ink-soft'
                      }`}
                      onClick={() => setModel(m)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {!artifactPanelOpen && (
          <div className='flex items-center gap-1.5'>
            {hasArtifacts && (
            <button
              className='icon-btn !h-8 !w-8 !border-transparent !bg-transparent'
              onClick={() =>
                artifactPanelOpen
                  ? closeArtifactPanel()
                  : openArtifactPanel()
              }
              aria-label='toggle artifact panel'
            >
              <svg
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                className='h-4 w-4'
              >
                <rect x='3' y='4' width='18' height='16' rx='2' />
                <path d='M14 4v16' />
              </svg>
            </button>
          )}
          <ShareGPT />
          <CloneChat />

          <div className='hidden sm:block'>
            <DownloadChat saveRef={saveRef} />
          </div>

          <button
            className='icon-btn !h-8 !w-8 !border-transparent !bg-transparent'
            onClick={() => setIsSettingsOpen(true)}
            aria-label='settings'
          >
            <GearIcon className='h-4 w-4' />
          </button>
          </div>
        )}
      </div>

      {isUpgradeModalOpen && (
        <UpgradeModal onClose={() => setIsUpgradeModalOpen(false)} />
      )}

      {isSettingsOpen && (
        <SettingsPopup
          setIsModalOpen={setIsSettingsOpen}
          chatTools={
            <>
              {config && (
                <button
                  className='btn btn-neutral'
                  onClick={() => {
                    setIsSettingsOpen(false);
                    setIsConfigOpen(true);
                  }}
                >
                  Chat configuration
                </button>
              )}
              <button
                className='btn btn-primary'
                onClick={() => {
                  setIsSettingsOpen(false);
                  setIsUpgradeModalOpen(true);
                }}
              >
                Upgrade
              </button>
            </>
          }
        />
      )}

      {isConfigOpen && config && (
        <ConfigMenu
          setIsModalOpen={setIsConfigOpen}
          config={config}
          setConfig={setConfig}
        />
      )}
    </>
  );
};

export default ChatHeader;

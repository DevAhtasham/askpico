import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import useStore from '@store/store';

import PopupModal from '@components/PopupModal';
import { submitShareGPT } from '@api/api';
import { ShareGPTSubmitBodyInterface } from '@type/api';
import { ShareLinkIcon } from '@icon/ui';
import { logger } from '@utils/logger';

const ShareGPT = React.memo(() => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const handleConfirm = async () => {
    const chats = useStore.getState().chats;
    const currentChatIndex = useStore.getState().currentChatIndex;
    if (chats) {
      try {
        const items: ShareGPTSubmitBodyInterface['items'] = [];
        const messages = document.querySelectorAll('.share-gpt-message');

        messages.forEach((message, index) => {
          items.push({
            from: 'gpt',
            value: `<p><b>${t(
              chats[currentChatIndex].messages[index].role
            )}</b></p>${message.innerHTML}`,
          });
        });

        await submitShareGPT({
          avatarUrl: '',
          items,
        });
        setIsModalOpen(false);
      } catch (e: unknown) {
        logger.error('ShareGPT submit failed:', e);
      }
    }
  };

  return (
    <>
      <button
        className='icon-btn !h-9 !w-9'
        onClick={() => {
          setIsModalOpen(true);
        }}
        aria-label={t('postOnShareGPT.title') as string}
        title={t('postOnShareGPT.title') as string}
      >
        <ShareLinkIcon className='h-4 w-4' />
      </button>
      {isModalOpen && (
        <PopupModal
          setIsModalOpen={setIsModalOpen}
          title={t('postOnShareGPT.title') as string}
          message={t('postOnShareGPT.warning') as string}
          handleConfirm={handleConfirm}
        />
      )}
    </>
  );
});

export default ShareGPT;

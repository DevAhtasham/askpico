import React, { useState } from 'react';
import useStore from '@store/store';
import { useTranslation } from 'react-i18next';

import PopupModal from '@components/PopupModal';
import {
  FrequencyPenaltySlider,
  MaxTokenSlider,
  ModelSelector,
  PresencePenaltySlider,
  TemperatureSlider,
  TopPSlider,
} from '@components/ConfigMenu/ConfigMenu';

import { ModelOptions } from '@type/chat';
import { _defaultChatConfig } from '@constants/chat';

const ChatConfigMenu = () => {
  const { t } = useTranslation('model');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  return (
    <div>
      <button
        className='btn btn-neutral'
        onClick={() => setIsModalOpen(true)}
        aria-label={t('defaultChatConfig') as string}
      >
        {t('defaultChatConfig')}
      </button>
      {isModalOpen && <ChatConfigPopup setIsModalOpen={setIsModalOpen} />}
    </div>
  );
};

const ChatConfigPopup = ({
  setIsModalOpen,
}: {
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const config = useStore.getState().defaultChatConfig;
  const setDefaultChatConfig = useStore((state) => state.setDefaultChatConfig);
  const [_model, _setModel] = useState<ModelOptions>(config.model);
  const [_maxToken, _setMaxToken] = useState<number>(config.max_tokens);
  const [_temperature, _setTemperature] = useState<number>(config.temperature);
  const [_topP, _setTopP] = useState<number>(config.top_p);
  const [_presencePenalty, _setPresencePenalty] = useState<number>(
    config.presence_penalty
  );
  const [_frequencyPenalty, _setFrequencyPenalty] = useState<number>(
    config.frequency_penalty
  );

  const { t } = useTranslation('model');

  const handleSave = () => {
    setDefaultChatConfig({
      model: _model,
      max_tokens: _maxToken,
      temperature: _temperature,
      top_p: _topP,
      presence_penalty: _presencePenalty,
      frequency_penalty: _frequencyPenalty,
    });
    setIsModalOpen(false);
  };

  const handleReset = () => {
    _setModel(_defaultChatConfig.model);
    _setMaxToken(_defaultChatConfig.max_tokens);
    _setTemperature(_defaultChatConfig.temperature);
    _setTopP(_defaultChatConfig.top_p);
    _setPresencePenalty(_defaultChatConfig.presence_penalty);
    _setFrequencyPenalty(_defaultChatConfig.frequency_penalty);
  };

  return (
    <PopupModal
      title={t('defaultChatConfig') as string}
      setIsModalOpen={setIsModalOpen}
      handleConfirm={handleSave}
    >
      <div className='p-6 border-b border-gray-200 dark:border-gray-600 w-[90vw] max-w-full text-sm text-gray-900 dark:text-gray-300'>
        <ModelSelector _model={_model} _setModel={_setModel} />
        <MaxTokenSlider
          _maxToken={_maxToken}
          _setMaxToken={_setMaxToken}
          _model={_model}
        />
        <TemperatureSlider
          _temperature={_temperature}
          _setTemperature={_setTemperature}
        />
        <TopPSlider _topP={_topP} _setTopP={_setTopP} />
        <PresencePenaltySlider
          _presencePenalty={_presencePenalty}
          _setPresencePenalty={_setPresencePenalty}
        />
        <FrequencyPenaltySlider
          _frequencyPenalty={_frequencyPenalty}
          _setFrequencyPenalty={_setFrequencyPenalty}
        />
        <div
          className='btn btn-neutral cursor-pointer mt-5'
          onClick={handleReset}
        >
          {t('resetToDefault')}
        </div>
      </div>
    </PopupModal>
  );
};

export default ChatConfigMenu;

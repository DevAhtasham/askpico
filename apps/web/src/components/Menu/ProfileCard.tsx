import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import useStore from '@store/store';
import useProfileStore, { profileDisplayName } from '@store/profile-store';

import useHideOnOutsideClick from '@hooks/useHideOnOutsideClick';

import AboutMenu from '@components/AboutMenu';
import ImportExportChat from '@components/ImportExportChat';
import SettingsMenu from '@components/SettingsMenu';
import GoogleSync from '@components/GoogleSync';
import { TotalTokenCostDisplay } from '@components/SettingsMenu/TotalTokenCost';
import { SignOutIcon } from '@icon/ui';
import PersonIcon from '@icon/PersonIcon';
import CrossIcon from '@icon/CrossIcon';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || undefined;

const ProfileCard = () => {
  const { t } = useTranslation();
  const name = useProfileStore((state) => state.name);
  const email = useProfileStore((state) => state.email);
  const setProfile = useProfileStore((state) => state.setProfile);
  const countTotalTokens = useStore((state) => state.countTotalTokens);

  const [optionsOpen, setOptionsOpen] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [_name, _setName] = useState<string>('');
  const [_email, _setEmail] = useState<string>('');

  const displayName = profileDisplayName(name);
  const initial = displayName.charAt(0).toUpperCase();

  const startEdit = () => {
    _setName(name);
    _setEmail(email);
    setIsEdit(true);
  };

  const saveProfile = () => {
    setProfile({ name: _name.trim(), email: _email.trim() });
    setIsEdit(false);
  };

  return (
    <div className='relative mt-2'>
      {isEdit ? (
        <div className='rounded-xl border border-surface-line bg-white p-3 shadow-soft'>
          <input
            type='text'
            className='mb-2 w-full rounded-lg border border-surface-line px-2.5 py-1.5 text-sm text-ink focus:outline-brand-300'
            placeholder='Your name'
            value={_name}
            onChange={(e) => _setName(e.target.value)}
            autoFocus
          />
          <input
            type='email'
            className='mb-3 w-full rounded-lg border border-surface-line px-2.5 py-1.5 text-sm text-ink focus:outline-brand-300'
            placeholder='Email (optional)'
            value={_email}
            onChange={(e) => _setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveProfile();
            }}
          />
          <div className='flex gap-2'>
            <button
              className='flex-1 rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-white hover:bg-ink-soft transition-colors'
              onClick={saveProfile}
            >
              {t('save')}
            </button>
            <button
              className='rounded-lg border border-surface-line px-3 py-1.5 text-xs text-ink-soft hover:bg-surface-muted'
              onClick={() => setIsEdit(false)}
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      ) : (
        <div
          className='flex items-center gap-3 rounded-2xl border border-surface-line bg-white p-2.5 shadow-soft cursor-pointer transition-shadow hover:shadow-card'
          onClick={startEdit}
        >
          <div className='flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-semibold text-white'>
            {initial}
          </div>
          <div className='min-w-0 flex-1'>
            <div className='truncate text-sm font-medium text-ink'>
              {displayName}
            </div>
            <div className='truncate text-xs text-ink-muted'>
              {email || 'Free plan'}
            </div>
          </div>
          <button
            className='flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-black/10 hover:text-ink'
            onClick={(e) => {
              e.stopPropagation();
              setOptionsOpen((prev) => !prev);
            }}
            aria-label='account options'
          >
            <SignOutIcon className='h-4 w-4' />
          </button>
        </div>
      )}

      {optionsOpen && (
        <OptionsPopover close={() => setOptionsOpen(false)} />
      )}
    </div>
  );
};

const OptionsPopover = ({ close }: { close: () => void }) => {
  const countTotalTokens = useStore((state) => state.countTotalTokens);
  const [ref] = useOutsideRef(close);

  return (
    <div
      ref={ref}
      className='absolute bottom-full left-0 mb-2 w-full rounded-2xl border border-white/20 bg-gray-900 p-2 shadow-card z-50'
    >
      <div className='flex items-center justify-between px-2 pb-1'>
        <span className='text-xs font-medium text-gray-400'>Options</span>
        <button
          className='text-gray-400 hover:text-white'
          onClick={close}
          aria-label='close options'
        >
          <CrossIcon />
        </button>
      </div>
      {countTotalTokens && <TotalTokenCostDisplay />}
      {googleClientId && <GoogleSync clientId={googleClientId} />}
      <AboutMenu />
      <ImportExportChat />
      <SettingsMenu />
    </div>
  );
};

const useOutsideRef = (close: () => void) => {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [close]);
  return [ref] as const;
};

export default ProfileCard;

import React, { useEffect, useRef, useState } from 'react';
import { debounce } from 'lodash';
import useStore from '@store/store';
import { useTranslation } from 'react-i18next';

import { SearchIcon } from '@icon/ui';

const ChatSearch = ({
  filter,
  setFilter,
}: {
  filter: string;
  setFilter: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const { t } = useTranslation();
  const [_filter, _setFilter] = useState<string>(filter);
  const generating = useStore((state) => state.generating);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    _setFilter(e.target.value);
  };

  const debouncedUpdateFilter = useRef(
    debounce((f) => {
      setFilter(f);
    }, 300)
  ).current;

  useEffect(() => {
    debouncedUpdateFilter(_filter);
  }, [_filter]);

  return (
    <div className='relative mb-2'>
      <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink-muted'>
        <SearchIcon className='h-4 w-4' />
      </div>
      <input
        disabled={generating}
        autoFocus
        type='text'
        className='h-9 w-full rounded-lg border border-surface-line bg-surface-muted/60 pl-9 pr-8 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all'
        placeholder={t('search') as string}
        value={_filter}
        onChange={handleChange}
      />
      <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5'>
        <kbd className='rounded-md border border-surface-line bg-white px-1.5 py-0.5 text-[10px] font-medium text-ink-muted'>
          ⌘K
        </kbd>
      </div>
    </div>
  );
};

export default ChatSearch;

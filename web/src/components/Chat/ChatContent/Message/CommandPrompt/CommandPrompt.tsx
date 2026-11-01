import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useStore from '@store/store';
import { Prompt } from '@type/prompt';
import { matchSorter } from 'match-sorter';
import SearchBar from '@components/SearchBar';
import { LibraryIcon } from '@icon/ui';

const CommandPrompt = ({
  _setContent,
  expanded = false,
}: {
  _setContent: React.Dispatch<React.SetStateAction<string>>;
  expanded?: boolean;
}) => {
  const { t } = useTranslation();
  const prompts = useStore((state) => state.prompts);
  const [_prompts, _setPrompts] = useState<Prompt[]>(prompts);
  const [input, setInput] = useState<string>('');
  const [dropDown, setDropDown] = useState<boolean>(expanded);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    _setPrompts(prompts);
    setInput('');
  }, [prompts]);

  useEffect(() => {
    if (expanded) setDropDown(true);
  }, [expanded]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        !expanded &&
        inputRef.current &&
        event.target instanceof Node &&
        !inputRef.current.contains(event.target) &&
        dropDown
      ) {
        setDropDown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [inputRef, dropDown, expanded]);

  const list = (
    <ul className='max-h-56 overflow-y-auto text-sm text-ink-soft'>
      {input !== '' && (
        <li
          className='cursor-pointer rounded-lg px-3 py-2 hover:bg-surface-muted'
          onClick={() => {
            _setContent((prev) => prev + input);
            setInput('');
            if (!expanded) setDropDown(false);
          }}
        >
          {input}
        </li>
      )}
      {_prompts.map((cp) => (
        <li
          className='cursor-pointer rounded-lg px-3 py-2 hover:bg-surface-muted'
          key={cp.id}
          onClick={() => {
            _setContent((prev) => prev + cp.prompt);
            if (!expanded) setDropDown(false);
          }}
        >
          {cp.name}
        </li>
      ))}
    </ul>
  );

  if (expanded) {
    return (
      <div className='rounded-xl border border-surface-line bg-surface-muted/50 p-2'>
        <div className='mb-1 px-1'>
          <SearchBar
            value={input}
            handleChange={(e) => {
              setInput(e.target.value);
              _setPrompts(
                matchSorter(prompts, e.target.value, { keys: ['name'] })
              );
            }}
          />
        </div>
        {list}
      </div>
    );
  }

  return (
    <div className='relative max-wd-sm flex justify-center'>
      <button
        className='icon-btn !h-8 !w-8 !border-transparent !bg-transparent'
        aria-label='prompt library'
        title={t('promptLibrary') as string}
        onClick={() => {
          setDropDown((prev) => !prev);
          setInput('');
        }}
      >
        <LibraryIcon className='h-4 w-4' />
      </button>
      <div
        className={`${
          dropDown ? '' : 'hidden'
        } absolute bottom-full left-1/2 z-20 mb-2 w-[calc(100%-12px)] -translate-x-1/2 rounded-xl border border-surface-line bg-white p-2 shadow-card`}
      >
        <div className='prose dark:prose-invert'>
          <SearchBar
            value={input}
            handleChange={(e) => {
              setInput(e.target.value);
              _setPrompts(
                matchSorter(prompts, e.target.value, { keys: ['name'] })
              );
            }}
          />
          {list}
        </div>
      </div>
    </div>
  );
};

export default CommandPrompt;

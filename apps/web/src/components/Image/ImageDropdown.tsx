import React, { useEffect, useRef, useState } from 'react';

export interface ImageDropdownOption<T extends string> {
  value: T;
  label: string;
}

const ImageDropdown = <T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: ImageDropdownOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
}) => {
  const [open, setOpen] = useState<boolean>(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = options.find((item) => item.value === value);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className='relative'>
      <button
        type='button'
        aria-label={ariaLabel}
        aria-haspopup='listbox'
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className='flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-100 focus:outline-none'
      >
        {current?.label ?? ''}
        <svg
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden='true'
        >
          <path d='m6 9 6 6 6-6' />
        </svg>
      </button>
      {open && (
        <ul
          role='listbox'
          aria-label={ariaLabel}
          className='absolute bottom-full left-0 z-20 mb-2 min-w-full overflow-hidden rounded-xl border border-surface-line bg-white p-1 shadow-card'
        >
          {options.map((item) => {
            const selected = item.value === value;
            return (
              <li key={item.value}>
                <button
                  type='button'
                  role='option'
                  aria-selected={selected}
                  onClick={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-4 whitespace-nowrap rounded-lg px-3 py-1.5 text-left text-xs transition-colors ${
                    selected
                      ? 'bg-brand-50 font-semibold text-brand-700'
                      : 'text-ink-soft hover:bg-surface-muted hover:text-ink'
                  }`}
                >
                  {item.label}
                  {selected && (
                    <svg
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2.5'
                      className='h-3 w-3'
                      aria-hidden='true'
                    >
                      <path d='M20 6 9 17l-5-5' />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ImageDropdown;

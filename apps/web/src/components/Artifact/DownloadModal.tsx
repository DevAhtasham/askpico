import React, { useEffect, useRef, useState } from 'react';

import { createDesktopAppZip, saveDesktopAppZip } from '@utils/desktopPackage';

const DURATION_MS = 5000;

const DownloadModal = ({
  files,
  onClose,
}: {
  files: { path: string; content: string }[];
  onClose: () => void;
}) => {
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const snapshot = useRef(files).current;

  useEffect(() => {
    let cancelled = false;
    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      if (cancelled) return;
      const ratio = Math.min((now - start) / DURATION_MS, 1);
      setProgress(ratio);
      if (ratio < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    const timer = new Promise<void>((resolve) => setTimeout(resolve, DURATION_MS));

    Promise.all([timer, createDesktopAppZip(snapshot)])
      .then(([, blob]) => {
        if (cancelled) return;
        saveDesktopAppZip(blob);
        onCloseRef.current();
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error(err);
        setError(err instanceof Error ? err.message : 'Desktop app packaging failed');
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [snapshot]);

  const remaining = Math.ceil((1 - progress) * (DURATION_MS / 1000));

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm'>
      <div className='w-80 rounded-2xl border border-surface-line bg-white p-6 shadow-xl'>
        <h3 className='text-base font-semibold text-ink'>Preparing your desktop package...</h3>
        {error ? (
          <>
            <p className='mt-3 text-sm text-red-600'>{error}</p>
            <div className='mt-5 flex justify-end'>
              <button
                className='rounded-lg border border-surface-line bg-white px-3 py-1.5 text-sm text-ink-soft hover:bg-surface-muted'
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </>
        ) : (
          <>
            <p className='mt-1 text-sm text-ink-muted'>
              {progress < 1 ? `Starting download in ${remaining}s` : 'Creating ZIP...'}
            </p>
            <div className='mt-4 h-2 w-full overflow-hidden rounded-full bg-surface-muted'>
              <div
                className='h-full rounded-full bg-indigo-500 transition-[width] duration-100'
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DownloadModal;

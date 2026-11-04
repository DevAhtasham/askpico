import React, { useEffect, useState } from 'react';
import useStore from '@store/store';

const FocusMode = () => {
  const setHideSideMenu = useStore((state) => state.setHideSideMenu);
  const closeArtifactPanel = useStore((state) => state.closeArtifactPanel);
  const [active, setActive] = useState<boolean>(false);
  const [hidden, setHidden] = useState<boolean>(false);

  const enter = async () => {
    setHideSideMenu(true);
    closeArtifactPanel();
    setActive(true);
    try {
      await document.documentElement.requestFullscreen?.();
    } catch {
      // Fullscreen may be blocked; focus mode still works without it.
    }
  };

  const exit = async () => {
    setActive(false);
    setHidden(false);
    if (document.fullscreenElement) {
      await document.exitFullscreen?.().catch(() => undefined);
    }
  };

  useEffect(() => {
    if (!active) return;
    const onVisibility = () => setHidden(document.hidden);
    const onFullscreen = () => {
      if (!document.fullscreenElement) setActive(false);
    };
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('fullscreenchange', onFullscreen);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('fullscreenchange', onFullscreen);
    };
  }, [active]);

  return (
    <div className='flex flex-col items-start gap-3 rounded-2xl border border-surface-line bg-white p-4'>
      <p className='text-xs text-ink-muted'>
        Focus mode sirf Pico ke andar kaam karta hai. Sidebar aur artifact panel chhup jate hain.
      </p>
      {active ? (
        <button className='btn btn-neutral' onClick={exit}>
          Exit focus mode
        </button>
      ) : (
        <button className='btn btn-primary' onClick={enter}>
          Start focus mode
        </button>
      )}
      {active && hidden && (
        <span className='text-xs text-ink-soft'>Tab chhupa hai, focus abhi bhi chal raha hai.</span>
      )}
    </div>
  );
};

export default FocusMode;

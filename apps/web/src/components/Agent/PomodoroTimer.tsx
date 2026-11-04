import React, { useEffect, useRef, useState } from 'react';

type Phase = 'focus' | 'break';

const FOCUS_SECONDS = 1 * 60;
const BREAK_SECONDS = 5 * 60;

const formatTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const PomodoroTimer = () => {
  const [phase, setPhase] = useState<Phase>('focus');
  const [remaining, setRemaining] = useState<number>(FOCUS_SECONDS);
  const [running, setRunning] = useState<boolean>(false);
  const endAtRef = useRef<number>(0);

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const left = Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        setRunning(false);
        const nextPhase: Phase = phase === 'focus' ? 'break' : 'focus';
        setPhase(nextPhase);
        setRemaining(nextPhase === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS);
      }
    };
    const id = window.setInterval(tick, 500);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [running, phase]);

  const start = () => {
    endAtRef.current = Date.now() + remaining * 1000;
    setRunning(true);
  };

  const reset = () => {
    setRunning(false);
    setPhase('focus');
    setRemaining(FOCUS_SECONDS);
  };

  return (
    <div className='flex flex-col items-center gap-3 rounded-2xl border border-surface-line bg-white p-6 shadow-soft'>
      <span className='text-xs font-medium uppercase tracking-wide text-ink-muted'>
        {phase === 'focus' ? 'Focus' : 'Break'}
      </span>
      <span className='font-mono text-4xl text-ink' aria-live='polite'>
        {formatTime(remaining)}
      </span>
      <div className='flex gap-2'>
        <button className='btn btn-primary' onClick={running ? () => setRunning(false) : start}>
          {running ? 'Pause' : 'Start'}
        </button>
        <button className='btn btn-neutral' onClick={reset}>
          Reset
        </button>
      </div>
    </div>
  );
};

export default PomodoroTimer;

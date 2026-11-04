import React, { useEffect, useState } from 'react';
import useStore from '@store/store';

const notifyOrToast = (text: string) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Pico Reminder', { body: text });
  } else {
    window.alert(`Reminder: ${text}`);
  }
};

const toLocalInputValue = (timestamp: number) => {
  const d = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const Reminders = () => {
  const reminders = useStore((state) => state.reminders);
  const addReminder = useStore((state) => state.addReminder);
  const updateReminder = useStore((state) => state.updateReminder);
  const deleteReminder = useStore((state) => state.deleteReminder);

  const [text, setText] = useState<string>('');
  const [when, setWhen] = useState<string>(toLocalInputValue(Date.now() + 15 * 60 * 1000));

  useEffect(() => {
    const check = () => {
      const now = Date.now();
      useStore.getState().reminders.forEach((r) => {
        if (!r.done && r.remindAt <= now) {
          updateReminder(r.id, { done: true });
          notifyOrToast(r.text);
        }
      });
    };
    check();
    const id = window.setInterval(check, 15000);
    return () => window.clearInterval(id);
  }, [updateReminder]);

  const requestPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const save = () => {
    const remindAt = new Date(when).getTime();
    if (text.trim() === '' || Number.isNaN(remindAt)) return;
    requestPermission();
    addReminder({ id: crypto.randomUUID(), text: text.trim(), remindAt, done: false });
    setText('');
  };

  const sorted = [...reminders].sort((a, b) => a.remindAt - b.remindAt);

  return (
    <div className='flex flex-col gap-3'>
      <p className='text-xs text-ink-muted'>
        Reminders sirf tab tak chalen gay jab Pico khula ho.
      </p>
      <div className='flex flex-wrap gap-2'>
        <input
          className='flex-1 rounded-lg border border-surface-line px-3 py-2 text-sm'
          placeholder='Kis baat ki yaad dihani hai?'
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <input
          type='datetime-local'
          className='rounded-lg border border-surface-line px-3 py-2 text-sm'
          value={when}
          onChange={(e) => setWhen(e.target.value)}
        />
        <button className='btn btn-primary' onClick={save}>
          Add
        </button>
      </div>
      <ul className='flex flex-col gap-2'>
        {sorted.map((r) => (
          <li
            key={r.id}
            className='flex items-center justify-between gap-2 rounded-xl border border-surface-line bg-white p-3 text-sm'
          >
            <span className={r.done ? 'text-ink-muted line-through' : 'text-ink'}>
              {r.text} <span className='text-xs text-ink-muted'>({new Date(r.remindAt).toLocaleString()})</span>
            </span>
            <button
              className='text-xs text-ink-muted hover:text-red-600'
              onClick={() => deleteReminder(r.id)}
              aria-label={`delete reminder ${r.text}`}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Reminders;

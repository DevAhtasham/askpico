import React, { useEffect, useMemo, useState } from 'react';

const ZONES = [
  'Asia/Karachi',
  'Asia/Dubai',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'Australia/Sydney',
  'UTC',
];

const LiveTime = () => {
  const [now, setNow] = useState<Date>(new Date());
  const [zone, setZone] = useState<string>(
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  );

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const zones = useMemo(
    () => (ZONES.includes(zone) ? ZONES : [zone, ...ZONES]),
    [zone]
  );

  const format = (timeZone: string) =>
    new Intl.DateTimeFormat(undefined, {
      timeZone,
      dateStyle: 'medium',
      timeStyle: 'medium',
    }).format(now);

  return (
    <div className='flex flex-col gap-3 rounded-2xl border border-surface-line bg-white p-4'>
      <div className='flex items-center justify-between gap-2'>
        <span className='text-sm font-medium text-ink'>Local: {format(zone)}</span>
        <select
          aria-label='time zone'
          className='rounded-lg border border-surface-line px-2 py-1 text-sm'
          value={zone}
          onChange={(e) => setZone(e.target.value)}
        >
          {zones.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>
      </div>
      <ul className='flex flex-col gap-1 text-sm text-ink-soft'>
        {ZONES.filter((z) => z !== zone).map((z) => (
          <li key={z} className='flex justify-between'>
            <span>{z}</span>
            <span className='font-mono'>{format(z)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LiveTime;

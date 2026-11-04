import React, { useState } from 'react';

const DOWN_URL = 'https://speed.cloudflare.com/__down';
const UP_URL = 'https://speed.cloudflare.com/__up';
const STREAMS = 4;
const WARMUP_MS = 2000;
const TEST_MS = 10000;
const DOWN_CHUNK = 25_000_000;
const UP_CHUNK = 2_000_000;
const PING_SAMPLES = 5;

type Meter = { bytes: number; warmBytes: number; warmAt: number | null; lastAt: number };

const newMeter = (): Meter => ({ bytes: 0, warmBytes: 0, warmAt: null, lastAt: 0 });

const addBytes = (m: Meter, n: number, start: number) => {
  const now = performance.now();
  m.bytes += n;
  m.lastAt = now;
  if (m.warmAt === null && now - start >= WARMUP_MS) {
    m.warmAt = now;
    m.warmBytes = m.bytes;
  }
};

const rateMbps = (m: Meter): number => {
  if (m.warmAt === null || m.lastAt <= m.warmAt) return 0;
  const bits = (m.bytes - m.warmBytes) * 8;
  return bits / ((m.lastAt - m.warmAt) / 1000) / 1_000_000;
};

const measurePing = async (): Promise<number> => {
  const times: number[] = [];
  for (let i = 0; i < PING_SAMPLES; i++) {
    const t = performance.now();
    await fetch(`${DOWN_URL}?bytes=0&t=${Math.random()}`, { cache: 'no-store' });
    times.push(performance.now() - t);
  }
  times.sort((a, b) => a - b);
  return times[Math.floor(times.length / 2)];
};

const measureDownload = async (onLive: (v: number) => void): Promise<number> => {
  const meter = newMeter();
  const start = performance.now();
  const controller = new AbortController();
  const stop = setTimeout(() => controller.abort(), WARMUP_MS + TEST_MS);
  const ticker = setInterval(() => onLive(rateMbps(meter)), 500);

  const worker = async () => {
    try {
      while (!controller.signal.aborted) {
        const res = await fetch(`${DOWN_URL}?bytes=${DOWN_CHUNK}&t=${Math.random()}`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        const reader = res.body!.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          addBytes(meter, value.length, start);
        }
      }
    } catch (e) {
      if (!controller.signal.aborted) throw e;
    }
  };

  try {
    await Promise.all(Array.from({ length: STREAMS }, () => worker()));
  } finally {
    clearTimeout(stop);
    clearInterval(ticker);
  }
  return rateMbps(meter);
};

const measureUpload = async (onLive: (v: number) => void): Promise<number> => {
  const meter = newMeter();
  const start = performance.now();
  const payload = new Uint8Array(UP_CHUNK);
  const active = new Set<XMLHttpRequest>();
  let stopped = false;
  const stop = setTimeout(() => {
    stopped = true;
    active.forEach((x) => x.abort());
  }, WARMUP_MS + TEST_MS);
  const ticker = setInterval(() => onLive(rateMbps(meter)), 500);

  const post = () =>
    new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let last = 0;
      active.add(xhr);
      xhr.upload.onprogress = (e) => {
        addBytes(meter, e.loaded - last, start);
        last = e.loaded;
      };
      xhr.onerror = () => reject(new Error('Upload failed'));
      xhr.onloadend = () => {
        active.delete(xhr);
        resolve();
      };
      xhr.open('POST', `${UP_URL}?t=${Math.random()}`);
      xhr.send(payload);
    });

  const worker = async () => {
    while (!stopped) await post();
  };

  try {
    await Promise.all(Array.from({ length: STREAMS }, () => worker()));
  } finally {
    clearTimeout(stop);
    clearInterval(ticker);
  }
  return rateMbps(meter);
};

const NetworkSpeed = () => {
  const [running, setRunning] = useState<boolean>(false);
  const [ping, setPing] = useState<number | null>(null);
  const [download, setDownload] = useState<number | null>(null);
  const [upload, setUpload] = useState<number | null>(null);
  const [error, setError] = useState<string>('');

  const run = async () => {
    setRunning(true);
    setError('');
    setPing(null);
    setDownload(null);
    setUpload(null);
    try {
      setPing(await measurePing());
      setDownload(await measureDownload(setDownload));
      setUpload(await measureUpload(setUpload));
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className='flex flex-col gap-3 rounded-2xl border border-surface-line bg-white p-4 text-sm'>
      <button className='btn btn-primary self-start' onClick={run} disabled={running}>
        {running ? 'Testing...' : 'Start speed test'}
      </button>
      {error && <p className='text-red-600'>{error}</p>}
      <div className='grid grid-cols-2 gap-2'>
        <div className='rounded-lg bg-surface-muted p-3'>
          <p className='text-xs text-ink-muted'>Download</p>
          <p className='text-xl font-semibold'>
            {download === null ? '—' : download.toFixed(1)} <span className='text-xs'>Mbps</span>
          </p>
        </div>
        <div className='rounded-lg bg-surface-muted p-3'>
          <p className='text-xs text-ink-muted'>Upload</p>
          <p className='text-xl font-semibold'>
            {upload === null ? '—' : upload.toFixed(1)} <span className='text-xs'>Mbps</span>
          </p>
        </div>
      </div>
      <p className='text-xs text-ink-muted'>
        Browser se test hota hai: {STREAMS} parallel streams, {WARMUP_MS / 1000} sec warm-up, {TEST_MS / 1000} sec
        measurement. Ookla se kuch farq ho sakta hai (server aur network load par depend karta hai).
      </p>
    </div>
  );
};

export default NetworkSpeed;

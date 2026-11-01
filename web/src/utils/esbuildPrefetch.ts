type IdleHandle = number;

const scheduleIdle = (callback: () => void): IdleHandle => {
  if (typeof window.requestIdleCallback === 'function') {
    return window.requestIdleCallback(callback, { timeout: 5000 });
  }
  return window.setTimeout(callback, 2000);
};

export const prefetchEsbuildWasm = (): (() => void) => {
  let cancelled = false;

  const handle = scheduleIdle(async () => {
    if (cancelled) return;
    try {
      const { default: wasmURL } = await import('esbuild-wasm/esbuild.wasm?url');
      await fetch(wasmURL, { priority: 'low' } as RequestInit);
    } catch {
      // prefetch is best-effort; the preview path fetches on demand
    }
  });

  return () => {
    cancelled = true;
    if (typeof window.cancelIdleCallback === 'function') {
      window.cancelIdleCallback(handle);
    } else {
      window.clearTimeout(handle);
    }
  };
};

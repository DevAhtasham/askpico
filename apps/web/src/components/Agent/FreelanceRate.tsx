import React, { useEffect, useState } from 'react';
import { fetchTool } from '@api/tools';

interface CurrencyResult {
  rates: Record<string, number>;
}

const FreelanceRate = () => {
  const [usdRate, setUsdRate] = useState<number | null>(null);
  const [hourlyUsd, setHourlyUsd] = useState<string>('20');
  const [platformFee, setPlatformFee] = useState<string>('10');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchTool<CurrencyResult>('currency', { base: 'USD' })
      .then((data) => setUsdRate(data.rates.PKR ?? null))
      .catch((e: unknown) => setError((e as Error).message));
  }, []);

  const gross = Number(hourlyUsd);
  const fee = Number(platformFee);
  const valid = Number.isFinite(gross) && Number.isFinite(fee) && fee >= 0 && fee < 100;
  const net = valid ? gross * (1 - fee / 100) : null;

  return (
    <div className='flex flex-col gap-3 rounded-2xl border border-surface-line bg-white p-4 text-sm'>
      <label className='flex flex-col gap-1'>
        <span className='text-ink-soft'>Hourly rate (USD)</span>
        <input
          className='rounded-lg border border-surface-line px-3 py-2'
          inputMode='decimal'
          value={hourlyUsd}
          onChange={(e) => setHourlyUsd(e.target.value)}
        />
      </label>
      <label className='flex flex-col gap-1'>
        <span className='text-ink-soft'>Platform fee (%), Upwork/Fiverr ka fee apne account ke hisab se likhein</span>
        <input
          className='rounded-lg border border-surface-line px-3 py-2'
          inputMode='decimal'
          value={platformFee}
          onChange={(e) => setPlatformFee(e.target.value)}
        />
      </label>
      {error && <p className='text-red-600'>{error}</p>}
      {valid && net !== null && (
        <div className='rounded-lg bg-surface-muted p-3'>
          <p>Aap ko milega: <span className='font-semibold'>${net.toFixed(2)}</span> per hour</p>
          {usdRate !== null && (
            <p className='text-ink-soft'>
              PKR mein taqreeban: {(net * usdRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default FreelanceRate;

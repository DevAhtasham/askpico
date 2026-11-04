import React, { useEffect, useState } from 'react';
import { fetchTool } from '@api/tools';

interface CurrencyResult {
  base: string;
  updatedAt: string;
  rates: Record<string, number>;
}

interface CryptoResult {
  updatedAt: number;
  prices: Record<string, { usd: number; usd_24h_change?: number }>;
}

const WATCH = ['PKR', 'EUR', 'GBP', 'AED', 'SAR', 'INR'];

const LiveCurrency = () => {
  const [rates, setRates] = useState<CurrencyResult | null>(null);
  const [crypto, setCrypto] = useState<CryptoResult | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [fx, coins] = await Promise.all([
          fetchTool<CurrencyResult>('currency', { base: 'USD' }),
          fetchTool<CryptoResult>('crypto'),
        ]);
        if (!cancelled) {
          setRates(fx);
          setCrypto(coins);
          setError('');
        }
      } catch (e: unknown) {
        if (!cancelled) setError((e as Error).message);
      }
    };
    load();
    const id = window.setInterval(load, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  if (error) return <p className='text-sm text-red-600'>{error}</p>;
  if (!rates || !crypto) return <p className='text-sm text-ink-muted'>Loading rates...</p>;

  return (
    <div className='flex flex-col gap-3 rounded-2xl border border-surface-line bg-white p-4 text-sm'>
      <div>
        <p className='mb-1 font-medium text-ink'>Currency (1 USD)</p>
        <ul className='flex flex-col gap-1 text-ink-soft'>
          {WATCH.map((code) => (
            <li key={code} className='flex justify-between'>
              <span>{code}</span>
              <span className='font-mono'>{rates.rates[code]?.toFixed(2) ?? 'n/a'}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className='mb-1 font-medium text-ink'>Crypto (USD)</p>
        <ul className='flex flex-col gap-1 text-ink-soft'>
          {Object.entries(crypto.prices).map(([id, p]) => (
            <li key={id} className='flex justify-between'>
              <span className='capitalize'>{id}</span>
              <span className='font-mono'>
                {p.usd.toLocaleString()}
                {typeof p.usd_24h_change === 'number' && (
                  <span className={p.usd_24h_change >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {' '}({p.usd_24h_change.toFixed(2)}%)
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <p className='text-xs text-ink-muted'>
        Gold (beta): free key-less source abhi final nahi hua, is liye yahan nahi dikhaya gaya.
      </p>
    </div>
  );
};

export default LiveCurrency;

import React, { useState } from 'react';
import { fetchTool } from '@api/tools';

interface WeatherResult {
  city: string;
  country: string;
  timezone: string;
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
  };
  units: Record<string, string>;
}

const weatherLabel = (code: number): string => {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 48) return 'Fog';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Showers';
  return 'Storm';
};

const LiveWeather = () => {
  const [city, setCity] = useState<string>('');
  const [result, setResult] = useState<WeatherResult | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const search = async () => {
    if (city.trim() === '') return;
    setLoading(true);
    setError('');
    try {
      setResult(await fetchTool<WeatherResult>('weather', { city: city.trim() }));
    } catch (e: unknown) {
      setResult(null);
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex flex-col gap-3 rounded-2xl border border-surface-line bg-white p-4'>
      <div className='flex gap-2'>
        <input
          className='flex-1 rounded-lg border border-surface-line px-3 py-2 text-sm'
          placeholder='City name (e.g. Lahore)'
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
        />
        <button className='btn btn-primary' onClick={search} disabled={loading}>
          {loading ? 'Loading...' : 'Check'}
        </button>
      </div>
      {error && <p className='text-sm text-red-600'>{error}</p>}
      {result && (
        <div className='text-sm text-ink'>
          <p className='font-medium'>
            {result.city}
            {result.country ? `, ${result.country}` : ''}
          </p>
          <p className='text-2xl font-semibold'>
            {result.current.temperature_2m}
            {result.units.temperature_2m} · {weatherLabel(result.current.weather_code)}
          </p>
          <p className='text-ink-soft'>
            Humidity {result.current.relative_humidity_2m}
            {result.units.relative_humidity_2m} · Wind {result.current.wind_speed_10m}
            {result.units.wind_speed_10m}
          </p>
          <p className='text-xs text-ink-muted'>
            {result.timezone} · {result.current.time}
          </p>
        </div>
      )}
    </div>
  );
};

export default LiveWeather;

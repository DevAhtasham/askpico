import React, { useState } from 'react';
import { fetchTool } from '@api/tools';

interface StockPhoto {
  id: string;
  source: string;
  alt: string;
  photographer: string;
  pageUrl: string;
  thumbnail: string;
  original: string;
}

interface StockResult {
  total: number;
  photos: StockPhoto[];
}

const StockSearch = () => {
  const [query, setQuery] = useState('');
  const [photos, setPhotos] = useState<StockPhoto[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTool<StockResult>('stock', { query: query.trim() });
      setPhotos(data.photos);
      setTotal(data.total);
    } catch (err) {
      setPhotos([]);
      setTotal(null);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex flex-col gap-3 rounded-2xl border border-surface-line bg-white p-4 text-sm'>
      <form
        className='flex gap-2'
        onSubmit={(e) => {
          e.preventDefault();
          search();
        }}
      >
        <input
          className='flex-1 rounded-lg border border-surface-line px-3 py-2'
          placeholder='Search photos (e.g. mountains, office desk)'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type='submit' className='rounded-lg border border-surface-line px-3 py-2' disabled={loading}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>
      {error && <p className='text-red-600'>{error}</p>}
      {total !== null && <p className='text-gray-500'>{total} results (showing {photos.length})</p>}
      <div className='grid max-h-96 grid-cols-2 gap-2 overflow-auto sm:grid-cols-3'>
        {photos.map((photo) => (
          <figure key={photo.id} className='flex flex-col gap-1'>
            <a href={photo.original} target='_blank' rel='noreferrer'>
              <img src={photo.thumbnail} alt={photo.alt} loading='lazy' className='h-28 w-full rounded-lg object-cover' />
            </a>
            <figcaption className='truncate text-xs text-gray-500'>
              <a href={photo.pageUrl} target='_blank' rel='noreferrer'>
                {photo.photographer}
              </a>
              <span> · {photo.source}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      {photos.length > 0 && (
        <p className='text-xs text-gray-500'>Photos Pexels aur Pixabay ki free license ke tehat hain.</p>
      )}
    </div>
  );
};

export default StockSearch;

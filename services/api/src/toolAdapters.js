// Route 1 (temporary, direct free APIs). Each adapter maps a tool id to one free provider.
// When the unified gateway (Route 2) is chosen, only this file's adapters change; the frontend keeps calling /api/tools/:tool.

const fetchJson = async (url, headers = {}) => {
  const response = await fetch(url, { headers: { Accept: 'application/json', ...headers } });
  if (!response.ok) throw new Error(`upstream responded ${response.status}`);
  return response.json();
};

const weather = async ({ city }) => {
  if (!city) throw new Error('city is required');
  const key = process.env.VISUALCROSSING_API_KEY;
  const keyParam = key ? `&key=${encodeURIComponent(key)}` : '';
  const data = await fetchJson(
    `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(String(city))}?unitGroup=metric&include=current&contentType=json${keyParam}`
  );
  if (!data.currentConditions) throw new Error('weather data not found for this city');
  return {
    location: data.resolvedAddress,
    timezone: data.timezone,
    current: data.currentConditions,
    units: 'temperature C, wind km/h, humidity %',
  };
};

const currency = async ({ base }) => {
  const code = String(base ?? 'USD').toUpperCase();
  const key = process.env.EXCHANGERATE_API_KEY;
  if (key) {
    const keyed = await fetchJson(
      `https://v6.exchangerate-api.com/v6/${encodeURIComponent(key)}/latest/${encodeURIComponent(code)}`
    );
    if (keyed.result !== 'success') throw new Error(keyed['error-type'] ?? 'rate lookup failed');
    return {
      base: keyed.base_code,
      updatedAt: keyed.time_last_update_utc,
      source: 'ExchangeRate-API',
      rates: keyed.conversion_rates,
    };
  }
  const data = await fetchJson(`https://open.er-api.com/v6/latest/${encodeURIComponent(code)}`);
  if (data.result !== 'success') throw new Error('rate lookup failed');
  return {
    base: data.base_code,
    updatedAt: data.time_last_update_utc,
    rates: data.rates,
  };
};

const crypto = async () => {
  const key = process.env.FREECRYPTOAPI_KEY;
  if (key) {
    const response = await fetch('https://api.freecryptoapi.com/v1/getData?symbol=BTC+ETH+SOL', {
      headers: { Accept: 'application/json', Authorization: `Bearer ${key}` },
    });
    if (!response.ok) throw new Error(`FreeCryptoAPI responded ${response.status}`);
    const text = await response.text();
    return { updatedAt: Date.now(), source: 'FreeCryptoAPI', prices: JSON.parse(text) };
  }
  const data = await fetchJson(
    'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true'
  );
  return { updatedAt: Date.now(), source: 'CoinGecko', prices: data };
};

const wiki = async ({ topic }) => {
  if (!topic) throw new Error('topic is required');
  const data = await fetchJson(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(String(topic).replace(/ /g, '_'))}`
  );
  return { title: data.title, extract: data.extract, url: data.content_urls?.desktop?.page ?? null };
};

const pubchem = async ({ name }) => {
  if (!name) throw new Error('name is required');
  const data = await fetchJson(
    `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(String(name))}/property/MolecularFormula,MolecularWeight,IUPACName/JSON`
  );
  const props = data.PropertyTable?.Properties?.[0];
  if (!props) throw new Error('compound not found');
  return {
    cid: props.CID,
    formula: props.MolecularFormula,
    molecularWeight: props.MolecularWeight,
    iupacName: props.IUPACName,
  };
};

const pexelsPhotos = async (query, size) => {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;
  const data = await fetchJson(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${size}`,
    { Authorization: key }
  );
  return {
    total: data.total_results ?? 0,
    photos: (data.photos ?? []).map((p) => ({
      id: `pexels-${p.id}`,
      source: 'Pexels',
      alt: p.alt ?? '',
      photographer: p.photographer,
      pageUrl: p.url,
      thumbnail: p.src?.medium,
      download: p.src?.large,
    })),
  };
};

const pixabayPhotos = async (query, size) => {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) return null;
  const data = await fetchJson(
    `https://pixabay.com/api/?key=${encodeURIComponent(key)}&q=${encodeURIComponent(query.slice(0, 100))}&per_page=${Math.max(size, 3)}&image_type=photo&safesearch=true`
  );
  return {
    total: data.totalHits ?? 0,
    photos: (data.hits ?? []).map((h) => ({
      id: `pixabay-${h.id}`,
      source: 'Pixabay',
      alt: h.tags ?? '',
      photographer: h.user,
      pageUrl: h.pageURL,
      thumbnail: h.webformatURL,
      download: h.largeImageURL,
    })),
  };
};

const stock = async ({ query, perPage = '4' }) => {
  if (!query) throw new Error('query is required');
  const size = Math.min(Math.max(Number(perPage) || 4, 1), 30);
  const results = await Promise.allSettled([
    pexelsPhotos(String(query), size),
    pixabayPhotos(String(query), size),
  ]);
  const providers = results.filter((r) => r.status === 'fulfilled' && r.value).map((r) => r.value);
  if (providers.length === 0) {
    const failure = results.find((r) => r.status === 'rejected');
    throw new Error(failure?.reason?.message ?? 'PEXELS_API_KEY ya PIXABAY_API_KEY services/api/.env mein set karein');
  }
  const photos = [];
  for (let i = 0; i < size; i++) {
    for (const provider of providers) {
      if (provider.photos[i] && photos.length < size) photos.push(provider.photos[i]);
    }
  }
  return {
    total: providers.reduce((sum, p) => sum + p.total, 0),
    photos,
  };
};

export const toolAdapters = {
  weather,
  currency,
  crypto,
  wiki,
  pubchem,
  stock,
};

import postcss from 'postcss';
import tailwindcss from 'tailwindcss';

const MAX_SOURCES = 50;
const MAX_TOTAL_CHARS = 2_000_000;

const tailwindConfig = {
  content: [],
  darkMode: 'class',
  theme: { extend: {} },
  plugins: [],
};

const TAILWIND_ENTRY = '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n';

export const validateSources = (sources) => {
  if (!Array.isArray(sources) || sources.length === 0) return 'sources must be a non-empty array';
  if (sources.length > MAX_SOURCES) return `sources cannot exceed ${MAX_SOURCES} files`;
  if (!sources.every((s) => typeof s === 'string')) return 'every source must be a string';
  if (sources.reduce((total, s) => total + s.length, 0) > MAX_TOTAL_CHARS) {
    return `sources cannot exceed ${MAX_TOTAL_CHARS} characters in total`;
  }
  return null;
};

export const compileTailwind = async (sources) => {
  const config = {
    ...tailwindConfig,
    content: sources.map((raw) => ({ raw, extension: 'jsx' })),
  };
  const result = await postcss([tailwindcss(config)]).process(TAILWIND_ENTRY, {
    from: undefined,
  });
  return result.css;
};

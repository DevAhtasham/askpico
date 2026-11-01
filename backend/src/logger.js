const isProduction = process.env.NODE_ENV === 'production';

export const logger = {
  debug: (...args) => {
    if (!isProduction) console.log(...args);
  },
  info: (...args) => {
    if (!isProduction) console.log(...args);
  },
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
};

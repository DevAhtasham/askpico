import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import wasm from 'vite-plugin-wasm';
import { fileURLToPath } from 'node:url';

const clientLogRelay = (): Plugin => ({
  name: 'client-log-relay',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use('/__client-log', (req, res) => {
      if (req.method !== 'POST') {
        res.statusCode = 405;
        res.end();
        return;
      }
      let body = '';
      req.setEncoding('utf8');
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        try {
          const { level, message } = JSON.parse(body);
          const print =
            level === 'error'
              ? server.config.logger.error
              : level === 'warn'
              ? server.config.logger.warn
              : server.config.logger.info;
          print(`[client] ${message}`);
          res.statusCode = 204;
        } catch {
          res.statusCode = 400;
        }
        res.end();
      });
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [process.env.VITEST ? null : react(), wasm(), clientLogRelay()],
  resolve: {
    alias: {
      '@icon/': fileURLToPath(new URL('./src/assets/icons/', import.meta.url)) + '/',
      '@type/': fileURLToPath(new URL('./src/types/', import.meta.url)) + '/',
      '@store/': fileURLToPath(new URL('./src/store/', import.meta.url)) + '/',
      '@hooks/': fileURLToPath(new URL('./src/hooks/', import.meta.url)) + '/',
      '@constants/': fileURLToPath(new URL('./src/constants/', import.meta.url)) + '/',
      '@api/': fileURLToPath(new URL('./src/api/', import.meta.url)) + '/',
      '@components/': fileURLToPath(new URL('./src/components/', import.meta.url)) + '/',
      '@utils/': fileURLToPath(new URL('./src/utils/', import.meta.url)) + '/',
      '@src/': fileURLToPath(new URL('./src/', import.meta.url)) + '/',
    },
  },
  base: './',
  build: {
    target: 'esnext',
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// (b) Code splitting.
// 1. Route pages are loaded with import() (src/routes/lazyPages.js), so each one is its own file.
// 2. Libraries are grouped into a few long-lived "vendor" files. They change rarely, so the
//    browser (and the service worker) can keep them cached across app updates.
const vendorChunk = (id) => {
  if (!id.includes('node_modules')) return undefined;
  if (/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom|@remix-run)\//.test(id)) return 'react-vendor';
  if (/node_modules\/(@reduxjs|react-redux|redux|redux-thunk|immer|reselect|use-sync-external-store)\//.test(id)) return 'redux-vendor';
  if (/node_modules\/(axios|follow-redirects|form-data|proxy-from-env)\//.test(id)) return 'http-vendor';
  return undefined;
};

// (f) Content-Security-Policy for the production build (added as a <meta> tag).
// Only files from the same origin may run; images may come from any https site
// (product photos); the app may only call its own API. If VITE_API_URL points to
// another server, that server is added to connect-src.
const buildCsp = (apiUrl) => {
  let apiOrigin = '';
  try { apiOrigin = apiUrl ? new URL(apiUrl).origin : ''; } catch { /* ignore bad URL */ }
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    `connect-src 'self'${apiOrigin ? ' ' + apiOrigin : ''}`,
    "manifest-src 'self'",
    "worker-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
};

const cspPlugin = (csp) => ({
  name: 'inject-csp',
  apply: 'build', // dev server needs inline scripts for hot reload, so it is skipped there
  transformIndexHtml(html) {
    return html.replace(/(<meta charset[^>]*>)/i, `$1\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`);
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    // Where the site lives: "/" (Netlify, Vercel) or "/ShopEasy/" (GitHub Pages, set by the workflow)
    base: env.VITE_BASE || '/',
    plugins: [react(), cspPlugin(buildCsp(env.VITE_API_URL))],
    build: {
      rollupOptions: { output: { manualChunks: vendorChunk } },
    },
    server: {
      // Forward /api/* to the json-server REST API (npm run server) so the
      // browser talks to one origin and no CORS setup is needed.
      //   GET http://localhost:5173/api/products  ->  GET http://localhost:3001/products
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  };
});

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import sitemap from 'vite-plugin-sitemap';

const require = createRequire(import.meta.url);
const prerender = require('vite-plugin-prerender');
const JSDOMRenderer = require('@prerenderer/renderer-jsdom');
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'robots.txt', 'sitemap.xml'],
        workbox: {
          maximumFileSizeToCacheInBytes: 5000000,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
          // Skip caching non-http requests (like chrome-extension://)
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.protocol === 'http:' || url.protocol === 'https:',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'http-cache',
              },
            },
          ],
        },
        manifest: {
          name: 'Aethelcare India',
          short_name: 'Aethelcare',
          description: 'Search any medicine. Understand it instantly.',
          theme_color: '#ffffff',
          icons: [
            {
              src: 'favicon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any hmaskable'
            }
          ]
        }
      }),
      sitemap({
        hostname: 'https://aethelcare.xyz',
        dynamicRoutes: ['/', '/scanner', '/drug-info', '/about', '/compare', '/banned-drugs', '/pricing', '/contact'],
        exclude: ['/google20f926fe5b04d78e']
      }),
      prerender({
        // Required - The path to the vite-outputted static site to prerender.
        staticDir: path.join(__dirname, 'dist'),
        // Required - Routes to render.
        routes: ['/', '/scanner', '/drug-info', '/about', '/compare', '/banned-drugs', '/pricing', '/contact'],
        renderer: new JSDOMRenderer({
          renderAfterDocumentEvent: 'render-event', // or just use fallback
        })
      }),
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});

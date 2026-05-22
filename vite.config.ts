import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import {defineConfig, loadEnv} from 'vite';
import sitemap from 'vite-plugin-sitemap';
import { VitePWA } from 'vite-plugin-pwa';

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
      sitemap({
        hostname: 'https://aethelcare.xyz',
        dynamicRoutes: [
          '/scan', 
          '/about', 
          '/banned-drugs', 
          '/pricing', 
          '/contact', 
          '/conditions',
          '/privacy',
          '/dashboard',
          '/medicine/Dolo 650',
          '/medicine/Calpol 650',
          '/medicine/Pan-D',
          '/medicine/Combiflam',
          '/medicine/Azithral 500'
        ],
        exclude: ['/google20f926fe5b04d78e']
      }),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'Aethelcare India',
          short_name: 'Aethelcare',
          description: 'Search any medicine. Understand it instantly.',
          theme_color: '#2563EB',
          icons: [
            {
              src: '/favicon.svg',
              sizes: '192x192',
              type: 'image/svg+xml'
            },
            {
              src: '/favicon.svg',
              sizes: '512x512',
              type: 'image/svg+xml'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      }),
      /*prerender({
        // Required - The path to the vite-outputted static site to prerender.
        staticDir: path.join(__dirname, 'dist'),
        // Required - Routes to render.
        routes: [
          '/', 
          '/scan', 
          '/about', 
          '/banned-drugs', 
          '/pricing', 
          '/contact', 
          '/conditions',
          '/privacy',
          '/dashboard'
        ],
        renderer: new JSDOMRenderer({
          renderAfterDocumentEvent: 'render-event', // or just use fallback
        })
      }),*/
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || ''),
      'process.env.GEMINI_API_KEYS': JSON.stringify(process.env.GEMINI_API_KEYS || env.GEMINI_API_KEYS || ''),
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
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['lucide-react', 'motion/react', 'gsap', '@studio-freight/lenis'],
            firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/analytics']
          }
        }
      }
    }
  };
});

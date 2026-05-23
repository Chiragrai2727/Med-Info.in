import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import {defineConfig, loadEnv} from 'vite';

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

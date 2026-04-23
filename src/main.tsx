import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './index.css';

import { LanguageProvider } from './LanguageContext';
import { AuthProvider } from './AuthContext';
import { ToastProvider } from './ToastContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <AuthProvider>
        <LanguageProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </LanguageProvider>
      </AuthProvider>
    </HelmetProvider>
  </StrictMode>,
);

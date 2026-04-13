import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { LanguageProvider } from './LanguageContext';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { MedicineDetail } from './pages/MedicineDetail';
import { ConditionPage } from './pages/ConditionPage';
import { Compare } from './pages/Compare';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { ScannerPage } from './pages/ScannerPage';
import { Timetable } from './pages/Timetable';
import { ProtectedRoute } from './components/ProtectedRoute';
import { BannedDrugs } from './pages/BannedDrugs';
import { OfflineBanner } from './components/OfflineBanner';
import { InstallPrompt } from './components/InstallPrompt';
import { AuthModal } from './components/AuthModal';

import { CompareProvider } from './CompareContext';
import { CompareBar } from './components/CompareBar';
import { ToastProvider } from './ToastContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './AuthContext';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
        <ToastProvider>
          <CompareProvider>
            <Router>
              <div className="min-h-screen bg-white font-sans selection:bg-black selection:text-white">
                <Navbar />
                <OfflineBanner />
                <CompareBar />
                <main>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route 
                      path="/scan" 
                      element={
                        <ProtectedRoute>
                          <ScannerPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route path="/medicine/:name" element={<MedicineDetail />} />
                    <Route path="/condition/:id" element={<ConditionPage />} />
                    <Route path="/banned-drugs" element={<BannedDrugs />} />
                    <Route path="/compare/:med1/:med2" element={<Compare />} />
                    <Route 
                      path="/timetable" 
                      element={
                        <ProtectedRoute>
                          <Timetable />
                        </ProtectedRoute>
                      } 
                    />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                  </Routes>
                </main>
                <InstallPrompt />
                <AuthModal />
                
                <footer className="py-12 border-t border-gray-100">
                  <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-sm text-gray-400 font-medium">
                      © {new Date().getFullYear()} MedInfo India. All rights reserved.
                    </p>
                    <div className="flex justify-center gap-6 mt-4">
                      <Link to="/privacy" className="text-xs text-gray-400 hover:text-black transition-colors font-bold uppercase tracking-widest">Privacy Policy</Link>
                      <a href="https://cdsco.gov.in/" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-black transition-colors font-bold uppercase tracking-widest">CDSCO Official</a>
                    </div>
                    <p className="text-xs text-gray-300 mt-4">
                      Educational purposes only. Not a substitute for professional medical advice.
                    </p>
                  </div>
                </footer>
              </div>
            </Router>
          </CompareProvider>
        </ToastProvider>
        </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

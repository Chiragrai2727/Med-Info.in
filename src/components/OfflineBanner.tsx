import React, { useState, useEffect } from 'react';
import { WifiOff, X, Wifi } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { motion, AnimatePresence } from 'motion/react';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [show, setShow] = useState(!navigator.onLine);
  const { t } = useLanguage();

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShow(true); // Show the "back online" message
      
      // Auto-hide the back online message after 5 seconds
      setTimeout(() => {
        setShow(false);
      }, 5000);
    };
    const handleOffline = () => {
      setIsOffline(true);
      setShow(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        className="fixed bottom-24 left-0 right-0 z-[60] px-4"
      >
        <div className={`max-w-md mx-auto p-5 rounded-[2rem] shadow-2xl flex flex-col gap-4 border ${
          isOffline ? 'bg-black text-white border-white/10' : 'bg-green-600 text-white border-green-500'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                isOffline ? 'bg-white/10' : 'bg-white/20'
              }`}>
                {isOffline ? (
                  <WifiOff className="w-6 h-6 text-yellow-400" />
                ) : (
                  <Wifi className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">
                  {isOffline ? t('offlineTitle') : 'Back Online!'}
                </h3>
                <p className="text-sm opacity-80 font-medium">
                  {isOffline ? t('offlineStatus') : 'All features are now available.'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShow(false)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isOffline && (
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
              <p className="text-xs text-gray-400 leading-relaxed">
                {t('offlineLimit')} {t('offlineAction')}
              </p>
            </div>
          )}

          {!isOffline && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-white text-green-600 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg"
            >
              {t('refresh')}
            </motion.button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

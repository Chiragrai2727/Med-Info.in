import React, { useState, useEffect } from 'react';
import { Download, X, WifiOff, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;
  prompt(): Promise<void>;
}

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    // Show the prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShow(false);
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed bottom-8 right-8 z-50"
      >
        <div className="bg-white p-6 rounded-[2rem] shadow-2xl border border-gray-100 flex flex-col gap-4 max-w-xs">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white">
              <Download className="w-6 h-6" />
            </div>
            <button onClick={() => setShow(false)} className="p-1 hover:bg-gray-100 rounded-full">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div>
            <h3 className="text-lg font-black text-black mb-3">Install MedInfo</h3>
            <div className="flex flex-col gap-2 text-sm text-gray-600 font-medium">
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-blue-500" />
                <span>Offline access anywhere</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span>Faster loading times</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleInstall}
            className="w-full py-3 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg"
          >
            Install Now
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

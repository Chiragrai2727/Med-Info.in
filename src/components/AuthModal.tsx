import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { FirebaseAuth } from './FirebaseAuth';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal } = useAuth();

  if (!isAuthModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(30,58,138,0.25)] max-w-lg w-full overflow-hidden relative"
        >
          <button
            onClick={closeAuthModal}
            className="absolute top-6 right-6 p-3 text-gray-400 hover:text-[#1E3A8A] hover:bg-slate-50 rounded-2xl transition-all z-10 active:scale-95"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="p-8 sm:p-12 overflow-y-auto max-h-[85vh] scrollbar-hide">
            <FirebaseAuth onSuccess={closeAuthModal} />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

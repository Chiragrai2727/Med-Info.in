import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { SupabaseAuth } from './SupabaseAuth';

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
          className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden relative"
        >
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="p-4 sm:p-8">
            <SupabaseAuth onSuccess={closeAuthModal} />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

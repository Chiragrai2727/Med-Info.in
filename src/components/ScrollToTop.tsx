import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronUp } from 'lucide-react';

export const ScrollToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 500) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          whileHover={{ scale: 1.1, translateY: -5 }}
          whileTap={{ scale: 0.9 }}
          onClick={scrollToTop}
          className="fixed bottom-32 right-6 md:bottom-8 md:right-8 z-50 p-4 rounded-3xl bg-primary text-white shadow-2xl shadow-primary/40 backdrop-blur-xl border border-white/10 group transition-all"
          aria-label="Scroll to top"
        >
          <div className="relative flex items-center justify-center">
            <ChevronUp className="w-6 h-6 relative z-10 transition-transform duration-300 group-hover:-translate-y-1" />
            <motion.div 
              className="absolute inset-0 bg-primary-hover rounded-full blur-xl"
              animate={{ 
                scale: [1, 2, 1],
                opacity: [0, 0.5, 0]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            />
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  );
};

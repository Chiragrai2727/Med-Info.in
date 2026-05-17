import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';

const AVATARS = [
  // Diverse Characters
  { id: 'b1', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&mouth=smile' },
  { id: 'b2', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aiden&mouth=smile' },
  { id: 'b3', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack&mouth=smile' },
  { id: 'g1', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&mouth=smile' },
  { id: 'g2', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mimi&mouth=smile' },
  { id: 'g3', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ginger&mouth=smile' },

  // Aesthetic & Modern
  { id: 'f1', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Aria' },
  { id: 'f2', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Luna' },
  { id: 'f3', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Nova' },

  // Artistic & Clean
  { id: 'n1', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Coco' },
  { id: 'n2', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Bear' },
  { id: 'n3', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Toby' },
];

interface AvatarSelectionProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AvatarSelection: React.FC<AvatarSelectionProps> = ({ isOpen, onClose }) => {
  const { profile, updateProfileImage } = useAuth();
  const { showToast } = useToast();
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleSelect = async (url: string) => {
    if (isUpdating) return;
    try {
      setIsUpdating(true);
      await updateProfileImage(url);
      showToast('Profile image updated!', 'success');
      onClose();
    } catch (error) {
      showToast('Failed to update image', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-[3rem] shadow-[0_32px_64px_rgba(0,0,0,0.2)] z-[201] overflow-hidden border border-white/20"
          >
            <div className="p-8 sm:p-12 border-b border-black/5 flex items-center justify-between bg-white/50 backdrop-blur-xl">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">CHOOSE AVATAR</h2>
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-2">Personalize your identity</p>
              </div>
              <button 
                onClick={onClose}
                className="p-3 hover:bg-slate-100 rounded-2xl transition-all hover:rotate-90"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="p-4 sm:p-8">
              <div className="flex items-center justify-between px-4 mb-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Selected Styles</p>
                <button
                  onClick={() => handleSelect('')}
                  className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1.5"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  Reset to Default
                </button>
              </div>
              <div 
                data-lenis-prevent="true" 
                onWheel={(e) => e.stopPropagation()}
                className="max-h-[420px] overflow-y-auto px-4 sm:px-4 py-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent"
              >
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 sm:gap-6 pb-4">
                  {AVATARS.map((avatar) => (
                    <button
                      key={avatar.id}
                      onClick={() => handleSelect(avatar.url)}
                      className={`relative aspect-square rounded-[2rem] overflow-hidden border-4 transition-all hover:scale-105 active:scale-95 group ${
                        profile?.photoURL === avatar.url 
                          ? 'border-blue-600 shadow-xl shadow-blue-500/20' 
                          : 'border-slate-100 hover:border-blue-200'
                      }`}
                    >
                      <img 
                        src={avatar.url} 
                        alt="Avatar" 
                        className="w-full h-full object-cover p-1"
                        referrerPolicy="no-referrer"
                      />
                      {profile?.photoURL === avatar.url && (
                        <div className="absolute inset-0 bg-blue-600/10 flex items-center justify-center">
                          <div className="bg-blue-600 text-white p-2 rounded-full shadow-lg">
                            <Check className="w-4 h-4 stroke-[3px]" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-8 py-6 border-t border-black/5 bg-slate-50/50 text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] opacity-60">
                Crafted with DiceBear Library
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

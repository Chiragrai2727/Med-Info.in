import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';

const AVATARS = [
  // Diverse Characters (Avataaars) - 20 options
  { id: 'b1', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&mouth=smile' },
  { id: 'b2', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aiden&mouth=smile' },
  { id: 'b3', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack&mouth=smile' },
  { id: 'b4', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Caleb&mouth=smile' },
  { id: 'b5', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Liam&mouth=smile' },
  { id: 'b6', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver&mouth=smile' },
  { id: 'b7', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun&mouth=smile' },
  { id: 'b8', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jose&mouth=smile' },
  { id: 'b9', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kenji&mouth=smile' },
  { id: 'b10', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hiroshi&mouth=smile' },
  { id: 'b11', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Malik&mouth=smile' },
  { id: 'b12', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Omar&mouth=smile' },
  { id: 'g1', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&mouth=smile' },
  { id: 'g2', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mimi&mouth=smile' },
  { id: 'g3', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ginger&mouth=smile' },
  { id: 'g4', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe&mouth=smile' },
  { id: 'g5', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sara&mouth=smile' },
  { id: 'g6', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kim&mouth=smile' },
  { id: 'g7', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zainab&mouth=smile' },
  { id: 'g8', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria&mouth=smile' },
  { id: 'g9', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Destiny&mouth=smile' },
  { id: 'g10', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sasha&mouth=smile' },
  { id: 'g11', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Yuki&mouth=smile' },
  { id: 'g12', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amara&mouth=smile' },

  // Aesthetic & Modern (Lorelei) - 10 options
  { id: 'f1', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Aria' },
  { id: 'f2', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Luna' },
  { id: 'f3', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Nova' },
  { id: 'f4', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Leo' },
  { id: 'f5', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Milo' },
  { id: 'f6', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Jade' },
  { id: 'f7', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Jasper' },
  { id: 'f8', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Ruby' },
  { id: 'f9', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Sage' },
  { id: 'f10', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Atlas' },

  // Artistic & Clean (Notionists) - 10 options
  { id: 'n1', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Coco' },
  { id: 'n2', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Bear' },
  { id: 'n3', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Toby' },
  { id: 'n4', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Mia' },
  { id: 'n5', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Leo' },
  { id: 'n6', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Zoe' },
  { id: 'n7', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Max' },
  { id: 'n8', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sasha' },
  { id: 'n9', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Kiki' },
  { id: 'n10', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Finn' },

  // Adventurous (Adventurer) - 10 options
  { id: 'a1', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sky' },
  { id: 'a2', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Forest' },
  { id: 'a3', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Rain' },
  { id: 'a4', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ocean' },
  { id: 'a5', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Breeze' },
  { id: 'a6', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Dawn' },
  { id: 'a7', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Dusk' },
  { id: 'a8', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Stone' },
  { id: 'a9', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Clay' },
  { id: 'a10', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Spark' },

  // Fun & Playful (Big Smile) - 6 options
  { id: 's1', url: 'https://api.dicebear.com/7.x/big-smile/svg?seed=Sunny' },
  { id: 's2', url: 'https://api.dicebear.com/7.x/big-smile/svg?seed=Joy' },
  { id: 's3', url: 'https://api.dicebear.com/7.x/big-smile/svg?seed=Happy' },
  { id: 's4', url: 'https://api.dicebear.com/7.x/big-smile/svg?seed=Smile' },
  { id: 's5', url: 'https://api.dicebear.com/7.x/big-smile/svg?seed=Beam' },
  { id: 's6', url: 'https://api.dicebear.com/7.x/big-smile/svg?seed=Grin' },
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
              <div className="max-h-[420px] overflow-y-auto px-4 sm:px-4 py-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
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

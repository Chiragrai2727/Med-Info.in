import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';

const AVATARS = [
  // Boys
  { id: 'b1', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&mouth=smile' },
  { id: 'b2', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aiden&mouth=smile' },
  { id: 'b3', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack&mouth=smile' },
  { id: 'b4', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Caleb&mouth=smile' },
  { id: 'b5', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Liam&mouth=smile' },
  { id: 'b6', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver&mouth=smile' },
  // Girls
  { id: 'g1', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&mouth=smile' },
  { id: 'g2', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mimi&mouth=smile' },
  { id: 'g3', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ginger&mouth=smile' },
  { id: 'g4', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe&mouth=smile' },
  { id: 'g5', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sara&mouth=smile' },
  { id: 'g6', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kim&mouth=smile' },
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
            <div className="p-8 sm:p-12 border-b border-black/5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">CHOOSE AVATAR</h2>
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-1">Personalize your profile</p>
              </div>
              <button 
                onClick={onClose}
                className="p-3 hover:bg-slate-100 rounded-2xl transition-colors"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="p-8 sm:p-12">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 sm:gap-6">
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
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {profile?.photoURL === avatar.url && (
                      <div className="absolute inset-0 bg-blue-600/10 flex items-center justify-center">
                        <div className="bg-blue-600 text-white p-1.5 rounded-full shadow-lg">
                          <Check className="w-3 h-3" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-8 sm:p-12 pb-10 sm:pb-12 text-center">
              <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">
                Avatars provided by DiceBear
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

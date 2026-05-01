import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageSquareWarning, Send, Loader2 } from 'lucide-react';
import { useToast } from '../ToastContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicineName?: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, medicineName }) => {
  const [feedbackType, setFeedbackType] = useState<'inaccuracy' | 'suggestion'>('inaccuracy');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        type: feedbackType,
        message: message.trim(),
        medicineName: medicineName || 'General',
        createdAt: serverTimestamp(),
        userId: auth.currentUser?.uid || 'guest',
        email: auth.currentUser?.email || null,
        status: 'new'
      });
      
      showToast('Thank you! Feedback saved and opening email client...', 'success');
      
      // Delay mailto slightly so the user sees the success message
      const text = `Type: ${feedbackType}\nMedicine: ${medicineName || 'General'}\n\nMessage: ${message.trim()}`;
      setTimeout(() => {
        window.location.href = `mailto:aethelcare.help@gmail.com?subject=Report/Feedback: ${medicineName || 'Platform'}&body=${encodeURIComponent(text)}`;
      }, 1000);

      setMessage('');
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'feedback');
      showToast('Failed to submit feedback. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-[2rem] shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <MessageSquareWarning className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">Report Feedback</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {medicineName && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Regarding Medicine</label>
                    <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium border border-gray-200">
                      {medicineName}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Feedback Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFeedbackType('inaccuracy')}
                      className={`py-3 px-4 rounded-xl font-bold text-sm transition-all border-2 ${
                        feedbackType === 'inaccuracy' 
                          ? 'border-blue-600 bg-blue-50 text-blue-700' 
                          : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                      }`}
                    >
                      Report Inaccuracy
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeedbackType('suggestion')}
                      className={`py-3 px-4 rounded-xl font-bold text-sm transition-all border-2 ${
                        feedbackType === 'suggestion' 
                          ? 'border-blue-600 bg-blue-50 text-blue-700' 
                          : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                      }`}
                    >
                      Suggest Improvement
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={feedbackType === 'inaccuracy' ? "What information is incorrect?" : "How can we improve this data?"}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:ring-0 focus:border-blue-600 transition-colors resize-none h-32 font-medium"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className="w-full py-4 bg-black text-white rounded-xl font-black flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Submit Feedback <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

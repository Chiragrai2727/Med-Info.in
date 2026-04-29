import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Send, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { useToast } from '../ToastContext';

export const Contact: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleNext = () => {
    if (step === 1 && !formData.name) return showToast('Please enter your name', 'info');
    if (step === 2 && (!formData.email || !formData.email.includes('@'))) return showToast('Please enter a valid email', 'info');
    setStep(s => Math.min(s + 1, 3));
  };

  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message) return showToast('Please enter a message', 'info');
    
    setIsSubmitting(true);
    try {
      // 1. Save to Firestore
      await addDoc(collection(db, 'contactRequests'), {
        ...formData,
        userId: auth.currentUser?.uid || 'guest',
        createdAt: new Date().toISOString()
      });

      showToast('Request received! Opening email client...', 'success');

      // 2. Open Email Client
      const body = `Name: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone || 'N/A'}\n\nMessage:\n${formData.message}`;
      setTimeout(() => {
        window.location.href = `mailto:aethelcare.help@gmail.com?subject=Contact Request from ${formData.name}&body=${encodeURIComponent(body)}`;
        navigate('/');
      }, 1500);

    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'contactRequests');
      showToast('Submission failed, but redirecting to email...', 'info');
      // Still allow email fallback
      window.location.href = `mailto:aethelcare.help@gmail.com?subject=Contact Request&body=${encodeURIComponent(formData.message)}`;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFF] p-6 md:p-12 flex flex-col items-center justify-center">
      <button 
        onClick={() => navigate(-1)}
        className="absolute top-8 left-8 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all group"
      >
        <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-slate-900 transition-colors" />
      </button>

      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black uppercase tracking-[-0.05em] text-slate-900">Contact Us</h1>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mt-2">We'd love to hear from you</p>
        </div>

        <motion.div 
          layout
          className="bg-white rounded-[2.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.03)] border border-slate-50 p-8 md:p-10 relative overflow-hidden"
        >
          <form onSubmit={step === 3 ? handleSubmit : (e) => e.preventDefault()}>
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">Name</label>
                    <input 
                      type="text"
                      placeholder="Jane Smith"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      autoFocus
                      className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl p-5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:bg-white transition-all placeholder:text-slate-300"
                    />
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">Email</label>
                    <input 
                      type="email"
                      placeholder="jane@framer.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      autoFocus
                      className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl p-5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:bg-white transition-all placeholder:text-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">Phone</label>
                    <input 
                      type="tel"
                      placeholder="0123456678"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl p-5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:bg-white transition-all placeholder:text-slate-300"
                    />
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">Message</label>
                    <textarea 
                      placeholder="Message"
                      value={formData.message}
                      onChange={e => setFormData({ ...formData, message: e.target.value })}
                      autoFocus
                      rows={4}
                      className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl p-5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:bg-white transition-all placeholder:text-slate-300 resize-none"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-10 flex items-center justify-between">
              <div className="flex gap-4 items-center">
                {step > 1 && (
                  <button 
                    type="button"
                    onClick={handleBack}
                    className="p-3 rounded-xl hover:bg-slate-50 text-slate-400 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <div className="flex gap-2">
                  {[1, 2, 3].map(i => (
                    <div 
                      key={i}
                      className={`h-2 rounded-full transition-all duration-500 ${step === i ? 'w-4 bg-slate-900' : 'w-2 bg-slate-200'}`}
                    />
                  ))}
                </div>
              </div>

              {step < 3 ? (
                <button 
                  type="button"
                  onClick={handleNext}
                  className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Submit</>}
                </button>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

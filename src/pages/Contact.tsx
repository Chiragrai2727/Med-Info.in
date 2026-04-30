import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Send, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useToast } from '../ToastContext';
import { Helmet } from 'react-helmet-async';

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
      // 1. Save to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('contact_requests').insert({
        ...formData,
        user_id: user?.id || 'guest',
        created_at: new Date().toISOString()
      });

      showToast('Request received! Opening email client...', 'success');

      // 2. Open Email Client
      const body = `Name: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone || 'N/A'}\n\nMessage:\n${formData.message}`;
      setTimeout(() => {
        window.location.href = `mailto:aethelcare.help@gmail.com?subject=Contact Request from ${formData.name}&body=${encodeURIComponent(body)}`;
        navigate('/');
      }, 1500);

    } catch (error) {
      console.error('Contact submission error:', error);
      showToast('Submission failed, but redirecting to email...', 'info');
      // Still allow email fallback
      window.location.href = `mailto:aethelcare.help@gmail.com?subject=Contact Request&body=${encodeURIComponent(formData.message)}`;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg p-6 md:p-12 flex flex-col items-center justify-center">
      <Helmet>
        <title>Contact Aethelcare India - Support & Medical Queries</title>
        <meta name="description" content="Get in touch with Aethelcare for medical information queries, support, or feedback. We're here to help Indian patients understand their medicines better." />
        <link rel="canonical" href="https://aethelcare.xyz/contact" />
      </Helmet>
      <button 
        onClick={() => navigate(-1)}
        className="absolute top-8 left-8 p-3 rounded-2xl bg-surface border border-border shadow-sm hover:shadow-md transition-all group"
      >
        <ArrowLeft className="w-5 h-5 text-text-secondary group-hover:text-text-primary transition-colors" />
      </button>
 
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black uppercase tracking-[-0.05em] text-text-primary">Contact Us</h1>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-text-secondary mt-2">We'd love to hear from you</p>
        </div>
 
        <motion.div 
          layout
          className="bg-surface rounded-[2.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.03)] border border-border p-8 md:p-10 relative overflow-hidden"
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
                    <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-3 ml-1">Name</label>
                    <input 
                      type="text"
                      placeholder="Jane Smith"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      autoFocus
                      className="w-full bg-bg/50 border border-border rounded-2xl p-5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-surface focus:border-primary transition-all placeholder:text-text-secondary/30"
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
                    <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-3 ml-1">Email</label>
                    <input 
                      type="email"
                      placeholder="jane@framer.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      autoFocus
                      className="w-full bg-bg/50 border border-border rounded-2xl p-5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-surface focus:border-primary transition-all placeholder:text-text-secondary/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-3 ml-1">Phone</label>
                    <input 
                      type="tel"
                      placeholder="0123456678"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-bg/50 border border-border rounded-2xl p-5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-surface focus:border-primary transition-all placeholder:text-text-secondary/30"
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
                    <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary mb-3 ml-1">Message</label>
                    <textarea 
                      placeholder="How can we help you?"
                      value={formData.message}
                      onChange={e => setFormData({ ...formData, message: e.target.value })}
                      autoFocus
                      rows={4}
                      className="w-full bg-bg/50 border border-border rounded-2xl p-5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/5 focus:bg-surface focus:border-primary transition-all placeholder:text-text-secondary/30 resize-none"
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
                    className="p-3 rounded-xl hover:bg-bg text-text-secondary transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <div className="flex gap-2">
                  {[1, 2, 3].map(i => (
                    <div 
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-500 ${step === i ? 'w-6 bg-primary' : 'w-1.5 bg-border'}`}
                    />
                  ))}
                </div>
              </div>
 
              {step < 3 ? (
                <button 
                  type="button"
                  onClick={handleNext}
                  className="bg-primary text-white px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(29,78,216,0.2)] hover:bg-primary-hover hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary text-white px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(29,78,216,0.2)] hover:bg-primary-hover hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
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

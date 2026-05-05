import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useLanguage } from './LanguageContext';
import { useToast } from './ToastContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';
import { handleFirestoreError, OperationType } from './utils/firestoreErrorHandler';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { MedicineDetail } from './pages/MedicineDetail';
import { ConditionPage } from './pages/ConditionPage';
import { Compare } from './pages/Compare';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { ScannerPage } from './pages/ScannerPage';
import { Timetable } from './pages/Timetable';
import { Dashboard } from './pages/Dashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { About } from './pages/About';
import { ProtectedRoute } from './components/ProtectedRoute';
import { BannedDrugs } from './pages/BannedDrugs';
import { Contact } from './pages/Contact';
import { Conditions } from './pages/Conditions';
import { Pricing } from './pages/Pricing';
import { OfflineBanner } from './components/OfflineBanner';
import { InstallPrompt } from './components/InstallPrompt';
import { AuthModal } from './components/AuthModal';
import { NotificationManager } from './components/NotificationManager';
import { MobileNav } from './components/MobileNav';
import { ScrollToTop } from './components/ScrollToTop';
import { TrialBanner } from './components/TrialBanner';

import { CompareProvider } from './CompareContext';
import { CompareBar } from './components/CompareBar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MedicalDisclaimerModal } from './components/MedicalDisclaimerModal';

import { checkDueReminders, dismissReminder, RefillReminder } from './utils/refillReminder';
import { Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [reminders, setReminders] = useState<RefillReminder[]>([]);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  useEffect(() => {
    const check = () => setReminders(checkDueReminders());
    check();
    const interval = setInterval(check, 60000); // Check for refills every minute
    
    // Dispatch event for prerendering
    document.dispatchEvent(new Event('render-event'));
    
    return () => clearInterval(interval);
  }, []);

  const handleDismissReminder = (medicineName: string) => {
    dismissReminder(medicineName);
    setReminders(reminders.filter(r => r.medicine_name !== medicineName));
  };

  return (
    <ErrorBoundary>
      <CompareProvider>
        <Router>
          <div className="min-h-screen bg-bg font-sans selection:bg-primary selection:text-white transition-colors duration-300 overflow-x-hidden">
            {/* Liquid Glass Background Elements */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
              <motion.div 
                animate={{ 
                  x: [0, 100, 0],
                  y: [0, -50, 0],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[120px]" 
              />
              <motion.div 
                animate={{ 
                  x: [0, -100, 0],
                  y: [0, 100, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] bg-blue-100/10 rounded-full blur-[120px]" 
              />
              <motion.div 
                animate={{ 
                  x: [0, 50, 0],
                  y: [0, -100, 0]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-0 left-[10%] w-[40%] h-[40%] bg-success/5 rounded-full blur-[120px]" 
              />
            </div>

            <div className="relative z-10">
              <Navbar />

                {/* Global Refill Reminders */}
                <div className="fixed top-20 right-4 z-[90] flex flex-col gap-2">
                  <AnimatePresence>
                    {reminders.map((r, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white border-l-4 border-amber-500 rounded-lg shadow-xl p-4 flex gap-3 w-80"
                      >
                        <Bell className="w-5 h-5 text-primary shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-bold text-text-primary text-sm">Time to Refill</h4>
                          <p className="text-text-secondary text-xs mt-0.5">Your {r.duration_days}-day prescription of <span className="font-bold">{r.medicine_name}</span> may be running low.</p>
                        </div>
                        <button onClick={() => handleDismissReminder(r.medicine_name)} className="text-text-secondary hover:text-text-primary self-start">
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <OfflineBanner />
                <MedicalDisclaimerModal />
                <NotificationManager />
                <CompareBar />
                <main>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route 
                      path="/scan" 
                      element={
                        <ProtectedRoute>
                          <ScannerPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route path="/medicine/:name" element={<MedicineDetail />} />
                    <Route path="/condition/:id" element={<ConditionPage />} />
                    <Route path="/conditions" element={<Conditions />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/banned-drugs" element={<BannedDrugs />} />
                    <Route path="/compare/:med1/:med2" element={<Compare />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route 
                      path="/timetable" 
                      element={
                        <ProtectedRoute>
                          <Timetable />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/dashboard" 
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin" 
                      element={
                        <ProtectedRoute>
                          <AdminDashboard />
                        </ProtectedRoute>
                      } 
                    />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    
                    <Route path="/sitemap.xml" element={<Navigate to="/sitemap.xml" replace />} />
                    <Route path="/robots.txt" element={<Navigate to="/robots.txt" replace />} />
                    <Route path="/manifest.json" element={<Navigate to="/manifest.json" replace />} />
                    
                    {/* Catch static files in subdirectories and redirect to root */}
                    <Route path="*/sitemap.xml" element={<Navigate to="/sitemap.xml" replace />} />
                    <Route path="*/robots.txt" element={<Navigate to="/robots.txt" replace />} />
                    <Route path="*/manifest.json" element={<Navigate to="/manifest.json" replace />} />
                    
                    {/* Specific nested cases common in logs */}
                    <Route path="/timetable/sitemap.xml" element={<Navigate to="/sitemap.xml" replace />} />
                    <Route path="/medicine/sitemap.xml" element={<Navigate to="/sitemap.xml" replace />} />
                    <Route path="/dashboard/sitemap.xml" element={<Navigate to="/sitemap.xml" replace />} />
                  </Routes>
                </main>
                <MobileNav />
                <ScrollToTop />
                <AuthModal />
                
                <footer className="py-12 pb-28 md:pb-12 border-t border-border bg-surface">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 text-center md:text-left">
                      <div>
                        <h3 className="font-black text-lg mb-4 text-text-primary">{t('appName')}</h3>
                        <p className="text-sm font-medium text-text-secondary mb-4">
                          {t('heroDescription')}
                        </p>
                      </div>
                      <div>
                        <h3 className="font-black text-lg mb-4 text-text-primary">Connect With Us</h3>
                        <p className="text-sm font-medium text-text-secondary mb-2">
                          Got questions or need help?
                        </p>
                        <a href="mailto:aethelcare.help@gmail.com" className="text-sm font-bold text-primary hover:underline block mb-4">
                          aethelcare.help@gmail.com
                        </a>
                        <a 
                          href="https://www.instagram.com/aethelcare.india?igsh=dTduZWV3bWl2bnJw" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-black text-pink-600 hover:scale-105 transition-transform"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                          </svg>
                          Follow us on Instagram
                        </a>
                      </div>
                      <div className="pr-12 md:pr-0">
                        <h3 className="font-black text-lg mb-4 text-text-primary">Suggestions</h3>
                        <p className="text-sm font-medium text-text-secondary mb-4">
                          We value your feedback. Let us know how we can improve.
                        </p>
                        <form 
                          onSubmit={async (e) => {
                            e.preventDefault();
                            if (isSubmittingFeedback) return;
                            
                            const form = e.target as HTMLFormElement;
                            const text = (form.elements.namedItem('feedback') as HTMLTextAreaElement).value;
                            
                            setIsSubmittingFeedback(true);
                            try {
                              // 1. Save to Firestore for reliability
                              await addDoc(collection(db, 'feedback'), {
                                type: 'general',
                                message: text,
                                createdAt: serverTimestamp(),
                                userId: auth.currentUser?.uid || 'guest',
                                email: auth.currentUser?.email || null,
                                status: 'new'
                              });

                              showToast('Feedback saved! Opening your email client...', 'success');
                              
                              // 2. Open email client as requested
                              setTimeout(() => {
                                window.location.href = `mailto:aethelcare.help@gmail.com?subject=Platform Feedback&body=${encodeURIComponent(text)}`;
                              }, 1000);
                              
                              form.reset();
                            } catch (err) {
                              handleFirestoreError(err, OperationType.CREATE, 'feedback');
                              showToast('Error saving feedback, but opening email client anyway.', 'info');
                              window.location.href = `mailto:aethelcare.help@gmail.com?subject=Platform Feedback&body=${encodeURIComponent(text)}`;
                            } finally {
                              setIsSubmittingFeedback(false);
                            }
                          }}
                          className="flex flex-col gap-2 relative z-50">
                          <textarea 
                            name="feedback"
                            required
                            placeholder="Type your feedback here..." 
                            className="w-full text-sm font-medium p-4 rounded-3xl border border-border bg-bg/50 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all pointer-events-auto resize-none h-24 placeholder:text-text-secondary/30"
                          />
                          <button 
                            type="submit" 
                            disabled={isSubmittingFeedback}
                            className="bg-primary text-white text-sm font-black uppercase tracking-widest py-4 px-6 rounded-3xl hover:bg-primary-hover shadow-xl shadow-primary/20 transition-all pointer-events-auto cursor-pointer disabled:opacity-50"
                          >
                            {isSubmittingFeedback ? 'Processing...' : 'Submit Feedback'}
                          </button>
                        </form>
                      </div>
                    </div>
                    
                    <div className="border-t border-border pt-8 text-center text-text-secondary/40">
                      <p className="text-sm font-black uppercase tracking-[0.2em]">
                        © {new Date().getFullYear()} {t('footerCopyright')}
                      </p>
                      <div className="flex flex-wrap justify-center gap-6 mt-6 relative z-50">
                        <Link to="/about" className="text-xs text-text-secondary hover:text-text-primary transition-colors font-black uppercase tracking-widest pointer-events-auto cursor-pointer">About Us</Link>
                        <Link to="/contact" className="text-xs font-black text-primary hover:scale-105 transition-transform uppercase tracking-widest underline decoration-2 underline-offset-4 pointer-events-auto cursor-pointer">Contact Us</Link>
                        <Link to="/privacy" className="text-xs text-text-secondary hover:text-text-primary transition-colors font-black uppercase tracking-widest pointer-events-auto cursor-pointer">{t('privacyPolicy')}</Link>
                        <a href="https://cdsco.gov.in/" target="_blank" rel="noopener noreferrer" className="text-xs text-text-secondary hover:text-text-primary transition-colors font-black uppercase tracking-widest pointer-events-auto cursor-pointer">{t('cdscoOfficial')}</a>
                      </div>
                      <p className="text-[10px] uppercase font-black tracking-widest mt-8 max-w-3xl mx-auto opacity-50">
                        {t('educationalDisclaimer')}
                      </p>
                    </div>
                  </div>
                </footer>
              </div>
            </div>
        </Router>
      </CompareProvider>
    </ErrorBoundary>
  );
}

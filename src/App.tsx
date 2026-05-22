import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useLanguage } from './LanguageContext';
import { useToast } from './ToastContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';
import { handleFirestoreError, OperationType } from './utils/firestoreErrorHandler';
import Lenis from '@studio-freight/lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

import { Navbar } from './components/Navbar';
import { Logo } from './components/Logo';

// Lazy load pages for better performance
import { Home } from './pages/Home';
const MedicineDetail = lazy(() => import('./pages/MedicineDetail').then(m => ({ default: m.MedicineDetail })));
const ConditionPage = lazy(() => import('./pages/ConditionPage').then(m => ({ default: m.ConditionPage })));
const Compare = lazy(() => import('./pages/Compare').then(m => ({ default: m.Compare })));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const TermsOfService = lazy(() => import('./pages/TermsOfService').then(m => ({ default: m.TermsOfService })));
const ScannerPage = lazy(() => import('./pages/ScannerPage').then(m => ({ default: m.ScannerPage })));
const Timetable = lazy(() => import('./pages/Timetable').then(m => ({ default: m.Timetable })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const About = lazy(() => import('./pages/About').then(m => ({ default: m.About })));
const BannedDrugs = lazy(() => import('./pages/BannedDrugs').then(m => ({ default: m.BannedDrugs })));
const Contact = lazy(() => import('./pages/Contact').then(m => ({ default: m.Contact })));
const Conditions = lazy(() => import('./pages/Conditions').then(m => ({ default: m.Conditions })));
const Pricing = lazy(() => import('./pages/Pricing').then(m => ({ default: m.Pricing })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));

import { ProtectedRoute } from './components/ProtectedRoute';
import { OfflineBanner } from './components/OfflineBanner';
import { AuthModal } from './components/AuthModal';
import { NotificationManager } from './components/NotificationManager';
import { MobileNav } from './components/MobileNav';
import { ScrollToTop } from './components/ScrollToTop';

import { CompareProvider } from './CompareContext';
import { CompareBar } from './components/CompareBar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MedicalDisclaimerModal } from './components/MedicalDisclaimerModal';
import { TutorialDriver } from './components/TutorialDriver';

import { Chatbot } from './components/Chatbot';

import { checkDueReminders, dismissReminder, RefillReminder } from './utils/refillReminder';
import { listCalendarEvents } from './services/googleCalendar';
import { useAuth } from './AuthContext';
import { Bell, X, Instagram } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ensureDataLoaded } from './services/geminiService';

export default function App() {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const { accessToken } = useAuth();
  const [reminders, setReminders] = useState<RefillReminder[]>([]);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  useEffect(() => {
    // Start loading medical data in background eagerly, but delay slightly to not block initial render
    setTimeout(() => {
      if (window.requestIdleCallback) {
        requestIdleCallback(() => ensureDataLoaded());
      } else {
        ensureDataLoaded();
      }
    }, 3000);

    // Initialize Lenis for smooth scrolling
    const lenis = new Lenis({
      duration: 1.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.5,
      smoothWheel: true,
      wheelMultiplier: 1,
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);
 
    // Internal function to sync and check
    const check = async () => {
      // 1. Get local reminders
      const localReminders = checkDueReminders();
      
      // 2. If authenticated, try to get from Google Calendar
      if (accessToken) {
        try {
          const events = await listCalendarEvents(accessToken);
          const now = new Date();
          
          const calendarReminders: RefillReminder[] = events
            .filter((event: any) => 
               event.summary?.startsWith('Refill Reminder:') && 
               new Date(event.start?.dateTime || event.start?.date) <= now
            )
            .map((event: any) => ({
              medicine_name: event.summary.replace('Refill Reminder: ', ''),
              scan_date: new Date(event.created || now).getTime(),
              duration_days: 0, // Not stored in calendar easily
              remind_at: new Date(event.start?.dateTime || event.start?.date).getTime()
            }));
            
          // Merge and avoid duplicates by medicine name
          const merged = [...localReminders];
          calendarReminders.forEach(cr => {
            if (!merged.find(m => m.medicine_name === cr.medicine_name)) {
              merged.push(cr);
            }
          });
          setReminders(merged);
        } catch (err) {
          console.warn("Failed to fetch calendar reminders", err);
          setReminders(localReminders);
        }
      } else {
        setReminders(localReminders);
      }
    };

    check();
    const interval = setInterval(check, 60000); // Check for refills every minute
    
    // Dispatch event for prerendering
    document.dispatchEvent(new Event('render-event'));
    
    return () => {
      clearInterval(interval);
      gsap.ticker.remove(lenis.raf);
      lenis.destroy();
    };
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
                <TutorialDriver />
                <Chatbot />
                <main>
                  <Suspense fallback={
                    <div className="min-h-screen pt-40 flex items-start justify-center">
                      <div className="flex flex-col items-center gap-4 mt-20">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm font-black uppercase tracking-widest text-text-secondary animate-pulse">Loading Aethelcare...</p>
                      </div>
                    </div>
                  }>
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
                      <Route path="/compare" element={<Compare />} />
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
                      <Route path="/terms" element={<TermsOfService />} />
                      
                      {/* Catch all other routes with a 404 page */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </main>
                <MobileNav />
                <ScrollToTop />
                <AuthModal />
                
                <footer className="py-12 pb-28 md:pb-12 border-t border-border bg-surface">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 text-center md:text-left">
                      <div>
                        <div className="mb-4 flex justify-center md:justify-start">
                          <Logo size="md" />
                        </div>
                        <p className="text-sm font-medium text-text-secondary mb-4">
                          {t('heroDescription')}
                        </p>
                      </div>
                      <div>
                        <h3 className="font-black text-lg mb-4 text-text-primary">Connect With Us</h3>
                        <p className="text-sm font-medium text-text-secondary mb-2">
                          Got questions or need help?
                        </p>
                        <a href="mailto:hello@aethelcare.xyz" className="text-sm font-bold text-primary hover:underline block mb-4">
                          hello@aethelcare.xyz
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
                                window.location.href = `mailto:hello@aethelcare.xyz?subject=Platform Feedback&body=${encodeURIComponent(text)}`;
                              }, 1000);
                              
                              form.reset();
                            } catch (err) {
                              handleFirestoreError(err, OperationType.CREATE, 'feedback');
                              showToast('Error saving feedback, but opening email client anyway.', 'info');
                              window.location.href = `mailto:hello@aethelcare.xyz?subject=Platform Feedback&body=${encodeURIComponent(text)}`;
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
                        <Link to="/conditions" className="text-xs text-text-secondary hover:text-text-primary transition-colors font-black uppercase tracking-widest pointer-events-auto cursor-pointer">Conditions</Link>
                        <Link to="/contact" className="text-xs font-black text-primary hover:scale-105 transition-transform uppercase tracking-widest underline decoration-2 underline-offset-4 pointer-events-auto cursor-pointer">Contact Us</Link>
                        <Link to="/privacy" className="text-xs text-text-secondary hover:text-text-primary transition-colors font-black uppercase tracking-widest pointer-events-auto cursor-pointer">{t('privacyPolicy')}</Link>
                        <Link to="/terms" className="text-xs text-text-secondary hover:text-text-primary transition-colors font-black uppercase tracking-widest pointer-events-auto cursor-pointer">Terms of Service</Link>
                        <a href="https://cdsco.gov.in" target="_blank" rel="noopener noreferrer" className="text-xs text-text-secondary hover:text-primary transition-colors font-black uppercase tracking-widest pointer-events-auto cursor-pointer">
                          {t('cdscoOfficial')}
                        </a>
                        <a href="https://www.instagram.com/aethelcare" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-pink-600 transition-colors pointer-events-auto cursor-pointer flex items-center gap-1">
                          <Instagram className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Follow</span>
                        </a>
                      </div>
                      <p className="text-[10px] uppercase font-black tracking-widest mt-8 max-w-3xl mx-auto opacity-50">
                        {t('educationalDisclaimer')} Data analyzed by Aethelcare AI using CDSCO & other verified medical sources.
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

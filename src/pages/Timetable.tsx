import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Clock, Calendar as CalendarIcon, Trash2, AlertCircle, CheckCircle2, Search, X, Bell, BellOff, Loader2 } from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { PremiumPaywall } from '../components/PremiumPaywall';
import { useToast } from '../ToastContext';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { searchMedicines, isDrugBanned } from '../services/geminiService';
import { useLanguage } from '../LanguageContext';
import { Helmet } from 'react-helmet-async';

interface Schedule {
  id: string;
  medicineName: string;
  dosage: string;
  time: string;
  days: string[];
  lastTakenDate?: string | null; // YYYY-MM-DD
  userId: string;
  createdAt: any;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const HEALTH_TIPS = [
  "Drink a glass of water with your medicine.",
  "Take your medicine at the same time every day.",
  "Don't skip doses for better effectiveness.",
  "Keep medicines in a cool, dry place.",
  "Check the expiry date before taking.",
  "Avoid taking medicine with fruit juices unless advised."
];

export const Timetable: React.FC = () => {
  const { user, profile, openAuthModal, loading } = useAuth();
  const { showToast } = useToast();
  const { language, t } = useLanguage();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<{ name: string; category: string; source?: string }[]>([]);
  const [bannedWarning, setBannedWarning] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    medicineName: '',
    dosage: '',
    time: '08:00',
    days: [...DAYS]
  });

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted");
      
      if (Notification.permission === "default" && user) {
        const timer = setTimeout(() => {
          showToast(t('enableNotificationsPrompt'), "info");
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  const requestNotifications = async () => {
    if (!("Notification" in window)) {
      showToast(t('notificationsNotSupported'), "error");
      return;
    }

    if (Notification.permission === "denied") {
      showToast(t('notificationsBlocked'), "error");
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === "granted");
    if (permission === "granted") {
      showToast(t('notificationsEnabled'), "success");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (newSchedule.medicineName.length > 2 && isAdding) {
        setIsSearching(true);
        const results = await searchMedicines(newSchedule.medicineName, language);
        setSuggestions(results);
        setIsSearching(false);
        
        if (isDrugBanned(newSchedule.medicineName)) {
          setBannedWarning(`${newSchedule.medicineName} ${t('bannedWarning')}`);
        } else {
          setBannedWarning(null);
        }
      } else {
        setSuggestions([]);
        setBannedWarning(null);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [newSchedule.medicineName, isAdding, language]);

  useEffect(() => {
    if (!user) {
      setSchedules([]);
      return;
    }

    const q = query(collection(db, 'schedules'), where('userId', '==', user.uid));
    console.log("Setting up schedules listener for:", user.uid);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log(`Received schedules snapshot: ${snapshot.size} documents`);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Schedule[];
      // Sort by time
      data.sort((a, b) => a.time.localeCompare(b.time));
      setSchedules(data);
    }, (error) => {
      console.error("Firestore onSnapshot error:", error);
      handleFirestoreError(error, OperationType.LIST, 'schedules');
      showToast(t('timetableLoadError'), "error");
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await addDoc(collection(db, 'schedules'), {
        ...newSchedule,
        userId: user.uid,
        createdAt: serverTimestamp(),
        lastTakenDate: null
      });
      setIsAdding(false);
      setNewSchedule({ medicineName: '', dosage: '', time: '08:00', days: [...DAYS] });
      showToast(t('scheduleAdded'), 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'schedules');
      showToast(t('scheduleAddError'), 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'schedules', id));
      showToast(t('scheduleRemoved'), 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `schedules/${id}`);
      showToast(t('scheduleRemoveError'), 'error');
    }
  };

  const handleToggleTaken = async (schedule: Schedule) => {
    if (!user) return;
    const today = new Date().toLocaleDateString('en-CA');
    const isTaken = schedule.lastTakenDate === today;

    try {
      await updateDoc(doc(db, 'schedules', schedule.id), {
        lastTakenDate: isTaken ? null : today,
        updatedAt: serverTimestamp()
      });
      showToast(isTaken ? t('markedNotTaken') : t('markedTaken'), 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `schedules/${schedule.id}`);
      showToast(t('statusUpdateError'), 'error');
    }
  };

  const getDayIndex = (d: Date) => (d.getDay() + 6) % 7;
  const todayIndex = getDayIndex(new Date());
  const today = DAYS[todayIndex]; 
  const todayDate = new Date().toLocaleDateString('en-CA');
  
  const isDayActive = (scheduleDays: string[], day: string) => {
    return (scheduleDays || []).some(d => d.substring(0, 3) === day.substring(0, 3));
  };

  const todaySchedules = schedules.filter(s => isDayActive(s.days, today));
  const otherSchedules = schedules.filter(s => !isDayActive(s.days, today));

  const isPremium = profile?.isPremium === true || profile?.role === 'admin';

  return (
    <div className="min-h-screen bg-transparent pt-32 sm:pt-40 pb-24 px-4 overflow-x-hidden">
      <Helmet>
        <title>Medicine Timetable & Reminders | Aethelcare India</title>
        <meta name="description" content="Set reminders for your medications, track your daily doses, and get health tips on Aethelcare." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl md:text-6xl font-black tracking-[-0.05em] text-text-primary mb-4 uppercase leading-none">{t('timetableTitle')}</h1>
            <p className="text-text-secondary font-bold tracking-tight text-xl opacity-70 leading-none">{t('timetableSubtitle')}</p>
            {notificationsEnabled && (
              <p className="text-[10px] text-success font-black uppercase tracking-[0.2em] mt-6 flex items-center gap-2 backdrop-blur-md bg-success/10 px-4 py-2 rounded-full border border-success/20 w-fit">
                <CheckCircle2 className="w-3.5 h-3.5" /> {t('notificationsActive')}
              </p>
            )}
          </motion.div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={requestNotifications}
              className={`p-5 rounded-[2rem] backdrop-blur-xl transition-all shadow-2xl ${notificationsEnabled ? 'bg-success text-white shadow-success/20' : 'bg-surface/70 text-text-secondary hover:text-text-primary border border-surface'}`}
              title={notificationsEnabled ? t('notificationsEnabled') : t('enableNotifications')}
            >
              {notificationsEnabled ? <Bell className="w-6 h-6" /> : <BellOff className="w-6 h-6" />}
            </button>
            {!isAdding && (
              <button 
                onClick={() => setIsAdding(true)}
                className="px-10 py-5 bg-primary text-white rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:bg-primary-hover transition-all shadow-2xl active:scale-95 group"
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> {t('addMed')}
              </button>
            )}
          </div>
        </div>
 
        {isAdding && (
          <motion.form 
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            onSubmit={handleAddSchedule}
            className="backdrop-blur-3xl bg-surface/70 p-12 rounded-[4rem] shadow-[0_40px_100px_rgba(0,0,0,0.08)] mb-16 border-2 border-surface relative"
          >
            <div className="absolute inset-0 rounded-[4rem] overflow-hidden pointer-events-none">
              <div className="absolute top-0 right-0 w-64 h-64 bg-dark-bg/5 rounded-full -mr-32 -mt-32 blur-3xl" />
            </div>
 
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10 relative">
              <div className="relative z-30" ref={searchRef}>
                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary mb-4 ml-4">{t('medicineName')}</label>
                <div className="relative group">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary/30 group-focus-within:text-text-primary transition-colors" />
                  <input 
                    type="text" 
                    required
                    value={newSchedule.medicineName}
                    onChange={e => setNewSchedule({...newSchedule, medicineName: e.target.value})}
                    className="w-full pl-16 pr-6 py-6 backdrop-blur-md bg-surface border-2 border-surface rounded-[2rem] focus:ring-0 focus:border-dark-bg font-bold text-lg transition-all shadow-inner placeholder:text-text-secondary/30"
                    placeholder={t('medicineSearchPlaceholder')}
                  />
                </div>
                
                <AnimatePresence>
                  {suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      className="absolute z-50 w-full mt-4 bg-surface border-2 border-surface rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.15)] overflow-hidden"
                    >
                      {suggestions.map((s, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setNewSchedule({...newSchedule, medicineName: s.name});
                            setSuggestions([]);
                          }}
                          className="w-full text-left px-8 py-6 hover:bg-dark-bg hover:text-white transition-all flex flex-col gap-1 border-b border-surface last:border-0 group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-black text-lg tracking-tight uppercase">{s.name}</span>
                            {s.source && (
                              <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                                s.source === 'Verified Database' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-bg text-text-secondary group-hover:bg-white/20 group-hover:text-white'
                              }`}>
                                {s.source}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary group-hover:text-white/50">{s.category}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
 
                {bannedWarning && (
                   <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mt-6 p-6 backdrop-blur-md bg-danger/10 border border-danger/20 rounded-[2rem] flex items-start gap-4"
                  >
                    <AlertCircle className="w-6 h-6 text-danger shrink-0" />
                    <p className="text-sm text-danger font-bold leading-tight tracking-tight uppercase">{bannedWarning}</p>
                  </motion.div>
                )}
              </div>
              <div className="relative z-20">
                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary mb-4 ml-4">{t('dosageLabel')}</label>
                <input 
                  type="text" 
                  required
                  value={newSchedule.dosage}
                  onChange={e => setNewSchedule({...newSchedule, dosage: e.target.value})}
                  className="w-full px-8 py-6 backdrop-blur-md bg-surface border-2 border-surface rounded-[2rem] focus:ring-0 focus:border-dark-bg font-bold text-lg transition-all shadow-inner placeholder:text-text-secondary/30"
                  placeholder={t('dosagePlaceholder')}
                />
              </div>
            </div>
 
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12 relative z-10">
              <div className="relative z-10">
                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary mb-4 ml-4">{t('timeLabel')}</label>
                <div className="relative group">
                  <Clock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary/30 group-focus-within:text-text-primary transition-colors" />
                  <input 
                    type="time" 
                    required
                    value={newSchedule.time}
                    onChange={e => setNewSchedule({...newSchedule, time: e.target.value})}
                    className="w-full pl-16 pr-6 py-6 backdrop-blur-md bg-surface border-2 border-surface rounded-[2rem] focus:ring-0 focus:border-dark-bg font-bold text-lg transition-all shadow-inner"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary mb-4 ml-4">{t('frequencyLabel')}</label>
                <div className="flex flex-wrap gap-2.5">
                  {DAYS.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        setNewSchedule(prev => ({
                          ...prev,
                          days: prev.days.includes(day) 
                            ? prev.days.filter(d => d !== day)
                            : [...prev.days, day]
                        }));
                      }}
                      className={`w-12 h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                        newSchedule.days.includes(day) 
                          ? 'bg-dark-bg text-white shadow-2xl scale-110 -translate-y-1' 
                          : 'backdrop-blur-md bg-surface text-text-secondary hover:bg-dark-bg hover:text-white border border-surface'
                      }`}
                    >
                      {day[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
 
            <div className="flex justify-end gap-6 pt-10 border-t border-surface/50 relative z-10">
              <button 
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-10 py-5 text-text-secondary font-black uppercase tracking-[0.2em] text-[10px] hover:text-text-primary transition-all"
              >
                {t('cancel')}
              </button>
              <button 
                type="submit"
                className="px-12 py-5 bg-dark-bg text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:bg-dark-bg/90 transition-all shadow-2xl active:scale-95"
              >
                {t('saveSchedule')}
              </button>
            </div>
          </motion.form>
        )}
 
        {schedules.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="backdrop-blur-xl bg-surface/40 rounded-[5rem] p-24 text-center shadow-sm border-4 border-dashed border-surface/50"
          >
            <div className="w-24 h-24 backdrop-blur-md bg-surface rounded-[3rem] flex items-center justify-center mx-auto mb-10 shadow-2xl rotate-3">
              <CalendarIcon className="w-12 h-12 text-text-secondary opacity-20" />
            </div>
            <p className="text-3xl font-black tracking-[-0.05em] text-text-primary uppercase leading-none mb-4">{t('timetableEmpty')}</p>
            <p className="text-text-secondary font-bold tracking-tight text-xl opacity-60 italic max-w-md mx-auto">"{t('timetableEmptyDesc')}"</p>
          </motion.div>
        ) : (
          <div className="space-y-20">
            {/* Today's Section */}
            {todaySchedules.length > 0 && (
              <section>
                <div className="flex items-center gap-6 mb-12">
                  <h2 className="text-xs font-black uppercase tracking-[0.4em] text-text-secondary opacity-60 shrink-0">{t('todaysDoses')}</h2>
                  <div className="h-px w-full bg-dark-bg/10" />
                  <span className="px-5 py-2 backdrop-blur-md bg-surface/70 border border-surface text-text-primary text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm shrink-0">
                    {t(`day_${today.toLowerCase()}`)}
                  </span>
                </div>
                <div className="grid gap-6">
                  {todaySchedules.map((schedule) => {
                    const isTaken = schedule.lastTakenDate === todayDate;
                    return (
                      <motion.div 
                        key={schedule.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-10 rounded-[4rem] backdrop-blur-xl border-2 transition-all flex flex-col md:flex-row md:items-center justify-between gap-10 group relative overflow-hidden ${
                          isTaken 
                            ? 'bg-success/5 grayscale border-success/20' 
                            : 'bg-surface/70 border-surface hover:shadow-2xl hover:border-dark-bg'
                        }`}
                      >
                        <div className="flex items-center gap-10">
                          <div className={`w-24 h-24 rounded-[2.5rem] flex flex-col items-center justify-center border-2 transition-all shadow-inner shrink-0 ${
                            isTaken 
                              ? 'bg-success text-white border-success/40 scale-95 rotate-3 shadow-success/20' 
                              : 'backdrop-blur-md bg-bg border-surface group-hover:bg-dark-bg group-hover:text-white group-hover:-rotate-3'
                          }`}>
                            {isTaken ? (
                              <CheckCircle2 className="w-12 h-12" />
                            ) : (
                              <>
                                <Clock className="w-6 h-6 mb-2 opacity-30" />
                                <span className="text-lg font-black tracking-tighter uppercase">{schedule.time}</span>
                              </>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-4 mb-2">
                              <h3 className={`text-3xl md:text-4xl font-black tracking-[-0.05em] uppercase leading-none ${isTaken ? 'text-text-secondary italic line-through' : 'text-text-primary'}`}>
                                {schedule.medicineName}
                              </h3>
                              <AnimatePresence>
                                {isDrugBanned(schedule.medicineName) && (
                                  <motion.span 
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="px-3 py-1 bg-danger text-white text-[8px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-danger/20"
                                  >
                                    {t('banned')}
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </div>
                            <p className="text-xl md:text-2xl text-text-secondary font-bold tracking-tight italic opacity-70">"{schedule.dosage}"</p>
                          </div>
                        </div>
                        
                         <div className="flex items-center justify-between md:justify-end gap-6">
                           <button
                             onClick={() => handleToggleTaken(schedule)}
                             className={`px-12 py-5 rounded-[2rem] font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-3 shadow-2xl active:scale-95 ${
                               isTaken 
                                 ? 'bg-success text-white hover:bg-success/90 shadow-success/20' 
                                 : 'bg-primary text-white hover:bg-primary-hover'
                             }`}
                           >
                             {isTaken ? t('taken') : t('markAsTaken')}
                           </button>
                           <button 
                             onClick={() => handleDelete(schedule.id)}
                             className="p-5 backdrop-blur-md bg-surface border border-surface text-text-secondary/30 hover:text-danger hover:bg-danger/10 rounded-[1.5rem] transition-all shadow-sm active:scale-90"
                           >
                             <Trash2 className="w-6 h-6" />
                           </button>
                        </div>
                        
                        <div className={`absolute top-0 right-0 w-48 h-48 rounded-full -mr-24 -mt-24 blur-3xl opacity-10 transition-transform duration-1000 group-hover:scale-150 ${isTaken ? 'bg-success' : 'bg-dark-bg'}`} />
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            )}
 
            {/* Other Days Section */}
            {otherSchedules.length > 0 && (
              <section>
                <div className="flex items-center gap-6 mb-12">
                  <h2 className="text-xs font-black uppercase tracking-[0.4em] text-text-secondary opacity-60 shrink-0">{t('otherDays')}</h2>
                  <div className="h-px w-full bg-dark-bg/10" />
                </div>
                <div className="grid gap-6">
                  {otherSchedules.map((schedule) => (
                    <motion.div 
                      key={schedule.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="backdrop-blur-xl bg-surface/50 p-10 rounded-[4rem] border-2 border-surface flex flex-col lg:flex-row lg:items-center justify-between gap-10 group hover:shadow-2xl hover:border-dark-bg transition-all relative overflow-hidden"
                    >
                      <div className="flex items-center gap-10 relative z-10">
                        <div className="w-20 h-20 backdrop-blur-md bg-surface rounded-[2rem] flex flex-col items-center justify-center border border-surface shadow-inner shrink-0 group-hover:bg-dark-bg group-hover:text-white transition-all">
                          <Clock className="w-5 h-5 opacity-30 mb-1" />
                          <span className="text-sm font-black tracking-tighter uppercase">{schedule.time}</span>
                        </div>
                        <div>
                          <h3 className="text-3xl font-black text-text-primary mb-1 tracking-tight uppercase leading-none">{schedule.medicineName}</h3>
                          <p className="text-lg text-text-secondary font-bold tracking-tight italic opacity-70">"{schedule.dosage}"</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between lg:justify-end gap-10 flex-1 relative z-10">
                        <div className="flex gap-2 p-3 backdrop-blur-md bg-surface border border-surface rounded-[2rem] shadow-inner">
                          {DAYS.map(day => (
                            <span 
                              key={day}
                              title={t(`day_${day.toLowerCase()}`)}
                              className={`text-[8px] font-black uppercase tracking-wider w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
                                isDayActive(schedule.days, day) 
                                  ? 'bg-dark-bg text-white shadow-lg -translate-y-1' 
                                  : 'text-text-secondary opacity-20'
                              }`}
                            >
                              {day[0]}
                            </span>
                          ))}
                        </div>
                        <button 
                          onClick={() => handleDelete(schedule.id)}
                          className="p-5 backdrop-blur-md bg-surface border border-surface text-text-secondary/30 hover:text-danger hover:bg-danger/10 rounded-[1.5rem] transition-all shadow-sm active:scale-90"
                        >
                          <Trash2 className="w-6 h-6" />
                        </button>
                      </div>
                      
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-dark-bg/5 rounded-full -ml-16 -mb-16 blur-2xl group-hover:scale-150 transition-transform duration-1000" />
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {showPaywall && <PremiumPaywall onSuccess={() => setShowPaywall(false)} onClose={() => setShowPaywall(false)} />}
    </div>
  );
};

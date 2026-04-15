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

interface Schedule {
  id: string;
  medicineName: string;
  dosage: string;
  time: string;
  days: string[];
  lastTakenDate?: string; // YYYY-MM-DD
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
  const { language } = useLanguage();
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
  const notifiedRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted");
      
      if (Notification.permission === "default" && user) {
        const timer = setTimeout(() => {
          showToast("Enable notifications to get medication reminders!", "info");
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  // Notification logic
  useEffect(() => {
    if (!notificationsEnabled || schedules.length === 0) return;

    // Load previously notified items from localStorage to survive page refreshes
    const loadNotifiedState = () => {
      try {
        const saved = localStorage.getItem('medinfo_notified');
        if (saved) {
          notifiedRef.current = JSON.parse(saved);
        }
      } catch (e) {
        console.error("Failed to load notified state", e);
      }
    };
    loadNotifiedState();

    const saveNotifiedState = () => {
      try {
        // Clean up old dates to prevent localStorage from growing indefinitely
        const todayStr = new Date().toLocaleDateString('en-CA');
        const cleanedState: Record<string, string> = {};
        for (const [key, date] of Object.entries(notifiedRef.current)) {
          if (date === todayStr) {
            cleanedState[key] = date;
          }
        }
        notifiedRef.current = cleanedState;
        localStorage.setItem('medinfo_notified', JSON.stringify(cleanedState));
      } catch (e) {
        console.error("Failed to save notified state", e);
      }
    };

    const checkReminders = async () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Use local date string to avoid UTC timezone issues
      const todayStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD
      const dayIndex = (now.getDay() + 6) % 7;
      const currentDay = DAYS[dayIndex];

      let stateChanged = false;

      for (const schedule of schedules) {
        if (!schedule.days.includes(currentDay)) continue;

        const [schedHour, schedMinute] = schedule.time.split(':').map(Number);
        
        // Check if the scheduled time is within the last 5 minutes
        // This handles browser throttling of setInterval in background tabs
        const nowMinutes = currentHour * 60 + currentMinute;
        const schedMinutes = schedHour * 60 + schedMinute;
        
        if (nowMinutes >= schedMinutes && nowMinutes < schedMinutes + 5) {
          const notificationKey = `${schedule.id}-${todayStr}`;
          if (!notifiedRef.current[notificationKey]) {
            try {
              const randomTip = HEALTH_TIPS[Math.floor(Math.random() * HEALTH_TIPS.length)];
              const title = `💊 Time for ${schedule.medicineName}`;
              const options: any = {
                body: `Dosage: ${schedule.dosage}\n\nTip: ${randomTip}`,
                icon: "https://cdn-icons-png.flaticon.com/512/822/822143.png",
                badge: "https://cdn-icons-png.flaticon.com/512/822/822143.png",
                tag: schedule.id,
                requireInteraction: true,
                vibrate: [200, 100, 200, 100, 200],
                silent: false,
                data: {
                  url: window.location.origin + '/timetable',
                  medicineName: schedule.medicineName
                }
              };

              // Actions are only supported in ServiceWorker notifications
              if ('serviceWorker' in navigator) {
                options.actions = [
                  { action: 'taken', title: 'Mark as Taken' },
                  { action: 'snooze', title: 'Snooze' }
                ];
                try {
                  const registration = await Promise.race([
                    navigator.serviceWorker.ready,
                    new Promise((_, reject) => setTimeout(() => reject(new Error('SW timeout')), 2000))
                  ]) as ServiceWorkerRegistration;
                  await registration.showNotification(title, options);
                } catch (e) {
                  console.warn("Service worker notification failed, falling back to standard Notification", e);
                  new Notification(title, options);
                }
              } else {
                new Notification(title, options);
              }
              
              notifiedRef.current[notificationKey] = todayStr;
              stateChanged = true;
            } catch (err) {
              console.error("Failed to send notification:", err);
            }
          }
        }
      }

      if (stateChanged) {
        saveNotifiedState();
      }
    };

    // Check immediately then every 30 seconds to be more responsive
    checkReminders();
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [notificationsEnabled, schedules]);

  const requestNotifications = async () => {
    if (!("Notification" in window)) {
      showToast("Notifications not supported in this browser", "error");
      return;
    }

    if (Notification.permission === "denied") {
      showToast("Notifications are blocked. Please enable them in your browser settings.", "error");
      alert("If you are on Windows, check if 'Focus Assist' or 'Do Not Disturb' is turned on. Notifications might be hidden in the Action Center (bottom right corner of your screen).");
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === "granted");
    if (permission === "granted") {
      showToast("Notifications enabled!", "success");
      try {
        const title = "🔔 MedInfo India Enabled";
        const options: any = {
          body: "You'll now receive timely medication reminders and health tips.",
          icon: "https://cdn-icons-png.flaticon.com/512/822/822143.png",
          vibrate: [100, 50, 100]
        };

        if ('serviceWorker' in navigator) {
          try {
            // Use Promise.race to prevent hanging if SW is not fully active
            const registration = await Promise.race([
              navigator.serviceWorker.ready,
              new Promise((_, reject) => setTimeout(() => reject(new Error('SW timeout')), 2000))
            ]) as ServiceWorkerRegistration;
            await registration.showNotification(title, options);
          } catch (e) {
            console.warn("Service worker notification failed, falling back to standard Notification", e);
            new Notification(title, options);
          }
        } else {
          new Notification(title, options);
        }
      } catch (err) {
        console.error("Failed to send test notification:", err);
      }
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
          setBannedWarning(`${newSchedule.medicineName} is a BANNED drug in India. Please consult a doctor immediately.`);
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
    if (!user) return;

    const q = query(collection(db, 'schedules'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Schedule[];
      // Sort by time
      data.sort((a, b) => a.time.localeCompare(b.time));
      setSchedules(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'schedules');
      showToast("Could not load timetable.", "error");
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
        createdAt: new Date().toISOString()
      });
      setIsAdding(false);
      setNewSchedule({ medicineName: '', dosage: '', time: '08:00', days: [...DAYS] });
      showToast('Schedule added successfully', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'schedules');
      showToast('Failed to add schedule', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'schedules', id));
      showToast('Schedule removed', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `schedules/${id}`);
      showToast('Failed to remove schedule', 'error');
    }
  };

  const handleToggleTaken = async (schedule: Schedule) => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const isTaken = schedule.lastTakenDate === today;

    try {
      await updateDoc(doc(db, 'schedules', schedule.id), {
        lastTakenDate: isTaken ? null : today,
        updatedAt: serverTimestamp()
      });
      showToast(isTaken ? 'Marked as not taken' : 'Marked as taken! Good job.', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `schedules/${schedule.id}`);
      showToast('Failed to update status', 'error');
    }
  };

  const today = DAYS[(new Date().getDay() + 6) % 7]; // Adjust for Mon-Sun array
  const todayDate = new Date().toISOString().split('T')[0];
  const todaySchedules = schedules.filter(s => s.days.includes(today));
  const otherSchedules = schedules.filter(s => !s.days.includes(today));

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-2">My Timetable</h1>
            <p className="text-gray-500 font-medium">Manage your daily medication schedule</p>
            {notificationsEnabled && (
              <p className="text-xs text-green-600 font-bold mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Notifications active (keep app open or in background)
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={requestNotifications}
              className={`p-3 rounded-xl transition-all ${notificationsEnabled ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400 hover:text-black'}`}
              title={notificationsEnabled ? "Notifications Enabled" : "Enable Notifications"}
            >
              {notificationsEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
            </button>
            {!isAdding && (
              <button 
                onClick={() => setIsAdding(true)}
                className="px-6 py-3 bg-black text-white rounded-xl font-bold flex items-center gap-2 hover:bg-gray-900 transition-colors shadow-lg"
              >
                <Plus className="w-5 h-5" /> Add Med
              </button>
            )}
          </div>
        </div>

        {isAdding && (
          <motion.form 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleAddSchedule}
            className="bg-white p-8 rounded-[2.5rem] shadow-2xl mb-12 border border-gray-100 relative"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="relative" ref={searchRef}>
                <label className="block text-sm font-black uppercase tracking-widest text-gray-400 mb-3">Medicine Name</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                  <input 
                    type="text" 
                    required
                    value={newSchedule.medicineName}
                    onChange={e => setNewSchedule({...newSchedule, medicineName: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-black/5 focus:border-black font-bold transition-all"
                    placeholder="Search or type name..."
                  />
                </div>
                
                <AnimatePresence>
                  {suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden"
                    >
                      {suggestions.map((s, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setNewSchedule({...newSchedule, medicineName: s.name});
                            setSuggestions([]);
                          }}
                          className="w-full text-left px-6 py-4 hover:bg-gray-50 flex flex-col gap-0.5 border-b border-gray-50 last:border-0"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-900">{s.name}</span>
                            {s.source && (
                              <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                                s.source === 'Verified Database' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'
                              }`}>
                                {s.source}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{s.category}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {bannedWarning && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 font-bold leading-tight">{bannedWarning}</p>
                  </motion.div>
                )}
              </div>
              <div>
                <label className="block text-sm font-black uppercase tracking-widest text-gray-400 mb-3">Dosage</label>
                <input 
                  type="text" 
                  required
                  value={newSchedule.dosage}
                  onChange={e => setNewSchedule({...newSchedule, dosage: e.target.value})}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-black/5 focus:border-black font-bold transition-all"
                  placeholder="e.g. 1 Tablet"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <label className="block text-sm font-black uppercase tracking-widest text-gray-400 mb-3">Time</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                  <input 
                    type="time" 
                    required
                    value={newSchedule.time}
                    onChange={e => setNewSchedule({...newSchedule, time: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-black/5 focus:border-black font-bold transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-black uppercase tracking-widest text-gray-400 mb-3">Frequency</label>
                <div className="flex flex-wrap gap-2">
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
                      className={`w-10 h-10 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                        newSchedule.days.includes(day) 
                          ? 'bg-black text-white shadow-lg scale-110' 
                          : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                      }`}
                    >
                      {day[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-gray-50">
              <button 
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-8 py-4 text-gray-500 font-black uppercase tracking-widest text-xs hover:bg-gray-50 rounded-2xl transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-10 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-900 transition-all shadow-xl hover:shadow-2xl active:scale-95"
              >
                Save Schedule
              </button>
            </div>
          </motion.form>
        )}

        {schedules.length === 0 ? (
          <div className="bg-white rounded-[3rem] p-20 text-center shadow-sm border-2 border-dashed border-gray-100">
            <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
              <CalendarIcon className="w-10 h-10 text-gray-200" />
            </div>
            <p className="text-2xl text-gray-400 font-black tracking-tight">Your timetable is empty</p>
            <p className="text-gray-400 font-medium mt-2">Add your first medication to stay on track.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Today's Section */}
            {todaySchedules.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-xl font-black uppercase tracking-[0.2em] text-gray-400">Today's Doses</h2>
                  <div className="h-px flex-grow bg-gray-100" />
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                    {today}
                  </span>
                </div>
                <div className="grid gap-4">
                  {todaySchedules.map((schedule) => {
                    const isTaken = schedule.lastTakenDate === todayDate;
                    return (
                      <motion.div 
                        key={schedule.id}
                        layout
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`bg-white p-8 rounded-[2.5rem] shadow-sm border transition-all flex flex-col md:flex-row md:items-center justify-between gap-8 ${isTaken ? 'opacity-60 grayscale border-green-100 bg-green-50/10' : 'border-gray-100 hover:shadow-xl hover:border-black'}`}
                      >
                        <div className="flex items-center gap-8">
                          <div className={`w-20 h-20 rounded-3xl flex flex-col items-center justify-center border transition-all ${isTaken ? 'bg-green-100 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
                            {isTaken ? (
                              <CheckCircle2 className="w-8 h-8 text-green-600" />
                            ) : (
                              <>
                                <Clock className="w-6 h-6 text-gray-400 mb-1" />
                                <span className="text-sm font-black text-gray-900">{schedule.time}</span>
                              </>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className={`text-2xl font-black tracking-tight ${isTaken ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                {schedule.medicineName}
                              </h3>
                              {isDrugBanned(schedule.medicineName) && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[8px] font-black uppercase tracking-widest rounded-md">Banned</span>
                              )}
                            </div>
                            <p className="text-lg text-gray-500 font-medium">{schedule.dosage}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between md:justify-end gap-6">
                          <button
                            onClick={() => handleToggleTaken(schedule)}
                            className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center gap-2 ${
                              isTaken 
                                ? 'bg-green-600 text-white shadow-lg' 
                                : 'bg-black text-white shadow-xl hover:bg-gray-900'
                            }`}
                          >
                            {isTaken ? 'Taken' : 'Mark as Taken'}
                          </button>
                          <button 
                            onClick={() => handleDelete(schedule.id)}
                            className="p-4 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Other Days Section */}
            {otherSchedules.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-xl font-black uppercase tracking-[0.2em] text-gray-400">Other Days</h2>
                  <div className="h-px flex-grow bg-gray-100" />
                </div>
                <div className="grid gap-4">
                  {otherSchedules.map((schedule) => (
                    <motion.div 
                      key={schedule.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-8 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-center gap-8">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex flex-col items-center justify-center border border-gray-100">
                          <Clock className="w-5 h-5 text-gray-400 mb-1" />
                          <span className="text-xs font-black text-gray-900">{schedule.time}</span>
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-gray-900 mb-1">{schedule.medicineName}</h3>
                          <p className="text-gray-500 font-medium">{schedule.dosage}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between md:justify-end gap-8 flex-1">
                        <div className="flex gap-1.5">
                          {DAYS.map(day => (
                            <span 
                              key={day}
                              className={`text-[8px] font-black uppercase tracking-wider w-8 h-8 flex items-center justify-center rounded-xl transition-all ${
                                schedule.days.includes(day) ? 'bg-black text-white shadow-md' : 'bg-gray-50 text-gray-200'
                              }`}
                            >
                              {day[0]}
                            </span>
                          ))}
                        </div>
                        <button 
                          onClick={() => handleDelete(schedule.id)}
                          className="p-4 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
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

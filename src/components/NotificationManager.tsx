import React, { useEffect, useCallback, useRef, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';
import { useLanguage } from '../LanguageContext';

interface Schedule {
  id: string;
  medicineName: string;
  dosage: string;
  time: string;
  days: string[];
  userId: string;
  lastTakenDate?: string | null;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const FUN_NOTIFICATIONS = [
  {
    title: "Posture Check! 🧘",
    body: "Stop slouching! You aren't a shrimp. Sit up straight for 10 seconds."
  },
  {
    title: "Hydro-Alert! 💧",
    body: "Your brain is 75% water. Don't let it turn into a raisin. Drink up!"
  },
  {
    title: "Eye break! 👀",
    body: "Follow the 20-20-20 rule: Every 20 mins, look 20 feet away for 20 seconds."
  },
  {
    title: "Apple Logic 🍎",
    body: "An apple a day keeps the doctor away. But since you're here, we're your best friend!"
  },
  {
    title: "Vitamin D-tected! ☀️",
    body: "If you haven't seen the sun today, your plants are officially doing better than you."
  },
  {
    title: "Blink! 👁️",
    body: "Just a reminder to blink. Staring at screens makes your eyes dry like a desert."
  },
  {
    title: "Banned Drug Check! 🔍",
    body: "Did you know CDSCO recently updated the banned drug list? Better scan your cabinet!"
  },
  {
    title: "Generic Savings! 💰",
    body: "Most brand name meds have generic versions at 50-80% off. Use our scanner to find yours!"
  }
];

export const NotificationManager: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const notifiedRef = useRef<Record<string, string>>({});

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    
    return Notification.permission === 'granted';
  }, []);

  const sendNotification = useCallback(async (title: string, body: string, options: any = {}) => {
    const icon = '/favicon.svg';
    const finalOptions = {
      body,
      icon,
      badge: icon,
      vibrate: [200, 100, 200],
      ...options
    };

    if (Notification.permission === 'granted') {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          // Double check permission right before calling to avoid race conditions
          if (Notification.permission === 'granted') {
            await registration.showNotification(title, finalOptions);
          } else {
            showToast(`${title}: ${body}`, 'info');
          }
        } catch (e) {
          console.warn("Service worker notification failed, falling back to standard Notification", e);
          try {
            if (Notification.permission === 'granted') {
              new Notification(title, finalOptions);
            } else {
              showToast(`${title}: ${body}`, 'info');
            }
          } catch (err) {
            showToast(`${title}: ${body}`, 'info');
          }
        }
      } else {
        try {
          new Notification(title, finalOptions);
        } catch (err) {
          showToast(`${title}: ${body}`, 'info');
        }
      }
    } else {
      showToast(`${title}: ${body}`, 'info');
    }
  }, [showToast]);

  // Sync schedules
  useEffect(() => {
    if (!user) {
      setSchedules([]);
      return;
    }

    const q = query(collection(db, 'schedules'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Schedule[];
      setSchedules(data);
    });

    return () => unsubscribe();
  }, [user]);

  // Reminder Logic
  useEffect(() => {
    if (!user || schedules.length === 0) return;

    // Load notified state
    try {
      const saved = localStorage.getItem('medinfo_notified');
      if (saved) notifiedRef.current = JSON.parse(saved);
    } catch (e) {}

    const checkReminders = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const todayStr = now.toLocaleDateString('en-CA');
      const dayIndex = (now.getDay() + 6) % 7;
      const currentDay = DAYS[dayIndex];

      let stateChanged = false;

      for (const schedule of schedules) {
        // Normalize days to handle potential legacy formats or case sensitivity
        const activeDays = (schedule.days || []).map(d => d.substring(0, 3));
        if (!activeDays.includes(currentDay)) continue;
        
        // Skip if already taken today
        if (schedule.lastTakenDate === todayStr) continue;

        const [schedHour, schedMinute] = schedule.time.split(':').map(Number);
        const nowMinutes = currentHour * 60 + currentMinute;
        const schedMinutes = schedHour * 60 + schedMinute;

        // Check if the scheduled time is within the last 5 minutes
        if (nowMinutes >= schedMinutes && nowMinutes < schedMinutes + 5) {
          const notificationKey = `notif-${schedule.id}-${todayStr}`;
          if (!notifiedRef.current[notificationKey]) {
            const tips = [t('tip1'), t('tip2'), t('tip3'), t('tip4'), t('tip5'), t('tip6')];
            const randomTip = tips[Math.floor(Math.random() * tips.length)];
            
            sendNotification(`💊 ${t('timeFor')} ${schedule.medicineName}`, `${t('dosageLabel')}: ${schedule.dosage}\n\nTip: ${randomTip}`, {
              tag: `med-${schedule.id}`,
              requireInteraction: true,
              data: { url: '/timetable' },
              actions: [
                { action: 'taken', title: t('markAsTaken') }
              ]
            });

            notifiedRef.current[notificationKey] = todayStr;
            stateChanged = true;
          }
        }
      }

      if (stateChanged) {
        // Clean up old dates
        const cleanedState: Record<string, string> = {};
        for (const [key, date] of Object.entries(notifiedRef.current)) {
          if (date === todayStr) cleanedState[key] = date;
        }
        localStorage.setItem('medinfo_notified', JSON.stringify(cleanedState));
      }
    };

    const interval = setInterval(checkReminders, 30000);
    checkReminders(); // Run immediately

    return () => clearInterval(interval);
  }, [user, schedules, t, sendNotification]);

  // Fun Notifications
  useEffect(() => {
    if (!user) return;

    requestPermission();

    const welcomeTimer = setTimeout(() => {
      sendNotification("Welcome to Aethelcare! 🛡️", "We're here to keep you and your medicine safe. Explore our scanner!");
    }, 500);

    const scheduleNextFun = () => {
      const delay = (5 + Math.random() * 5) * 60 * 1000; 
      return setTimeout(() => {
        const randomNotif = FUN_NOTIFICATIONS[Math.floor(Math.random() * FUN_NOTIFICATIONS.length)];
        sendNotification(randomNotif.title, randomNotif.body);
        scheduleNextFun();
      }, delay);
    };

    const funTimer = scheduleNextFun();

    return () => {
      clearTimeout(welcomeTimer);
      clearTimeout(funTimer);
    };
  }, [user, requestPermission, sendNotification]);

  return null;
};

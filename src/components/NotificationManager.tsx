import React, { useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';

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

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    
    return Notification.permission === 'granted';
  }, []);

  const sendNotification = useCallback((title: string, body: string) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        body,
        icon: '/favicon.svg'
      });
    } else if (Notification.permission === 'granted') {
       new Notification(title, { body, icon: '/favicon.svg' });
    } else {
      showToast(`${title}: ${body}`, 'info');
    }
  }, [showToast]);

  useEffect(() => {
    if (!user) return;

    // Initial permission request
    requestPermission();

    // Send a welcome fun notification after 0.5 seconds
    const welcomeTimer = setTimeout(() => {
      const greeting = {
        title: "Welcome to Aethelcare! 🛡️",
        body: "We're here to keep you and your medicine safe. Explore our scanner!"
      };
      sendNotification(greeting.title, greeting.body);
    }, 500);

    // Schedule random notifications every 5-10 minutes (fun e-comm vibe)
    const scheduleNext = () => {
      const delay = (5 + Math.random() * 5) * 60 * 1000; 
      return setTimeout(() => {
        const randomNotif = FUN_NOTIFICATIONS[Math.floor(Math.random() * FUN_NOTIFICATIONS.length)];
        sendNotification(randomNotif.title, randomNotif.body);
        scheduleNext();
      }, delay);
    };

    const timer = scheduleNext();
    return () => {
      clearTimeout(welcomeTimer);
      clearTimeout(timer);
    };
  }, [user, requestPermission, sendNotification]);

  return null;
};

import React, { useEffect } from 'react';

const FUNNY_MESSAGES = [
  "Hey! Your medicines are missing you! 🥺💊",
  "Did you drink water today? Stay hydrated! 💧",
  "An apple a day keeps the doctor away, but don't forget your meds! 🍎",
  "Your health is your wealth! Check your timetable! 🏥",
  "Just a friendly reminder that you're doing great! 🌟",
  "Time to take a break and stretch! 🧘‍♂️",
  "Don't let your pills get lonely! Check your schedule. 📅",
  "Be a superhero for your immune system today! 🦸‍♂️"
];

export const NotificationManager: React.FC = () => {
  useEffect(() => {
    const checkAndSendNotification = async () => {
      if (!("Notification" in window) || Notification.permission !== "granted") {
        return;
      }

      const lastFunnyNotif = localStorage.getItem('last_funny_notif');
      const now = Date.now();

      // Only send a funny notification if it's been at least 4 hours since the last one
      if (lastFunnyNotif && now - parseInt(lastFunnyNotif) < 1000 * 60 * 60 * 4) {
        return;
      }

      const message = FUNNY_MESSAGES[Math.floor(Math.random() * FUNNY_MESSAGES.length)];
      
      const options = {
        body: message,
        icon: "https://cdn-icons-png.flaticon.com/512/822/822143.png",
        vibrate: [100, 50, 100],
        tag: 'funny-notif',
      };

      try {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification("aethelcare", options);
        } else {
          new Notification("aethelcare", options);
        }
        localStorage.setItem('last_funny_notif', now.toString());
      } catch (e) {
        console.error("Failed to send funny notification", e);
      }
    };

    // Send one 2 minutes after opening the app
    const timeout = setTimeout(checkAndSendNotification, 1000 * 60 * 2);

    // And then every 4 hours while the app is open
    const interval = setInterval(checkAndSendNotification, 1000 * 60 * 60 * 4);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  return null;
};

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

      const lastInteractionTip = localStorage.getItem('last_interaction_tip');
      const now = Date.now();

      // Only send an interaction tip if it's been at least 4 hours since the last one
      if (lastInteractionTip && now - parseInt(lastInteractionTip) < 1000 * 60 * 60 * 4) {
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
          await registration.showNotification("Aethelcare India", options);
        } else {
          new Notification("Aethelcare India", options);
        }
        localStorage.setItem('last_interaction_tip', now.toString());
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

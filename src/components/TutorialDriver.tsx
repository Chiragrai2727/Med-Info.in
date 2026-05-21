import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

export const TutorialDriver = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const startTutorial = () => {
      const driverObj = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        popoverClass: 'driverjs-theme',
        steps: [
          {
            element: '#search-bar-step',
            popover: {
              title: 'Welcome to Aethelcare',
              description: 'Type any medicine name to instantly check if it is banned in India and get AI-powered safety alerts.',
              side: 'bottom',
              align: 'start'
            }
          },
          {
            element: '#scan-step',
            popover: {
              title: 'Smart Scanner',
              description: 'Use your camera to scan physical medicine packaging and extract safety info instantly.',
              side: 'bottom',
              align: 'center'
            }
          },
          {
            element: '#compare-step',
            popover: {
              title: 'Compare Medicines',
              description: 'Not sure which medicine to choose? Compare side-effects, dosage, and usage side-by-side.',
              side: 'top',
              align: 'start'
            }
          },
          {
            element: '#banned-drug-step',
            popover: {
              title: 'Banned Drugs',
              description: 'Check the list of medicines banned by CDSCO in India to ensure your safety.',
              side: 'bottom',
              align: 'center'
            }
          },
          {
            element: '#language-step',
            popover: {
              title: 'Multilingual Support',
              description: 'Access critical medical information in 22 scheduled Indian languages to understand warnings in your regional language.',
              side: 'bottom',
              align: 'end'
            }
          },
          {
            element: '#chatbot-trigger-step',
            popover: {
              title: 'Aethelcare Assistant',
              description: 'Have a specific question? Our AI assistant is always here to help you navigate the app and understand your medicines.',
              side: 'top',
              align: 'end'
            }
          }
        ]
      });

      driverObj.drive();
    };

    const handleOpenTutorial = () => {
      if (location.pathname !== '/') {
        navigate('/');
        setTimeout(startTutorial, 500);
      } else {
        startTutorial();
      }
    };

    document.addEventListener('openTutorial', handleOpenTutorial);

    // Initial check for tutorial
    if (!localStorage.getItem('hasSeenDriverTutorial')) {
      localStorage.setItem('hasSeenDriverTutorial', 'true');
      setTimeout(handleOpenTutorial, 1000);
    }

    return () => {
      document.removeEventListener('openTutorial', handleOpenTutorial);
    };
  }, [location.pathname, navigate]);

  return null;
};

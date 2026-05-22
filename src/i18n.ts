import { Language } from './types';

export const translations: Record<Language | 'en' | 'hi', Record<string, string>> = {
  en: {
    appName: 'Aethelcare',
    tagline: 'Search any medicine. Understand it instantly.',
  },
  hi: {
    appName: 'एथेलकेयर',
    tagline: 'किसी भी दवा को खोजें। उसे तुरंत समझें।',
  }
};

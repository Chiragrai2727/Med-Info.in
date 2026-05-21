import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { AlertCircle, ArrowLeft, Home as HomeIcon } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

export const NotFound: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center">
      <Helmet>
        <title>404 - {t('pageNotFound')} | Aethelcare India</title>
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 bg-danger/10 rounded-[2rem] flex items-center justify-center">
            <AlertCircle className="w-12 h-12 text-danger" />
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-text-primary mb-4 tracking-tight">
          {t('oops')} 404
        </h1>
        <p className="text-lg text-text-secondary mb-12 font-medium">
          {t('pageNotFoundDesc')}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white rounded-3xl font-black uppercase tracking-widest hover:bg-primary-hover shadow-xl shadow-primary/20 transition-all active:scale-95"
          >
            <HomeIcon className="w-4 h-4" />
            {t('goHome')}
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-surface text-text-primary border border-border rounded-3xl font-black uppercase tracking-widest hover:bg-bg transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('goBack')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

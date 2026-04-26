import React from 'react';
import { motion } from 'motion/react';
import { Logo } from '../components/Logo';
import { useLanguage } from '../LanguageContext';

export const About: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden pt-[calc(10rem+env(safe-area-inset-top))]">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        
        {/* HERO SECTION - Clean, Brand Aligned */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="pt-24 pb-32 text-center flex flex-col items-center"
        >
          <div className="backdrop-blur-2xl bg-white/30 p-8 rounded-[4rem] border border-white/50 mb-16 shadow-2xl">
            <Logo size="xl" showText={false} />
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black text-slate-900 leading-[0.8] tracking-[-0.05em] mb-12 max-w-5xl mx-auto uppercase">
            {t('aboutHeadline')}
          </h1>
          <p className="text-xl md:text-3xl text-slate-500 font-bold tracking-tight leading-tight max-w-4xl mx-auto opacity-70">
            {t('aboutSubheadline')}
          </p>
        </motion.div>
 
        {/* MISSION MANIFESTO - Human Story Blocks */}
        <div className="py-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
            
            {/* Block 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }}
              className="backdrop-blur-xl bg-white/70 p-12 rounded-[3.5rem] border border-white shadow-sm hover:shadow-2xl transition-all duration-700 hover:-translate-y-4"
            >
              <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-blue-600/20">
                <span className="text-white font-black text-2xl">01</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight uppercase">{t('aboutMission1Title')}</h2>
              <p className="text-lg text-slate-500 leading-relaxed font-bold tracking-tight">
                {t('aboutMission1Desc')}
              </p>
            </motion.div>
 
            {/* Block 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="backdrop-blur-xl bg-white/70 p-12 rounded-[3.5rem] border border-white shadow-sm hover:shadow-2xl transition-all duration-700 hover:-translate-y-4"
            >
              <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center mb-8 shadow-xl">
                <span className="text-white font-black text-2xl">02</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight uppercase">{t('aboutMission2Title')}</h2>
              <p className="text-lg text-slate-500 leading-relaxed font-bold tracking-tight">
                {t('aboutMission2Desc')}
              </p>
            </motion.div>
 
            {/* Block 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="backdrop-blur-xl bg-white/70 p-12 rounded-[3.5rem] border border-white shadow-sm hover:shadow-2xl transition-all duration-700 hover:-translate-y-4"
            >
              <div className="w-16 h-16 bg-emerald-600 rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-emerald-600/20">
                <span className="text-white font-black text-2xl">03</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight uppercase">{t('aboutMission3Title')}</h2>
              <p className="text-lg text-slate-500 leading-relaxed font-bold tracking-tight">
                {t('aboutMission3Desc')}
              </p>
            </motion.div>
 
          </div>
        </div>
 
        {/* FOUNDERS SECTION */}
        <div className="py-32">
          <div className="text-center mb-24 max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 tracking-[-0.05em] uppercase leading-none">{t('aboutStoryTitle')}</h2>
            <p className="text-xl md:text-2xl text-slate-500 font-bold tracking-tight opacity-70 leading-relaxed">
              {t('aboutStoryDesc')}
            </p>
          </div>
 
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24 max-w-6xl mx-auto">
            
            {/* Chirag Rai */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="group flex flex-col items-center"
            >
              <div className="w-full max-w-[440px] aspect-[4/5] backdrop-blur-3xl bg-white/30 rounded-[4rem] mb-12 overflow-hidden relative shadow-2xl border border-white transition-all duration-700 hover:shadow-blue-200">
                <img 
                  src="/chirag.jpg" 
                  alt="Chirag Rai" 
                  className="w-full h-full object-cover grayscale brightness-110 group-hover:grayscale-0 transition-all duration-1000 ease-in-out group-hover:scale-110" 
                  referrerPolicy="no-referrer" 
                  onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              </div>
              <div className="text-center max-w-md">
                <div className="flex items-center justify-center gap-4 mb-6">
                  <h4 className="font-black text-4xl text-slate-900 tracking-[-0.04em] uppercase leading-none">{t('founder1Name')}</h4>
                  <a href="https://www.linkedin.com/in/chirag-rai-77ab23240/" target="_blank" rel="noopener noreferrer" className="backdrop-blur-xl bg-white/80 p-3 rounded-2xl border border-white shadow-lg hover:bg-white transition-all" title="LinkedIn Profile">
                    <svg className="w-6 h-6 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </a>
                </div>
                <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] mb-6 opacity-60 leading-none">{t('founder1Title')}</p>
                <p className="text-slate-500 font-bold tracking-tight leading-relaxed italic">
                  "{t('founder1Story')}"
                </p>
              </div>
            </motion.div>
 
            {/* Dr. Sagar Rai */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="group flex flex-col items-center"
            >
              <div className="w-full max-w-[440px] aspect-[4/5] backdrop-blur-3xl bg-white/30 rounded-[4rem] mb-12 overflow-hidden relative shadow-2xl border border-white transition-all duration-700 hover:shadow-emerald-200">
                <img 
                  src="/sagar.jpg" 
                  alt="Dr. Sagar Rai" 
                  className="w-full h-full object-cover grayscale brightness-110 group-hover:grayscale-0 transition-all duration-1000 ease-in-out group-hover:scale-110" 
                  referrerPolicy="no-referrer" 
                  onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=800'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              </div>
              <div className="text-center max-w-md">
                <div className="flex items-center justify-center gap-4 mb-6">
                  <h4 className="font-black text-4xl text-slate-900 tracking-[-0.04em] uppercase leading-none">{t('founder2Name')}</h4>
                  <a href="https://www.linkedin.com/in/dr-sagar-rai-215503259/" target="_blank" rel="noopener noreferrer" className="backdrop-blur-xl bg-white/80 p-3 rounded-2xl border border-white shadow-lg hover:bg-white transition-all" title="LinkedIn Profile">
                    <svg className="w-6 h-6 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </a>
                </div>
                <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] mb-6 opacity-60 leading-none">{t('founder2Title')}</p>
                <p className="text-slate-500 font-bold tracking-tight leading-relaxed italic">
                  "{t('founder2Story')}"
                </p>
              </div>
            </motion.div>
            
          </div>
        </div>
 
      </div>
    </div>
  );
};

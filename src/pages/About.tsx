import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { Logo } from '../components/Logo';
import { useLanguage } from '../LanguageContext';

export const About: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden pt-[calc(10rem+env(safe-area-inset-top))]">
      <Helmet>
        <title>About Aethelcare India - Our Mission for Drug Safety</title>
        <meta name="description" content="Discover the mission behind Aethelcare India. Founded by Chirag Rai and Dr. Sagar Rai, we are dedicated to providing smart AI pharmaceutical intelligence and ensuring drug safety for all Indian citizens." />
        <meta name="keywords" content="Aethelcare mission, Chirag Rai Aethelcare, Dr Sagar Rai, drug safety India, pharmaceutical intelligence, about Aethelcare" />
        <link rel="canonical" href="https://aethelcare.xyz/about" />
      </Helmet>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        
        {/* HERO SECTION - Refined Typography */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="pt-16 pb-24 text-center flex flex-col items-center"
        >
          <div className="backdrop-blur-2xl bg-surface/30 p-6 rounded-[3rem] border border-surface/50 mb-12 shadow-xl">
            <Logo size="lg" showText={false} />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black text-text-primary leading-[1.1] tracking-tight mb-8 max-w-4xl mx-auto uppercase text-balance">
            {t('aboutHeadline')}
          </h1>
          <p className="text-lg md:text-xl text-text-secondary font-medium tracking-tight leading-relaxed max-w-3xl mx-auto opacity-80">
            {t('aboutSubheadline')}
          </p>
        </motion.div>
 
        {/* MISSION MANIFESTO - Focus on Typography */}
        <div className="py-24 border-y border-border/50">
          <div className="text-center mb-16">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-4 block">Our Foundation</span>
            <h2 className="text-3xl md:text-4xl font-black text-text-primary tracking-tight uppercase">The Pillars of Safety</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            
            {/* Block 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }}
              className="bg-surface/40 p-10 rounded-[2.5rem] border border-border/50 transition-all duration-500 hover:bg-surface/60"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-8 border border-primary/20">
                <span className="text-primary font-black text-xl">01</span>
              </div>
              <h3 className="text-xl font-black text-text-primary mb-4 tracking-tight uppercase">{t('aboutMission1Title')}</h3>
              <p className="text-base text-text-secondary leading-relaxed font-medium tracking-tight">
                {t('aboutMission1Desc')}
              </p>
            </motion.div>
 
            {/* Block 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-surface/40 p-10 rounded-[2.5rem] border border-border/50 transition-all duration-500 hover:bg-surface/60"
            >
              <div className="w-12 h-12 bg-text-primary/10 rounded-2xl flex items-center justify-center mb-8 border border-text-primary/20">
                <span className="text-text-primary font-black text-xl">02</span>
              </div>
              <h3 className="text-xl font-black text-text-primary mb-4 tracking-tight uppercase">{t('aboutMission2Title')}</h3>
              <p className="text-base text-text-secondary leading-relaxed font-medium tracking-tight">
                {t('aboutMission2Desc')}
              </p>
            </motion.div>
 
            {/* Block 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-surface/40 p-10 rounded-[2.5rem] border border-border/50 transition-all duration-500 hover:bg-surface/60"
            >
              <div className="w-12 h-12 bg-success/10 rounded-2xl flex items-center justify-center mb-8 border border-success/20">
                <span className="text-success font-black text-xl">03</span>
              </div>
              <h3 className="text-xl font-black text-text-primary mb-4 tracking-tight uppercase">{t('aboutMission3Title')}</h3>
              <p className="text-base text-text-secondary leading-relaxed font-medium tracking-tight">
                {t('aboutMission3Desc')}
              </p>
            </motion.div>
 
          </div>
        </div>
 
        {/* FOUNDERS SECTION - Biographical Layout */}
        <div className="py-32">
          <div className="text-center mb-24 max-w-3xl mx-auto">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-4 block">The Founding Story</span>
            <h2 className="text-4xl md:text-6xl font-black text-text-primary mb-8 tracking-tight uppercase leading-[0.9]">{t('aboutStoryTitle')}</h2>
            <p className="text-lg text-text-secondary font-medium tracking-tight opacity-80 leading-relaxed text-balance">
              {t('aboutStoryDesc')}
            </p>
          </div>
 
          <div className="space-y-32 max-w-5xl mx-auto">
            
            {/* Founder 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col md:flex-row items-center gap-12 md:gap-20"
            >
              <div className="w-full md:w-2/5 aspect-[4/5] bg-surface rounded-[3rem] overflow-hidden relative shadow-2xl border border-border group">
                <img 
                  src="/chirag.jpg" 
                  alt="Chirag Rai" 
                  className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105" 
                  referrerPolicy="no-referrer" 
                  onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800'; }}
                />
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                  <h4 className="font-black text-3xl md:text-4xl text-text-primary tracking-tight uppercase">{t('founder1Name')}</h4>
                  <a href="https://www.linkedin.com/in/chirag-rai-77ab23240/" target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-primary/5 rounded-xl transition-all text-primary" title="LinkedIn Profile">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </a>
                </div>
                <p className="text-primary font-black uppercase tracking-[0.2em] text-[10px] mb-8">{t('founder1Title')}</p>
                <div className="relative">
                  <div className="absolute -left-6 top-0 text-6xl text-primary/10 font-serif leading-none">"</div>
                  <p className="text-text-secondary font-medium tracking-tight leading-relaxed italic text-lg opacity-90 relative z-10">
                    {t('founder1Story')}
                  </p>
                </div>
              </div>
            </motion.div>
 
            {/* Founder 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col md:flex-row-reverse items-center gap-12 md:gap-20"
            >
              <div className="w-full md:w-2/5 aspect-[4/5] bg-surface rounded-[3rem] overflow-hidden relative shadow-2xl border border-border group">
                <img 
                  src="/sagar.jpg" 
                  alt="Dr. Sagar Rai" 
                  className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105" 
                  referrerPolicy="no-referrer" 
                  onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=800'; }}
                />
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                  <h4 className="font-black text-3xl md:text-4xl text-text-primary tracking-tight uppercase">{t('founder2Name')}</h4>
                  <a href="https://www.linkedin.com/in/dr-sagar-rai-215503259/" target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-primary/5 rounded-xl transition-all text-primary" title="LinkedIn Profile">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </a>
                </div>
                <p className="text-primary font-black uppercase tracking-[0.2em] text-[10px] mb-8">{t('founder2Title')}</p>
                <div className="relative">
                  <div className="absolute -left-6 top-0 text-6xl text-primary/10 font-serif leading-none">"</div>
                  <p className="text-text-secondary font-medium tracking-tight leading-relaxed italic text-lg opacity-90 relative z-10">
                    {t('founder2Story')}
                  </p>
                </div>
              </div>
            </motion.div>
            
          </div>
        </div>
 
      </div>
    </div>
  );
};

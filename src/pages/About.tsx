import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { Logo } from '../components/Logo';
import { useLanguage } from '../LanguageContext';

export const About: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden pt-[calc(10rem+env(safe-area-inset-top))] bg-grid">
      <Helmet>
        <title>About Aethelcare India - Our Mission for Drug Safety</title>
        <meta name="description" content="Discover the mission behind Aethelcare India. Founded by Chirag Rai and Dr. Sagar Rai, we are dedicated to providing smart AI pharmaceutical intelligence and ensuring drug safety for all Indian citizens." />
        <meta name="keywords" content="Aethelcare mission, Chirag Rai Aethelcare, Dr Sagar Rai, drug safety India, pharmaceutical intelligence, about Aethelcare" />
        <link rel="canonical" href="https://aethelcare.xyz/about" />
      </Helmet>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        
        {/* HERO SECTION - Editorial Style */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="pt-16 pb-32 text-center flex flex-col items-center border-b border-border/30"
        >
          <div className="backdrop-blur-3xl bg-surface/20 p-8 rounded-[4rem] border border-white/20 mb-16 shadow-2xl flex items-center justify-center">
            <Logo size="lg" showText={false} />
          </div>
          
          <h1 className="text-5xl md:text-8xl font-serif font-medium text-text-primary leading-[0.9] tracking-tighter mb-12 max-w-5xl mx-auto text-balance">
            <span className="italic mr-2">We built Aethelcare</span> because our own family was sold a <span className="font-black underline underline-offset-8 decoration-primary/30">banned medicine.</span>
          </h1>
          <p className="text-xl md:text-2xl text-text-secondary font-sans font-normal tracking-tight leading-relaxed max-w-3xl mx-auto opacity-70 italic">
            "{t('aboutSubheadline')}"
          </p>
        </motion.div>
 
        {/* MISSION MANIFESTO - Technical Precision */}
        <div className="py-32 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(29,78,216,0.02),transparent_70%)] pointer-events-none" />
          <div className="text-left mb-20 flex flex-col md:flex-row md:items-end justify-between border-l-4 border-primary pl-8">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-4 block font-mono">System Integrity</span>
              <h2 className="text-4xl md:text-6xl font-serif italic text-text-primary tracking-tighter leading-[0.9]">Foundational <br/>Principles</h2>
            </div>
            <div className="mt-8 md:mt-0 max-w-sm">
              <p className="text-sm text-text-secondary font-sans font-medium tracking-tight leading-relaxed opacity-70">
                Our infrastructure is built on precision data and ethical AI to eliminate pharmaceutical ambiguity in the Indian market.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/30 overflow-hidden border border-border/30 rounded-3xl">
            
            {/* Block 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }}
              className="bg-bg p-12 hover:bg-surface/50 transition-colors group flex flex-col h-full"
            >
              <div className="font-mono text-xs text-primary mb-12 flex items-center gap-2">
                <span className="w-8 h-px bg-primary/30" />
                01 / INTEGRITY
              </div>
              <h3 className="text-3xl font-serif italic text-text-primary mb-6 tracking-tight leading-none">{t('aboutMission1Title')}</h3>
              <p className="text-base text-text-secondary leading-relaxed font-sans font-normal tracking-tight opacity-90 mt-auto">
                {t('aboutMission1Desc')}
              </p>
            </motion.div>
 
            {/* Block 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-bg p-12 hover:bg-surface/50 transition-colors group flex flex-col h-full"
            >
              <div className="font-mono text-xs text-text-primary/50 mb-12 flex items-center gap-2">
                <span className="w-8 h-px bg-text-primary/10" />
                02 / TRANSPARENCY
              </div>
              <h3 className="text-3xl font-serif italic text-text-primary mb-6 tracking-tight leading-none">{t('aboutMission2Title')}</h3>
              <p className="text-base text-text-secondary leading-relaxed font-sans font-normal tracking-tight opacity-90 mt-auto">
                {t('aboutMission2Desc')}
              </p>
            </motion.div>
 
            {/* Block 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-bg p-12 hover:bg-surface/50 transition-colors group flex flex-col h-full"
            >
              <div className="font-mono text-xs text-success/50 mb-12 flex items-center gap-2">
                <span className="w-8 h-px bg-success/20" />
                03 / ACCURACY
              </div>
              <h3 className="text-3xl font-serif italic text-text-primary mb-6 tracking-tight leading-none">{t('aboutMission3Title')}</h3>
              <p className="text-base text-text-secondary leading-relaxed font-sans font-normal tracking-tight opacity-90 mt-auto">
                {t('aboutMission3Desc')}
              </p>
            </motion.div>
 
          </div>
        </div>
 
        {/* FOUNDERS SECTION - Editorial Profile Layout */}
        <div className="py-32 border-t border-border/30">
          <div className="text-center mb-32 max-w-4xl mx-auto">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-6 block">The People Behind the Code</span>
            <h2 className="text-6xl md:text-9xl font-serif italic text-text-primary mb-12 tracking-tighter leading-[0.8]">{t('aboutStoryTitle')}</h2>
            <div className="h-px w-24 bg-primary mx-auto mb-12" />
            <p className="text-xl md:text-2xl text-text-secondary font-sans font-light tracking-tight leading-relaxed text-balance">
              {t('aboutStoryDesc')}
            </p>
          </div>
 
          <div className="space-y-48 max-w-6xl mx-auto">
            
            {/* Founder 1 */}
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-0 items-center"
            >
              <div className="md:col-span-5 relative">
                <div className="aspect-[4/5] bg-surface rounded-2xl overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-border/50 relative z-10 group">
                  <img 
                    src="/chirag.jpg" 
                    alt="Chirag Rai" 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100" 
                    referrerPolicy="no-referrer" 
                    onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
              </div>
              <div className="md:col-span-1 md:col-start-6 hidden md:block">
                <div className="h-px w-full bg-border/50" />
              </div>
              <div className="md:col-span-6 md:col-start-7 py-12">
                <div className="mb-8">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-primary mb-4 block">Founder & Engineering</span>
                  <div className="flex items-center gap-6">
                    <h4 className="font-serif italic text-5xl md:text-7xl text-text-primary tracking-tight leading-none">{t('founder1Name')}</h4>
                    <a href="https://www.linkedin.com/in/chirag-rai-77ab23240/" target="_blank" rel="noopener noreferrer" className="p-3 bg-surface border border-border rounded-full hover:bg-primary hover:text-white transition-all shadow-md" title="LinkedIn Profile">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    </a>
                  </div>
                </div>
                <div className="relative pl-12 border-l border-primary/20">
                  <p className="text-xl md:text-2xl font-serif italic text-text-primary leading-relaxed opacity-80">
                    {t('founder1Story')}
                  </p>
                </div>
              </div>
            </motion.div>
 
            {/* Founder 2 */}
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-0 items-center"
            >
              <div className="md:col-span-6 md:order-1 py-12">
                <div className="mb-8 text-right">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-success mb-4 block">Medical Advisor & Co-Founder</span>
                  <div className="flex items-center justify-end gap-6">
                    <a href="https://www.linkedin.com/in/dr-sagar-rai-215503259/" target="_blank" rel="noopener noreferrer" className="p-3 bg-surface border border-border rounded-full hover:bg-success hover:text-white transition-all shadow-md" title="LinkedIn Profile">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    </a>
                    <h4 className="font-serif italic text-5xl md:text-7xl text-text-primary tracking-tight leading-none text-right">{t('founder2Name')}</h4>
                  </div>
                </div>
                <div className="relative pr-12 border-r border-success/20 text-right">
                  <p className="text-xl md:text-2xl font-serif italic text-text-primary leading-relaxed opacity-80">
                    {t('founder2Story')}
                  </p>
                </div>
              </div>
              <div className="md:col-span-1 md:col-start-7 hidden md:block">
                <div className="h-px w-full bg-border/50" />
              </div>
              <div className="md:col-span-5 md:col-start-8 md:order-2 relative">
                <div className="aspect-[4/5] bg-surface rounded-2xl overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-border/50 relative z-10 group">
                  <img 
                    src="/sagar.jpg" 
                    alt="Dr. Sagar Rai" 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100" 
                    referrerPolicy="no-referrer" 
                    onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=800'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="absolute -top-12 -right-12 w-64 h-64 bg-success/5 rounded-full blur-3xl" />
              </div>
            </motion.div>
            
          </div>
        </div>
 
      </div>
    </div>
  );
};

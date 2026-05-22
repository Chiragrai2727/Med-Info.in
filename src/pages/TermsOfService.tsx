import React from 'react';
import { motion } from 'motion/react';
import { FileText, ChevronLeft, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-transparent pt-48 pb-24 pt-[calc(10rem+env(safe-area-inset-top))]">
      <Helmet>
        <title>Terms of Service - Aethelcare India</title>
        <meta name="description" content="Read the terms of service for Aethelcare India. By using our platform, you agree to these terms." />
        <link rel="canonical" href="https://aethelcare.xyz/terms" />
      </Helmet>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-3 text-text-secondary hover:text-text-primary transition-all mb-12 font-black uppercase tracking-[0.2em] text-[10px] group">
          <div className="p-2 backdrop-blur-md bg-surface rounded-xl border border-surface shadow-sm group-hover:-translate-x-2 transition-transform">
            <ChevronLeft className="w-4 h-4" />
          </div>
          Back to Home
        </Link>
 
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-3xl bg-surface/70 rounded-[4rem] p-12 md:p-20 shadow-[0_40px_100px_rgba(0,0,0,0.05)] border border-surface"
        >
          <div className="flex items-center gap-6 mb-16">
            <div className="w-20 h-20 bg-primary rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-primary/20">
              <FileText className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-text-primary tracking-[-0.05em] uppercase leading-none mb-2">Terms of Service</h1>
              <p className="text-text-secondary font-black uppercase tracking-[0.25em] text-[10px] opacity-40">Last updated: May 21, 2026</p>
            </div>
          </div>
 
          <div className="backdrop-blur-md bg-amber-500/5 border-2 border-amber-200/50 p-8 rounded-[2.5rem] mb-16 flex items-start gap-6 shadow-inner">
            <div className="bg-amber-100 p-3 rounded-2xl shrink-0 shadow-lg shadow-amber-900/5">
              <Shield className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-amber-900 mb-2 uppercase tracking-tight">Educational Purpose Only</h3>
              <p className="text-amber-800/80 font-bold tracking-tight leading-relaxed">
                Aethelcare provides information for educational purposes. This is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
              </p>
            </div>
          </div>
 
          <div className="space-y-16">
            <section>
              <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight mb-6">1. Acceptance of Terms</h2>
              <p className="text-text-secondary leading-relaxed font-bold tracking-tight text-lg">
                By accessing or using our platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
            </section>
  
            <section>
              <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight mb-6">2. Use of Platform</h2>
              <p className="text-text-secondary leading-relaxed font-bold tracking-tight text-lg">
                Our platform is for your personal, non-commercial use. You agree not to misuse our services or help anyone else to do so.
              </p>
            </section>
  
            <section>
              <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight mb-6">3. Content Accuracy</h2>
              <p className="text-text-secondary leading-relaxed font-bold tracking-tight text-lg">
                While we strive to provide accurate medical information based on verified sources, information on our platform may change. We do not guarantee the accuracy, completeness, or usefulness of this information.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

import React from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Eye, Database, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-transparent pt-48 pb-24 pt-[calc(10rem+env(safe-area-inset-top))]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-3 text-slate-400 hover:text-slate-900 transition-all mb-12 font-black uppercase tracking-[0.2em] text-[10px] group">
          <div className="p-2 backdrop-blur-md bg-white rounded-xl border border-white shadow-sm group-hover:-translate-x-2 transition-transform">
            <ChevronLeft className="w-4 h-4" />
          </div>
          Back to Home
        </Link>
 
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-3xl bg-white/70 rounded-[4rem] p-12 md:p-20 shadow-[0_40px_100px_rgba(0,0,0,0.05)] border border-white"
        >
          <div className="flex items-center gap-6 mb-16">
            <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white shadow-2xl">
              <Shield className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-[-0.05em] uppercase leading-none mb-2">Privacy Policy</h1>
              <p className="text-slate-400 font-black uppercase tracking-[0.25em] text-[10px] opacity-60">Last updated: April 8, 2026</p>
            </div>
          </div>
 
          <div className="backdrop-blur-md bg-amber-500/5 border-2 border-amber-200/50 p-8 rounded-[2.5rem] mb-16 flex items-start gap-6 shadow-inner">
            <div className="bg-amber-100 p-3 rounded-2xl shrink-0 shadow-lg shadow-amber-900/5">
              <Shield className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-amber-900 mb-2 uppercase tracking-tight">Medical Disclaimer</h3>
              <p className="text-amber-800/80 font-bold tracking-tight leading-relaxed">
                Educational purposes only. Not a substitute for professional medical advice. Always consult a qualified doctor before taking any medication.
              </p>
            </div>
          </div>
 
          <div className="space-y-16">
            <section>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-2.5 bg-slate-100 rounded-xl">
                  <Lock className="w-5 h-5 text-slate-900" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Data Protection</h2>
              </div>
              <p className="text-slate-500 leading-relaxed font-bold tracking-tight text-lg">
                Aethelcare is designed with a "Privacy First" approach. We do not collect, store, or share any personally identifiable information (PII). Your search history is stored locally on your device for offline access and is never transmitted to our servers.
              </p>
            </section>
 
            <section>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-2.5 bg-slate-100 rounded-xl">
                  <Eye className="w-5 h-5 text-slate-900" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Platform Compliance</h2>
              </div>
              <p className="text-slate-500 leading-relaxed font-bold tracking-tight text-lg">
                Our application complies with the latest privacy standards of Android 14+ and iOS 17+. We follow the principle of least privilege:
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "No background data collection.",
                  "No access to your contacts, photos, or files.",
                  "Microphone access is only used for voice search.",
                  "Location data is never requested or stored."
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-slate-500 font-bold tracking-tight">
                    <div className="w-2 h-2 bg-slate-900 rounded-full" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
 
            <section>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-2.5 bg-slate-100 rounded-xl">
                  <Database className="w-5 h-5 text-slate-900" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">AI & Data Accuracy</h2>
              </div>
              <p className="text-slate-500 leading-relaxed font-bold tracking-tight text-lg">
                We use advanced AI models to provide information on legally approved medications in India. While we strive for 100% accuracy based on the latest medical guidelines, this information is for educational purposes only.
              </p>
            </section>
 
            <section className="backdrop-blur-md bg-slate-900/5 p-10 rounded-[3rem] border border-black/5 shadow-inner">
              <h3 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-tight">Your Rights</h3>
              <p className="text-slate-400 leading-relaxed font-bold tracking-tight">
                You have the right to clear your search history and cached data at any time through your browser settings. As a Progressive Web App (PWA), we respect your device's native privacy controls and sandboxing.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

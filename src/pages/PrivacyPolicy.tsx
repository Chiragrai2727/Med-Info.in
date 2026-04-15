import React from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Eye, Database, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen pt-40 pb-20 bg-gray-50 pt-[calc(10rem+env(safe-area-inset-top))]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-black transition-colors mb-8 font-medium">
          <ChevronLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[3rem] p-10 md:p-16 shadow-2xl border border-gray-100"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-black rounded-3xl flex items-center justify-center text-white shadow-xl">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-black tracking-tight">Privacy Policy</h1>
              <p className="text-gray-400 font-medium">Last updated: April 8, 2026</p>
            </div>
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-200 p-6 rounded-2xl mb-12 flex items-start gap-4">
            <div className="bg-yellow-100 p-2 rounded-full shrink-0">
              <Shield className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-yellow-900 mb-1">Medical Disclaimer</h3>
              <p className="text-yellow-800 font-bold">
                Educational purposes only. Not a substitute for professional medical advice. Always consult a qualified doctor before taking any medication.
              </p>
            </div>
          </div>

          <div className="space-y-12">
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-5 h-5 text-black" />
                <h2 className="text-2xl font-black text-black">Data Protection</h2>
              </div>
              <p className="text-gray-600 leading-relaxed font-medium">
                aethelcare is designed with a "Privacy First" approach. We do not collect, store, or share any personally identifiable information (PII). Your search history is stored locally on your device for offline access and is never transmitted to our servers.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <Eye className="w-5 h-5 text-black" />
                <h2 className="text-2xl font-black text-black">Android & iOS Compliance</h2>
              </div>
              <p className="text-gray-600 leading-relaxed font-medium">
                Our application complies with the latest privacy standards of Android 14+ and iOS 17+. We follow the principle of least privilege:
              </p>
              <ul className="mt-4 space-y-3 list-disc list-inside text-gray-600 font-medium">
                <li>No background data collection.</li>
                <li>No access to your contacts, photos, or files.</li>
                <li>Microphone access is only used for voice search and is only active when you tap the mic icon.</li>
                <li>Location data is never requested or stored.</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-5 h-5 text-black" />
                <h2 className="text-2xl font-black text-black">AI & Data Accuracy</h2>
              </div>
              <p className="text-gray-600 leading-relaxed font-medium">
                We use advanced AI models to provide information on legally approved medications in India. While we strive for 100% accuracy based on the latest medical guidelines, this information is for educational purposes only and should never replace professional medical advice.
              </p>
            </section>

            <section className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100">
              <h3 className="text-lg font-black text-black mb-2">Your Rights</h3>
              <p className="text-sm text-gray-500 leading-relaxed font-medium">
                You have the right to clear your search history and cached data at any time through your browser settings. As a Progressive Web App (PWA), we respect your device's native privacy controls and sandboxing.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

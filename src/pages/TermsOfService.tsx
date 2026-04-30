import React from 'react';
import { motion } from 'motion/react';
import { Shield, FileText, Scale, Lock } from 'lucide-react';

export const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[3rem] p-8 sm:p-12 shadow-xl border border-border"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Scale className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-text-primary tracking-tight">Terms of Service</h1>
              <p className="text-text-secondary font-bold uppercase tracking-widest text-xs mt-1">Last Updated: April 2026</p>
            </div>
          </div>

          <div className="space-y-8 text-text-secondary font-medium leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing and using Aethelcare India, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                2. Medical Disclaimer
              </h2>
              <div className="bg-primary/5 border-l-4 border-primary p-6 rounded-2xl">
                <p className="text-text-primary font-bold mb-2">IMPORTANT NOTICE:</p>
                <p>
                  Aethelcare India provides information for educational purposes only. It is NOT a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                3. User Accounts
              </h2>
              <p>
                You are responsible for maintaining the confidentiality of your account and password. You agree to notify us immediately of any unauthorized use of your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                4. Proper Use
              </h2>
              <p>
                You agree not to use the service for any illegal or unauthorized purpose. You must not, in the use of the Service, violate any laws in your jurisdiction.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                5. Changes to Terms
              </h2>
              <p>
                We reserve the right to modify these terms at any time. We will notify users of any significant changes by posting the new terms on this site.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

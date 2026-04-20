import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../LanguageContext';

export const About: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[var(--color-bg)] pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* HERO SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-20 md:py-32 border-b border-[var(--color-ink)]/10"
        >
          <div className="max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-black text-[var(--color-ink)] leading-tight mb-8 tracking-tighter">
              Medical Intelligence for all from India.
            </h1>
            <p className="text-xl md:text-2xl text-[var(--color-ink)]/70 font-medium leading-relaxed max-w-3xl">
              We're building toward a future where critical healthcare knowledge is widely accessible, highly secure, and instantly reliable for everyone in India. With a robust neural backend, we are shaping technology that understands how the country seeks, reads, and applies medical information.
            </p>
          </div>
        </motion.div>

        {/* PILLARS SECTION */}
        <div className="py-24 border-b border-[var(--color-ink)]/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-black text-[var(--color-ink)] mb-4 tracking-tight">We are building for Patient Agency</h3>
              <p className="text-[var(--color-ink)]/70 leading-relaxed font-medium">
                We want India to embrace AI-driven healthcare with confidence and control. Our ambition is to demystify complex medical jargon and place actionable intelligence directly in the hands of the patient, helping them understand their prescriptions and lab data instantly.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="text-2xl font-black text-[var(--color-ink)] mb-4 tracking-tight">We are building for Everyday Use</h3>
              <p className="text-[var(--color-ink)]/70 leading-relaxed font-medium">
                We believe the real value of our platform comes from everyday utility. That means building a robust scanner that thrives in low-light conditions, understands handwritten local prescriptions, and translates clinical data into plain, multilingual guidance.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-2xl font-black text-[var(--color-ink)] mb-4 tracking-tight">We are building for the Ecosystem</h3>
              <p className="text-[var(--color-ink)]/70 leading-relaxed font-medium">
                Building a sovereign digital health backbone is a nationwide effort. It starts with highly secure, compliant, and cost-efficient infrastructure so that local developers, pharmacies, and clinics can integrate our medical intelligence with full agency.
              </p>
            </motion.div>
          </div>
        </div>

        {/* FOUNDERS SECTION */}
        <div className="py-24 border-b border-[var(--color-ink)]/10">
          <h2 className="text-4xl font-black text-[var(--color-ink)] mb-12 tracking-tight">Our Founders</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <p className="text-xl text-[var(--color-ink)]/80 leading-relaxed font-medium mb-8 max-w-2xl">
                AethelCare was founded by Chirag Rai and Dr. Sagar Rai. Together, they bridge the gap between cutting-edge digital experiences and rigorous clinical healthcare, dedicated to building India's premier medical intelligence infrastructure.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 sm:gap-8">
              {/* Founder 1: Chirag Rai */}
              <div>
                <div className="w-full aspect-[4/5] bg-[var(--color-ink)]/5 rounded-2xl mb-6 border border-[var(--color-ink)]/10 overflow-hidden relative group">
                  {/* @User: Replace this src with your uploaded image for Chirag */}
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800" alt="Chirag Rai" className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <h4 className="font-black text-2xl text-[var(--color-ink)] mb-1 tracking-tight">Chirag Rai</h4>
                <p className="text-[var(--color-accent)] font-bold text-sm uppercase tracking-wider mb-4">Technical & Design Lead</p>
                <p className="text-[var(--color-ink)]/70 text-sm leading-relaxed font-medium">
                  With a robust background in multimedia, graphics, and 3D animation/VFX, Chirag brings 4 years of specialized experience in front-end development and UI/UX design. He architects the highly intuitive, lightning-fast interfaces that make complex AI accessible to everyone.
                </p>
              </div>

              {/* Founder 2: Dr. Sagar Rai */}
              <div>
                <div className="w-full aspect-[4/5] bg-[var(--color-ink)]/5 rounded-2xl mb-6 border border-[var(--color-ink)]/10 overflow-hidden relative group">
                  {/* @User: Replace this src with your uploaded image for Dr. Sagar */}
                  <img src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=800" alt="Dr. Sagar Rai" className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="font-black text-2xl text-[var(--color-ink)] tracking-tight">Dr. Sagar Rai</h4>
                  <a href="https://www.linkedin.com/in/dr-sagar-rai-215503259/" target="_blank" rel="noopener noreferrer" className="text-[#0A66C2] hover:opacity-80 transition-opacity" title="LinkedIn Profile">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </a>
                </div>
                <p className="text-[var(--color-accent)] font-bold text-sm uppercase tracking-wider mb-4">Clinical Lead</p>
                <p className="text-[var(--color-ink)]/70 text-sm leading-relaxed font-medium">
                  Driving the medical vision of AethelCare, Dr. Sagar ensures our AI pipelines are rigorously grounded in clinical reality. He oversees the integration of complex pharmaceutical intelligence, bridging the gap between scalable technology and patient safety.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* BACKED FOR SCALE & CTA */}
        <div className="py-24 grid grid-cols-1 md:grid-cols-2 gap-16">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col justify-center"
          >
            <h3 className="text-[max(2rem,3vw)] font-black text-[var(--color-ink)] mb-4 tracking-tight leading-none">Backed for scale</h3>
            <p className="text-lg text-[var(--color-ink)]/70 font-medium mb-6">
              Raised Seed funding from top global health-tech firms who back category-defining clinical infrastructure companies.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-[var(--color-ink)] text-[var(--color-bg)] rounded-[2rem] p-12 flex flex-col justify-center"
          >
            <h3 className="text-3xl font-black mb-4 tracking-tight">We are hiring!</h3>
            <p className="text-[var(--color-bg)]/70 font-medium mb-8">
              We are hiring for various roles across technical and clinical functions. If you're driven by health innovation and thrive in a fast-paced setting, we'd love to hear from you.
            </p>
            <button className="bg-[var(--color-bg)] text-[var(--color-ink)] px-8 py-4 rounded-xl font-bold self-start hover:bg-[var(--color-bg)]/90 transition-colors">
              Join AethelCare
            </button>
          </motion.div>
        </div>

      </div>
    </div>
  );
};

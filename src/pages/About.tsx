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
          <h2 className="text-4xl font-black text-[var(--color-ink)] mb-12 tracking-tight">Our Leadership</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <p className="text-xl text-[var(--color-ink)]/80 leading-relaxed font-medium mb-8 max-w-2xl">
                AethelCare was founded by a team of technologists and clinical professionals dedicated to building India's digital health infrastructure. They bring together decades of experience in scalable healthcare, open-source AI, and secure public systems.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8">
              {/* Generic placeholder for Founders layout (similar to Sarvam style) */}
              <div>
                <div className="w-full aspect-square bg-[var(--color-ink)]/5 rounded-2xl mb-4 border border-[var(--color-ink)]/10 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=800" alt="Tech Lead" className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
                </div>
                <h4 className="font-bold text-lg text-[var(--color-ink)]">Technical Lead</h4>
              </div>
              <div>
                <div className="w-full aspect-square bg-[var(--color-ink)]/5 rounded-2xl mb-4 border border-[var(--color-ink)]/10 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=800" alt="Clinical Lead" className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
                </div>
                <h4 className="font-bold text-lg text-[var(--color-ink)]">Clinical Lead</h4>
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

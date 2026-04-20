import React from 'react';
import { motion } from 'framer-motion';
import { Logo } from '../components/Logo';

export const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] relative overflow-hidden">
      
      {/* Subtle Brand Background Glow */}
      <div className="absolute top-0 left-0 right-0 h-[60vh] flex justify-between pointer-events-none opacity-50 -z-10">
        <div className="w-1/2 h-full bg-[var(--color-ink)]/5 blur-[120px] rounded-br-[100%] transform -translate-x-1/4 -translate-y-1/4"></div>
        <div className="w-1/2 h-full bg-blue-500/10 blur-[120px] rounded-bl-[100%] transform translate-x-1/4 -translate-y-1/4"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32">
        
        {/* HERO SECTION - Clean, Brand Aligned */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="pt-16 pb-24 border-b border-[var(--color-ink)]/10 text-center flex flex-col items-center"
        >
          <Logo size="xl" showText={false} className="mb-12" />
          
          <h1 className="text-5xl md:text-7xl font-black text-[var(--color-ink)] leading-tight tracking-tighter mb-8 max-w-4xl mx-auto">
            Clarity in every prescription.<br/>
            Confidence in every decision.
          </h1>
          <p className="text-xl md:text-2xl text-[var(--color-ink)]/70 font-medium leading-relaxed max-w-3xl mx-auto">
            Building a sovereign future where absolute medical intelligence is instantly accessible to everyone in India.
          </p>
        </motion.div>

        {/* MISSION MANIFESTO - Clean Centered Blocks */}
        <div className="py-24 border-b border-[var(--color-ink)]/10">
          <div className="space-y-20 max-w-3xl mx-auto text-center">
            
            {/* Block 1 */}
            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-2xl md:text-3xl font-black text-[var(--color-ink)] mb-4 tracking-tight">Medical Intelligence for all</h2>
              <p className="text-lg text-[var(--color-ink)]/70 leading-relaxed font-medium">
                We're building toward a future where medical intelligence is widely accessible to everyone in India. With a world-class team of technologists and experts, we're dedicated to developing systems that understand India. What excites us is the chance to build and shape this technology to reflect how the country seeks, reads, reasons, and solves health problems.
              </p>
            </motion.div>

            {/* Block 2 */}
            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-2xl md:text-3xl font-black text-[var(--color-ink)] mb-4 tracking-tight">Patient Agency First</h2>
              <p className="text-lg text-[var(--color-ink)]/70 leading-relaxed font-medium">
                We want India to embrace AI-driven healthcare with confidence and control. Our ambition is to demystify complex medical jargon and place actionable intelligence directly in the hands of the patient, helping them understand their prescriptions and lab data safely within India's jurisdiction.
              </p>
            </motion.div>

            {/* Block 3 */}
            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-2xl md:text-3xl font-black text-[var(--color-ink)] mb-4 tracking-tight">Built for Reality</h2>
              <p className="text-lg text-[var(--color-ink)]/70 leading-relaxed font-medium">
                We believe the real value of our engineering comes from everyday use. That means translating our complex AI architectures into compelling products—like a neural scanner that thrives on crumpled papers, low-light environments, and handwritten local prescriptions.
              </p>
            </motion.div>

            {/* Block 4 */}
            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-2xl md:text-3xl font-black text-[var(--color-ink)] mb-4 tracking-tight">Ecosystem Wide</h2>
              <p className="text-lg text-[var(--color-ink)]/70 leading-relaxed font-medium">
                Building a sovereign digital health backbone is a collective effort. It starts by powering the ecosystem with cost-efficient, high-quality models and tools, so developers, pharmacies, and startups can create with full agency.
              </p>
            </motion.div>

          </div>
        </div>

        {/* FOUNDERS SECTION */}
        <div className="py-24">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-4xl font-black text-[var(--color-ink)] mb-6 tracking-tight">Our Founders</h2>
            <p className="text-lg text-[var(--color-ink)]/70 leading-relaxed font-medium">
              AethelCare was founded by Chirag Rai and Dr. Sagar Rai. Chirag brings specialized experience in front-end architecture and UI/UX design, while Dr. Sagar oversees the integration of complex pharmaceutical intelligence, bridging the gap between scalable technology and patient safety.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 max-w-5xl mx-auto">
            
            {/* Chirag Rai */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group flex flex-col items-center"
            >
              <div className="w-full max-w-[320px] aspect-[4/5] bg-[var(--color-ink)]/5 rounded-3xl mb-8 overflow-hidden relative shadow-sm border border-[var(--color-ink)]/10">
                <img 
                  src="/chirag.jpg" 
                  alt="Chirag Rai" 
                  className="w-full h-full object-cover filter grayscale opacity-90 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out" 
                  referrerPolicy="no-referrer" 
                  onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800'; }}
                />
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <h4 className="font-black text-3xl text-[var(--color-ink)] tracking-tighter">Chirag Rai</h4>
                  <a href="https://www.linkedin.com/in/chirag-rai-77ab23240/" target="_blank" rel="noopener noreferrer" className="text-[#0A66C2] hover:opacity-80 transition-opacity bg-blue-50/50 p-2 rounded-full" title="LinkedIn Profile">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </a>
                </div>
                <p className="text-[var(--color-ink)]/50 font-bold uppercase tracking-widest text-sm">Technical & Design Lead</p>
              </div>
            </motion.div>

            {/* Dr. Sagar Rai */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="group flex flex-col items-center"
            >
              <div className="w-full max-w-[320px] aspect-[4/5] bg-[var(--color-ink)]/5 rounded-3xl mb-8 overflow-hidden relative shadow-sm border border-[var(--color-ink)]/10">
                <img 
                  src="/sagar.jpg" 
                  alt="Dr. Sagar Rai" 
                  className="w-full h-full object-cover filter grayscale opacity-90 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out" 
                  referrerPolicy="no-referrer" 
                  onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=800'; }}
                />
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <h4 className="font-black text-3xl text-[var(--color-ink)] tracking-tighter">Dr. Sagar Rai</h4>
                  <a href="https://www.linkedin.com/in/dr-sagar-rai-215503259/" target="_blank" rel="noopener noreferrer" className="text-[#0A66C2] hover:opacity-80 transition-opacity bg-blue-50/50 p-2 rounded-full" title="LinkedIn Profile">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </a>
                </div>
                <p className="text-[var(--color-ink)]/50 font-bold uppercase tracking-widest text-sm">Clinical Lead</p>
              </div>
            </motion.div>
            
          </div>
        </div>

      </div>
    </div>
  );
};

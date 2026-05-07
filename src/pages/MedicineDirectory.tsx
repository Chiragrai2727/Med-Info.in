import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Info, Filter, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import medicinesData from '../data/medicines.json';

const ALPHABET = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const MedicineDirectory: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeLetter, setActiveLetter] = useState<string>('All');
  
  // Flatten medications and aggregate properties for better search
  const allMeds = useMemo(() => {
    // Only picking specific fields to avoid huge objects in map
    return medicinesData.map((m: any) => ({
      id: m.id,
      name: m.drug_name,
      brands: m.brand_names_india ? m.brand_names_india.join(', ') : '',
      category: m.category || 'Medicine',
      uses: m.uses ? m.uses.join(', ') : '',
    }));
  }, []);

  const filteredMeds = useMemo(() => {
    return allMeds.filter(med => {
      // 1. Check Search Term
      const termMatch = 
        med.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        med.brands.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!termMatch) return false;
      
      // 2. Check Alphabet Filter
      if (activeLetter !== 'All') {
        const firstLetter = med.name.charAt(0).toUpperCase();
        if (activeLetter === '#') {
          // # is for numbers / symbols
          return !/[A-Z]/.test(firstLetter);
        }
        return firstLetter === activeLetter;
      }
      
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [allMeds, searchTerm, activeLetter]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 60; // 60 is a good multiple for grids of 1, 2, 3 or 4 columns
  
  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeLetter]);

  const paginatedMeds = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredMeds.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredMeds, currentPage]);

  const totalPages = Math.ceil(filteredMeds.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-bg pb-24 pt-safe">
      <Helmet>
        <title>Medicine Directory | Aethelcare</title>
        <meta name="description" content="Browse our complete directory of medications, including uses, side effects, and popular Indian brand names." />
      </Helmet>

      {/* Header */}
      <section className="pt-24 pb-12 sm:pt-32 sm:pb-16 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none -mr-48 -mt-48" />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 mb-6"
          >
            <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-sm tracking-widest uppercase border border-primary/20">
              Database
            </span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-text-primary tracking-tight mb-6"
          >
            Medicine <span className="text-primary">Directory</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto"
          >
            Explore our comprehensive database of medications to learn about uses, side effects, and more.
          </motion.p>
        </div>
      </section>

      {/* Filters & Search */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="bg-surface/80 backdrop-blur-xl border border-border p-4 sm:p-6 rounded-[2rem] shadow-sm flex flex-col gap-6">
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-text-secondary" />
            <input 
              type="text" 
              placeholder="Search by medicine, brand name, or category..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-bg border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-text-primary font-medium"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="w-5 h-5 text-text-secondary mr-2" />
            <button
              onClick={() => setActiveLetter('All')}
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all flex-shrink-0 ${activeLetter === 'All' ? 'bg-primary text-white shadow-md' : 'bg-bg text-text-secondary hover:bg-border/50 border border-border/50'}`}
            >
              All
            </button>
            {ALPHABET.map(letter => (
              <button
                key={letter}
                onClick={() => setActiveLetter(letter)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all flex-shrink-0 ${activeLetter === letter ? 'bg-primary text-white shadow-md' : 'bg-bg text-text-secondary hover:bg-border/50 border border-border/50'}`}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4 text-sm font-bold text-text-secondary">
          Showing {filteredMeds.length} medications
        </div>
        
        {filteredMeds.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {paginatedMeds.map((med, index) => (
                  <motion.div
                    key={med.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: index < 12 ? index * 0.05 : 0 }}
                    onClick={() => navigate(`/medicine/${encodeURIComponent(med.name)}`)}
                    className="bg-surface/60 backdrop-blur-md border border-border p-6 rounded-[2rem] hover:shadow-xl hover:border-primary/30 transition-all cursor-pointer group flex flex-col items-start gap-4"
                  >
                    <div className="px-3 py-1 flex items-center gap-1.5 rounded-full bg-primary/5 border border-primary/10 text-xs font-bold text-primary">
                      <Info className="w-3.5 h-3.5" />
                      {med.category}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-text-primary group-hover:text-primary transition-colors underline-offset-4 decoration-primary/30 group-hover:underline">
                        {med.name}
                      </h3>
                      {med.brands && (
                        <p className="text-sm text-text-secondary mt-1 line-clamp-1">
                          Brands: <span className="font-semibold text-text-primary/70">{med.brands}</span>
                        </p>
                      )}
                    </div>
                    {med.uses && (
                      <div className="text-sm text-text-secondary/80 line-clamp-2 mt-auto">
                        Uses: {med.uses}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center items-center gap-4">
                <button
                  onClick={() => {
                    setCurrentPage(prev => Math.max(prev - 1, 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === 1}
                  className="px-6 py-3 bg-white border border-border rounded-full font-bold text-sm text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
                <div className="text-sm font-medium text-text-secondary">
                  Page {currentPage} of {totalPages}
                </div>
                <button
                  onClick={() => {
                    setCurrentPage(prev => Math.min(prev + 1, totalPages));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === totalPages}
                  className="px-6 py-3 bg-primary text-white rounded-full font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-hover transition-colors shadow-lg"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
              <Search className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-2">No medications found</h3>
            <p className="text-text-secondary">Try adjusting your search or filters to find what you're looking for.</p>
            <button 
              onClick={() => { setSearchTerm(''); setActiveLetter('All'); }}
              className="mt-6 px-6 py-2 bg-primary/10 text-primary font-bold rounded-full hover:bg-primary/20 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

import React, { createContext, useContext, useState, useEffect } from 'react';

interface CompareContextType {
  compareList: string[];
  addToCompare: (name: string) => void;
  removeFromCompare: (name: string) => void;
  clearCompare: () => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export const CompareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [compareList, setCompareList] = useState<string[]>(() => {
    const saved = localStorage.getItem('medinfo_compare_list');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('medinfo_compare_list', JSON.stringify(compareList));
  }, [compareList]);

  const addToCompare = (name: string) => {
    setCompareList(prev => {
      if (prev.includes(name)) return prev;
      if (prev.length >= 2) {
        // Replace the second one if we already have two
        return [prev[0], name];
      }
      return [...prev, name];
    });
  };

  const removeFromCompare = (name: string) => {
    setCompareList(prev => prev.filter(item => item !== name));
  };

  const clearCompare = () => {
    setCompareList([]);
  };

  return (
    <CompareContext.Provider value={{ compareList, addToCompare, removeFromCompare, clearCompare }}>
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (!context) throw new Error('useCompare must be used within CompareProvider');
  return context;
};

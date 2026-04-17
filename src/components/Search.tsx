import React, { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, X, Loader2, Mic, MicOff, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import { useToast } from '../ToastContext';
import { searchMedicines, interpretQuery, transcribeAudio } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { doc, getDoc, setDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

interface SearchProps {
  autoFocus?: boolean;
}

const POPULAR_SEARCHES = [
  'Dolo 650',
  'Paracetamol',
  'Fever',
  'Headache',
  'Cold & cough',
  'Paracetamol vs Ibuprofen'
];

export const Search: React.FC<SearchProps> = ({ autoFocus = false }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{ name: string; category: string; summary: string; isOffline?: boolean; source?: string; confidence?: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) setRecentSearches(JSON.parse(saved));
  }, []);

  const saveRecentSearch = (term: string) => {
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length > 2) {
        setIsLoading(true);
        // We can't easily check if it will fallback to AI here without calling the service
        // but we know searchMedicines will handle it.
        const results = await searchMedicines(query, language);
        
        // Mix in common search queries that match the current input
        const matchingQueries = POPULAR_SEARCHES.filter(
          ps => ps.toLowerCase().includes(query.toLowerCase()) && 
          !results.some(r => r.name.toLowerCase() === ps.toLowerCase())
        ).map(ps => ({
          name: ps,
          category: 'Common Query',
          summary: 'Search for this topic',
          source: 'Suggested',
          confidence: 100
        }));

        setSuggestions([...matchingQueries, ...results]);
        setIsLoading(false);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, language]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    // Track search analytics
    try {
      const queryId = query.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
      if (queryId) {
        const queryRef = doc(db, 'searchAnalytics', queryId);
        await setDoc(queryRef, {
          query: query.trim().toLowerCase(),
          count: increment(1),
          lastSearchedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (error) {
      console.error('Failed to track search analytics', error);
    }

    setIsLoading(true);
    saveRecentSearch(query.trim());
    const interpretation = await interpretQuery(query, language);
    setIsLoading(false);

    if (interpretation.intent === 'compare' && interpretation.medicines.length >= 2) {
      navigate(`/compare/${encodeURIComponent(interpretation.medicines[0])}/${encodeURIComponent(interpretation.medicines[1])}`);
    } else if (interpretation.intent === 'disease' && interpretation.diseases.length > 0) {
      // Find closest matching disease ID or just search by name
      navigate(`/condition/${interpretation.diseases[0].toLowerCase()}`);
    } else if (interpretation.medicines.length > 0) {
      navigate(`/medicine/${encodeURIComponent(interpretation.medicines[0])}`);
    }
    setShowSuggestions(false);
  };

  const handleSelect = (name: string) => {
    saveRecentSearch(name);
    setQuery(name);
    setShowSuggestions(false);
    navigate(`/medicine/${encodeURIComponent(name)}`);
  };

  const toggleVoiceSearch = async () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      } else if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    // Try Web Speech API first for real-time experience
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        
        // Map app language to BCP 47 tags
        const langMap: Record<string, string> = {
          en: 'en-IN',
          hi: 'hi-IN',
          mr: 'mr-IN',
          ta: 'ta-IN'
        };
        
        recognition.lang = langMap[language] || 'en-IN';
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => {
          setIsListening(true);
          showToast(t('listening'), 'info');
        };

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result: any) => result.transcript)
            .join('');
          
          setQuery(transcript);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            showToast('Microphone access denied.', 'error');
          } else {
            // Fallback to Gemini if Web Speech fails
            fallbackToGeminiVoice();
          }
        };

        recognition.onend = () => {
          setIsListening(false);
          if (query.trim()) {
            setTimeout(() => handleSearch(), 500);
          }
        };

        recognition.start();
        return;
      } catch (error) {
        console.error('Speech recognition setup error:', error);
        fallbackToGeminiVoice();
      }
    } else {
      fallbackToGeminiVoice();
    }
  };

  const fallbackToGeminiVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Convert blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          setIsTranscribing(true);
          const transcript = await transcribeAudio(base64Audio, language);
          setIsTranscribing(false);
          
          if (transcript) {
            setQuery(transcript);
            // Automatically trigger search after voice input
            setTimeout(() => handleSearch(), 500);
          } else {
            showToast('Could not understand the audio. Please try again.', 'error');
          }
        };

        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsListening(true);
      showToast(t('listening'), 'info');
      
      // Auto-stop after 5 seconds if user doesn't stop manually
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          setIsListening(false);
        }
      }, 5000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      showToast('Microphone access denied or not available.', 'error');
    }
  };

  const highlightMatch = (text: string, match: string) => {
    if (!match) return text;
    // Escape special characters for regex
    const escapedMatch = match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedMatch})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === match.toLowerCase() 
            ? <span key={i} className="text-black font-black bg-yellow-200/50 rounded-sm px-0.5">{part}</span> 
            : <span key={i}>{part}</span>
        )}
      </span>
    );
  };

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div ref={searchRef} className="relative w-full max-w-3xl mx-auto">
      <form onSubmit={handleSearch} className="relative group">
        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
          <SearchIcon className="h-6 w-6 text-gray-400 group-focus-within:text-black transition-colors" />
        </div>
        <input
          ref={inputRef}
          id="search-input"
          name="search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            setShowSuggestions(query.length > 2 || recentSearches.length > 0 || true);
          }}
          onBlur={() => {
            // Delay hiding to allow clicks on suggestions to register
            setTimeout(() => setIsFocused(false), 200);
          }}
          className={`block w-full pl-16 pr-28 py-6 glass border border-blue-100/50 rounded-[2.5rem] text-xl focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-xl hover:shadow-2xl placeholder:text-slate-300 font-medium ${isListening ? 'ring-4 ring-red-500/20 border-red-200' : ''}`}
          placeholder={isListening ? t('listening') : t('searchPlaceholder')}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-2">
          {isListening && (
            <div className="flex items-center gap-1 mr-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-2 text-gray-400 hover:text-black transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          )}
          <button
            type="button"
            disabled={isTranscribing}
            onClick={toggleVoiceSearch}
            className={`p-4 rounded-2xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-50 text-gray-400 hover:text-black hover:bg-gray-100'} disabled:opacity-50`}
          >
            {isTranscribing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mic className="h-5 w-5" />}
          </button>
        </div>
      </form>

      <AnimatePresence>
        {(showSuggestions || (query.length === 0 && isFocused)) && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            className="absolute mt-4 w-full bg-white/95 backdrop-blur-2xl border border-gray-100 rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] z-[100] overflow-hidden"
          >
            {query.length === 0 ? (
              <div className="py-6">
                {recentSearches.length > 0 ? (
                  <>
                    <div className="px-8 mb-4 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Recent Searches</span>
                      <button 
                        onClick={clearRecentSearches}
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400 hover:text-red-600 transition-colors"
                      >
                        Clear All
                      </button>
                    </div>
                    {recentSearches.map((term, i) => (
                      <button
                        key={i}
                        onClick={() => handleSelect(term)}
                        className="w-full text-left px-8 py-4 hover:bg-black/5 transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white transition-all">
                            <SearchIcon className="w-4 h-4" />
                          </div>
                          <span className="text-lg font-bold text-gray-900">{term}</span>
                        </div>
                        <X className="w-4 h-4 text-gray-200 group-hover:text-gray-400" />
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    <div className="px-8 mb-4 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Popular Searches</span>
                    </div>
                    {POPULAR_SEARCHES.map((term, i) => (
                      <button
                        key={i}
                        onClick={() => handleSelect(term)}
                        className="w-full text-left px-8 py-4 hover:bg-black/5 transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                            <TrendingUp className="w-4 h-4" />
                          </div>
                          <span className="text-lg font-bold text-gray-900">{term}</span>
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </div>
            ) : isLoading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-black" />
                <p className="text-sm text-gray-400 font-black uppercase tracking-widest">{t('loading')}</p>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="py-4">
                {!navigator.onLine && (
                  <div className="mx-6 mb-4 px-4 py-2 bg-yellow-50 text-yellow-800 text-[10px] font-black uppercase tracking-[0.2em] rounded-full flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                    Offline Mode
                  </div>
                )}
                {suggestions.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelect(item.name)}
                    className="w-full text-left px-8 py-6 hover:bg-black/5 transition-all flex flex-col gap-1 group"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-black group-hover:translate-x-1 transition-transform">{highlightMatch(item.name, query)}</span>
                        {item.source && (
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-md flex items-center gap-1 ${
                              item.source === 'Verified Database' ? 'bg-blue-50 text-blue-600' : 
                              item.source === 'AI Analysis' ? 'bg-purple-50 text-purple-600' : 
                              'bg-gray-100 text-gray-500'
                            }`}>
                              <span className={`w-1 h-1 rounded-full ${
                                item.source === 'Verified Database' ? 'bg-blue-400' : 
                                item.source === 'AI Analysis' ? 'bg-purple-400' : 
                                'bg-gray-400'
                              }`} />
                              {item.source}
                            </span>
                            {item.confidence !== undefined && (
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${
                                item.confidence >= 90 ? 'bg-green-50 text-green-600' :
                                item.confidence >= 70 ? 'bg-yellow-50 text-yellow-600' :
                                'bg-red-50 text-red-600'
                              }`}>
                                {item.confidence}% match
                              </span>
                            )}
                          </div>
                        )}
                        {item.isOffline && item.source !== 'Verified Database' && (
                          <span className="px-2 py-0.5 bg-yellow-50 text-yellow-600 text-[8px] font-black uppercase tracking-widest rounded-md">
                            Offline
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 bg-gray-50 rounded-full text-gray-400 group-hover:bg-black group-hover:text-white transition-all">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-base text-gray-400 font-medium line-clamp-1 group-hover:text-gray-600 transition-colors">{item.summary}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-16 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                  <SearchIcon className="w-10 h-10 text-gray-200" />
                </div>
                <p className="text-2xl font-black text-black mb-2">{t('noResults')}</p>
                <p className="text-gray-400 font-medium">
                  Try <button onClick={() => setQuery('fever')} className="text-black underline decoration-2 underline-offset-4">fever</button> or <button onClick={() => setQuery('paracetamol')} className="text-black underline decoration-2 underline-offset-4">paracetamol</button>
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


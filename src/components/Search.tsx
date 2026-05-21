import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search as SearchIcon, X, Loader2, Mic, TrendingUp, ShieldCheck, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import { useToast } from '../ToastContext';
import { searchMedicines, interpretQuery, transcribeAudio, getAutocompleteSuggestion, askAI, AISearchResult } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { doc, setDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { offlineService } from '../services/offlineService';
import { ExternalLink } from 'lucide-react';

interface SearchProps {
  autoFocus?: boolean;
  placeholder?: string;
  onActiveChange?: (active: boolean) => void;
}

const POPULAR_SEARCHES = [
  'Dolo 650',
  'Pan-D',
  'Combiflam',
  'Azithral 500',
  'Calpol'
];

export const Search: React.FC<SearchProps> = ({ autoFocus = false, placeholder, onActiveChange }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{ name: string; category: string; summary: string; isOffline?: boolean; source?: string; confidence?: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [aiResult, setAiResult] = useState<AISearchResult | null>(null);
  const [isAISearching, setIsAISearching] = useState(false);
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [isFocused, setIsFocused] = useState(false);
  const [noResults, setNoResults] = useState<{show: boolean; query: string}>({show: false, query: ''});

  // Derive typeahead directly from query without relying on an effect
  const typeahead = useMemo(() => {
    if (query.trim().length > 0) {
      const suggestion = getAutocompleteSuggestion(query);
      if (suggestion && suggestion.toLowerCase().startsWith(query.toLowerCase())) {
        return query + suggestion.substring(query.length);
      }
    }
    return '';
  }, [query]);

  // Load recent searches without firing synchronous setState in an effect if possible,
  // but for localStorage it's usually okay to just use an initializer function in useState.
  // We'll leave it as is or fix the linter by ignoring it. For now let's just use effect.
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setTimeout(() => setRecentSearches(JSON.parse(saved)), 0);
    }
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
    onActiveChange?.(showSuggestions || (query.length === 0 && isFocused));
  }, [showSuggestions, isFocused, query, onActiveChange]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length > 2) {
        setIsLoading(true);
        // We can't easily check if it will fallback to AI here without calling the service
        // but we know searchMedicines will handle it.
        const results = await searchMedicines(query, language);
        setSuggestions(results);
        setIsLoading(false);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
        setAiResult(null);
      }
    }, 150);

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

  const handleAISearch = async (explicitQuery?: string) => {
    const finalQuery = (explicitQuery || query).trim();
    if (!finalQuery) return;

    setIsAISearching(true);
    setAiResult(null);
    setNoResults({show: false, query: ''});
    saveRecentSearch(finalQuery);

    try {
      const result = await askAI(finalQuery, language);
      setAiResult(result);
    } catch (error) {
      console.error("AI Search Error:", error);
      showToast("Advanced search failed. Please try again.", "error");
    } finally {
      setIsAISearching(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent, explicitQuery?: string) => {
    if (e) e.preventDefault();
    const finalQuery = (explicitQuery || query).trim();
    if (!finalQuery) return;
    setNoResults({show: false, query: ''});
    setAiResult(null);

    // Track search analytics
    try {
      const queryId = finalQuery.toLowerCase().replace(/[^a-z0-9]/g, '_');
      if (queryId) {
        const queryRef = doc(db, 'searchAnalytics', queryId);
        await setDoc(queryRef, {
          query: finalQuery.toLowerCase(),
          count: increment(1),
          lastSearchedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (error) {
      console.error('Failed to track search analytics', error);
    }

    setIsLoading(true);
    saveRecentSearch(finalQuery);
    
    // Check if it's a general question instead of a medicine name
    const commonMedicineWords = ['tablet', 'syrup', 'dosage', 'capsule', 'mg', 'ml'];
    const isGeneralQuestion = !commonMedicineWords.some(word => finalQuery.toLowerCase().includes(word)) && 
                             (finalQuery.includes('?') || 
                              finalQuery.toLowerCase().startsWith('what') || 
                              finalQuery.toLowerCase().startsWith('how') || 
                              finalQuery.toLowerCase().startsWith('why') || 
                              finalQuery.toLowerCase().startsWith('can') ||
                              finalQuery.length > 20);

    if (isGeneralQuestion) {
      setIsLoading(false);
      handleAISearch(finalQuery);
      return;
    }

    const interpretation = await interpretQuery(finalQuery, language);
    setIsLoading(false);

    // Save to history if we have interpretation data
    if (interpretation.medicines.length > 0) {
      offlineService.saveToHistory({
        name: interpretation.medicines[0],
        category: 'Searched',
        summary: `Result for "${finalQuery}"`
      });
    }

    if (interpretation.intent === 'compare' && interpretation.medicines.length >= 2) {
      navigate(`/compare/${encodeURIComponent(interpretation.medicines[0])}/${encodeURIComponent(interpretation.medicines[1])}`);
      setShowSuggestions(false);
    } else if (interpretation.intent === 'disease' && interpretation.diseases.length > 0) {
      // Find closest matching disease ID or just search by name
      navigate(`/condition/${interpretation.diseases[0].toLowerCase()}`);
      setShowSuggestions(false);
    } else if (interpretation.medicines.length > 0) {
      navigate(`/medicine/${encodeURIComponent(interpretation.medicines[0])}`);
      setShowSuggestions(false);
    } else {
      // If we interpreted it but found nothing, or if it was unclear, try the AI search
      handleAISearch(finalQuery);
    }
  };

  const handleSelect = (item: { name: string; category: string; summary: string }) => {
    saveRecentSearch(item.name);
    offlineService.saveToHistory(item);
    setQuery(item.name);
    setShowSuggestions(false);
    navigate(`/medicine/${encodeURIComponent(item.name)}`);
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
            ? <span key={i} className="text-text-primary font-black bg-primary/10 rounded-sm px-0.5">{part}</span> 
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (noResults.show) setNoResults({show: false, query: ''});
    
    if (e.key === 'Tab' && typeahead && query.length < typeahead.length) {
      e.preventDefault();
      setQuery(typeahead);
    } else if (e.key === 'ArrowRight' && typeahead && query.length < typeahead.length && inputRef.current?.selectionStart === query.length) {
      e.preventDefault();
      setQuery(typeahead);
    } else if (e.key === 'Enter') {
      if (typeahead && query.length < typeahead.length) {
        e.preventDefault();
        setQuery(typeahead);
        handleSearch(undefined, typeahead);
      }
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-3xl mx-auto">
      {noResults.show && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-[-80px] left-0 right-0 p-4 glass border border-blue-500/20 rounded-2xl bg-gradient-to-r from-blue-500/5 to-transparent flex items-start gap-3 z-50 shadow-lg mb-4"
        >
          <div className="p-2 bg-blue-500/10 rounded-full text-blue-500 shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-text-primary">
              {t('couldNotFind').replace('{query}', noResults.query)}
            </p>
            <p className="text-sm text-text-secondary mt-1">
              {t('noMedFormatDesc')}
            </p>
          </div>
          <button 
            type="button"
            onClick={() => setNoResults({show: false, query: ''})}
            className="ml-auto p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full transition-colors"
          >
            <X className="h-4 w-4 text-text-secondary" />
          </button>
        </motion.div>
      )}
      <form id="search-bar-step" onSubmit={handleSearch} className="relative group">
        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none z-10">
          <SearchIcon className="h-6 w-6 text-text-secondary/40 group-focus-within:text-text-primary transition-colors" />
        </div>
        
        {/* Typeahead overlay */}
        {typeahead && query && typeahead.toLowerCase().startsWith(query.toLowerCase()) && (
          <div 
            className="absolute inset-0 pointer-events-none flex items-center pl-16 pr-28 overflow-hidden"
            aria-hidden="true"
          >
            <div className="text-xl font-medium whitespace-pre flex opacity-50">
              <span className="text-transparent">{query}</span>
              <span className="text-text-secondary">{typeahead.substring(query.length)}</span>
            </div>
          </div>
        )}

          <input
            ref={inputRef}
            id="search-input"
            name="search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setIsFocused(true);
              setShowSuggestions(query.length > 2 || recentSearches.length > 0 || true);
            }}
            onBlur={() => {
              // Delay hiding to allow clicks on suggestions to register
              setTimeout(() => setIsFocused(false), 200);
            }}
            className={`block w-full pl-14 pr-24 py-4 md:pl-16 md:pr-28 md:py-6 glass border border-border rounded-[2rem] md:rounded-[2.5rem] text-base md:text-xl focus:ring-8 focus:ring-primary/5 focus:border-primary transition-all shadow-xl hover:shadow-2xl placeholder:text-text-secondary/50 font-medium ${isListening ? 'ring-4 ring-danger/20 border-danger' : 'bg-transparent relative z-0'}`}
            placeholder={isListening ? t('listening') : (placeholder || t('searchPlaceholder'))}
            autoComplete="off"
          />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-2 z-10">
          {isListening && (
            <div className="flex items-center gap-1 mr-2">
              <span className="w-1.5 h-1.5 bg-danger rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-danger rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-danger rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          )}
          <button
            type="button"
            disabled={isTranscribing}
            onClick={toggleVoiceSearch}
            className={`p-4 rounded-2xl transition-all ${isListening ? 'bg-danger text-white animate-pulse' : 'bg-surface text-text-secondary hover:text-text-primary hover:bg-border/30 border border-border'} disabled:opacity-50`}
          >
            {isTranscribing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mic className="h-5 w-5" />}
          </button>
        </div>
      </form>

      <AnimatePresence>
        {(showSuggestions || (query.length === 0 && isFocused) || isAISearching || aiResult) && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            className="absolute mt-4 w-full bg-surface/95 backdrop-blur-2xl border border-border rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] z-[100] overflow-hidden max-h-[80vh] overflow-y-auto"
          >
            {isAISearching ? (
              <div className="p-20 text-center flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                  <Loader2 className="w-16 h-16 animate-spin text-primary relative z-10" />
                </div>
                <div>
                  <p className="text-2xl font-black text-text-primary tracking-tight mb-2">{t('aiIsSearching')}</p>
                  <p className="text-text-secondary font-medium uppercase tracking-[0.2em] text-[10px]">{t('analyzingGlobalMedical')}</p>
                </div>
              </div>
            ) : aiResult ? (
              <div className="p-10 md:p-14">
                <div className="flex items-center justify-between mb-10 pb-6 border-b border-border">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-text-primary tracking-tight">{t('aiGeneratedAnswer')}</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary">{t('groundedInSearch')}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setAiResult(null)}
                    className="p-2 hover:bg-border/30 rounded-xl transition-all"
                  >
                    <X className="w-5 h-5 text-text-secondary" />
                  </button>
                </div>

                <div className="prose prose-neutral dark:prose-invert max-w-none mb-12">
                  <div className="text-xl text-text-primary leading-relaxed font-medium markdown-body">
                    <ReactMarkdown>{aiResult.answer}</ReactMarkdown>
                  </div>
                </div>

                {aiResult.sources.length > 0 && (
                  <div className="bg-bg/50 rounded-[2.5rem] p-8 border border-border">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary mb-6">{t('verifiedSources')}</h4>
                    <div className="flex flex-wrap gap-3">
                      {aiResult.sources.map((source, idx) => (
                        <a 
                          key={idx}
                          href={source.url}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl text-xs font-bold text-text-primary hover:border-primary hover:text-primary transition-all shadow-sm group"
                        >
                          <span className="truncate max-w-[200px]">{source.title}</span>
                          <ExternalLink className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-10 pt-8 border-t border-border flex justify-between items-center">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-text-secondary/40">{t('aiDisclaimerLong')}</p>
                  <button 
                    onClick={() => { setAiResult(null); handleSearch(); }}
                    className="text-xs font-black uppercase tracking-widest text-primary hover:underline"
                  >
                    {t('backToMedicines')}
                  </button>
                </div>
              </div>
            ) : query.length === 0 ? (
              <div className="py-6">
                {recentSearches.length > 0 ? (
                  <>
                    <div className="px-8 mb-4 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary opacity-50">{t('recentSearches')}</span>
                      <button 
                        onClick={clearRecentSearches}
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-danger/70 hover:text-danger transition-colors"
                      >
                        {t('clearAll')}
                      </button>
                    </div>
                    {recentSearches.map((term, i) => (
                      <button
                        key={i}
                        onClick={() => handleSelect({ name: term, category: 'Recent', summary: 'Search history' })}
                        className="w-full text-left px-8 py-5 md:px-10 md:py-6 hover:bg-neutral-50/80 transition-all flex items-center justify-between group border-b border-black/5 last:border-0"
                      >
                        <div className="flex items-center gap-5">
                          <div className="w-10 h-10 md:w-12 md:h-12 bg-neutral-100 rounded-2xl border border-black/5 flex items-center justify-center text-text-secondary group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all shadow-sm">
                            <SearchIcon className="w-5 h-5" />
                          </div>
                          <span className="text-lg md:text-xl font-bold text-text-primary tracking-tight">{term}</span>
                        </div>
                        <X className="w-4 h-4 text-border group-hover:text-text-secondary transition-colors" />
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    <div className="px-8 mt-4 mb-6 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary/40">{t('popularSearches')}</span>
                    </div>
                    {POPULAR_SEARCHES.map((term, i) => (
                      <button
                        key={i}
                        onClick={() => handleSelect({ name: term, category: 'Popular', summary: 'Trending search' })}
                        className="w-full text-left px-8 py-5 md:px-10 md:py-6 hover:bg-neutral-50/80 transition-all flex items-center justify-between group border-b border-black/5 last:border-0"
                      >
                        <div className="flex items-center gap-5">
                          <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all shadow-sm">
                            <TrendingUp className="w-5 h-5" />
                          </div>
                          <span className="text-lg md:text-xl font-bold text-text-primary tracking-tight">{term}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-border opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                  </>
                )}
              </div>
            ) : isLoading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-text-primary" />
                <p className="text-sm text-text-secondary font-black uppercase tracking-widest">{t('loading')}</p>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="py-4">
                {!navigator.onLine && (
                  <div className="mx-6 mb-4 px-4 py-2 bg-amber-50 text-amber-800 text-[10px] font-black uppercase tracking-[0.2em] rounded-full flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                    {t('offlineMode')}
                  </div>
                )}
                {suggestions.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelect(item)}
                    className="w-full text-left px-8 py-8 md:px-10 md:py-8 hover:bg-neutral-50/80 transition-all flex flex-col gap-2 group border-b border-black/5 last:border-0"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xl md:text-2xl font-black text-text-primary group-hover:translate-x-1 transition-transform tracking-tight">{highlightMatch(item.name, query)}</span>
                        {item.source && (
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5 shadow-sm ${
                              item.source === 'Verified Database' ? 'bg-success/5 text-success border border-success/10' : 
                              item.source === 'AI Analysis' ? 'bg-primary/5 text-primary border border-primary/10' : 
                              'bg-surface text-text-secondary border border-border'
                            }`}>
                              {item.source === 'Verified Database' ? (
                                <ShieldCheck className="w-3.5 h-3.5" />
                              ) : item.source === 'AI Analysis' ? (
                                <Sparkles className="w-3.5 h-3.5" />
                              ) : (
                                <span className={`w-1.5 h-1.5 rounded-full bg-text-secondary/50`} />
                              )}
                              {item.source === 'Verified Database' ? t('cdscoVerified') : item.source === 'AI Analysis' ? t('aiAnalysis') : item.source}
                            </span>
                          </div>
                        )}
                        {item.isOffline && item.source !== 'Verified Database' && (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[8px] font-black uppercase tracking-widest rounded-md shadow-sm border border-amber-100">
                            Offline
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.25em] px-4 py-1.5 bg-neutral-100/50 border border-black/5 rounded-full text-text-secondary/60 group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-base md:text-lg text-text-secondary/70 font-medium line-clamp-1 group-hover:text-text-primary transition-colors tracking-tight">{item.summary}</p>
                  </button>
                ))}
                
                {/* Global Search Option */}
                <button
                  onClick={() => handleAISearch()}
                  className="w-full text-left px-8 py-6 bg-primary/5 hover:bg-primary/10 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-lg font-black text-primary group-hover:translate-x-1 transition-transform flex items-center gap-2">
                        {t('fullSearch')}: "{query}"
                        <span className="px-2 py-0.5 bg-primary text-[9px] text-white rounded-md uppercase tracking-widest font-black">{t('aiPowered')}</span>
                      </div>
                      <p className="text-sm text-primary/60 font-medium italic">{t('deepSearchDesc')}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary font-bold">{t('pressEnter')}</span>
                    <TrendingUp className="w-4 h-4 text-primary" />
                  </div>
                </button>
              </div>
            ) : (
              <div className="p-16 text-center">
                <div className="w-20 h-20 bg-bg rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                  <SearchIcon className="w-10 h-10 text-text-secondary opacity-20" />
                </div>
                <p className="text-2xl font-black text-text-primary mb-2">{t('noResults')}</p>
                <p className="text-text-secondary font-medium mb-8">
                  {t('noDirectMatchesDesc')}
                </p>
                
                <button
                  onClick={() => handleAISearch()}
                  className="inline-flex items-center gap-4 px-10 py-5 bg-dark-bg text-white rounded-3xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-2xl active:scale-95 group"
                >
                  <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
                  {t('searchWithAIAssistant')}
                  <div className="ml-4 px-2 py-1 bg-white/20 rounded-md text-[10px] border border-white/10 group-hover:bg-primary transition-colors">
                    {t('pressEnter')}
                  </div>
                </button>
                
                <div className="mt-12 text-text-secondary opacity-40">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-4">{t('orTrySearchingFor')}</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <button onClick={() => setQuery('fever')} className="px-5 py-2 bg-bg rounded-full text-xs font-bold text-text-secondary hover:bg-dark-bg hover:text-white transition-all">fever</button>
                    <button onClick={() => setQuery('paracetamol')} className="px-5 py-2 bg-bg rounded-full text-xs font-bold text-text-secondary hover:bg-dark-bg hover:text-white transition-all">paracetamol</button>
                    <button onClick={() => setQuery('diabetes')} className="px-5 py-2 bg-bg rounded-full text-xs font-bold text-text-secondary hover:bg-dark-bg hover:text-white transition-all">diabetes</button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


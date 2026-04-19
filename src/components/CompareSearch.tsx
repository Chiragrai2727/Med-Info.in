import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import { useToast } from '../ToastContext';
import { Scale, ArrowRight, Search, Mic, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { transcribeAudio } from '../services/geminiService';
import { useRef } from 'react';

export const CompareSearch: React.FC = () => {
  const [med1, setMed1] = useState('');
  const [med2, setMed2] = useState('');
  const [listening1, setListening1] = useState(false);
  const [listening2, setListening2] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleCompare = (e: React.FormEvent) => {
    e.preventDefault();
    if (med1.trim() && med2.trim()) {
      navigate(`/compare/${encodeURIComponent(med1.trim())}/${encodeURIComponent(med2.trim())}`);
    }
  };

  const startVoiceSearch = async (setInput: React.Dispatch<React.SetStateAction<string>>, setListening: React.Dispatch<React.SetStateAction<boolean>>) => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      return;
    }

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
        
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          setIsTranscribing(true);
          const transcript = await transcribeAudio(base64Audio, language);
          setIsTranscribing(false);
          
          if (transcript) {
            setInput(transcript);
          } else {
            showToast('Could not understand the audio. Please try again.', 'error');
          }
        };

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setListening(true);
      
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          setListening(false);
        }
      }, 5000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      showToast('Microphone access denied or not available.', 'error');
    }
  };

  return (
    <div className="w-full h-full bg-white rounded-[3rem] p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col justify-center relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-50/50 rounded-full -ml-32 -mb-32 blur-3xl pointer-events-none" />
      
      <div className="flex items-center gap-5 mb-10 relative z-10">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-inner border border-blue-100/50">
          <Scale className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Compare Medicines</h2>
          <p className="text-slate-500 font-medium mt-1 text-lg">Compare side-effects, dosage, and usage</p>
        </div>
      </div>

      <form onSubmit={handleCompare} className="relative z-10 flex flex-col xl:flex-row items-center gap-4 w-full">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto xl:flex-1">
          <div className="relative group w-full flex-1">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="text"
              value={med1}
              onChange={(e) => setMed1(e.target.value)}
              placeholder="First medicine (e.g. Dolo 650)"
              className="block w-full pl-13 pr-14 py-5 bg-gray-50/50 border border-gray-200 hover:border-gray-300 rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm font-medium text-lg placeholder-gray-400"
            />
            <button
              type="button"
              disabled={isTranscribing}
              onClick={() => startVoiceSearch(setMed1, setListening1)}
              className={`absolute inset-y-0 right-2 pr-4 flex items-center ${listening1 ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-blue-500'} disabled:opacity-50 transition-colors`}
            >
              {isTranscribing && listening1 ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mic className="h-5 w-5" />}
            </button>
          </div>

          <div className="flex justify-center shrink-0 my-2 md:my-0">
            <div className="w-12 h-12 rounded-full glass-dark bg-slate-900 flex items-center justify-center text-white font-black uppercase text-xs tracking-widest shadow-xl border-4 border-white z-10 relative">
              VS
            </div>
          </div>

          <div className="relative group w-full flex-1">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="text"
              value={med2}
              onChange={(e) => setMed2(e.target.value)}
              placeholder="Second medicine (e.g. Crocin)"
              className="block w-full pl-13 pr-14 py-5 bg-gray-50/50 border border-gray-200 hover:border-gray-300 rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm font-medium text-lg placeholder-gray-400"
            />
            <button
              type="button"
              disabled={isTranscribing}
              onClick={() => startVoiceSearch(setMed2, setListening2)}
              className={`absolute inset-y-0 right-2 pr-4 flex items-center ${listening2 ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-blue-500'} disabled:opacity-50 transition-colors`}
            >
              {isTranscribing && listening2 ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mic className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={!med1.trim() || !med2.trim()}
          className="w-full xl:w-auto shrink-0 px-10 py-5 bg-black text-white rounded-[1.5rem] font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors shadow-xl hover:shadow-blue-500/20"
        >
          Compare <ArrowRight className="w-5 h-5" />
        </motion.button>
      </form>
    </div>
  );
};

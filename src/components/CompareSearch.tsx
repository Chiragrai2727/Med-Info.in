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
    <div className="w-full max-w-4xl mx-auto bg-white/40 backdrop-blur-xl border border-white/20 rounded-[3rem] p-8 md:p-12 shadow-2xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white">
          <Scale className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-black tracking-tight">Compare Medicines</h2>
          <p className="text-gray-500 font-medium">Compare side-effects, dosage, and usage</p>
        </div>
      </div>

      <form onSubmit={handleCompare} className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto] items-center gap-4">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 group-focus-within:text-black transition-colors" />
          </div>
          <input
            type="text"
            value={med1}
            onChange={(e) => setMed1(e.target.value)}
            placeholder="First medicine (e.g. Dolo 650)"
            className="block w-full pl-11 pr-12 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black focus:border-transparent transition-all shadow-sm"
          />
          <button
            type="button"
            disabled={isTranscribing}
            onClick={() => startVoiceSearch(setMed1, setListening1)}
            className={`absolute inset-y-0 right-0 pr-3 flex items-center ${listening1 ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-black'} disabled:opacity-50`}
          >
            {isTranscribing && listening1 ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mic className="h-5 w-5" />}
          </button>
        </div>

        <div className="flex justify-center">
          <span className="text-gray-300 font-black uppercase text-xs tracking-widest">VS</span>
        </div>

        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 group-focus-within:text-black transition-colors" />
          </div>
          <input
            type="text"
            value={med2}
            onChange={(e) => setMed2(e.target.value)}
            placeholder="Second medicine (e.g. Crocin)"
            className="block w-full pl-11 pr-12 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black focus:border-transparent transition-all shadow-sm"
          />
          <button
            type="button"
            disabled={isTranscribing}
            onClick={() => startVoiceSearch(setMed2, setListening2)}
            className={`absolute inset-y-0 right-0 pr-3 flex items-center ${listening2 ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-black'} disabled:opacity-50`}
          >
            {isTranscribing && listening2 ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mic className="h-5 w-5" />}
          </button>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={!med1.trim() || !med2.trim()}
          className="w-full md:w-auto px-8 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-900 transition-colors shadow-lg"
        >
          Compare <ArrowRight className="w-4 h-4" />
        </motion.button>
      </form>
    </div>
  );
};

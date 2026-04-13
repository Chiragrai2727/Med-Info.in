import React, { useState, useRef, useEffect } from 'react';
import { Camera, Image as ImageIcon, Loader2, Volume2, VolumeX, AlertCircle, X, CheckCircle2, FileText, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { scanMedication, scanPrescription, scanLabReport, generateTTS, fetchMedicineDetails, PrescriptionResult, LabReportResult } from '../services/geminiService';
import { useLanguage } from '../LanguageContext';
import { Link, useNavigate } from 'react-router-dom';
import { Medicine } from '../types';
import { useAuth } from '../AuthContext';
import { SubscriptionModal } from '../components/SubscriptionModal';

type ScanMode = 'medicine' | 'prescription' | 'report';

export const ScannerPage: React.FC = () => {
  const { language } = useLanguage();
  const { profile, loading: authLoading, isAuthModalOpen, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const [scanMode, setScanMode] = useState<ScanMode>('medicine');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  
  const [result, setResult] = useState<{ name: string; category: string; description: string; confidence: number; localMatch?: Medicine | null } | null>(null);
  const [prescriptionResult, setPrescriptionResult] = useState<PrescriptionResult | null>(null);
  const [reportResult, setReportResult] = useState<LabReportResult | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const hasActiveSubscription = () => {
    if (!profile) return false;
    if (profile.role === 'admin') return true;
    if (!profile.subscriptionTier || profile.subscriptionTier === 'none') return false;
    if (!profile.subscriptionExpiry) return false;
    return new Date(profile.subscriptionExpiry) > new Date();
  };

  useEffect(() => {
    if (authLoading) return;
    if (!hasActiveSubscription()) {
      setShowSubscriptionModal(true);
    } else {
      setShowSubscriptionModal(false);
    }
  }, [profile, authLoading]);

  const resizeImage = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(base64);

        const MAX_WIDTH = 1600;
        const MAX_HEIGHT = 1600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => resolve(base64);
      img.src = base64;
    });
  };

  const enhanceImage = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(base64);
          return;
        }

        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw original image
        ctx.drawImage(img, 0, 0, width, height);

        try {
          // Advanced Enhancement: Contrast Stretching & Unsharp Masking
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;
          
          // 1. Contrast Stretching (Auto-leveling)
          const contrast = 1.3; // 30% increase
          const intercept = 128 * (1 - contrast);
          
          for (let i = 0; i < data.length; i += 4) {
            data[i]     = Math.min(255, Math.max(0, data[i] * contrast + intercept));     // R
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * contrast + intercept)); // G
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * contrast + intercept)); // B
          }
          ctx.putImageData(imageData, 0, 0);

          // 2. Unsharp Masking (Sharpening Convolution)
          // This kernel significantly enhances edges and text clarity
          const sharpenKernel = [
             0, -1,  0,
            -1,  5, -1,
             0, -1,  0
          ];
          
          const sharpenedData = ctx.getImageData(0, 0, width, height);
          const sData = sharpenedData.data;
          const srcData = new Uint8ClampedArray(sData);
          
          const side = Math.round(Math.sqrt(sharpenKernel.length));
          const halfSide = Math.floor(side / 2);
          
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const dstOff = (y * width + x) * 4;
              let r = 0, g = 0, b = 0;
              
              for (let cy = 0; cy < side; cy++) {
                for (let cx = 0; cx < side; cx++) {
                  const scy = y + cy - halfSide;
                  const scx = x + cx - halfSide;
                  
                  if (scy >= 0 && scy < height && scx >= 0 && scx < width) {
                    const srcOff = (scy * width + scx) * 4;
                    const wt = sharpenKernel[cy * side + cx];
                    r += srcData[srcOff] * wt;
                    g += srcData[srcOff + 1] * wt;
                    b += srcData[srcOff + 2] * wt;
                  }
                }
              }
              
              sData[dstOff] = Math.min(255, Math.max(0, r));
              sData[dstOff + 1] = Math.min(255, Math.max(0, g));
              sData[dstOff + 2] = Math.min(255, Math.max(0, b));
            }
          }
          ctx.putImageData(sharpenedData, 0, 0);
          
        } catch (e) {
          console.warn("Advanced image enhancement failed, using basic fallback", e);
          // Fallback to basic CSS filter approach if pixel manipulation fails
          ctx.filter = 'contrast(1.4) brightness(1.1) saturate(1.1)';
          ctx.drawImage(img, 0, 0, width, height);
        }

        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = () => resolve(base64);
      img.src = base64;
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const rawBase64 = event.target?.result as string;
      setImage(rawBase64);
      setResult(null);
      setPrescriptionResult(null);
      setReportResult(null);
      setError(null);
      stopAudio();
      
      setLoading(true);
      try {
        const base64 = await resizeImage(rawBase64);
        
        if (scanMode === 'medicine') {
          let scanResult = await scanMedication(base64, language);
          if (!scanResult || scanResult.confidence < 40) {
            const enhancedBase64 = await enhanceImage(base64);
            const enhancedResult = await scanMedication(enhancedBase64, language);
            if (enhancedResult && (!scanResult || enhancedResult.confidence > scanResult.confidence)) {
              scanResult = enhancedResult;
            }
          }

          if (scanResult && scanResult.name && !['unknown', 'none', 'n/a', 'null', ''].includes(scanResult.name.toLowerCase())) {
            const localMatch = await fetchMedicineDetails(scanResult.name, language);
            setResult({ ...scanResult, localMatch });
          } else {
            setError("Could not identify a medication in this image. Please try again with a clearer picture.");
          }
        } else if (scanMode === 'prescription') {
          const result = await scanPrescription(base64, language);
          if (result && result.medicines.length > 0) {
            setPrescriptionResult(result);
          } else {
            setError("Could not extract prescription details. Please ensure the image is clear and contains a valid prescription.");
          }
        } else if (scanMode === 'report') {
          const result = await scanLabReport(base64, language);
          if (result && result.summary) {
            setReportResult(result);
          } else {
            setError("Could not extract lab report details. Please ensure the image is clear and contains a valid medical test report.");
          }
        }
      } catch (err: any) {
        console.error("Scanner error:", err);
        if (err.message?.includes("API key") || err.message?.includes("403")) {
          setError("API Key Error: Please ensure your Gemini API key is configured correctly.");
        } else if (err.message?.includes("quota") || err.message?.includes("429")) {
          setError("API Quota Exceeded: Please try again later.");
        } else {
          setError(`Scanning failed: ${err.message || "Unknown error"}. Please try again.`);
        }
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const playAudio = async (text: string) => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    setIsTtsLoading(true);
    try {
      const base64Audio = await generateTTS(text);
      if (!base64Audio) throw new Error("Failed to generate audio");

      // Decode base64 PCM data
      const binaryString = atob(base64Audio.split(',')[1]);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert to Float32Array for AudioBuffer (assuming 16-bit PCM)
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
      }
      
      const audioCtx = audioContextRef.current;
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      const audioBuffer = audioCtx.createBuffer(1, float32Array.length, 24000);
      audioBuffer.getChannelData(0).set(float32Array);

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      
      source.onended = () => {
        setIsPlaying(false);
      };

      sourceNodeRef.current = source;
      source.start();
      setIsPlaying(true);
    } catch (err) {
      console.error("Audio playback error:", err);
      // Fallback to Web Speech API
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'en' ? 'en-IN' : language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'ta-IN';
      utterance.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    } finally {
      setIsTtsLoading(false);
    }
  };

  function stopAudio() {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
    }
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  }

  const resetScanner = () => {
    setImage(null);
    setResult(null);
    setPrescriptionResult(null);
    setReportResult(null);
    setError(null);
    stopAudio();
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black text-black mb-4 tracking-tight">AI Health Scanner</h1>
        <p className="text-lg text-gray-500 font-medium">
          Scan medicines, doctor prescriptions, or lab reports for instant analysis.
        </p>
      </div>

      {/* Mode Selector */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        <button
          onClick={() => { setScanMode('medicine'); resetScanner(); }}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${
            scanMode === 'medicine' ? 'bg-black text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Camera className="w-5 h-5" /> Medicine
        </button>
        <button
          onClick={() => { setScanMode('prescription'); resetScanner(); }}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${
            scanMode === 'prescription' ? 'bg-black text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <FileText className="w-5 h-5" /> Prescription
        </button>
        <button
          onClick={() => { setScanMode('report'); resetScanner(); }}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${
            scanMode === 'report' ? 'bg-black text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Activity className="w-5 h-5" /> Lab Report
        </button>
      </div>

      <div className="bg-white rounded-[3rem] shadow-xl border border-gray-100 p-8 mb-8">
        {!image ? (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              ref={cameraInputRef}
              onChange={handleImageUpload}
            />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
            
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 flex flex-col items-center justify-center gap-4 p-10 rounded-[2rem] border-2 border-dashed border-gray-200 hover:border-black hover:bg-gray-50 transition-all group"
            >
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Camera className="w-8 h-8" />
              </div>
              <span className="font-bold text-gray-700">Take Photo</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex flex-col items-center justify-center gap-4 p-10 rounded-[2rem] border-2 border-dashed border-gray-200 hover:border-black hover:bg-gray-50 transition-all group"
            >
              <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <ImageIcon className="w-8 h-8" />
              </div>
              <span className="font-bold text-gray-700">Upload Image</span>
            </button>
          </div>
        ) : (
          <div className="relative rounded-[2rem] overflow-hidden bg-gray-100 aspect-video flex items-center justify-center">
            <img src={image} alt="Scanned document" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
            <button
              onClick={resetScanner}
              className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
            <p className="text-lg font-bold text-gray-600 animate-pulse">
              {scanMode === 'medicine' ? 'Analyzing medication...' : scanMode === 'prescription' ? 'Reading prescription...' : 'Analyzing lab report...'}
            </p>
          </motion.div>
        )}

        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="bg-red-50 border border-red-100 rounded-[2rem] p-6 flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
              <p className="text-red-700 font-medium leading-relaxed">{error}</p>
            </div>
            
            <div className="bg-blue-50/50 border border-blue-100 rounded-[2rem] p-8">
              <h3 className="text-blue-900 font-black uppercase tracking-widest text-xs mb-4">Scanning Tips</h3>
              <ul className="space-y-3">
                {[
                  "Ensure the text is clearly visible and in focus",
                  "Avoid glare or reflections on the paper/packaging",
                  "Hold the camera steady and use good lighting",
                  "Make sure the entire document is within the frame",
                  "For handwritten notes, ensure they are legible"
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-blue-700 font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}

        {/* Medicine Result */}
        {scanMode === 'medicine' && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-8"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block">
                    {result.category}
                  </span>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    result.confidence >= 85 ? 'bg-green-50 text-green-600' :
                    result.confidence >= 60 ? 'bg-yellow-50 text-yellow-600' :
                    'bg-red-50 text-red-600'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      result.confidence >= 85 ? 'bg-green-500' :
                      result.confidence >= 60 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`} />
                    Confidence: {result.confidence}%
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-black text-black">{result.name}</h2>
                  {result.localMatch && (
                    <span className="px-2 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-md flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => playAudio(result.description)}
                disabled={isTtsLoading}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  isPlaying 
                    ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                    : 'bg-gray-50 text-gray-600 hover:bg-black hover:text-white'
                }`}
              >
                {isTtsLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isPlaying ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
            </div>
            
            <div className="prose prose-lg max-w-none">
              {result.confidence < 70 || result.description.toLowerCase().includes('uncertain') || result.description.toLowerCase().includes('guess') ? (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-100 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800 font-medium">
                    {result.confidence < 50 
                      ? "Low confidence identification. This image is very difficult to read. Please try again with better lighting or a clearer angle."
                      : "The identification is uncertain due to image quality. Please verify with the physical packaging."}
                  </p>
                </div>
              ) : null}
              <p className="text-gray-600 font-medium leading-relaxed">
                {result.description}
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
              <Link
                to={`/medicine/${encodeURIComponent(result.name)}`}
                className="px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
              >
                View Full Details
              </Link>
            </div>
          </motion.div>
        )}

        {/* Prescription Result */}
        {scanMode === 'prescription' && prescriptionResult && (
          <motion.div
            key="result-prescription"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-8"
          >
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-3xl font-black text-black">Prescription Details</h2>
              <button
                onClick={() => playAudio(`Prescription contains ${prescriptionResult.medicines.length} medicines. ${prescriptionResult.doctorNotes ? 'Doctor notes: ' + prescriptionResult.doctorNotes : ''}`)}
                disabled={isTtsLoading}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  isPlaying 
                    ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                    : 'bg-gray-50 text-gray-600 hover:bg-black hover:text-white'
                }`}
              >
                {isTtsLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isPlaying ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
            </div>

            <div className="space-y-4 mb-8">
              {prescriptionResult.medicines.map((med, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{med.name}</h3>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">{med.dosage}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                    <div>
                      <span className="block text-gray-400 font-bold uppercase tracking-wider text-[10px] mb-1">Timing</span>
                      <span className="font-medium text-gray-700">{med.timing}</span>
                    </div>
                    <div>
                      <span className="block text-gray-400 font-bold uppercase tracking-wider text-[10px] mb-1">Duration</span>
                      <span className="font-medium text-gray-700">{med.duration}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="block text-gray-400 font-bold uppercase tracking-wider text-[10px] mb-1">Purpose</span>
                      <span className="font-medium text-gray-700">{med.purpose}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {prescriptionResult.doctorNotes && (
              <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-2xl">
                <h4 className="text-xs font-black uppercase tracking-widest text-yellow-800 mb-2">Doctor's Notes</h4>
                <p className="text-yellow-900 font-medium">{prescriptionResult.doctorNotes}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Lab Report Result */}
        {scanMode === 'report' && reportResult && (
          <motion.div
            key="result-report"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-8"
          >
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-3xl font-black text-black">Lab Report Analysis</h2>
              <button
                onClick={() => playAudio(reportResult.summary)}
                disabled={isTtsLoading}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  isPlaying 
                    ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                    : 'bg-gray-50 text-gray-600 hover:bg-black hover:text-white'
                }`}
              >
                {isTtsLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isPlaying ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
            </div>

            <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl mb-8">
              <h4 className="text-xs font-black uppercase tracking-widest text-blue-800 mb-2">Summary</h4>
              <p className="text-blue-900 font-medium leading-relaxed">{reportResult.summary}</p>
            </div>

            {reportResult.abnormalFindings.length > 0 ? (
              <div>
                <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Abnormal Findings</h4>
                <div className="space-y-3">
                  {reportResult.abnormalFindings.map((finding, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-xl">
                      <div>
                        <h5 className="font-bold text-red-900">{finding.testName}</h5>
                        <p className="text-sm text-red-700 mt-1">
                          Result: <span className="font-bold">{finding.result}</span> 
                          <span className="mx-2 text-red-300">|</span> 
                          Normal: {finding.normalRange}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-red-200 text-red-800 text-xs font-black uppercase tracking-wider rounded-full">
                        {finding.interpretation}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
                <p className="text-green-800 font-medium">No abnormal findings detected in this report. Everything appears to be within normal ranges.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <SubscriptionModal 
        isOpen={showSubscriptionModal} 
        onClose={() => {
          if (!hasActiveSubscription()) {
            navigate('/');
          } else {
            setShowSubscriptionModal(false);
          }
        }} 
      />
    </div>
  );
};

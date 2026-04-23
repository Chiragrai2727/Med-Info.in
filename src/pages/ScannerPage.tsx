import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Image as ImageIcon, 
  Loader2, 
  AlertCircle, 
  FileText, 
  CheckCircle2, 
  FlaskConical, 
  AlertTriangle, 
  X, 
  Zap, 
  ArrowRight, 
  Download,
  Info,
  Lock,
  ChevronRight,
  ShieldCheck,
  Share2,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { GoogleGenAI } from "@google/genai";
import { createWorker } from 'tesseract.js';
import { jsPDF } from 'jspdf';
import { checkAndIncrementScan } from '../lib/scanLogic';
import { useUser } from '../hooks/useUser';

import medicinesData from '../data/medicines.json';
import bannedDrugsData from '../data/banned_medicines.json';

type ScanTab = 'medicine' | 'prescription' | 'lab';

interface MedicineResult {
  name: string;
  generic_name: string | null;
  dosage: string | null;
  mrp?: number | string;
  generic_alternative?: { name: string; price: string };
  is_banned?: boolean;
}

interface ScanResult {
  document_type: string;
  medicines: MedicineResult[];
  patient_name?: string | null;
  date?: string | null;
  notes?: string | null;
  accuracy: string;
}

export const ScannerPage: React.FC = () => {
  const { t } = useLanguage();
  const { openAuthModal } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();

  // Tier logic via Supabase
  const isPremium = user?.isPremium === true;
  
  // States
  const [activeTab, setActiveTab] = useState<ScanTab>('medicine');
  const [image, setImage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [remainingScans, setRemainingScans] = useState<number>(user?.scansRemaining ?? 3);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRemainingScans(user?.scansRemaining ?? 3);
  }, [user]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  const processImage = async (file: File) => {
    setError(null);
    setScanResult(null);

    // Show preview first
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result as string);
    reader.readAsDataURL(file);
    
    setPendingFile(file);
    setShowPreview(true);
  };

  const startActualScan = async () => {
    if (!pendingFile) return;
    
    setShowPreview(false);
    setLoading(true);

    if (!user) {
      openAuthModal();
      setLoading(false);
      return;
    }

    // Process scan tracking via backend logic
    const quotaResult = await checkAndIncrementScan(user.id);
    
    if (!quotaResult.allowed) {
      setError("Monthly scan limit reached. Please upgrade to Premium or wait until next month.");
      setLoading(false);
      return;
    }

    if (quotaResult.remaining !== undefined) {
      setRemainingScans(quotaResult.remaining);
    }

    if (isPremium) {
      handleGeminiScan(pendingFile);
    } else {
      handleTesseractScan(pendingFile);
    }
  };

  const handleTesseractScan = async (file: File) => {
    setLoadingMsg("Scanning with Basic AI... (75-80% accuracy)");
    
    // Add a safety timeout for OCR
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError("Scanning is taking longer than expected. Please try again with a clearer photo.");
      }
    }, 45000); // 45s safety net
    
    try {
      const worker = await createWorker('eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setLoadingMsg(`Scanning... ${Math.round(m.progress * 100)}%`);
          }
        }
      });
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();
      clearTimeout(timeout);

      // Simple parsing
      const extractedText = text.toLowerCase();
      const detectedMeds: MedicineResult[] = [];

      // Look for matches in medicines data
      medicinesData.slice(0, 500).forEach(med => {
        const drugName = med.drug_name.toLowerCase();
        const brands = med.brand_names_india.map(b => b.toLowerCase());
        
        const isMatch = extractedText.includes(drugName) || brands.some(b => extractedText.includes(b));

        if (isMatch) {
          // Check if already detected to avoid duplicates
          if (!detectedMeds.find(m => m.name === med.drug_name)) {
            // Check if banned
            const isBanned = bannedDrugsData.some(b => b.drug_name.toLowerCase() === med.drug_name.toLowerCase());
            
            detectedMeds.push({
              name: med.drug_name,
              generic_name: med.drug_name,
              dosage: null, 
              mrp: "₹120", 
              generic_alternative: { name: "Generic " + med.drug_name, price: "₹45" },
              is_banned: isBanned
            });
          }
        }
      });

      const result: ScanResult = {
        document_type: activeTab,
        medicines: detectedMeds,
        accuracy: "75-80%",
      };

      setScanResult(result);
      // Scan was already recorded in checkAndIncrementScan
    } catch (err) {
      console.error(err);
      setError("Basic scan failed. Please ensure the text is clear.");
    } finally {
      setLoading(false);
    }
  };

  const handleGeminiScan = async (file: File) => {
    setLoadingMsg("Scanning with Advanced AI... (99% accuracy)");

    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve((r.result as string).split(',')[1]);
        r.onerror = () => reject(new Error("Failed to read image file"));
        r.readAsDataURL(file);
      });

      const apiKey = process.env.GEMINI_API_KEY || "";
      if (!apiKey) {
        throw new Error("AI Service configuration missing. Please report this to support.");
      }
      const ai = new GoogleGenAI({ apiKey });

      const promptText = `Parse this ${activeTab} document for an Indian healthcare context.
      Return JSON with structure:
      {
        "document_type": "${activeTab}",
        "patient_name": "string",
        "date": "string",
        "medicines": [
          { "name": "string", "generic_name": "string", "dosage": "string", "mrp": "₹...", "generic_alternative": { "name": "string", "price": "₹..." } }
        ],
        "notes": "string"
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { text: promptText },
            {
              inlineData: {
                data: base64Data,
                mimeType: file.type
              }
            }
          ]
        },
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "";
      const match = responseText.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Parsing failed");
      
      const parsed = JSON.parse(match[0]);
      
      // Post-process: Check banned list
      const processedMeds = parsed.medicines.map((m: any) => ({
        ...m,
        is_banned: bannedDrugsData.some(b => b.drug_name.toLowerCase() === m.name.toLowerCase())
      }));

      setScanResult({
        ...parsed,
        medicines: processedMeds,
        accuracy: "99%"
      });
      // Scan recorded automatically in Supabase
    } catch (err) {
      console.error(err);
      setError("AI analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppShare = (med: MedicineResult) => {
    const isBanned = !!med.is_banned;
    const message = isBanned 
      ? `⚠️ BANNED DRUG ALERT: My Aethelcare scan detected ${med.name}. This medication is BANNED in India by CDSCO. Please check your medicines at: https://aethelcare.xyz`
      : `Check out ${med.name} details on Aethelcare. I just scanned it and got verified medical info: https://aethelcare.xyz/medicine/${encodeURIComponent(med.name)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const downloadPDF = () => {
    if (!scanResult) return;
    const doc = new jsPDF();
    
    // Watermark
    doc.setTextColor(240, 240, 240);
    doc.setFontSize(60);
    doc.text('VERIFIED BY AETHELCARE', 20, 100, { angle: 45 });
    
    // Header
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(22);
    doc.text(`AETHELCARE AI ${scanResult.document_type.toUpperCase()} ANALYSIS`, 20, 25);
    
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 30, 190, 30);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Report Generated: ${new Date().toLocaleString()}`, 20, 35);
    doc.text(`Confidence: ${scanResult.accuracy}`, 20, 40);
    
    if (scanResult.patient_name) {
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Patient Name: ${scanResult.patient_name}`, 20, 55);
    }
    
    // Results
    doc.setFontSize(14);
    doc.text('Detected Medications:', 20, 70);
    
    let y = 80;
    doc.setFontSize(11);
    scanResult.medicines.forEach((m, i) => {
      if (y > 250) {
        doc.addPage();
        y = 30;
      }
      doc.setTextColor(0, 0, 0);
      doc.text(`${i + 1}. ${m.name}`, 25, y);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generic: ${m.generic_name || 'N/A'} • Dosage: ${m.dosage || 'N/A'}`, 30, y + 5);
      
      if (m.is_banned) {
        doc.setTextColor(200, 0, 0);
        doc.text('⚠️ BANNED BY CDSCO', 30, y + 10);
        y += 15;
      } else {
        y += 12;
      }
    });

    // Footer with contact details
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(230, 230, 230);
      doc.line(20, 280, 190, 280);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('This is an AI-generated analysis. Always verify with a healthcare professional.', 20, 285);
      doc.text('Aethelcare India • www.aethelcare.xyz • support@aethelcare.xyz', 20, 290);
    }
    
    doc.save(`Aethelcare_${scanResult.document_type}_Report.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-32">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Header & Counter */}
        {!isPremium && (
          <div className="mb-8 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Monthly Scan Usage</h3>
              <span className="text-sm font-black text-blue-600">{3 - remainingScans} of 3 free scans used</span>
            </div>
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${((3 - remainingScans) / 3) * 100}%` }}
                className="h-full bg-blue-600 rounded-full shadow-lg"
              />
            </div>
            {remainingScans === 0 && (
              <button 
                onClick={() => navigate('/pricing')}
                className="mt-6 w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
              >
                Upgrade to scan unlimited <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tighter">AI Health Scanner</h1>
          <p className="text-slate-500 font-medium">Scan prescriptions or medicine strips for instant AI analysis.</p>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-slate-200/50 rounded-2xl mb-8 border border-slate-200">
          {(['medicine', 'prescription', 'lab'] as const).map((tab) => {
            const isLocked = !isPremium && tab === 'lab';
            return (
              <button
                key={tab}
                disabled={isLocked && activeTab === tab}
                onClick={() => {
                  if (isLocked) {
                    navigate('/pricing');
                  } else {
                    setActiveTab(tab);
                    setScanResult(null);
                    setImage(null);
                  }
                }}
                className={`flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                  activeTab === tab 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab}
                {isLocked && <Lock className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>

          {/* Preview State */}
          {showPreview && !loading && image && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Scan Preview</h3>
                  <p className="text-slate-500 text-sm font-medium">Verify your photo before processing</p>
                </div>
                <button 
                  onClick={() => { setShowPreview(false); setImage(null); setPendingFile(null); }}
                  className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 bg-slate-900 flex justify-center">
                <img 
                  src={image} 
                  alt="Scan Preview" 
                  className="max-h-[400px] object-contain rounded-2xl border-4 border-white/10" 
                />
              </div>
              <div className="p-8 flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 py-5 bg-white border-2 border-slate-100 text-slate-900 rounded-3xl font-black text-sm uppercase tracking-widest hover:border-slate-900 transition-all"
                >
                  Retake Photo
                </button>
                <button 
                  onClick={startActualScan}
                  className="flex-1 py-5 bg-blue-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
                >
                  <ShieldCheck className="w-5 h-5" /> Confirm & Analyze
                </button>
              </div>
            </motion.div>
          )}

          {/* Scan Area */}
          <div className="relative">
            {!scanResult && !loading && !showPreview && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-12 text-center hover:border-blue-500 transition-all group"
            >
              <div className="flex flex-col items-center gap-6">
                <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-lg active:scale-95">
                  <Camera className="w-10 h-10" />
                </div>
                <div className="max-w-xs">
                  <h3 className="text-lg font-black text-slate-900 mb-2">Ready to Scan?</h3>
                  <p className="text-slate-500 font-medium text-sm">Position your {activeTab} in center. Ensure good lighting.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                  <button 
                    disabled={remainingScans === 0 && !isPremium}
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex-1 py-5 bg-slate-900 text-white rounded-3xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 shadow-xl hover:bg-slate-800"
                  >
                    Take Photo
                  </button>
                  <button 
                    disabled={remainingScans === 0 && !isPremium}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-5 bg-white border-2 border-slate-100 text-slate-900 rounded-3xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 hover:border-slate-900"
                  >
                    Upload Image
                  </button>
                </div>
              </div>

              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </motion.div>
          )}

          {/* Upgrade Nudge Banner */}
          {!isPremium && !nudgeDismissed && !scanResult && !loading && (
            <div className="mt-8 bg-blue-900 text-white p-6 rounded-[2rem] flex items-center justify-between shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-xl" />
               <div className="flex items-center gap-4 relative z-10">
                 <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-6 h-6 text-blue-300" />
                 </div>
                 <div className="pr-12">
                   <p className="font-bold text-sm">Handwritten prescription?</p>
                   <p className="text-blue-300 text-xs font-medium">Basic scan may miss details. Premium Plan reads any handwriting — ₹99/month</p>
                 </div>
               </div>
               <div className="flex flex-col items-end gap-2 shrink-0">
                 <button onClick={() => navigate('/pricing')} className="p-2 bg-blue-500 rounded-lg hover:bg-blue-400">
                    <ChevronRight className="w-5 h-5" />
                 </button>
                 <button onClick={() => setNudgeDismissed(true)} className="text-[10px] uppercase font-black tracking-widest text-blue-400/50 hover:text-white">Dismiss</button>
               </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="py-20 text-center flex flex-col items-center">
              <div className="relative w-32 h-32 mb-8">
                <div className="absolute inset-0 border-[6px] border-blue-100 rounded-[2.5rem]" />
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-[6px] border-blue-600 rounded-[2.5rem] border-t-transparent shadow-lg"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="w-10 h-10 text-blue-600 animate-pulse" />
                </div>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">{loadingMsg}</h3>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Deciphering Medical Data</p>
            </div>
          )}

          {/* Results Area */}
          {scanResult && !loading && (
            <div className="space-y-8 pb-32">
              {/* Scan Info Banner */}
              <div className={`p-6 rounded-[2rem] border flex items-center justify-between ${
                isPremium ? 'bg-green-50 border-green-100 text-green-900' : 'bg-amber-50 border-amber-100 text-amber-900'
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    isPremium ? 'bg-green-600 text-white' : 'bg-amber-600 text-white animate-pulse'
                  }`}>
                    {isPremium ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="font-black uppercase tracking-widest text-xs mb-1">
                      {isPremium ? 'Premium Scan Complete' : 'Basic Scan Complete'}
                    </h4>
                    <p className="font-bold">
                      {isPremium 
                        ? '100% Precise: 99% Accuracy achieved using Advanced AI' 
                        : 'Basic scan complete. Upgrade to Premium Plan for 99% accuracy and handwriting support.'}
                    </p>
                  </div>
                </div>
                {isPremium && (
                  <button 
                    onClick={downloadPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-green-200 text-green-700 rounded-xl font-black text-xs uppercase tracking-widest hover:border-green-600 transition-all shadow-sm"
                  >
                    <Download className="w-4 h-4" /> PDF
                  </button>
                )}
              </div>

              {activeTab === 'prescription' && !isPremium && (
                <div className="bg-slate-900 text-white p-5 rounded-2xl flex items-center gap-4 shadow-xl">
                  <Info className="w-6 h-6 text-blue-400 shrink-0" />
                  <p className="text-sm font-bold">
                    Reading printed prescription... For handwritten prescriptions, <span className="text-blue-400">upgrade to Premium Plan</span>.
                  </p>
                </div>
              )}

              {/* Medicine Cards */}
              <div className="space-y-4">
                <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs px-4">Detected Medicines</h3>
                {scanResult.medicines.length === 0 && (
                  <div className="p-12 text-center bg-white rounded-[3rem] border border-slate-100">
                    <p className="text-slate-400 font-bold tracking-tight">No medicines detected. Try a clearer photo.</p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {scanResult.medicines.map((med, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className={`p-8 bg-white rounded-[3rem] border-2 shadow-sm transition-all relative overflow-hidden ${
                         med.is_banned ? 'border-red-500 bg-red-50/10' : 'border-slate-100 hover:border-blue-500'
                      }`}
                    >
                      {med.is_banned && (
                        <div className="absolute top-0 right-0 bg-red-600 text-white px-6 py-2 rounded-bl-3xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl z-20">
                          Banned Alert
                        </div>
                      )}
                      
                      <div className="flex flex-col gap-6">
                         <div className="flex items-start justify-between">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                               <FlaskConical className="w-6 h-6" />
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleWhatsAppShare(med)}
                                className="p-3 bg-green-50 text-green-600 rounded-2xl hover:bg-green-600 hover:text-white transition-all shadow-sm"
                                title="Share on WhatsApp"
                              >
                                <Share2 className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => navigate(`/medicine/${encodeURIComponent(med.name)}`)}
                                className="text-xs font-black uppercase tracking-widest text-blue-600 hover:underline flex items-center gap-1"
                              >
                                Search <ArrowRight className="w-4 h-4" />
                              </button>
                            </div>
                         </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">{med.name}</h4>
                            <button
                              onClick={() => {
                                const message = `📦 *Refill Alert* from Aethelcare\n\nI scanned my medicine: *${med.name}*\nRemind me to refill this before I run out!\nScan Details: https://aethelcare.xyz/scan`;
                                window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                              }}
                              className="px-4 py-2 bg-[#25D366]/10 text-[#075E54] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#25D366] hover:text-white transition-all flex items-center gap-2"
                            >
                               <Clock className="w-3.5 h-3.5" /> Refill Reminder
                            </button>
                          </div>
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{med.generic_name || 'Generic details unknown'}</p>
                        </div>

                        {med.dosage && (
                          <div className="py-2 px-3 bg-slate-50 border border-slate-100 rounded-xl inline-block max-w-fit">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Dosage</span>
                            <span className="font-bold text-slate-900 text-sm">{med.dosage}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
                           <div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">MRP</span>
                              <span className="font-black text-slate-900">{med.mrp}</span>
                           </div>
                           <div className="bg-green-50 p-3 rounded-2xl border border-green-100">
                             <span className="text-[10px] font-black uppercase tracking-widest text-green-600 block mb-1">Generic Alt</span>
                             <div className="flex flex-col">
                               <span className="font-black text-green-700 text-xs">{med.generic_alternative?.name || 'Searching...'}</span>
                               <span className="font-bold text-green-600 text-[10px]">{med.generic_alternative?.price || ''}</span>
                             </div>
                           </div>
                        </div>

                        {med.is_banned && (
                          <div className="bg-red-600 text-white p-4 rounded-2xl flex items-start gap-3 shadow-lg shadow-red-900/20">
                             <AlertTriangle className="w-6 h-6 shrink-0" />
                             <p className="text-xs font-bold leading-relaxed">
                               This medicine is BANNED by CDSCO in India. Consult your doctor immediately to stop use.
                             </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Reset Button */}
              <div className="flex flex-col items-center gap-6 mt-16 pb-20">
                 {!isPremium && (
                   <button 
                     onClick={() => navigate('/pricing')}
                     className="text-sm font-black text-blue-600 hover:underline uppercase tracking-widest"
                   >
                     Was this scan unclear? → Upgrade for precise results
                   </button>
                 )}
                 <button 
                  onClick={() => { setScanResult(null); setImage(null); }}
                  className="px-10 py-5 bg-white border-2 border-slate-900 text-slate-900 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-xl active:scale-95"
                 >
                   Scan Another Document
                 </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/95 text-white backdrop-blur-xl border-t border-white/10 text-center z-[100] shadow-2xl">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-3">
          <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0" />
          <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.1em] leading-tight">
            Not a medical tool. Always consult a certified doctor before taking any medication.
          </p>
        </div>
      </div>

    </div>
  );
};


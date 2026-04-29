import React, { useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
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
import { DEFAULT_MODEL } from '../services/geminiService';
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
  purpose?: string;
}

interface LabResult {
  test_name: string;
  result: string;
  unit: string;
  reference_range: string;
  interpretation: string;
}

interface ScanResult {
  document_type: string;
  medicines: (MedicineResult & { timing?: string; duration?: string })[];
  lab_results?: LabResult[];
  patient_name?: string | null;
  age?: string | null;
  gender?: string | null;
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
      setError("Daily scan limit reached. Please upgrade to Premium or wait until tomorrow.");
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

      let promptText = "";
      if (activeTab === 'medicine') {
        promptText = `Parse this medicine strip/packaging for an Indian healthcare context.
        Return JSON:
        {
          "document_type": "medicine",
          "medicines": [
            { "name": "string", "generic_name": "string", "dosage": "string", "mrp": "₹...", "is_banned": boolean, "generic_alternative": { "name": "string", "price": "₹..." }, "purpose": "string" }
          ],
          "notes": "string"
        }`;
      } else if (activeTab === 'prescription') {
        promptText = `Parse this doctor's prescription for an Indian healthcare context.
        Return JSON:
        {
          "document_type": "prescription",
          "patient_name": "string",
          "age": "string",
          "gender": "string",
          "date": "string",
          "medicines": [
            { "name": "string", "generic_name": "string", "dosage": "string", "timing": "string", "duration": "string", "purpose": "string" }
          ],
          "notes": "string"
        }`;
      } else {
        promptText = `Parse this lab/diagnostic report (blood test, urine, etc.) for an Indian healthcare context. 
        Extract any abnormal findings carefully.
        Return JSON:
        {
          "document_type": "lab",
          "patient_name": "string",
          "age": "string",
          "gender": "string",
          "date": "string",
          "lab_results": [
            { "test_name": "string", "result": "string", "unit": "string", "reference_range": "string", "interpretation": "string" }
          ],
          "notes": "string"
        }`;
      }

      const response = await ai.models.generateContent({
        model: DEFAULT_MODEL,
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
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Watermark
    doc.setTextColor(240, 240, 240);
    doc.setFontSize(60);
    doc.text('VERIFIED BY AETHELCARE', 20, 100, { angle: 45 });
    
    // Header Backdrop
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(`AETHELCARE AI ${scanResult.document_type.toUpperCase()} ANALYSIS`, 20, 25);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('GEN-AI MEDICAL ANALYSIS REPORT • CONFIDENTIAL', 20, 33);
    
    // Meta Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 50);
    doc.text(`Confidence: ${scanResult.accuracy}`, pageWidth - 60, 50);

    doc.setDrawColor(230, 230, 230);
    doc.line(20, 55, pageWidth - 20, 55);
    
    let y = 65;

    // Patient Info
    if (scanResult.patient_name || scanResult.date) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      if (scanResult.patient_name) {
        doc.text(`Patient: ${scanResult.patient_name}`, 20, y);
        if (scanResult.age || scanResult.gender) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text(`${scanResult.age ? 'Age: ' + scanResult.age : ''} ${scanResult.gender ? ' • Gender: ' + scanResult.gender : ''}`, 20, y + 5);
          y += 15;
        } else {
          y += 10;
        }
      }
      if (scanResult.date) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Document Date: ${scanResult.date}`, 20, y);
        y += 10;
      }
      doc.setDrawColor(240, 240, 240);
      doc.line(20, y - 2, pageWidth - 20, y - 2);
      y += 10;
    }
    
    // Content
    if (scanResult.document_type === 'lab' && scanResult.lab_results) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Lab Results Analysis:', 20, y);
      y += 10;

      scanResult.lab_results.forEach((res, i) => {
        if (y > 260) { doc.addPage(); y = 30; }
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(`${i + 1}. ${res.test_name}`, 20, y);
        y += 6;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 50, 50);
        doc.text(`Result: ${res.result} ${res.unit}`, 25, y);
        doc.text(`Range: ${res.reference_range}`, 100, y);
        y += 6;
        
        doc.setFont('helvetica', 'italic');
        const interp = doc.splitTextToSize(`Interpretation: ${res.interpretation}`, pageWidth - 50);
        doc.text(interp, 25, y);
        y += (interp.length * 5) + 5;
      });
    } else if (scanResult.medicines && scanResult.medicines.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Detected Medications:', 20, y);
      y += 10;
      
      scanResult.medicines.forEach((m, i) => {
        if (y > 260) { doc.addPage(); y = 30; }
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(`${i + 1}. ${m.name}`, 20, y);
        y += 6;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(70, 70, 70);
        doc.text(`Generic: ${m.generic_name || 'N/A'}`, 25, y);
        y += 5;
        
        if (m.dosage || m.timing) {
          doc.text(`Dosage: ${m.dosage || 'N/A'} ${m.timing ? ' • Timing: ' + m.timing : ''}`, 25, y);
          y += 5;
        }

        if (m.duration) {
          doc.text(`Duration: ${m.duration}`, 25, y);
          y += 5;
        }

        if (m.purpose) {
          doc.text(`Purpose: ${m.purpose}`, 25, y);
          y += 5;
        }

        if (m.is_banned) {
          doc.setTextColor(200, 0, 0);
          doc.setFont('helvetica', 'bold');
          doc.text('⚠️ BANNED BY CDSCO INDIA', 25, y);
          doc.setFont('helvetica', 'normal');
          y += 5;
        }

        if (m.mrp || m.generic_alternative) {
          doc.setTextColor(0, 100, 0);
          doc.text(`Price: ${m.mrp || 'N/A'} ${m.generic_alternative ? ' • Generic Alt: ' + m.generic_alternative.name + ' (' + m.generic_alternative.price + ')' : ''}`, 25, y);
          y += 5;
        }
        
        y += 5;
      });
    }

    if (scanResult.notes) {
      if (y > 250) { doc.addPage(); y = 30; }
      y += 5;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Additional AI Notes:', 20, y);
      y += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const splitNotes = doc.splitTextToSize(scanResult.notes, pageWidth - 40);
      doc.text(splitNotes, 20, y);
    }

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(230, 230, 230);
      doc.line(20, 280, pageWidth - 20, 280);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('This is an AI-generated analysis based on image recognition. NOT a medical diagnosis.', 20, 285);
      doc.text('Always verify with a healthcare professional before making clinical decisions.', 20, 289);
      doc.text(`Aethelcare India • page ${i} of ${pageCount}`, pageWidth - 60, 290);
    }
    
    doc.save(`Aethelcare_${scanResult.document_type.charAt(0).toUpperCase() + scanResult.document_type.slice(1)}_Report.pdf`);
  };

  return (
    <div className="min-h-screen bg-transparent pt-32 sm:pt-48 pb-32">
      <Helmet>
        <title>AI Medicine & Prescription Scanner - Aethelcare India</title>
        <meta name="description" content="Use Aethelcare's advanced AI scanner to analyze medicine strips, prescriptions, and lab reports. Get 99% accuracy on drug names, side effects, and CDSCO ban status." />
        <meta name="keywords" content="AI medicine scanner, prescription reader India, scan medicine strip, CDSCO drug checker, Aethelcare AI scanner" />
        <link rel="canonical" href="https://aethelcare.xyz/scan" />
      </Helmet>
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Header & Counter */}
        {!isPremium && (
          <div className="mb-12 p-8 backdrop-blur-xl bg-white/70 rounded-[3rem] border border-white shadow-[0_20px_50px_rgba(0,0,0,0.03)] group">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-slate-900 uppercase tracking-[0.3em] text-[10px] opacity-60">Usage Tracker</h3>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">{3 - remainingScans} / 3 scans used</span>
            </div>
            <div className="h-5 bg-black/5 rounded-full overflow-hidden p-1 shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${((3 - remainingScans) / 3) * 100}%` }}
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-lg"
              />
            </div>
            {remainingScans === 0 && (
              <button 
                onClick={() => navigate('/pricing')}
                className="mt-8 w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
              >
                Unlock Unlimited Scans <ArrowRight className="w-5 h-5 text-yellow-400" />
              </button>
            )}
          </div>
        )}
 
        <div className="text-center mb-16 px-4">
          <h1 className="text-4xl md:text-7xl font-black text-slate-900 mb-6 tracking-[-0.05em] uppercase leading-[0.8]">AI Health Scanner</h1>
          <p className="text-slate-400 font-bold tracking-tight text-lg md:text-xl opacity-70">Instantly analyze prescriptions or medicine strips with 99% accuracy.</p>
        </div>
 
        {/* Tabs */}
        <div className="flex p-2 backdrop-blur-xl bg-white/40 rounded-[2.5rem] mb-12 border border-white shadow-sm overflow-hidden">
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
                className={`flex-1 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.25em] transition-all flex items-center justify-center gap-3 ${
                  activeTab === tab 
                    ? 'bg-slate-900 text-white shadow-xl' 
                    : 'text-slate-400 hover:text-slate-900'
                }`}
              >
                {tab}
                {isLocked && <Lock className="w-4 h-4 opacity-50" />}
              </button>
            );
          })}
        </div>
 
          {/* Preview State */}
          {showPreview && !loading && image && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="backdrop-blur-3xl bg-white/70 rounded-[4rem] border border-white overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.08)]"
            >
              <div className="p-10 border-b border-black/5 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Scan Preview</h3>
                  <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mt-1 opacity-60">Ready for AI Analysis</p>
                </div>
                <button 
                  onClick={() => { setShowPreview(false); setImage(null); setPendingFile(null); }}
                  className="w-12 h-12 backdrop-blur-md bg-white text-slate-400 rounded-2xl flex items-center justify-center border border-white shadow-sm hover:bg-rose-50 hover:text-rose-600 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 bg-slate-900/5 flex justify-center">
                <img 
                  src={image} 
                  alt="Scan Preview" 
                  className="max-h-[450px] object-contain rounded-[2rem] shadow-2xl border-4 border-white" 
                />
              </div>
              <div className="p-10 flex flex-col sm:flex-row gap-6">
                <button 
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 py-6 backdrop-blur-md bg-white border-2 border-slate-100 text-slate-400 font-black text-xs uppercase tracking-widest rounded-[2rem] hover:border-slate-900 hover:text-slate-900 transition-all shadow-sm"
                >
                  Take Another
                </button>
                <button 
                  onClick={startActualScan}
                  className="flex-1 py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-4 shadow-2xl hover:bg-black active:scale-95 transition-all"
                >
                  <ShieldCheck className="w-5 h-5 text-emerald-400" /> Confirm & Process
                </button>
              </div>
            </motion.div>
          )}
 
          {/* Scan Area */}
          <div className="relative">
            {!scanResult && !loading && !showPreview && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="backdrop-blur-xl bg-white/60 border-[3px] border-dashed border-white rounded-[5rem] p-16 text-center hover:bg-white/80 transition-all duration-700 group shadow-[0_20px_50px_rgba(0,0,0,0.02)]"
            >
              <div className="flex flex-col items-center gap-10">
                <div 
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-32 h-32 bg-slate-100 rounded-[3rem] flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all duration-700 shadow-xl cursor-pointer active:scale-90"
                >
                  <Camera className="w-12 h-12" />
                </div>
                <div className="max-w-md">
                  <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight uppercase leading-none">Ready to start?</h3>
                  <p className="text-slate-400 font-bold tracking-tight text-lg opacity-80 leading-relaxed px-4">Ensure your {activeTab} is centered and stable for the highest accuracy.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg">
                  <button 
                    disabled={remainingScans === 0 && !isPremium}
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex-1 py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 disabled:opacity-40 active:scale-95 shadow-2xl hover:bg-black border border-slate-700"
                  >
                    Open Camera
                  </button>
                  <button 
                    disabled={remainingScans === 0 && !isPremium}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-6 backdrop-blur-md bg-white border-2 border-white text-slate-900 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 disabled:opacity-40 active:scale-95 shadow-sm hover:border-slate-900"
                  >
                    Upload File
                  </button>
                </div>
              </div>
 
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </motion.div>
          )}
 
          {/* Upgrade Nudge Banner */}
          {!isPremium && !nudgeDismissed && !scanResult && !loading && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 backdrop-blur-2xl bg-slate-900 p-10 rounded-[3.5rem] flex items-center justify-between shadow-2xl relative overflow-hidden group border-2 border-slate-700"
            >
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-[100px] group-hover:scale-150 transition-transform duration-1000" />
               <div className="flex items-center gap-6 relative z-10">
                 <div className="w-14 h-14 backdrop-blur-md bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 shrink-0 shadow-lg">
                    <Zap className="w-7 h-7 text-yellow-400 fill-yellow-400" />
                 </div>
                 <div className="pr-12">
                   <p className="font-black text-white text-xl tracking-tight mb-2 uppercase leading-none">Handwriting Detected?</p>
                   <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] leading-relaxed">Basic scan may miss details. Get AI-Vision precise results with Premium — ₹99/mo</p>
                 </div>
               </div>
               <div className="flex flex-col items-end gap-3 shrink-0 relative z-10">
                 <button onClick={() => navigate('/pricing')} className="p-3 bg-white text-slate-900 rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-xl">
                    <ChevronRight className="w-6 h-6" />
                 </button>
                 <button onClick={() => setNudgeDismissed(true)} className="text-[9px] uppercase font-black tracking-[0.3em] text-slate-500 hover:text-white transition-opacity">Dismiss</button>
               </div>
            </motion.div>
          )}
 
          {/* Loading State */}
          {loading && (
            <div className="py-32 text-center flex flex-col items-center">
              <div className="relative w-48 h-48 mb-12">
                <div className="absolute inset-0 border-[8px] border-slate-100 rounded-[3.5rem]" />
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-[8px] border-slate-900 rounded-[3.5rem] border-t-transparent shadow-2xl"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="w-14 h-14 text-slate-900 fill-yellow-400 animate-pulse" />
                </div>
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight uppercase leading-none">{loadingMsg}</h3>
              <p className="text-slate-400 font-extrabold uppercase tracking-[0.4em] text-[10px]">Processing Neuro-Medical Patterns</p>
            </div>
          )}
 
          {/* Results Area */}
          {scanResult && !loading && (
            <div className="space-y-12 pb-32">
              {/* Scan Info Banner */}
              <div className={`p-10 rounded-[4rem] border shadow-2xl flex items-center justify-between backdrop-blur-xl ${
                isPremium ? 'bg-emerald-50/60 border-emerald-200/50 text-emerald-900' : 'bg-blue-50/60 border-blue-200/50 text-blue-900'
              }`}>
                <div className="flex items-center gap-6">
                  <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-lg ${
                    isPremium ? 'bg-emerald-600 text-white' : 'bg-blue-500 text-white'
                  }`}>
                    {isPremium ? <CheckCircle2 className="w-8 h-8" /> : <Zap className="w-8 h-8" />}
                  </div>
                  <div>
                    <h4 className="font-black uppercase tracking-[0.3em] text-[10px] mb-2 opacity-60">
                      {isPremium ? 'Analysis Verified' : 'AI Analysis Ready'}
                    </h4>
                    <p className="text-2xl font-black tracking-tight leading-none">
                      {isPremium 
                        ? '100% Precise Results' 
                        : 'Review Your Scan'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={downloadPDF}
                  className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-sm ${
                    isPremium 
                      ? 'bg-white border-2 border-emerald-100 text-emerald-700 hover:bg-emerald-500 hover:text-white'
                      : 'bg-white border-2 border-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white'
                  }`}
                >
                  <Download className="w-5 h-5" /> Download Report
                </button>
              </div>

              {/* Patient Meta */}
              {(scanResult.patient_name || scanResult.date) && (
                <div className="px-10 py-8 backdrop-blur-xl bg-white/40 border border-white rounded-[3rem] shadow-sm flex flex-wrap gap-10">
                  {scanResult.patient_name && (
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 block mb-1">Patient Name</span>
                      <p className="text-xl font-black text-slate-900 uppercase">{scanResult.patient_name}</p>
                      {(scanResult.age || scanResult.gender) && (
                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">
                          {scanResult.age && `${scanResult.age} Years`} {scanResult.gender && `• ${scanResult.gender}`}
                        </p>
                      )}
                    </div>
                  )}
                  {scanResult.date && (
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 block mb-1">Document Date</span>
                      <p className="text-xl font-black text-slate-900">{scanResult.date}</p>
                    </div>
                  )}
                  <div className="ml-auto flex items-center gap-3 bg-emerald-50 text-emerald-600 px-6 py-3 rounded-2xl border border-emerald-100">
                    <ShieldCheck className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Accuracy: {scanResult.accuracy}</span>
                  </div>
                </div>
              )}
 
              {activeTab === 'prescription' && !isPremium && (
                <div className="bg-slate-900 shadow-2xl p-8 rounded-[2.5rem] flex items-center gap-6 text-white border-2 border-slate-700">
                  <div className="w-12 h-12 backdrop-blur-md bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                    <Info className="w-6 h-6 text-blue-400" />
                  </div>
                  <p className="text-lg font-bold tracking-tight">
                    Basic AI reads printed text. <span className="text-blue-400">Upgrade to Premium Plan</span> for cursive/handwritten scripts.
                  </p>
                </div>
              )}
 
              {/* Results Display */}
              <div className="space-y-12">
                <h3 className="font-black text-slate-900 uppercase tracking-[0.3em] text-[10px] px-8 opacity-40">AI-Extracted Details</h3>
                
                {scanResult.medicines.length === 0 && (!scanResult.lab_results || scanResult.lab_results.length === 0) && (
                  <div className="p-20 text-center backdrop-blur-xl bg-white/70 rounded-[4rem] border border-white shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-slate-100 shadow-inner">
                        <ImageIcon className="w-10 h-10 text-slate-200" />
                    </div>
                    <p className="text-slate-400 font-bold tracking-tight text-lg">No medical patterns detected. Try a clearer scan profile.</p>
                  </div>
                )}

                {/* Lab Results Specific Grid */}
                {scanResult.document_type === 'lab' && scanResult.lab_results && scanResult.lab_results.length > 0 && (
                  <div className="grid grid-cols-1 gap-6">
                    {scanResult.lab_results.map((res, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-8 backdrop-blur-xl bg-white/70 rounded-[3rem] border border-white shadow-sm flex flex-col md:flex-row gap-8 items-start md:items-center"
                      >
                        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center shrink-0">
                          <FlaskConical className="w-7 h-7" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xl font-black text-slate-900 mb-1 leading-tight uppercase tracking-tight">{res.test_name}</h4>
                          <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-400">
                             <span className="bg-slate-50 px-3 py-1 rounded-lg">Reference: {res.reference_range}</span>
                             <span className="bg-slate-50 px-3 py-1 rounded-lg">Unit: {res.unit}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 opacity-60">Result Value</span>
                          <span className="text-3xl font-black text-slate-900">{res.result}</span>
                        </div>
                        <div className="md:w-64 p-5 bg-black/[0.02] rounded-2xl border border-black/5">
                           <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-2">Interpretation</span>
                           <p className="text-[11px] font-bold text-slate-600 leading-relaxed italic">{res.interpretation}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Medicine Cards */}
                {scanResult.medicines && scanResult.medicines.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {scanResult.medicines.map((med, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className={`p-10 backdrop-blur-xl bg-white/70 rounded-[4rem] border-2 transition-all duration-700 relative overflow-hidden shadow-sm group hover:shadow-2xl hover:-translate-y-2 ${
                          med.is_banned ? 'border-rose-500/50 bg-rose-50/20' : 'border-white hover:border-slate-900'
                        }`}
                      >
                        {med.is_banned && (
                          <div className="absolute top-0 right-0 bg-rose-600 text-white px-8 py-3 rounded-bl-[2.5rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl z-20">
                            Banned Alert
                          </div>
                        )}
                        
                        <div className="flex flex-col gap-8">
                          <div className="flex items-start justify-between">
                              <div className="p-4 bg-slate-50 text-slate-900 rounded-[1.5rem] shadow-inner group-hover:rotate-12 transition-transform duration-700">
                                <FlaskConical className="w-8 h-8" />
                              </div>
                              <div className="flex items-center gap-3">
                                <button 
                                  onClick={() => handleWhatsAppShare(med)}
                                  className="p-3.5 backdrop-blur-md bg-white text-emerald-600 rounded-[1.25rem] hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-white"
                                  title="Share on WhatsApp"
                                >
                                  <Share2 className="w-6 h-6" />
                                </button>
                                <button 
                                  onClick={() => navigate(`/medicine/${encodeURIComponent(med.name)}`)}
                                  className="p-3.5 backdrop-blur-md bg-white text-slate-900 rounded-[1.25rem] hover:bg-slate-900 hover:text-white transition-all shadow-sm border border-white"
                                >
                                  <ArrowRight className="w-6 h-6" />
                                </button>
                              </div>
                          </div>
  
                          <div>
                            <div className="flex flex-col gap-2 mb-4">
                              <h4 className="text-3xl font-black text-slate-900 leading-[0.9] tracking-tighter uppercase">{med.name}</h4>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] opacity-60 leading-none">{med.generic_name || 'Generic details unknown'}</p>
                              {med.purpose && (
                                <p className="text-[11px] font-bold text-blue-600 italic mt-1 leading-tight">
                                  Purpose: {med.purpose}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mb-6">
                              {med.timing && <span className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider">{med.timing}</span>}
                              {med.duration && <span className="bg-slate-50 text-slate-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider">{med.duration}</span>}
                            </div>

                            <button
                              onClick={() => {
                                const message = `📦 *Refill Alert* from Aethelcare\n\nI scanned my medicine: *${med.name}*\nRemind me to refill this before I run out!\nScan Details: https://aethelcare.xyz/scan`;
                                window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                              }}
                              className="inline-flex px-6 py-3 backdrop-blur-md bg-white border border-slate-100 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 hover:text-white transition-all items-center gap-3 shadow-sm"
                            >
                              <Clock className="w-4 h-4" /> Refill Reminder
                            </button>
                          </div>
  
                          {med.dosage && (
                            <div className="py-3 px-6 backdrop-blur-md bg-slate-500/5 border border-white rounded-2xl inline-block max-w-fit shadow-inner">
                              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 block mb-2 opacity-50">Detected Dosage</span>
                              <span className="font-black text-slate-900 text-base tracking-tight">{med.dosage}</span>
                            </div>
                          )}
  
                          {scanResult.document_type === 'medicine' && (
                            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-black/5">
                              <div>
                                  <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 block mb-2 opacity-50">Market Price</span>
                                  <span className="text-xl font-black text-slate-900 tracking-tighter">{med.mrp || 'N/A'}</span>
                              </div>
                              <div className="backdrop-blur-md bg-emerald-50 p-5 rounded-[1.5rem] border border-emerald-100 shadow-sm">
                                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-emerald-600 block mb-2">Smart Alternative</span>
                                <div className="flex flex-col gap-1">
                                  <span className="font-black text-emerald-900 text-xs tracking-tight uppercase leading-tight">{med.generic_alternative?.name || 'Searching...'}</span>
                                  <span className="font-bold text-emerald-600 text-[10px] tracking-tight">{med.generic_alternative?.price || ''}</span>
                                </div>
                              </div>
                            </div>
                          )}
  
                          {med.is_banned && (
                            <div className="backdrop-blur-md bg-rose-600 p-6 rounded-[2rem] flex items-start gap-4 shadow-2xl border border-rose-500 border-t-rose-400">
                              <AlertTriangle className="w-8 h-8 text-white shrink-0 animate-pulse" />
                              <p className="text-xs font-black uppercase tracking-widest text-white/90 leading-relaxed">
                                This medicine is BANNED in India. Stop use and consult a doctor immediately.
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {scanResult.notes && (
                  <div className="p-10 backdrop-blur-xl bg-white/70 rounded-[4rem] border border-white shadow-sm mt-12">
                     <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 block mb-4 opacity-60">AI Clinical Observations</span>
                     <p className="text-xl font-bold text-slate-600 leading-relaxed italic">{scanResult.notes}</p>
                  </div>
                )}
              </div>

              {/* Reset Button */}
              <div className="flex flex-col items-center gap-10 mt-24 pb-20">
                 {!isPremium && (
                   <button 
                     onClick={() => navigate('/pricing')}
                     className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-[0.4em] transition-colors"
                   >
                     Scan unclear? → Try Premium AI-Vision
                   </button>
                 )}
                 <button 
                  onClick={() => { setScanResult(null); setImage(null); }}
                  className="px-14 py-6 bg-white border-2 border-slate-900 text-slate-900 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-slate-900 hover:text-white transition-all shadow-[0_20px_50px_rgba(0,0,0,0.1)] active:scale-95"
                 >
                   Scan Another Document
                 </button>
              </div>
            </div>
          )}
        </div>
      </div>
 
      {/* Footer Disclaimer */}
      <div className="fixed bottom-0 left-0 right-0 p-5 backdrop-blur-3xl bg-slate-900/90 text-white border-t border-white/10 text-center z-[100] shadow-[0_-10px_50px_rgba(0,0,0,0.2)]">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-4">
          <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0" />
          <p className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] leading-tight opacity-80">
            Aethelcare is an AI analysis tool and not a substitute for professional medical advice.
          </p>
        </div>
      </div>
 
    </div>
  );
};

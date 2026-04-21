import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { Medicine } from '../types';
import { Share2, Download, ShieldAlert } from 'lucide-react';

interface ShareCardProps {
  medicines: any[]; // Using any to match existing schemas from Gemini depending on where it's used
  patientName?: string;
  date?: string;
  language: string;
}

export const ShareCard: React.FC<ShareCardProps> = ({ medicines, patientName, date, language }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateImage = async (): Promise<string | null> => {
    if (!cardRef.current) return null;
    try {
      setIsGenerating(true);
      const canvas = await html2canvas(cardRef.current, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Failed to generate image', error);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleWhatsAppShare = async () => {
    const dataUrl = await generateImage();
    if (!dataUrl) return;
    
    // For WhatsApp web/mobile, sharing a data URL direct via intent is tricky.
    // In a real app we'd upload to a bucket and share the URL. 
    // Here we can trigger a download and prompt them to share.
    const link = document.createElement('a');
    link.download = `Aethelcare-Summary-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
    
    // Fallback: Web Share API if supported (often works better on mobile for files)
    if (navigator.share) {
      try {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], 'prescription.png', { type: 'image/png' });
        await navigator.share({
          title: 'My Prescription Summary',
          text: 'Here is my medicine summary safely decoded by Aethelcare.',
          files: [file],
        });
      } catch (e) {
        console.log('Web share failed or cancelled');
      }
    }
  };

  return (
    <div className="w-full mt-8 flex flex-col items-center">
      <button
        onClick={handleWhatsAppShare}
        disabled={isGenerating}
        className="mb-8 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-sm disabled:opacity-50 transition-colors"
      >
        <Share2 className="w-5 h-5" />
        {isGenerating ? 'Generating Card...' : 'Share to WhatsApp'}
      </button>

      {/* Hidden container for the screenshot (offscreen but rendered) */}
      <div className="absolute left-[-9999px] top-[-9999px]">
        <div 
          ref={cardRef} 
          className="w-[600px] bg-white p-8 font-sans border-t-8 border-indigo-600 shadow-xl"
          style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '20px 20px' }}
        >
          <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-100">
            <div>
              <h2 className="text-2xl font-black text-indigo-900 tracking-tight">Aethelcare</h2>
              <p className="text-gray-500 font-medium text-sm">Automated Prescription Analysis</p>
            </div>
            <div className="text-right">
              {patientName && <p className="font-bold text-gray-900 text-lg">{patientName}</p>}
              <p className="text-gray-500 font-medium">{date || new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            {medicines.map((med, idx) => (
              <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 text-lg">{med.name}</h3>
                  <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-3 py-1 rounded-full">{med.timing}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 block text-xs font-semibold uppercase tracking-wider mb-1">Dosage</span>
                    <span className="font-medium text-gray-900">{med.dosage}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs font-semibold uppercase tracking-wider mb-1">Duration</span>
                    <span className="font-medium text-gray-900">{med.duration || 'Not specified'}</span>
                  </div>
                </div>
                {med.what_it_does && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-gray-600 text-sm">{med.what_it_does}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-400 text-sm font-medium flex items-center justify-center gap-2">
              <ShieldAlert className="w-4 h-4" /> Not a substitute for professional medical advice.
            </p>
            <p className="text-indigo-600 font-bold mt-2">aethelcare.in</p>
          </div>
        </div>
      </div>
    </div>
  );
};

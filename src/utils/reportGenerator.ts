import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ReportData {
  userName: string;
  userEmail: string;
  reportType: 'medicine' | 'prescription' | 'lab';
  date: string;
  title: string;
  details: any;
}

export const generateMedReport = async (data: ReportData) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 1. Header & Backdrop
  doc.setFillColor(0, 0, 0); // Black header
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('AethelCare', 20, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('GEN-AI MEDICAL ANALYSIS REPORT', 20, 30);

  // 2. User Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Patient: ${data.userName}`, 20, 55);
  doc.setFont('helvetica', 'normal');
  doc.text(`Email: ${data.userEmail}`, 20, 62);
  doc.text(`Date: ${data.date}`, pageWidth - 70, 55);

  // 3. Document Title
  doc.setDrawColor(230, 230, 230);
  doc.line(20, 70, pageWidth - 20, 70);
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(data.title.toUpperCase(), 20, 85);

  // 4. Content Area
  let yPos = 100;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  if (data.reportType === 'medicine') {
    const med = data.details;
    doc.setFont('helvetica', 'bold');
    doc.text('Identification Summary:', 20, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    const splitDesc = doc.splitTextToSize(med.description, pageWidth - 40);
    doc.text(splitDesc, 20, yPos);
    yPos += (splitDesc.length * 6) + 10;

    doc.setFont('helvetica', 'bold');
    doc.text('Confidence Score:', 20, yPos);
    doc.text(`${med.confidence}%`, 60, yPos);
    yPos += 15;
  } 
  else if (data.reportType === 'prescription') {
    const results = data.details;
    results.medicines.forEach((med: any, i: number) => {
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.text(`${i + 1}. ${med.name} - ${med.dosage}`, 20, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      doc.text(`Timing: ${med.timing}`, 25, yPos);
      yPos += 5;
      doc.text(`Duration: ${med.duration}`, 25, yPos);
      yPos += 5;
      doc.text(`Purpose: ${med.purpose}`, 25, yPos);
      yPos += 10;
    });

    if (results.doctorNotes) {
      yPos += 5;
      doc.setFont('helvetica', 'bold');
      doc.text('Doctor Notes:', 20, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      const splitNotes = doc.splitTextToSize(results.doctorNotes, pageWidth - 40);
      doc.text(splitNotes, 20, yPos);
    }
  }
  else if (data.reportType === 'lab') {
    const report = data.details;
    doc.setFont('helvetica', 'bold');
    doc.text('Report Analysis Summary:', 20, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    const splitSummary = doc.splitTextToSize(report.summary, pageWidth - 40);
    doc.text(splitSummary, 20, yPos);
    yPos += (splitSummary.length * 6) + 15;

    if (report.abnormalFindings.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(180, 0, 0);
      doc.text('ABNORMAL FINDINGS DETECTED:', 20, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 10;
      
      report.abnormalFindings.forEach((finding: any) => {
        if (yPos > pageHeight - 40) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont('helvetica', 'bold');
        doc.text(finding.testName, 20, yPos);
        doc.text(finding.interpretation, pageWidth - 60, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        doc.text(`Result: ${finding.result} | Normal: ${finding.normalRange}`, 20, yPos);
        yPos += 12;
      });
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 150, 0);
      doc.text('ALL TEST PARAMETERS WITHIN NORMAL RANGE.', 20, yPos);
      doc.setTextColor(0, 0, 0);
    }
  }

  // 5. Watermark & Security
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  const watermarkText = 'This report is AI-generated for informational purposes. Always consult a licensed medical professional for clinical diagnosis.';
  const splitWatermark = doc.splitTextToSize(watermarkText, pageWidth - 40);
  doc.text(splitWatermark, pageWidth / 2, pageHeight - 20, { align: 'center' });

  // 6. QR Code (Footer)
  const qrColor = data.reportType === 'lab' ? 'blue' : 'black';
  try {
    const qrUrl = `https://chart.googleapis.com/chart?chs=150x150&cht=qr&chl=${encodeURIComponent(window.location.origin)}&choe=UTF-8`;
    doc.addImage(qrUrl, 'PNG', pageWidth - 45, pageHeight - 50, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('SCAN TO VERIFY', pageWidth - 30, pageHeight - 15, { align: 'center' });
  } catch (e) {
    console.warn('QR Code generation failed');
  }

  // 7. Footer Meta
  doc.setFontSize(8);
  doc.text(`Page 1 of 1`, pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Save the PDF
  doc.save(`AethelCare_Report_${data.userName.replace(/\s+/g, '_')}_${data.reportType}.pdf`);
};

/**
 * EnglishCertificate.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Printable single-page English proficiency certificate as responsive React component.
 * Format: A4 landscape (297x210 mm), print-friendly, white page background.
 * Color palette: purple-to-blue gradients (#6D28D9 → #2563EB), dark navy (#1E1B4B).
 * All default values stored in CERTIFICATE_DEFAULT_DATA at the top.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useMemo, useState } from 'react';
import { Printer, X, Download, Loader2 } from 'lucide-react';

/* ==========================================================================
   Client-side High-Resolution PDF Generator (Uses html2canvas-pro + jsPDF)
   ========================================================================== */
export async function downloadCertificatePdf(elementOrId, filename = 'venoxa-english-certificate.pdf') {
  const el = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
  if (!el) throw new Error('Certificate DOM element not found');

  const { jsPDF } = await import('jspdf');
  const html2canvas = (await import('html2canvas-pro')).default;

  const canvas = await html2canvas(el, {
    scale: 2.5, // 300DPI crisp print resolution
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: 1200,
  });

  const imgData = canvas.toDataURL('image/png', 1.0);
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  pdf.addImage(imgData, 'PNG', 0, 0, 297, 210, undefined, 'FAST');
  const blob = pdf.output('blob');
  if (!blob || blob.size < 1000) {
    throw new Error('PDF output is empty or failed');
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 2000);
  return true;
}

/* ==========================================================================
   1. CERTIFICATE CONFIGURATION DATA (Stored in ONE JS/JSON Object at the top)
   ========================================================================== */
export const CERTIFICATE_DEFAULT_DATA = {
  brandName: "Venoxa AI",
  candidateName: "ABDELGHANI NOUAYTI",
  certificateId: "VX-2025-883921",
  certificateUrl: "cert.example.com/VX-2025-883921",
  awardedDate: "11 Dec 2025",
  overallScore: 41,
  overallLevel: "B1 Intermediate",
  skills: {
    reading:   { name: "Reading",   level: "A2 Elementary",   score: 33 },
    listening: { name: "Listening", level: "A2 Elementary",   score: 36 },
    writing:   { name: "Writing",   level: "B1 Intermediate", score: 45 },
    speaking:  { name: "Speaking",  level: "B1 Intermediate", score: 50 },
  }
};

/* 7 CEFR Segments Scale */
export const CEFR_SCALE = [
  { min: 0,  max: 20,  cefr: "A0", title: "Novice",            bg: "#EDE9FE" },
  { min: 21, max: 30,  cefr: "A1", title: "Beginner",          bg: "#DDD6FE" },
  { min: 31, max: 40,  cefr: "A2", title: "Elementary",        bg: "#C4B5FD" },
  { min: 41, max: 50,  cefr: "B1", title: "Intermediate",      bg: "#A78BFA" },
  { min: 51, max: 60,  cefr: "B2", title: "Upper Intermediate",bg: "#60A5FA" },
  { min: 61, max: 70,  cefr: "C1", title: "Advanced",          bg: "#3B82F6" },
  { min: 71, max: 100, cefr: "C2", title: "Proficient",        bg: "#1D4ED8" },
];

export default function EnglishCertificate({
  data = CERTIFICATE_DEFAULT_DATA,
  onClose,
  onDownloadPdf,
  showActions = true,
}) {
  const [isExporting, setIsExporting] = useState(false);

  const cert = useMemo(() => ({
    ...CERTIFICATE_DEFAULT_DATA,
    ...data,
    skills: {
      ...CERTIFICATE_DEFAULT_DATA.skills,
      ...(data?.skills || {})
    }
  }), [data]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      if (onDownloadPdf) {
        await onDownloadPdf();
      } else {
        await downloadCertificatePdf('venoxa-certificate-sheet', `venoxa-certificate-${cert.certificateId || 'download'}.pdf`);
      }
    } catch (err) {
      console.warn('PDF export error, falling back to client renderer:', err);
      try {
        await downloadCertificatePdf('venoxa-certificate-sheet', `venoxa-certificate-${cert.certificateId || 'download'}.pdf`);
      } catch (err2) {
        console.error('Download PDF error:', err2);
        window.print();
      }
    } finally {
      setIsExporting(false);
    }
  };

  const skillEntries = Object.entries(cert.skills);

  return (
    <div className="flex flex-col items-center">
      {/* Action bar (screen only) */}
      {showActions && (
        <div className="flex items-center justify-between gap-4 w-full max-w-[297mm] mb-4 print:hidden px-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white bg-gradient-to-r from-[#6D28D9] to-[#2563EB] shadow-md hover:opacity-95 transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print / Save as PDF
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-gray-700 bg-white border border-gray-300 shadow-sm hover:bg-gray-50 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin text-purple-600" /> : <Download className="w-4 h-4" />}
              {isExporting ? 'Generating PDF…' : 'Download PDF'}
            </button>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-black/10 text-gray-600 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* A4 Landscape Certificate Sheet */}
      <div
        id="venoxa-certificate-sheet"
        className="cert-page relative bg-white text-[#1E1B4B] shadow-2xl overflow-hidden flex flex-col justify-between"
        style={{
          width: '297mm',
          height: '210mm',
          padding: '14mm 16mm 12mm 16mm',
          boxSizing: 'border-box',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
        }}
      >
        {/* Top gradient stripe */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{ background: 'linear-gradient(135deg, #6D28D9 0%, #2563EB 100%)' }}
        />

        {/* Outer subtle frame */}
        <div className="absolute inset-[8mm] border border-[#6D28D9]/15 rounded-xl pointer-events-none" />

        {/* 1. HEADER */}
        <header className="flex justify-between items-center relative z-10">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-base shadow-sm"
              style={{ background: 'linear-gradient(135deg, #6D28D9 0%, #2563EB 100%)' }}
            >
              {cert.brandName.charAt(0)}
            </div>
            <span className="font-extrabold text-base tracking-wide text-[#1E1B4B]">
              {cert.brandName}
            </span>
          </div>
          <div className="text-[11px] font-mono text-gray-500 tracking-tight">
            {cert.certificateUrl}
          </div>
        </header>

        {/* 2. TITLE BLOCK */}
        <div className="text-center relative z-10 mt-1">
          <div className="text-[11px] font-extrabold uppercase tracking-[3px] text-[#6D28D9] mb-1">
            English Certificate
          </div>
          <h1 className="text-[26px] font-black uppercase text-[#1E1B4B] tracking-tight leading-tight mb-1">
            {cert.candidateName}
          </h1>
          <p className="text-[11.5px] text-gray-500 font-medium">
            has successfully completed the English Level Test and has earned level:
          </p>
        </div>

        {/* 3. MAIN RESULT PANEL */}
        <div className="flex justify-center relative z-10 my-1">
          <div
            className="text-white text-center py-3 px-12 rounded-2xl shadow-lg min-w-[260px]"
            style={{ background: 'linear-gradient(135deg, #6D28D9 0%, #2563EB 100%)' }}
          >
            <div className="text-4xl font-black leading-none tracking-tight">
              {cert.overallScore}/100
            </div>
            <div className="text-[13px] font-bold uppercase tracking-wider opacity-95 mt-1">
              {cert.overallLevel}
            </div>
          </div>
        </div>

        {/* 4. SCORE SCALE BAR */}
        <div className="w-full relative z-10 my-1">
          <div className="text-[10.5px] font-bold uppercase tracking-wider text-gray-400 text-center mb-3">
            Understanding the results
          </div>
          <div className="grid grid-cols-7 gap-1 items-end">
            {CEFR_SCALE.map((seg, idx) => {
              const isHighlighted = cert.overallScore >= seg.min && cert.overallScore <= seg.max;
              return (
                <div key={idx} className="flex flex-col items-center relative">
                  {/* Pin marker */}
                  {isHighlighted && (
                    <div
                      className="absolute -top-3 w-0 h-0"
                      style={{
                        borderLeft: '5px solid transparent',
                        borderRight: '5px solid transparent',
                        borderTop: '6px solid #6D28D9',
                      }}
                    />
                  )}
                  <span
                    className={`text-[9.5px] font-bold mb-1 transition-colors ${
                      isHighlighted ? 'text-[#6D28D9] font-extrabold text-[10.5px]' : 'text-gray-500'
                    }`}
                  >
                    {seg.min}-{seg.max}
                  </span>
                  <div
                    className={`w-full rounded transition-all ${isHighlighted ? 'h-5 rounded-md shadow-md' : 'h-3.5'}`}
                    style={{
                      background: isHighlighted
                        ? 'linear-gradient(135deg, #6D28D9 0%, #2563EB 100%)'
                        : seg.bg,
                    }}
                  />
                  <span
                    className={`text-[9.5px] text-center whitespace-nowrap mt-1 ${
                      isHighlighted ? 'text-[#1E1B4B] font-extrabold text-[10.5px]' : 'text-gray-500 font-semibold'
                    }`}
                  >
                    {seg.cefr} {seg.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. EXPLANATION TEXT */}
        <p className="text-center text-[10.5px] text-gray-500 leading-relaxed max-w-3xl mx-auto relative z-10 my-0.5">
          The achieved level is {cert.overallScore}/100 on the score scale and {cert.overallLevel} according to the Common European Framework of Reference (CEFR). The overall score is calculated as an average of the skill section scores.
        </p>

        {/* 6. SKILL BREAKDOWN */}
        <div className="relative z-10">
          <div className="grid grid-cols-4 gap-3 my-1">
            {skillEntries.map(([key, s]) => (
              <div
                key={key}
                className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-2.5 px-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className="text-xs font-extrabold text-[#1E1B4B]">{s.name}</span>
                    <span className="text-sm font-black text-[#2563EB]">{s.score}</span>
                  </div>
                  <div className="text-[9.5px] font-semibold text-gray-500 mb-1.5">{s.level}</div>
                </div>
                <div className="w-full h-1 bg-[#E5E7EB] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(0, Math.min(100, s.score))}%`,
                      background: 'linear-gradient(135deg, #6D28D9 0%, #2563EB 100%)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Summary Row */}
          <div className="text-center text-[10.5px] font-bold text-[#1E1B4B] bg-[#6D28D9]/5 py-1.5 px-3 rounded-lg mt-1">
            {skillEntries.map(([_, s]) => `${s.score}`).join('  |  ')} &nbsp;→&nbsp;{' '}
            <span className="text-[#2563EB] font-black">
              {cert.overallScore}/100, {cert.overallLevel}
            </span>
          </div>
        </div>

        {/* 7. FOOTER */}
        <div className="relative z-10">
          <div
            className="w-full h-px my-1.5"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(109, 40, 217, 0.25), transparent)',
            }}
          />
          <footer className="flex justify-between items-center text-[10px] text-gray-500 font-semibold">
            <div>Awarded on: {cert.awardedDate}</div>
            <div className="font-mono text-gray-600">{cert.certificateUrl}</div>
          </footer>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: A4 landscape;
          margin: 0;
        }
        @media print {
          body {
            background-color: #fff !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .cert-page {
            box-shadow: none !important;
            width: 297mm !important;
            height: 210mm !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
            margin: 0 auto !important;
          }
        }
      ` }} />
    </div>
  );
}

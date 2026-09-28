import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Smartphone } from 'lucide-react';

interface ScannableQRCodeProps {
  value: string;
  size?: number;
  className?: string;
  showScanHint?: boolean;
  darkColor?: string;
  lightColor?: string;
}

export const ScannableQRCode: React.FC<ScannableQRCodeProps> = ({
  value,
  size = 120,
  className = '',
  showScanHint = false,
  darkColor = '#0f172a',
  lightColor = '#ffffff'
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!value) return;

    QRCode.toDataURL(value, {
      width: size * 2, // 2x for sharp retina rendering
      margin: 1,
      color: {
        dark: darkColor,
        light: lightColor
      },
      errorCorrectionLevel: 'M'
    })
      .then(url => {
        setDataUrl(url);
        setError(null);
      })
      .catch(err => {
        console.error('QR generation error:', err);
        setError('Failed to generate QR');
      });
  }, [value, size, darkColor, lightColor]);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `3D-ULPIN-QR-${Date.now()}.png`;
    a.click();
  };

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-red-50 text-red-600 text-[10px] p-2 rounded-lg ${className}`}>
        {error}
      </div>
    );
  }

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`bg-slate-100 animate-pulse rounded-lg flex items-center justify-center ${className}`}
      >
        <Smartphone className="w-5 h-5 text-slate-400" />
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <div className="relative group p-1.5 bg-white rounded-xl shadow-sm border border-slate-200/90 transition-transform hover:scale-[1.02]">
        <img
          src={dataUrl}
          alt={`Scannable QR Code for ${value}`}
          style={{ width: size, height: size }}
          className="rounded-lg object-contain block"
        />

        {/* Quick Download Overlay on Hover */}
        <button
          onClick={handleDownload}
          className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex flex-col items-center justify-center text-white gap-1 print:hidden cursor-pointer"
          title="Download Scannable QR PNG"
        >
          <Download className="w-4 h-4 text-cyan-300" />
          <span className="text-[9px] font-bold">Download</span>
        </button>
      </div>

      {showScanHint && (
        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium mt-1">
          <Smartphone className="w-3 h-3 text-blue-600 shrink-0" />
          <span>Scan with phone camera</span>
        </div>
      )}
    </div>
  );
};

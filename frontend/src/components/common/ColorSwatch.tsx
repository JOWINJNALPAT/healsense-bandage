import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface ColorSwatchProps {
  hex: string;
  rgb?: [number, number, number];
  lab?: [number, number, number];
  hsv?: [number, number, number];
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export const ColorSwatch: React.FC<ColorSwatchProps> = ({
  hex,
  rgb,
  lab,
  hsv,
  label,
  size = 'md',
  showDetails = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const swatchSizes = {
    sm: 'w-6 h-6 rounded-md',
    md: 'w-10 h-10 rounded-lg shadow-inner',
    lg: 'w-16 h-16 rounded-xl shadow-md',
  };

  return (
    <div className="flex items-center gap-3">
      <div
        className={`${swatchSizes[size]} flex-shrink-0 border border-slate-300 relative transition-transform hover:scale-105`}
        style={{ backgroundColor: hex }}
      />
      <div>
        <div className="flex items-center gap-2">
          {label && <span className="text-xs font-semibold text-slate-800">{label}</span>}
          <button
            onClick={() => handleCopy(hex)}
            className="inline-flex items-center gap-1 font-mono text-xs font-medium text-slate-600 hover:text-teal-700 bg-slate-100 hover:bg-teal-50 px-1.5 py-0.5 rounded border border-slate-200 transition-colors"
            title="Click to copy Hex"
          >
            {hex}
            {copied ? <Check className="w-3 h-3 text-teal-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
          </button>
        </div>

        {showDetails && (
          <div className="text-[11px] text-slate-500 font-mono mt-0.5 space-x-2">
            {rgb && <span>RGB: ({rgb[0]}, {rgb[1]}, {rgb[2]})</span>}
            {lab && <span>LAB: [{lab[0]}, {lab[1]}, {lab[2]}]</span>}
            {hsv && <span>HSV: [{hsv[0]}°, {hsv[1]}%, {hsv[2]}%]</span>}
          </div>
        )}
      </div>
    </div>
  );
};

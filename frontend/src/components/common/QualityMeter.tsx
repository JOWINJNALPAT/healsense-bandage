import React from 'react';
import { QualityStatus, QualityDetails } from '../../types';
import { Check, AlertCircle, Sparkles } from 'lucide-react';

interface QualityMeterProps {
  score: number;
  status: QualityStatus;
  details?: QualityDetails;
  showDetails?: boolean;
}

export const QualityMeter: React.FC<QualityMeterProps> = ({
  score,
  status,
  details,
  showDetails = false,
}) => {
  const getBarColor = () => {
    if (score >= 75) return 'bg-teal-600';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getStatusBadge = () => {
    if (status === 'OPTIMAL') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
          <Sparkles className="w-3 h-3 text-teal-600" /> Optimal
        </span>
      );
    }
    if (status === 'ACCEPTABLE') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
          <Check className="w-3 h-3 text-amber-600" /> Acceptable
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
        <AlertCircle className="w-3 h-3 text-rose-600" /> Insufficient Quality
      </span>
    );
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-600 font-medium">Image Quality Score:</span>
        <div className="flex items-center gap-2">
          <span className="font-bold text-navy-900">{score}/100</span>
          {getStatusBadge()}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/80">
        <div
          className={`h-full transition-all duration-500 rounded-full ${getBarColor()}`}
          style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
        />
      </div>

      {showDetails && details && (
        <div className="pt-2 text-xs grid grid-cols-3 gap-2 text-slate-500 border-t border-slate-100 mt-2">
          <div>
            <span className="block text-slate-400">Blur Var:</span>
            <span className="font-semibold text-slate-700">{details.laplacian_blur_var ?? 'N/A'}</span>
          </div>
          <div>
            <span className="block text-slate-400">Contrast Std:</span>
            <span className="font-semibold text-slate-700">{details.contrast_std ?? 'N/A'}</span>
          </div>
          <div>
            <span className="block text-slate-400">Glare:</span>
            <span className="font-semibold text-slate-700">{details.glare_percent ?? 0}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

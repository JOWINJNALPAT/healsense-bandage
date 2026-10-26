import React from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon, HelpCircle } from 'lucide-react';
import { StatusCategory } from '../../types';

interface StatusBadgeProps {
  status: StatusCategory | 'NO_SCANS' | string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showIcon = true,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  switch (status) {
    case 'GREEN':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 ${sizeClasses[size]}`}
          title="Colorimetric indicators within configured reference range. Note: Does not exclude infection."
        >
          {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />}
          Within Reference Range
        </span>
      );

    case 'AMBER':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 ${sizeClasses[size]}`}
          title="Measured color is outside configured target range. Clinician review recommended."
        >
          {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />}
          Needs Review / Outside Range
        </span>
      );

    case 'RED':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-rose-50 text-rose-800 border border-rose-200/80 ${sizeClasses[size]}`}
          title="Priority clinical review: Significant pH or color shift flagged by prototype rule."
        >
          {showIcon && <AlertOctagon className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />}
          Priority Clinical Review
        </span>
      );

    case 'GRAY':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses[size]}`}
          title="Insufficient image quality or uncalibrated profile."
        >
          {showIcon && <HelpCircle className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />}
          Insufficient Quality / Uncalibrated
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center rounded-full bg-slate-100 text-slate-600 border border-slate-200 ${sizeClasses[size]}`}
        >
          No Scans Recorded
        </span>
      );
  }
};

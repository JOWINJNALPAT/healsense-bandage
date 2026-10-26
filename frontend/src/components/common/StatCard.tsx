import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'teal' | 'amber' | 'rose' | 'slate';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  onClick,
}) => {
  const variantStyles = {
    default: {
      border: 'border-slate-200/80',
      iconBg: 'bg-navy-50 text-navy-800',
    },
    teal: {
      border: 'border-teal-200/80',
      iconBg: 'bg-teal-50 text-teal-700',
    },
    amber: {
      border: 'border-amber-200/80',
      iconBg: 'bg-amber-50 text-amber-700',
    },
    rose: {
      border: 'border-rose-200/80',
      iconBg: 'bg-rose-50 text-rose-700',
    },
    slate: {
      border: 'border-slate-200/80',
      iconBg: 'bg-slate-100 text-slate-600',
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-5 border ${style.border} shadow-sm transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-navy-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${style.iconBg} flex-shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

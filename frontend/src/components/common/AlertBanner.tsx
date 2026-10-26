import React from 'react';
import { AlertCircle, ShieldAlert, Info, X } from 'lucide-react';

interface AlertBannerProps {
  type?: 'safety' | 'warning' | 'info';
  title?: string;
  message?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  children?: React.ReactNode;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  type = 'safety',
  title,
  message,
  dismissible = false,
  onDismiss,
  children,
}) => {
  const styles = {
    safety: {
      bg: 'bg-amber-50/90',
      border: 'border-amber-200',
      text: 'text-amber-900',
      icon: <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />,
    },
    warning: {
      bg: 'bg-rose-50/90',
      border: 'border-rose-200',
      text: 'text-rose-900',
      icon: <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />,
    },
    info: {
      bg: 'bg-teal-50/90',
      border: 'border-teal-200',
      text: 'text-teal-900',
      icon: <Info className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />,
    },
  };

  const current = styles[type];

  return (
    <div className={`rounded-xl border p-4 ${current.bg} ${current.border} shadow-sm`}>
      <div className="flex items-start gap-3">
        {current.icon}
        <div className="flex-1 text-xs leading-relaxed">
          {title && <p className={`font-bold ${current.text} text-sm mb-0.5`}>{title}</p>}
          {message && <p className={`${current.text}`}>{message}</p>}
          {children}
        </div>
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

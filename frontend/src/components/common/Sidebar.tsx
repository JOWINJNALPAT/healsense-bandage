import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Camera,
  ClipboardCheck,
  Sliders,
  FileSpreadsheet,
  ShieldAlert,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Patients', path: '/patients', icon: Users },
    { label: 'New Scan', path: '/scan/new', icon: Camera, highlight: true },
    { label: 'Review Queue', path: '/reviews', icon: ClipboardCheck },
    { label: 'Calibration', path: '/calibration', icon: Sliders },
    { label: 'Reports & Export', path: '/reports', icon: FileSpreadsheet },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-navy-950/70 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-navy-900 text-slate-300 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 border-r border-navy-800 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 space-y-1">
          <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Clinical Operations
          </p>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-teal-600 text-white shadow-sm shadow-teal-500/20 font-semibold'
                        : item.highlight
                        ? 'text-teal-300 hover:bg-navy-800 hover:text-white'
                        : 'text-slate-300 hover:bg-navy-800 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Prototype Safety Notice in Sidebar */}
        <div className="p-4 m-3 rounded-xl bg-navy-950 border border-navy-800/80 text-xs">
          <div className="flex items-center gap-2 text-amber-400 font-semibold mb-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Safety Disclaimer</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            HealSense is a research prototype. Color analysis and pH estimation do not diagnose infection. Clinical assessment required.
          </p>
        </div>
      </aside>
    </>
  );
};

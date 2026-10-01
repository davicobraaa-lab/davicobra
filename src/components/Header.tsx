import React, { useState, useEffect } from 'react';
import { 
  Laptop, 
  Smartphone, 
  HelpCircle, 
  Bell, 
  GitBranch, 
  Layers,
  Database,
  CheckCircle2,
  RefreshCw,
  Sun,
  Moon,
  Download,
  Settings,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  LogOut
} from 'lucide-react';
import { UserRole, ThemeMode, UserAccount } from '../types/pusri';
import { PusriLogo } from './PusriLogo';

interface HeaderProps {
  currentRole: UserRole;
  currentUser?: UserAccount | null;
  onLogout: (roleToSelect?: UserRole) => void;
  onRoleChange: (role: UserRole) => void;
  viewMode: 'laptop' | 'mobile';
  onViewModeChange: (mode: 'laptop' | 'mobile') => void;
  onOpenSop: () => void;
  onOpenSyncConsole: () => void;
  syncPulse: boolean;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onDownloadSql: () => void;
  onNavigateSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  currentUser,
  onLogout,
  onRoleChange,
  viewMode,
  onViewModeChange,
  onOpenSop,
  onOpenSyncConsole,
  syncPulse,
  theme,
  onToggleTheme,
  onDownloadSql,
  onNavigateSettings
}) => {
  const [timeStr, setTimeStr] = useState('23 September 2026 12:35:40');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      const day = now.getDate();
      const month = months[now.getMonth()];
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');
      setTimeStr(`${day} ${month} ${year} ${hours}:${mins}:${secs}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getInitials = () => {
    if (currentUser?.nama) {
      const parts = currentUser.nama.split(' ').filter(Boolean);
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return currentUser.nama.slice(0, 2).toUpperCase();
    }
    if (currentRole === 'Admin') return 'DA';
    if (currentRole === 'Atasan / VP') return 'MD';
    return 'FA';
  };

  const getProfileTitle = () => {
    if (currentUser?.nama) return `${currentUser.nama} (${currentUser.badge ? `Badge ${currentUser.badge} - ` : ''}${currentUser.role})`;
    if (currentRole === 'Admin') return 'DAFFA ARI PRASETYA (Badge 0952 - Admin)';
    if (currentRole === 'Atasan / VP') return 'M DAVI RAMADHAN (Badge 0951 - VP)';
    return 'FAUZAN AL GHANIYYU (Badge 0953 - Unit Kerja)';
  };

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-wrap items-center justify-between gap-3 transition-colors">
      {/* Left zone: Brand + Role Selector + Alur Proses */}
      <div className="flex items-center gap-3 md:gap-4 flex-wrap">
        {/* Brand Lockup with Official Pusri Logo */}
        <div className="flex items-center gap-2.5">
          <PusriLogo className="h-9 w-auto" />
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-extrabold text-slate-900 dark:text-white tracking-tight text-base font-sans">
                PORTAL RISIKO
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-100 dark:bg-yellow-950/60 text-amber-900 dark:text-yellow-200 tracking-wide uppercase border border-yellow-300 dark:border-yellow-800">
                PUSRI
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-0.5">
              PT Pupuk Sriwidjaja Palembang
            </p>
          </div>
        </div>

        {/* Layout icon divider */}
        <div className="hidden lg:block text-slate-300 dark:text-slate-700">
          <Layers className="w-4 h-4 text-slate-400 dark:text-slate-600" />
        </div>

        {/* Single Authoritative Role Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 rounded-xl text-xs">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Role:</span>
          <span className="font-bold text-[#009fe3] dark:text-sky-300 font-mono">
            {currentRole}
          </span>
        </div>
      </div>

      {/* Right zone: MySQL Button (Admin Only), Theme Toggle, Viewport, Clock, Settings, Profile */}
      <div className="flex items-center gap-2 flex-wrap">
        
        {/* Single Simple MySQL Button (Admin Only) */}
        {currentRole === 'Admin' && (
          <button
            onClick={onDownloadSql}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-900 dark:text-sky-200 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800 rounded-xl transition-all cursor-pointer shadow-2xs hover:border-sky-400"
            title="Database MySQL: Unduh Skema & Data Lengkap (.sql)"
          >
            <Database className="w-3.5 h-3.5 text-[#009fe3] dark:text-sky-400" />
            <span className="font-mono text-xs">Database MySQL</span>
          </button>
        )}

        {/* Dark / Light Mode Toggle Button */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          title={theme === 'dark' ? 'Ganti ke Tema Terang (Light Mode)' : 'Ganti ke Tema Gelap (Dark Mode)'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>

        {/* Device Switcher (Laptop / Handphone) */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
          <button
            onClick={() => onViewModeChange('laptop')}
            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all cursor-pointer ${
              viewMode === 'laptop'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
            title="Tampilan Desktop / Laptop"
          >
            <Laptop className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Laptop</span>
          </button>
          <button
            onClick={() => onViewModeChange('mobile')}
            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all cursor-pointer ${
              viewMode === 'mobile'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
            title="Tampilan Mobile / Handphone"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">HP</span>
          </button>
        </div>

        {/* Real-time Clock */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-mono tabular-nums px-1">
          <span>🕒</span>
          <span>{timeStr}</span>
        </div>

        {/* Settings button */}
        <button
          onClick={onNavigateSettings}
          className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Pengaturan Profil & Tema"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Notification bell */}
        <button 
          onClick={onOpenSyncConsole}
          className="relative text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Notifikasi & Log Sinkronisasi"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
        </button>

        {/* User avatar circle & info */}
        <div 
          onClick={onNavigateSettings}
          className="cursor-pointer flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all shadow-2xs"
          title={`Profil: ${getProfileTitle()} - Klik untuk buka Pengaturan`}
        >
          <div className="w-7 h-7 rounded-full bg-[#009fe3] text-white flex items-center justify-center font-bold text-xs ring-1 ring-sky-300 dark:ring-sky-700 shadow-xs">
            {getInitials()}
          </div>
          <div className="hidden xl:block text-left text-[11px] leading-tight max-w-[130px] truncate">
            <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
              {currentUser?.nama || (currentRole === 'Admin' ? 'DAFFA ARI P.' : currentRole === 'Atasan / VP' ? 'M DAVI R.' : 'FAUZAN AL G.')}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {currentUser?.badge ? `[${currentUser.badge}] ` : ''}{currentRole}
            </span>
          </div>
        </div>

        {/* Tombol Keluar (Logout) untuk kembali ke halaman login */}
        <button
          onClick={() => onLogout()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 text-xs font-bold transition-all shadow-2xs cursor-pointer ml-1"
          title="Keluar dari Portal (Kembali ke Halaman Login)"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
};


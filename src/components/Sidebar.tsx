import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ShieldAlert, 
  Download, 
  ChevronDown, 
  ChevronRight, 
  Building2,
  Sliders,
  Grid3X3,
  GitBranch,
  Lock,
  Plus,
  FileSpreadsheet,
  LogOut,
  FileText
} from 'lucide-react';
import { UserRole } from '../types/pusri';

interface SidebarProps {
  currentRole: UserRole;
  activeTab: string;
  onSelectMenu: (menuId: string) => void;
  counts: {
    total: number;
    vpReview: number;
    adminApproval: number;
    carryOver: number;
  };
  onDownloadManual: () => void;
  onDownloadSql: () => void;
  onOpenSop: () => void;
  onLogout?: (roleToSelect?: UserRole) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  activeTab,
  onSelectMenu,
  onDownloadManual,
  onDownloadSql,
  onOpenSop,
  onLogout
}) => {
  const [risikoOpen, setRisikoOpen] = useState(true);
  const [masterOpen, setMasterOpen] = useState(true);

  // Strict RBAC checks: Unit Kerja cannot see or access VP / Admin; VP cannot access Admin
  const canAccessVp = currentRole === 'Atasan / VP' || currentRole === 'Admin';
  const canAccessAdmin = currentRole === 'Admin';

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 h-[calc(100vh-57px)] sticky top-[57px] overflow-y-auto transition-colors">
      <div className="p-3.5 space-y-3">
        {/* Corporate Navigation Header */}
        <div className="pt-1 pb-1 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-[#009fe3] dark:text-sky-400 uppercase tracking-wider flex items-center justify-between">
          <span>Menu Corporate ERM</span>
          <span className="text-[10px] text-amber-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-950/60 px-1.5 py-0.2 rounded font-mono font-bold">
            Pusri 2026
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {/* Dashboard */}
          <button
            onClick={() => onSelectMenu('dashboard')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-[#009fe3] text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          {/* RISIKO Group */}
          <div>
            <button
              onClick={() => setRisikoOpen(!risikoOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 text-[#009fe3]">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span className="text-slate-800 dark:text-slate-200 font-extrabold">RISIKO</span>
              </div>
              {risikoOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            {risikoOpen && (
              <div className="pl-3 space-y-0.5 mt-0.5">
                {/* 1. Identifikasi Risiko */}
                <button
                  onClick={() => onSelectMenu('identifikasi')}
                  className={`w-full flex items-center px-3 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
                    activeTab === 'identifikasi'
                      ? 'bg-sky-50 dark:bg-sky-950/60 text-[#009fe3] dark:text-sky-300 font-semibold border-l-2 border-[#009fe3]'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <span className="truncate">Identifikasi Risiko</span>
                </button>

                {/* 2. Review Atasan/VP */}
                <button
                  onClick={() => onSelectMenu('review-vp')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
                    activeTab === 'review-vp'
                      ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 font-semibold border-l-2 border-amber-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                  title={!canAccessVp ? 'Terkunci untuk Unit Kerja (Khusus Atasan / VP)' : undefined}
                >
                  <span className="truncate">Review Atasan / VP</span>
                  {!canAccessVp && <Lock className="w-3 h-3 text-amber-500/80 shrink-0" />}
                </button>

                {/* 3. Approval Admin */}
                <button
                  onClick={() => onSelectMenu('approval-admin')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
                    activeTab === 'approval-admin'
                      ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-900 dark:text-sky-300 font-semibold border-l-2 border-[#009fe3]'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                  title={!canAccessAdmin ? 'Terkunci untuk Unit Kerja (Khusus Admin Korporat)' : undefined}
                >
                  <span className="truncate">Approval Admin</span>
                  {!canAccessAdmin && <Lock className="w-3 h-3 text-sky-600/80 shrink-0" />}
                </button>

                {/* 4. Pengendalian Risiko */}
                <button
                  onClick={() => onSelectMenu('pengendalian-tw')}
                  className={`w-full flex items-center px-3 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
                    activeTab === 'pengendalian-tw'
                      ? 'bg-sky-50 dark:bg-sky-950/60 text-[#009fe3] dark:text-sky-300 font-semibold border-l-2 border-[#009fe3]'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <span className="truncate">Pengendalian Risiko</span>
                </button>

                {/* 5. Evaluasi Risiko */}
                <button
                  onClick={() => onSelectMenu('evaluasi-carryover')}
                  className={`w-full flex items-center px-3 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
                    activeTab === 'evaluasi-carryover'
                      ? 'bg-yellow-50 dark:bg-yellow-950/60 text-amber-900 dark:text-yellow-200 font-semibold border-l-2 border-yellow-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <span className="truncate">Evaluasi Risiko</span>
                </button>
              </div>
            )}
          </div>

          {/* Master Departemen & Matriks */}
          <div>
            <button
              onClick={() => setMasterOpen(!masterOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Sliders className="w-4 h-4" />
                <span className="text-slate-800 dark:text-slate-200">Master Data & Matriks</span>
              </div>
              {masterOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            {masterOpen && (
              <div className="pl-3 space-y-0.5 mt-0.5">
                {/* Diubah dari Daftar Organisasi menjadi Daftar Departemen, HANYA untuk Admin */}
                {canAccessAdmin && (
                  <button
                    onClick={() => onSelectMenu('master-organisasi')}
                    className={`w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors flex items-center gap-2 cursor-pointer ${
                      activeTab === 'master-organisasi'
                        ? 'bg-sky-50 dark:bg-sky-950/60 text-[#009fe3] dark:text-sky-300 font-semibold border-l-2 border-[#009fe3]'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Daftar Departemen</span>
                  </button>
                )}

                <button
                  onClick={() => onSelectMenu('peta-matriks')}
                  className={`w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors flex items-center gap-2 cursor-pointer ${
                    activeTab === 'peta-matriks'
                      ? 'bg-sky-50 dark:bg-sky-950/60 text-[#009fe3] dark:text-sky-300 font-semibold border-l-2 border-[#009fe3]'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                  <span>Peta Matriks 5x5</span>
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Bottom Area: Download Panduan SOP, Download MySQL Khusus Admin */}
      <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-2">
        {/* Download Panduan SOP */}
        <button
          onClick={onDownloadManual}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-[#009fe3] dark:text-sky-300 bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700/80 border border-sky-300 dark:border-slate-700 rounded-lg transition-colors shadow-2xs cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-[#009fe3]" />
          <span>Download Panduan SOP</span>
        </button>

        {/* Download MySQL: HANYA tampil jika Admin */}
        {canAccessAdmin && (
          <button
            onClick={onDownloadSql}
            className="w-full flex items-center justify-center gap-2 py-1.5 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors shadow-2xs font-mono cursor-pointer"
            title="Download Skema & Data Database MySQL (Password: portal123)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Download MySQL (.sql)</span>
          </button>
        )}

        {/* Diagram Alur Proses SOP */}
        <button
          onClick={onOpenSop}
          className="w-full p-2 rounded-lg border border-yellow-300/80 dark:border-yellow-800/80 bg-yellow-50/60 dark:bg-yellow-950/30 hover:bg-yellow-100/70 dark:hover:bg-yellow-900/40 text-left transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-yellow-300">
            <GitBranch className="w-3.5 h-3.5 text-amber-600" />
            <span>Diagram Alur Proses SOP</span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
            16 Tahapan Manajemen Risiko Pusri
          </div>
        </button>

        {/* Tombol Keluar */}
        {onLogout && (
          <button
            onClick={() => onLogout()}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50/80 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-900/60 rounded-lg transition-colors cursor-pointer"
            title="Keluar dari Portal Pusri & Kembali ke Halaman Login"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar (Logout)</span>
          </button>
        )}
      </div>
    </aside>
  );
};

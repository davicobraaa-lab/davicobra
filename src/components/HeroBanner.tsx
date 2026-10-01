import React from 'react';
import { Shield, Sparkles } from 'lucide-react';

interface HeroBannerProps {
  onOpenSop?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onOpenSop }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-sky-200 dark:border-slate-800 p-5 md:p-6 shadow-xs transition-colors">
      {/* Soft yellow and light blue background gradients */}
      <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-yellow-100/50 via-sky-50/60 to-transparent pointer-events-none dark:opacity-20" />
      <div className="absolute -left-12 -bottom-12 w-44 h-44 rounded-full bg-sky-100/60 dark:bg-sky-950/20 blur-2xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div className="space-y-2 max-w-4xl">
          {/* Badges in soft yellow & light blue */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-[#009fe3] dark:text-sky-300 text-[11px] font-bold tracking-wider uppercase border border-sky-200 dark:border-sky-800">
              <Shield className="w-3 h-3" />
              <span>Pusri Enterprise Risk Management</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-950/60 text-amber-900 dark:text-yellow-200 text-[11px] font-bold tracking-wider uppercase border border-yellow-300 dark:border-yellow-800">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>Periode Tahun 2026</span>
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Dashboard Profil Risiko Korporat & Unit Kerja
          </h1>

          {/* Subtitle */}
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            Pemantauan terpadu implementasi mitigasi risiko PT Pupuk Sriwidjaja Palembang sesuai siklus SOP 16 Tahapan dan kriteria evaluasi triwulanan.
          </p>
        </div>

        {onOpenSop && (
          <div className="shrink-0">
            <button
              onClick={onOpenSop}
              className="px-4 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              Lihat 16 Tahap SOP Pusri
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

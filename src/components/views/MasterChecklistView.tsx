import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  CheckCircle2, 
  Layers, 
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import { MasterChecklistItem, RiskCategory, UserRole } from '../../types/pusri';

interface MasterChecklistViewProps {
  currentRole: UserRole;
  checklist: MasterChecklistItem[];
  onSelectChecklistItem?: (item: MasterChecklistItem) => void;
}

export const MasterChecklistView: React.FC<MasterChecklistViewProps> = ({
  currentRole,
  checklist,
  onSelectChecklistItem
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = ['Semua', 'Operasional', 'Keuangan', 'Strategis', 'Hukum & Kepatuhan'];

  const filtered = checklist.filter((item) => {
    const matchesCat = selectedCategory === 'Semua' || item.kategori === selectedCategory;
    const matchesSearch = searchTerm === '' ||
      item.jenisRisiko.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.deskripsiStandar.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.faktorPemicuUmum.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-5 max-w-6xl mx-auto py-2">
      {/* Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-800 to-emerald-900 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 font-mono">
            Taksonomi Risiko Pusri (Tabel master_checklist_jenis_risiko)
          </span>
          <h2 className="text-xl font-extrabold tracking-tight mt-0.5">
            Daftar Checklist Standar Jenis & Kategori Risiko
          </h2>
          <p className="text-xs text-emerald-100 mt-1 max-w-2xl">
            Katalog taksonomi risiko standar Pusri sebagai acuan Unit Kerja dalam menetapkan pernyataan risiko, akar penyebab umum, serta rekomendasi pengendalian.
          </p>
        </div>

        <div className="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 text-xs font-mono text-emerald-200">
          Katalog: <strong className="text-white font-bold">{checklist.length} Referensi</strong>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[#005a54] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder=""
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 shadow-2xs transition-all"
          />
        </div>
      </div>

      {/* Catalog Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-xs"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                  {item.kategori}
                </span>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-1">
                  {item.jenisRisiko}
                </h3>
              </div>
              <span className="font-mono text-[10px] text-slate-400">ID: {item.id}</span>
            </div>

            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {item.deskripsiStandar}
            </p>

            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300">Faktor Pemicu Umum: </span>
                <span className="text-slate-500 dark:text-slate-400">{item.faktorPemicuUmum}</span>
              </div>
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300">Rekomendasi Pengendalian: </span>
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">{item.rekomendasiPengendalian}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

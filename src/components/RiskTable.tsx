import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  ExternalLink, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  RotateCcw,
  ArrowUpDown
} from 'lucide-react';
import { PusriRisk, UserRole } from '../types/pusri';

interface RiskTableProps {
  risks: PusriRisk[];
  currentRole: UserRole;
  onOpenNewRisk: () => void;
  onSelectRisk: (risk: PusriRisk) => void;
  onOpenUpdateRiskModal?: (risk: PusriRisk) => void;
  selectedMatrixCell: string | null;
  onClearMatrixCell: () => void;
  onTriggerSync: () => void;
}

export const RiskTable: React.FC<RiskTableProps> = ({
  risks,
  currentRole,
  onOpenNewRisk,
  onSelectRisk,
  onOpenUpdateRiskModal,
  selectedMatrixCell,
  onClearMatrixCell,
  onTriggerSync
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Filter logic
  const filtered = risks.filter((r) => {
    // Search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        r.kodeRisiko.toLowerCase().includes(q) ||
        r.pernyataanRisiko.toLowerCase().includes(q) ||
        r.namaOrganisasi.toLowerCase().includes(q) ||
        (r.picPelaksana && r.picPelaksana.toLowerCase().includes(q));
      if (!matchSearch) return false;
    }

    // Category
    if (selectedCategory !== 'ALL' && r.kategoriRisiko !== selectedCategory) {
      return false;
    }

    // Status
    if (selectedStatus !== 'ALL' && r.statusWorkflow !== selectedStatus) {
      return false;
    }

    // Matrix cell filter
    if (selectedMatrixCell) {
      const cellKey = `L${r.kemungkinanAwal}xD${r.dampakAwal}`;
      if (cellKey !== selectedMatrixCell) return false;
    }

    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Draft_Unit':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Draft Unit
          </span>
        );
      case 'Revisi':
      case 'revisi':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <RotateCcw className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            (revisi)
          </span>
        );
      case 'Menunggu_Approval_VP':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            Review Atasan / VP
          </span>
        );
      case 'Menunggu_Approval_Admin':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
            <AlertTriangle className="w-3 h-3 text-[#005a54] dark:text-emerald-400" />
            Approval Admin
          </span>
        );
      case 'Disetujui_Dalam_Pengendalian':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Monitoring TW 1-4
          </span>
        );
      case 'Carry_Over':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <RotateCcw className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            Carry Over
          </span>
        );
      case 'Selesai':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
            Terkendali / Selesai
          </span>
        );
      default:
        return <span className="text-xs text-slate-600 dark:text-slate-400">{status}</span>;
    }
  };

  const getRiskScoreBadge = (k: number, d: number, score: number, level: string) => {
    let bg = 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700';
    if (level === 'High') bg = 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900 font-bold';
    else if (level === 'Mod to High') bg = 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-900 font-bold';
    else if (level === 'Moderate') bg = 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900 font-semibold';
    else if (level === 'Low to Mod') bg = 'bg-lime-50 dark:bg-lime-950/60 text-lime-800 dark:text-lime-300 border-lime-200 dark:border-lime-900';
    else if (level === 'Low') bg = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900';

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${bg}`}>
        <span>L{k}×D{d} = {score}</span>
        <span className="text-[10px] opacity-75">({level})</span>
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden mt-4 transition-colors">
      {/* Header bar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <span>Daftar Register Risiko Korporat & Unit Kerja</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Database tersinkronisasi via REST API Golang & Database MySQL InnoDB
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          {selectedMatrixCell && (
            <button
              onClick={onClearMatrixCell}
              className="px-2.5 py-1.5 text-xs font-semibold text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Matriks: {selectedMatrixCell}</span>
              <span className="text-amber-700 dark:text-amber-400 font-bold ml-1">×</span>
            </button>
          )}

          <button
            onClick={onOpenNewRisk}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#005a54] hover:bg-[#004d47] dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Input Risiko</span>
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="p-3 bg-slate-50/70 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2.5 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder=""
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 shadow-2xs transition-all"
          />
        </div>

        {/* Category filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="h-9 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 cursor-pointer shadow-2xs transition-all"
        >
          <option value="ALL">Semua Kategori</option>
          <option value="Operasional">Operasional</option>
          <option value="Keuangan">Keuangan</option>
          <option value="Strategis">Strategis</option>
          <option value="Hukum & Kepatuhan">Hukum & Kepatuhan</option>
        </select>

        {/* Status filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="h-9 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 cursor-pointer shadow-2xs transition-all"
        >
          <option value="ALL">Semua Status</option>
          <option value="Revisi">(revisi)</option>
          <option value="Menunggu_Approval_VP">Review Atasan / VP</option>
          <option value="Menunggu_Approval_Admin">Approval Admin</option>
          <option value="Disetujui_Dalam_Pengendalian">Monitoring TW 1-4</option>
          <option value="Carry_Over">Carry Over</option>
          <option value="Selesai">Terkendali / Selesai</option>
        </select>

        {/* Sync Trigger button */}
        <button
          onClick={onTriggerSync}
          className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors ml-auto cursor-pointer"
          title="Sinkronisasi Ulang Data Antar Modul via API"
        >
          🔄 Refresh API Sync
        </button>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/70 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold">
              <th className="py-2.5 px-3.5 whitespace-nowrap">Kode & Departemen</th>
              <th className="py-2.5 px-3.5">Pernyataan Risiko & Tindakan Mitigasi</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Kategori</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Skor Matriks</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Strategi</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Status Alur SOP</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-400 dark:text-slate-500">
                  Tidak ada data risiko yang sesuai dengan kriteria filter.
                </td>
              </tr>
            ) : (
              filtered.map((risk) => (
                <tr
                  key={risk.id}
                  onClick={() => onSelectRisk(risk)}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 cursor-pointer transition-colors group"
                >
                  {/* Kode & Unit */}
                  <td className="py-3 px-3.5 whitespace-nowrap align-top">
                    <div className="font-mono font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#005a54] dark:group-hover:text-emerald-400 transition-colors">
                      {risk.kodeRisiko}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[170px]">
                      {risk.namaOrganisasi}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                      PIC: {risk.picPelaksana || '-'}
                    </div>
                  </td>

                  {/* Pernyataan Risiko & Rencana */}
                  <td className="py-3 px-3.5 max-w-[340px] align-top">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
                      {risk.pernyataanRisiko}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                      <span className="font-medium text-slate-600 dark:text-slate-300">Mitigasi:</span> {risk.rencanaPenanganan || 'Belum ada mitigasi'}
                    </p>
                  </td>

                  {/* Kategori */}
                  <td className="py-3 px-3.5 whitespace-nowrap align-top">
                    <span className="inline-block px-2 py-0.5 text-[11px] rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700">
                      {risk.kategoriRisiko}
                    </span>
                  </td>

                  {/* Inherent Matrix Score */}
                  <td className="py-3 px-3.5 whitespace-nowrap align-top">
                    {getRiskScoreBadge(
                      risk.kemungkinanAwal,
                      risk.dampakAwal,
                      risk.inherentScore,
                      risk.currentTingkatRisiko
                    )}
                  </td>

                  {/* Strategi */}
                  <td className="py-3 px-3.5 whitespace-nowrap align-top">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                      risk.jenisPenanganan === 'Mitigasi' 
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}>
                      {risk.jenisPenanganan}
                    </span>
                  </td>

                  {/* Status Workflow */}
                  <td className="py-3 px-3.5 whitespace-nowrap align-top">
                    {getStatusBadge(risk.statusWorkflow)}
                  </td>

                  {/* Action button */}
                  <td className="py-3 px-3.5 whitespace-nowrap align-top text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRisk(risk);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-sky-800 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/60 border border-sky-300 dark:border-sky-800 rounded-md transition-colors cursor-pointer"
                        title="Buka Detail Risiko"
                      >
                        Detail
                      </button>

                      {onOpenUpdateRiskModal && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenUpdateRiskModal(risk);
                          }}
                          className="px-2.5 py-1 text-xs font-bold text-amber-900 dark:text-yellow-200 bg-yellow-50 dark:bg-yellow-950/60 hover:bg-yellow-100 dark:hover:bg-yellow-900/60 border border-yellow-300 dark:border-yellow-800 rounded-md transition-colors cursor-pointer shadow-2xs"
                          title="Perbarui / Update Data Risiko Ini"
                        >
                          Update Data
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

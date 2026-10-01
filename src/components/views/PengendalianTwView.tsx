import React, { useState } from 'react';
import { 
  Calendar, 
  TrendingDown, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  DollarSign, 
  Save, 
  Activity,
  Layers,
  ShieldAlert,
  LogOut
} from 'lucide-react';
import { PusriRisk, QuarterlyControl, UserRole } from '../../types/pusri';
import { PusriApiClient } from '../../services/api';

interface PengendalianTwViewProps {
  currentRole: UserRole;
  risks: PusriRisk[];
  onRiskUpdated: (updatedRisk: PusriRisk) => void;
  onSelectRisk: (risk: PusriRisk) => void;
  onLogout?: (roleToSelect?: UserRole) => void;
}

export const PengendalianTwView: React.FC<PengendalianTwViewProps> = ({
  currentRole,
  risks,
  onRiskUpdated,
  onSelectRisk,
  onLogout
}) => {
  const activeRisks = risks.filter(
    (r) => r.statusWorkflow === 'Disetujui_Dalam_Pengendalian' || (r.pengendalianTriwulan && r.pengendalianTriwulan.length > 0)
  );
  const [selectedRisk, setSelectedRisk] = useState<PusriRisk | null>(activeRisks[0] || risks[0] || null);

  const [selectedTw, setSelectedTw] = useState<'TW 1' | 'TW 2' | 'TW 3' | 'TW 4'>('TW 1');
  const [progressPersen, setProgressPersen] = useState<number>(75);
  const [statusRealisasi, setStatusRealisasi] = useState<'On Track' | 'Delayed' | 'Completed' | 'Pending'>('On Track');
  const [biayaTerpakai, setBiayaTerpakai] = useState<number>(250000000);
  const [kendalaDanTindakLanjut, setKendalaDanTindakLanjut] = useState('');
  const [residualK, setResidualK] = useState<number>(2);
  const [residualD, setResidualD] = useState<number>(3);
  const [isSaving, setIsSaving] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleSelectRisk = (risk: PusriRisk) => {
    setSelectedRisk(risk);
    const existingTw = risk.pengendalianTriwulan?.find((q) => q.triwulan === selectedTw);
    if (existingTw) {
      setProgressPersen(existingTw.progressPersen);
      setStatusRealisasi(existingTw.statusPengendalian);
      setBiayaTerpakai(existingTw.realisasiBiaya);
      setKendalaDanTindakLanjut(existingTw.kendalaDanTindakLanjut || '');
      setResidualK(existingTw.kemungkinanResidual);
      setResidualD(existingTw.dampakResidual);
    } else {
      setProgressPersen(50);
      setStatusRealisasi('On Track');
      setBiayaTerpakai(Math.round(risk.biayaRencanaPengendalian * 0.25));
      setKendalaDanTindakLanjut('');
      setResidualK(Math.max(1, risk.kemungkinanAwal - 1));
      setResidualD(risk.dampakAwal);
    }
  };

  const handleSaveQuarter = async () => {
    if (!selectedRisk) return;
    setIsSaving(true);
    const residualScore = residualK * residualD;
    const residualLevel = residualScore >= 16 ? 'High' : residualScore >= 12 ? 'Mod to High' : residualScore >= 8 ? 'Moderate' : residualScore >= 4 ? 'Low to Mod' : 'Low';

    const newControl: QuarterlyControl = {
      triwulan: selectedTw,
      realisasiKegiatan: `Realisasi mitigasi ${selectedTw} unit kerja: progres ${progressPersen}% tercapai.`,
      progressPersen,
      realisasiBiaya: Number(biayaTerpakai) || 0,
      kemungkinanResidual: residualK,
      dampakResidual: residualD,
      tingkatResidual: residualLevel,
      statusPengendalian: statusRealisasi,
      kendalaDanTindakLanjut,
      updatedAt: new Date().toISOString()
    };

    const updatedControls = [...(selectedRisk.pengendalianTriwulan || [])];
    const existingIndex = updatedControls.findIndex((q) => q.triwulan === selectedTw);
    if (existingIndex >= 0) {
      updatedControls[existingIndex] = newControl;
    } else {
      updatedControls.push(newControl);
    }

    try {
      const updated = await PusriApiClient.updateRisk(
        selectedRisk.id,
        {
          pengendalianTriwulan: updatedControls,
          currentTingkatRisiko: residualScore >= 16 ? 'High' : residualScore >= 12 ? 'Mod to High' : residualScore >= 8 ? 'Moderate' : residualScore >= 4 ? 'Low to Mod' : 'Low'
        },
        `${currentRole} - Pengendalian TW`,
        currentRole
      );
      if (updated) {
        onRiskUpdated(updated);
        setSelectedRisk(updated);
        setSuccessNotice(`Realisasi ${selectedTw} untuk risiko ${updated.kodeRisiko} berhasil disimpan ke basis data MySQL.`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto py-2">
      {/* Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-900 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 font-mono">
            Tahap 10 - 14 SOP Enterprise Risk Management
          </span>
          <h2 className="text-xl font-extrabold tracking-tight mt-0.5">
            Modul Pengendalian & Pemantauan Triwulanan (TW 1 - TW 4)
          </h2>
          <p className="text-xs text-emerald-100 mt-1 max-w-2xl">
            Catat dan evaluasi realisasi kemajuan fisik program mitigasi, realisasi penyerapan anggaran, penurunan risiko residual (K × D), serta hambatan implementasi di lapangan setiap triwulan.
          </p>
        </div>

        <div className="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 text-xs font-mono text-emerald-200">
          Risiko Aktif: <strong className="text-white font-bold">{activeRisks.length} Risiko</strong>
        </div>
      </div>

      {/* Peringatan & Arahan Login Ulang untuk Posisi Unit Kerja */}
      {currentRole === 'Unit Kerja' && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-sm">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="text-xs leading-relaxed space-y-0.5">
              <div className="font-bold text-amber-950 dark:text-amber-100 text-sm flex items-center gap-1.5">
                <span>Peringatan & Arahan Posisi Unit Kerja</span>
              </div>
              <p className="text-amber-800 dark:text-amber-300">
                Akun Anda saat ini berada pada posisi <strong>Unit Kerja</strong> (wewenang pencatatan progres fisik & serapan biaya mitigasi). Untuk wewenang managerial, review status pengendalian, evaluasi korporat, atau approval final, silakan <strong>login ulang sebagai Vice President (VP) atau Admin</strong>.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={() => onLogout?.('Atasan / VP')}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Beralih dan Login Ulang sebagai Vice President (VP)"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Login sbg VP</span>
            </button>
            <button
              type="button"
              onClick={() => onLogout?.('Admin')}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#005a54] to-emerald-700 hover:from-[#004742] hover:to-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Beralih dan Login Ulang sebagai Admin Manajemen Risiko"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Login sbg Admin</span>
            </button>
          </div>
        </div>
      )}

      {successNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
          <button onClick={() => setSuccessNotice(null)} className="text-xs font-bold hover:underline">
            Tutup
          </button>
        </div>
      )}

      {/* Workspace */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Left: Active Risks */}
        <div className="md:col-span-1 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
            <span>Pilih Risiko Aktif ({activeRisks.length})</span>
            <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
              Active Control
            </span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {activeRisks.map((risk) => {
              const isSelected = selectedRisk?.id === risk.id;
              const completedTwCount = risk.pengendalianTriwulan?.length || 0;
              return (
                <div
                  key={risk.id}
                  onClick={() => handleSelectRisk(risk)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-300 dark:ring-emerald-800'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono font-bold text-slate-900 dark:text-slate-100 mb-1">
                    <span>{risk.kodeRisiko}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                      {completedTwCount}/4 TW
                    </span>
                  </div>
                  <div className="font-semibold text-slate-700 dark:text-slate-300 line-clamp-1">
                    {risk.namaOrganisasi}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                    {risk.pernyataanRisiko}
                  </p>
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-mono">
                    <span>Target: {risk.targetWaktuMitigasi}</span>
                    <span className="text-emerald-600 font-bold">{risk.currentTingkatRisiko}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Monitoring & Update Form */}
        <div className="md:col-span-2 space-y-4">
          {selectedRisk ? (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
                <div>
                  <span className="font-mono font-bold text-base text-slate-900 dark:text-slate-100">
                    {selectedRisk.kodeRisiko}
                  </span>
                  <div className="text-slate-500 dark:text-slate-400 font-medium">
                    PIC Pelaksana: <strong>{selectedRisk.picPelaksana}</strong> | PIC Pengendali: <strong>{selectedRisk.picPengendali}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold font-mono">
                    Tingkat Risiko: {selectedRisk.currentTingkatRisiko}
                  </span>
                </div>
              </div>

              {/* Inherent vs Current */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">
                  Program Mitigasi yang Dipantau:
                </span>
                <p className="text-slate-900 dark:text-slate-100 font-bold">
                  {selectedRisk.rencanaPenanganan}
                </p>
                <div className="text-[11px] text-slate-500 flex gap-4 pt-1">
                  <span>Anggaran Rencana: <strong>Rp {selectedRisk.biayaRencanaPengendalian.toLocaleString('id-ID')}</strong></span>
                  <span>Inherent Awal: <strong>Skor {selectedRisk.inherentScore} ({selectedRisk.tingkatRisikoAwal})</strong></span>
                </div>
              </div>

              {/* TW Selector Tabs */}
              <div className="space-y-1.5">
                <span className="font-bold text-xs text-slate-700 dark:text-slate-300 block">
                  Pilih Periode Triwulan:
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {(['TW 1', 'TW 2', 'TW 3', 'TW 4'] as const).map((tw) => {
                    const hasRecord = selectedRisk.pengendalianTriwulan?.some((q) => q.triwulan === tw);
                    const isCurrent = selectedTw === tw;
                    return (
                      <button
                        key={tw}
                        type="button"
                        onClick={() => setSelectedTw(tw)}
                        className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                          isCurrent
                            ? 'border-[#005a54] bg-[#005a54] text-white shadow-xs'
                            : hasRecord
                              ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <div>{tw}</div>
                        <span className="text-[9px] font-mono block opacity-80">
                          {hasRecord ? 'Terekam' : 'Belum'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TW Input Form */}
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-3">
                <span className="font-bold text-xs text-emerald-900 dark:text-emerald-200 block">
                  Input Realisasi Fisik & Residual Skor ({selectedTw}):
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Kemajuan Fisik (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={progressPersen}
                      onChange={(e) => setProgressPersen(Number(e.target.value))}
                      className="w-full h-10 px-3.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 font-bold focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 outline-none transition-all shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Status Capaian
                    </label>
                    <select
                      value={statusRealisasi}
                      onChange={(e) => setStatusRealisasi(e.target.value as any)}
                      className="w-full h-10 px-3.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-semibold focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 outline-none transition-all shadow-2xs cursor-pointer"
                    >
                      <option value="On Track">On Track (Sesuai Jadwal)</option>
                      <option value="Delayed">Delayed (Mengalami Keterlambatan)</option>
                      <option value="Completed">Completed (Mitigasi Selesai)</option>
                      <option value="Pending">Pending (Belum Mulai)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Realisasi Biaya (Rp)
                    </label>
                    <input
                      type="number"
                      value={biayaTerpakai}
                      onChange={(e) => setBiayaTerpakai(Number(e.target.value))}
                      className="w-full h-10 px-3.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 outline-none transition-all shadow-2xs"
                    />
                  </div>
                </div>

                {/* Residual Likelihood & Impact Slider */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 space-y-1.5 shadow-2xs">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Kemungkinan Residual</span>
                      <strong className="font-mono text-[#005a54] dark:text-emerald-400">Level {residualK} / 5</strong>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={residualK}
                      onChange={(e) => setResidualK(Number(e.target.value))}
                      className="w-full accent-[#005a54] cursor-pointer"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 space-y-1.5 shadow-2xs">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Dampak Residual</span>
                      <strong className="font-mono text-[#005a54] dark:text-emerald-400">Level {residualD} / 5</strong>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={residualD}
                      onChange={(e) => setResidualD(Number(e.target.value))}
                      className="w-full accent-[#005a54] cursor-pointer"
                    />
                  </div>
                </div>

                {/* Kendala & Tindak Lanjut */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Kendala Lapangan & Rencana Tindak Lanjut Pemulihan
                  </label>
                  <textarea
                    rows={2}
                    placeholder=""
                    value={kendalaDanTindakLanjut}
                    onChange={(e) => setKendalaDanTindakLanjut(e.target.value)}
                    className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 outline-none transition-all shadow-2xs resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60">
                  <button
                    onClick={handleSaveQuarter}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-[#005a54] hover:bg-[#004d47] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 text-emerald-300" />
                    <span>{isSaving ? 'Menyimpan ke MySQL...' : `Simpan Realisasi ${selectedTw}`}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
              Pilih risiko aktif di sebelah kiri untuk memantau atau menginput kemajuan triwulanan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

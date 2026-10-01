import React, { useState } from 'react';
import { X, Calendar, Activity, CheckCircle2, AlertTriangle, Plus, Save } from 'lucide-react';
import { PusriRisk, QuarterlyControl, RiskLevel } from '../types/pusri';
import { PusriApiClient } from '../services/api';

interface PengendalianTwModalProps {
  isOpen: boolean;
  onClose: () => void;
  risks: PusriRisk[];
  onRiskUpdated: (updatedRisk: PusriRisk) => void;
}

export const PengendalianTwModal: React.FC<PengendalianTwModalProps> = ({
  isOpen,
  onClose,
  risks,
  onRiskUpdated
}) => {
  const activeRisks = risks.filter(
    (r) => r.statusWorkflow === 'Disetujui_Dalam_Pengendalian' || r.statusWorkflow === 'Selesai'
  );
  const [selectedRisk, setSelectedRisk] = useState<PusriRisk | null>(activeRisks[0] || null);

  // New TW form state
  const [triwulan, setTriwulan] = useState<'TW 1' | 'TW 2' | 'TW 3' | 'TW 4'>('TW 2');
  const [realisasiKegiatan, setRealisasiKegiatan] = useState('');
  const [realisasiBiaya, setRealisasiBiaya] = useState(50000000);
  const [progressPersen, setProgressPersen] = useState(75);
  const [kemungkinanResidual, setKemungkinanResidual] = useState(2);
  const [dampakResidual, setDampakResidual] = useState(3);
  const [statusPengendalian, setStatusPengendalian] = useState<'On Track' | 'Delayed' | 'Completed'>('On Track');
  const [kendala, setKendala] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddQuarterly = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRisk || !realisasiKegiatan.trim()) return;

    setIsSubmitting(true);
    const residualScore = kemungkinanResidual * dampakResidual;
    let tingkatResidual: RiskLevel = 'Low';
    if (residualScore >= 16) tingkatResidual = 'High';
    else if (residualScore >= 12) tingkatResidual = 'Mod to High';
    else if (residualScore >= 8) tingkatResidual = 'Moderate';
    else if (residualScore >= 4) tingkatResidual = 'Low to Mod';

    const newControl: QuarterlyControl = {
      triwulan,
      realisasiKegiatan,
      realisasiBiaya: Number(realisasiBiaya),
      progressPersen: Number(progressPersen),
      kemungkinanResidual,
      dampakResidual,
      tingkatResidual,
      statusPengendalian,
      kendalaDanTindakLanjut: kendala,
      updatedAt: new Date().toISOString()
    };

    const existingControls = selectedRisk.pengendalianTriwulan || [];
    const updatedList = existingControls.filter((c) => c.triwulan !== triwulan);
    updatedList.push(newControl);

    const isFinished = statusPengendalian === 'Completed' || progressPersen >= 100;

    try {
      const updated = await PusriApiClient.updateRisk(
        selectedRisk.id,
        {
          pengendalianTriwulan: updatedList,
          currentTingkatRisiko: tingkatResidual,
          statusWorkflow: isFinished ? 'Selesai' : selectedRisk.statusWorkflow
        },
        'PIC Pelaksana',
        'Unit Kerja'
      );
      if (updated) {
        onRiskUpdated(updated);
        setSelectedRisk(updated);
        setRealisasiKegiatan('');
        setKendala('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full overflow-hidden border border-slate-200 my-8">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#005a54] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-300" />
            <div>
              <h3 className="font-bold text-base tracking-tight">
                Monitoring & Evaluasi Pengendalian Triwulan (TW 1 - TW 4)
              </h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Tahap 10-13 SOP Pusri: Pemantauan realisasi fisik, serapan anggaran, dan skor residual risiko
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          {/* Left: Risk selection */}
          <div className="md:col-span-1 border-r border-slate-200 pr-4 space-y-2">
            <div className="font-bold text-slate-800 flex items-center justify-between mb-2">
              <span>Risiko Terdaftar ({activeRisks.length})</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono">
                TW Active
              </span>
            </div>

            <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
              {activeRisks.map((risk) => {
                const isSelected = selectedRisk?.id === risk.id;
                const controlsCount = risk.pengendalianTriwulan?.length || 0;
                return (
                  <div
                    key={risk.id}
                    onClick={() => setSelectedRisk(risk)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#005a54] bg-emerald-50/60 ring-2 ring-emerald-300'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono font-bold text-slate-900">
                      <span>{risk.kodeRisiko}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {controlsCount} TW Update
                      </span>
                    </div>
                    <div className="text-[11px] font-semibold text-slate-700 mt-1 line-clamp-1">
                      {risk.namaOrganisasi}
                    </div>
                    <div className="text-[10px] text-slate-500 line-clamp-2 mt-1">
                      {risk.pernyataanRisiko}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: History & Form */}
          <div className="md:col-span-2 space-y-4">
            {selectedRisk ? (
              <>
                {/* Risk summary banner */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-slate-900">{selectedRisk.kodeRisiko}</span>
                    <p className="text-[11px] text-slate-600 font-medium">{selectedRisk.pernyataanRisiko}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">PIC Pelaksana: {selectedRisk.picPelaksana || '-'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-500 block">Tingkat Saat Ini</span>
                    <span className="font-bold text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {selectedRisk.currentTingkatRisiko}
                    </span>
                  </div>
                </div>

                {/* Historical Quarterly Controls */}
                <div>
                  <h4 className="font-bold text-slate-800 text-xs mb-2 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#005a54]" />
                    <span>Riwayat Realisasi Pemantauan Triwulanan:</span>
                  </h4>

                  {(!selectedRisk.pengendalianTriwulan || selectedRisk.pengendalianTriwulan.length === 0) ? (
                    <div className="p-3 bg-slate-50 rounded-lg text-slate-400 text-center">
                      Belum ada laporan triwulan yang diinput. Silakan input melalui formulir di bawah.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedRisk.pengendalianTriwulan.map((ctrl, i) => (
                        <div key={i} className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                          <div className="flex items-center justify-between font-semibold">
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              {ctrl.triwulan}
                            </span>
                            <span className="text-slate-600 text-[11px]">
                              Progress: <strong className="text-slate-900">{ctrl.progressPersen}%</strong> ({ctrl.statusPengendalian})
                            </span>
                            <span className="text-slate-600 text-[11px]">
                              Serapan: <strong>Rp {ctrl.realisasiBiaya.toLocaleString('id-ID')}</strong>
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              Residual: L{ctrl.kemungkinanResidual}×D{ctrl.dampakResidual} ({ctrl.tingkatResidual})
                            </span>
                          </div>
                          <p className="text-slate-800 text-[11px] pt-1">{ctrl.realisasiKegiatan}</p>
                          {ctrl.kendalaDanTindakLanjut && (
                            <p className="text-[10px] text-amber-700 bg-amber-50/60 p-1.5 rounded">
                              Kendala: {ctrl.kendalaDanTindakLanjut}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Form to submit new quarterly progress */}
                <form onSubmit={handleAddQuarterly} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                  <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-[#005a54]" />
                    <span>Input Pemantauan Triwulan Baru:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">Pilih Triwulan</label>
                      <select
                        value={triwulan}
                        onChange={(e) => setTriwulan(e.target.value as any)}
                        className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 shadow-2xs transition-all cursor-pointer"
                      >
                        <option value="TW 1">Triwulan I (TW 1)</option>
                        <option value="TW 2">Triwulan II (TW 2)</option>
                        <option value="TW 3">Triwulan III (TW 3)</option>
                        <option value="TW 4">Triwulan IV (TW 4)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">Progress Fisik (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={progressPersen}
                        onChange={(e) => setProgressPersen(Number(e.target.value))}
                        className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 shadow-2xs transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">Status Lapangan</label>
                      <select
                        value={statusPengendalian}
                        onChange={(e) => setStatusPengendalian(e.target.value as any)}
                        className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 shadow-2xs transition-all cursor-pointer"
                      >
                        <option value="On Track">On Track (Sesuai Jadwal)</option>
                        <option value="Delayed">Delayed (Terlambat)</option>
                        <option value="Completed">Completed (Tuntas)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">Uraian Realisasi Tindakan Mitigasi *</label>
                    <textarea
                      rows={2}
                      required
                      value={realisasiKegiatan}
                      onChange={(e) => setRealisasiKegiatan(e.target.value)}
                      placeholder=""
                      className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 shadow-2xs transition-all resize-none leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">Serapan Biaya (Rp)</label>
                      <input
                        type="number"
                        value={realisasiBiaya}
                        onChange={(e) => setRealisasiBiaya(Number(e.target.value))}
                        className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 shadow-2xs transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">Residual Kemungkinan (1-5)</label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={kemungkinanResidual}
                        onChange={(e) => setKemungkinanResidual(Number(e.target.value))}
                        className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 shadow-2xs transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">Residual Dampak (1-5)</label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={dampakResidual}
                        onChange={(e) => setDampakResidual(Number(e.target.value))}
                        className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 shadow-2xs transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#005a54] hover:bg-[#004d47] rounded-lg shadow-sm flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Pemantauan TW'}</span>
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="p-8 text-center text-slate-400">
                Pilih risiko di sebelah kiri untuk melihat progress triwulan.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

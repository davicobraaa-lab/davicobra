import React, { useState } from 'react';
import { 
  RotateCw, 
  CheckCircle2, 
  Calendar, 
  FileText, 
  AlertTriangle, 
  Building2, 
  Send,
  HelpCircle
} from 'lucide-react';
import { PusriRisk, UserRole } from '../../types/pusri';
import { PusriApiClient } from '../../services/api';

interface EvaluasiCarryOverViewProps {
  currentRole: UserRole;
  risks: PusriRisk[];
  onRiskUpdated: (updatedRisk: PusriRisk) => void;
  onSelectRisk: (risk: PusriRisk) => void;
}

export const EvaluasiCarryOverView: React.FC<EvaluasiCarryOverViewProps> = ({
  currentRole,
  risks,
  onRiskUpdated,
  onSelectRisk
}) => {
  const [selectedRisk, setSelectedRisk] = useState<PusriRisk | null>(risks[0] || null);
  const [alasanCarryOver, setAlasanCarryOver] = useState('');
  const [tahunTujuan, setTahunTujuan] = useState(2027);
  const [rekomendasi, setRekomendasi] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const handleCarryOver = async () => {
    if (!selectedRisk) return;
    setIsSubmitting(true);
    try {
      const updated = await PusriApiClient.updateRisk(
        selectedRisk.id,
        {
          statusWorkflow: 'Carry_Over',
          carryOverInfo: {
            alasanCarryOver,
            targetTahun: tahunTujuan,
            rekomendasiKomite: rekomendasi,
            approvalCarryOverBy: currentRole === 'Admin' ? 'Disetujui Komite Risiko' : 'Diajukan Unit / VP',
            tanggalCarryOver: new Date().toISOString()
          }
        },
        `${currentRole} - Evaluasi Tahunan`,
        currentRole
      );
      if (updated) {
        onRiskUpdated(updated);
        setSelectedRisk(updated);
        setNotice(`Risiko ${updated.kodeRisiko} berhasil dialihkan ke program Carry Over RKAP ${tahunTujuan}.`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const carryOverCount = risks.filter((r) => r.statusWorkflow === 'Carry_Over').length;

  return (
    <div className="space-y-5 max-w-6xl mx-auto py-2">
      {/* Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-900 to-indigo-950 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 font-mono">
            Tahap 15 - 16 SOP Enterprise Risk Management
          </span>
          <h2 className="text-xl font-extrabold tracking-tight mt-0.5">
            Modul Evaluasi Efektivitas & Penetapan Carry Over
          </h2>
          <p className="text-xs text-purple-100 mt-1 max-w-2xl">
            Tinjau efektivitas pengendalian tahunan (TW 4) dan tetapkan risiko-risiko berkepanjangan yang wajib dilanjutkan (Carry Over) ke tahun anggaran berikutnya (RKAP 2027).
          </p>
        </div>

        <div className="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 text-xs font-mono text-purple-200">
          Risiko Carry Over: <strong className="text-white font-bold">{carryOverCount} Risiko</strong>
        </div>
      </div>

      {notice && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-xs font-bold hover:underline">
            Tutup
          </button>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Left: Risks */}
        <div className="md:col-span-1 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
            <span>Daftar Risiko RKAP 2026 ({risks.length})</span>
            <span className="text-[10px] font-mono text-purple-600 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded">
              Carry Over Review
            </span>
          </div>

          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {risks.map((risk) => {
              const isSelected = selectedRisk?.id === risk.id;
              const isCarryOver = risk.statusWorkflow === 'Carry_Over';
              return (
                <div
                  key={risk.id}
                  onClick={() => setSelectedRisk(risk)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 ring-2 ring-purple-300 dark:ring-purple-800'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono font-bold text-slate-900 dark:text-slate-100 mb-1">
                    <span>{risk.kodeRisiko}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      isCarryOver ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {isCarryOver ? 'Carry Over' : risk.statusWorkflow.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-700 dark:text-slate-300 line-clamp-1">
                    {risk.namaOrganisasi}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                    {risk.pernyataanRisiko}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Carry Over Form */}
        <div className="md:col-span-2 space-y-4">
          {selectedRisk ? (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
                <div>
                  <span className="font-mono font-bold text-base text-slate-900 dark:text-slate-100">
                    {selectedRisk.kodeRisiko}
                  </span>
                  <div className="text-slate-500 dark:text-slate-400 font-medium">
                    Departemen: <strong>{selectedRisk.namaOrganisasi}</strong>
                  </div>
                </div>

                <span className={`text-xs px-2.5 py-1 rounded-lg font-bold font-mono ${
                  selectedRisk.statusWorkflow === 'Carry_Over'
                    ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  Status: {selectedRisk.statusWorkflow.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Statement */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Pernyataan Risiko:</span>
                <p className="text-slate-900 dark:text-slate-100 font-bold">{selectedRisk.pernyataanRisiko}</p>
                <div className="text-[11px] text-slate-500 pt-1">
                  Mitigasi Terencana: {selectedRisk.rencanaPenanganan}
                </div>
              </div>

              {/* Existing Carry Over Info if any */}
              {selectedRisk.carryOverInfo && (
                <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-900 dark:text-purple-200 text-xs">
                      Informasi Carry Over Terdaftar:
                    </span>
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-purple-600 text-white">
                      Target RKAP {selectedRisk.carryOverInfo.targetTahun}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">
                    <strong>Alasan:</strong> {selectedRisk.carryOverInfo.alasanCarryOver}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                    <strong>Rekomendasi Komite:</strong> {selectedRisk.carryOverInfo.rekomendasiKomite}
                  </p>
                </div>
              )}

              {/* Form to submit / adjust carry over */}
              <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/20 dark:bg-purple-950/20 space-y-3">
                <span className="font-bold text-xs text-purple-900 dark:text-purple-200 block">
                  Penetapan Usulan Carry Over ke RKAP Berikutnya:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Tahun Anggaran Asal
                    </label>
                    <input
                      type="number"
                      disabled
                      value={selectedRisk.tahun}
                      className="w-full h-10 px-3.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-500 opacity-80 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Tahun Anggaran Sasaran (Carry Over) *
                    </label>
                    <input
                      type="number"
                      value={tahunTujuan}
                      onChange={(e) => setTahunTujuan(Number(e.target.value))}
                      className="w-full h-10 px-3.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 font-bold focus:border-purple-600 focus:ring-2 focus:ring-purple-500/15 outline-none transition-all shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Justifikasi / Alasan Kebutuhan Carry Over *
                  </label>
                  <textarea
                    rows={2}
                    placeholder=""
                    value={alasanCarryOver}
                    onChange={(e) => setAlasanCarryOver(e.target.value)}
                    className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-500/15 outline-none transition-all shadow-2xs resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Rekomendasi Penanganan di Tahun Baru *
                  </label>
                  <textarea
                    rows={2}
                    placeholder=""
                    value={rekomendasi}
                    onChange={(e) => setRekomendasi(e.target.value)}
                    className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-500/15 outline-none transition-all shadow-2xs resize-none"
                  />
                </div>

                <div className="flex items-center justify-end pt-2 border-t border-purple-200/60 dark:border-purple-800/60">
                  <button
                    onClick={handleCarryOver}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCw className="w-4 h-4 text-purple-200" />
                    <span>{isSubmitting ? 'Memproses...' : `Tetapkan Carry Over ke RKAP ${tahunTujuan}`}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
              Pilih risiko dari daftar di sebelah kiri untuk melihat evaluasi tahunan dan status carry over.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

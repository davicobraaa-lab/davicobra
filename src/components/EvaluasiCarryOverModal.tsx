import React, { useState } from 'react';
import { X, RotateCcw, Calendar, CheckCircle, FileText, ArrowRight, ShieldAlert } from 'lucide-react';
import { PusriRisk } from '../types/pusri';
import { PusriApiClient } from '../services/api';

interface EvaluasiCarryOverModalProps {
  isOpen: boolean;
  onClose: () => void;
  risks: PusriRisk[];
  onRiskUpdated: (updatedRisk: PusriRisk) => void;
}

export const EvaluasiCarryOverModal: React.FC<EvaluasiCarryOverModalProps> = ({
  isOpen,
  onClose,
  risks,
  onRiskUpdated
}) => {
  const carryOverRisks = risks.filter((r) => r.statusWorkflow === 'Carry_Over');
  const [selectedRisk, setSelectedRisk] = useState<PusriRisk | null>(carryOverRisks[0] || null);

  // Form state to carry over an existing active risk
  const candidateRisks = risks.filter((r) => r.statusWorkflow === 'Disetujui_Dalam_Pengendalian');
  const [candidateId, setCandidateId] = useState(candidateRisks[0]?.id || '');
  const [alasan, setAlasan] = useState('');
  const [targetTahun, setTargetTahun] = useState(2027);
  const [rekomendasi, setRekomendasi] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCreateCarryOver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateId || !alasan.trim()) return;

    setIsSubmitting(true);
    try {
      const updated = await PusriApiClient.updateRisk(
        candidateId,
        {
          statusWorkflow: 'Carry_Over',
          carryOverInfo: {
            targetTahun,
            alasanCarryOver: alasan,
            rekomendasiKomite: rekomendasi || 'Disetujui komite risiko Pusri untuk dialihkan ke RKAP berikutnya.',
            approvalCarryOverBy: 'VP Manajemen Risiko & Direktur Operasi',
            tanggalCarryOver: new Date().toISOString().split('T')[0]
          }
        },
        'Komite Manajemen Risiko',
        'Admin'
      );
      if (updated) {
        onRiskUpdated(updated);
        setSelectedRisk(updated);
        setAlasan('');
        setRekomendasi('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 my-8">
        {/* Header */}
        <div className="px-5 py-3.5 bg-purple-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-purple-300" />
            <div>
              <h3 className="font-bold text-base tracking-tight">
                Evaluasi Risiko & Registrasi Carry Over
              </h3>
              <p className="text-xs text-purple-200 mt-0.5">
                Tahap 15 SOP Pusri: Evaluasi program mitigasi multi-tahun dan eskalasi ke RKAP Periode 2027
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
          {/* Left list: Current Carry Over */}
          <div className="md:col-span-1 border-r border-slate-200 pr-4 space-y-2">
            <div className="font-bold text-slate-800 flex items-center justify-between mb-2">
              <span>Risiko Carry Over ({carryOverRisks.length})</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-mono">
                Tahun 2027
              </span>
            </div>

            {carryOverRisks.map((risk) => {
              const isSelected = selectedRisk?.id === risk.id;
              return (
                <div
                  key={risk.id}
                  onClick={() => setSelectedRisk(risk)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-purple-600 bg-purple-50/70 ring-2 ring-purple-300'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono font-bold text-slate-900">
                    <span>{risk.kodeRisiko}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                      Target {risk.carryOverInfo?.targetTahun || 2027}
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

          {/* Right side: Detail of selected or Usulan Form */}
          <div className="md:col-span-2 space-y-4">
            {selectedRisk && selectedRisk.carryOverInfo && (
              <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900 text-sm">{selectedRisk.kodeRisiko}</span>
                  <span className="text-xs px-2.5 py-1 rounded bg-purple-700 text-white font-bold font-mono">
                    Carry Over ke RKAP {selectedRisk.carryOverInfo.targetTahun}
                  </span>
                </div>

                <div>
                  <span className="font-semibold text-slate-700">Pernyataan Risiko:</span>
                  <p className="text-slate-900 mt-0.5 font-medium">{selectedRisk.pernyataanRisiko}</p>
                </div>

                <div>
                  <span className="font-semibold text-slate-700">Alasan Justifikasi Carry Over:</span>
                  <p className="text-slate-800 mt-0.5 bg-white p-2.5 rounded-lg border border-purple-200/80">
                    {selectedRisk.carryOverInfo.alasanCarryOver}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-slate-700">Rekomendasi Komite Risiko:</span>
                  <p className="text-slate-800 mt-0.5 bg-white p-2.5 rounded-lg border border-purple-200/80">
                    {selectedRisk.carryOverInfo.rekomendasiKomite}
                  </p>
                </div>

                <div className="flex gap-4 text-[11px] text-slate-500 pt-1">
                  <span>Persetujuan: <strong>{selectedRisk.carryOverInfo.approvalCarryOverBy}</strong></span>
                  <span>Tanggal: <strong>{selectedRisk.carryOverInfo.tanggalCarryOver}</strong></span>
                </div>
              </div>
            )}

            {/* Propose new carry over form */}
            {candidateRisks.length > 0 && (
              <form onSubmit={handleCreateCarryOver} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-purple-700" />
                  <span>Usulkan Risiko Berjalan Menjadi Carry Over (Target 2027):</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                      Pilih Risiko Proyek / Multi-Tahun
                    </label>
                    <select
                      value={candidateId}
                      onChange={(e) => setCandidateId(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded text-xs"
                    >
                      {candidateRisks.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.kodeRisiko} - {r.namaOrganisasi.substring(0, 25)}...
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                      Target Tahun RKAP
                    </label>
                    <input
                      type="number"
                      value={targetTahun}
                      onChange={(e) => setTargetTahun(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-200 rounded text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                    Justifikasi Teknis / Komersial Penyebab Carry Over *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={alasan}
                    onChange={(e) => setAlasan(e.target.value)}
                    placeholder=""
                    className="w-full p-2 bg-white border border-slate-200 rounded text-xs"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs font-semibold text-white bg-purple-800 hover:bg-purple-900 rounded-lg shadow-sm flex items-center gap-1.5"
                  >
                    <span>{isSubmitting ? 'Menyimpan...' : 'Ajukan Carry Over ke Komite'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

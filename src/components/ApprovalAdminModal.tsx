import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle, UserCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { PusriRisk } from '../types/pusri';
import { PusriApiClient } from '../services/api';

interface ApprovalAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  risks: PusriRisk[];
  onRiskUpdated: (updatedRisk: PusriRisk) => void;
}

export const ApprovalAdminModal: React.FC<ApprovalAdminModalProps> = ({
  isOpen,
  onClose,
  risks,
  onRiskUpdated
}) => {
  const pendingAdmin = risks.filter((r) => r.statusWorkflow === 'Menunggu_Approval_Admin');
  const [selectedRisk, setSelectedRisk] = useState<PusriRisk | null>(pendingAdmin[0] || null);
  const [picPelaksana, setPicPelaksana] = useState(selectedRisk?.picPelaksana || '');
  const [picPengendali, setPicPengendali] = useState(selectedRisk?.picPengendali || '');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleApprove = async () => {
    if (!selectedRisk) return;
    setIsProcessing(true);
    try {
      const updated = await PusriApiClient.updateRisk(
        selectedRisk.id,
        {
          statusWorkflow: 'Disetujui_Dalam_Pengendalian',
          picPelaksana: picPelaksana || selectedRisk.picPelaksana,
          picPengendali: picPengendali || selectedRisk.picPengendali,
          updatedDate: new Date().toISOString()
        },
        'Risk Admin Korporat',
        'Admin'
      );
      if (updated) {
        onRiskUpdated(updated);
        const remaining = pendingAdmin.filter((r) => r.id !== selectedRisk.id);
        setSelectedRisk(remaining[0] || null);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 my-8">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#005a54] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-300" />
            <div>
              <h3 className="font-bold text-base tracking-tight">
                Approval Admin Manajemen Risiko & Penugasan PIC
              </h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Tahap 9 SOP Pusri: Verifikasi selera risiko korporat, penugasan resmi PIC, dan aktivasi pemantauan TW
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
          {/* Left list: Pending reviews */}
          <div className="md:col-span-1 border-r border-slate-200 pr-4 space-y-2">
            <div className="font-bold text-slate-800 flex items-center justify-between mb-2">
              <span>Menunggu Approval Admin ({pendingAdmin.length})</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-mono">
                Admin Queue
              </span>
            </div>

            {pendingAdmin.length === 0 ? (
              <div className="p-4 rounded-lg bg-slate-50 text-slate-400 text-center">
                Semua risiko korporat telah divalidasi dan disetujui.
              </div>
            ) : (
              pendingAdmin.map((risk) => {
                const isSelected = selectedRisk?.id === risk.id;
                return (
                  <div
                    key={risk.id}
                    onClick={() => {
                      setSelectedRisk(risk);
                      setPicPelaksana(risk.picPelaksana);
                      setPicPengendali(risk.picPengendali);
                    }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#005a54] bg-teal-50/60 ring-2 ring-teal-300'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono font-bold text-slate-900">
                      <span>{risk.kodeRisiko}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {risk.kategoriRisiko}
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
              })
            )}
          </div>

          {/* Right side */}
          <div className="md:col-span-2 space-y-3.5">
            {selectedRisk ? (
              <>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {selectedRisk.kodeRisiko}
                      </span>
                      <p className="text-slate-500 text-[11px]">
                        {selectedRisk.namaOrganisasi} ({selectedRisk.kodeOrganisasi})
                      </p>
                    </div>
                    <span className="font-mono font-bold text-xs px-2.5 py-1 rounded bg-teal-100 text-teal-800 border border-teal-200">
                      L{selectedRisk.kemungkinanAwal} × D{selectedRisk.dampakAwal} = {selectedRisk.inherentScore} ({selectedRisk.currentTingkatRisiko})
                    </span>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-700">Pernyataan Risiko:</span>
                    <p className="text-slate-900 font-medium mt-0.5">{selectedRisk.pernyataanRisiko}</p>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-700">Rencana Penanganan / Mitigasi:</span>
                    <p className="text-slate-900 mt-0.5">{selectedRisk.rencanaPenanganan || '-'}</p>
                  </div>
                </div>

                {/* Assignment Form */}
                <div className="space-y-3 p-3.5 rounded-xl border border-slate-200 bg-white">
                  <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-[#005a54]" />
                    <span>Penugasan Resmi PIC Pengendali & PIC Pelaksana Korporat:</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        PIC Pelaksana (Eksekutor di Lapangan) *
                      </label>
                      <input
                        type="text"
                        value={picPelaksana}
                        onChange={(e) => setPicPelaksana(e.target.value)}
                        placeholder=""
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#005a54]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        PIC Pengendali (Vice President / GM) *
                      </label>
                      <input
                        type="text"
                        value={picPengendali}
                        onChange={(e) => setPicPengendali(e.target.value)}
                        placeholder=""
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#005a54]"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
                  <button
                    onClick={onClose}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Batal
                  </button>

                  <button
                    onClick={handleApprove}
                    disabled={isProcessing}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#005a54] hover:bg-[#004d47] rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{isProcessing ? 'Menyimpan...' : 'Setujui & Aktifkan Pemantauan TW 1-4'}</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-slate-400">
                Pilih risiko di sebelah kiri untuk approval.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

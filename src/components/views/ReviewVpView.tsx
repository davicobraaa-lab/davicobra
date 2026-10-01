import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  RotateCcw, 
  XCircle, 
  ShieldCheck, 
  Building2, 
  FileText, 
  ArrowRight,
  Clock,
  Send,
  AlertCircle,
  UserCheck,
  UserPlus,
  Users,
  Save,
  Sparkles
} from 'lucide-react';
import { PusriRisk, UserRole } from '../../types/pusri';
import { PusriApiClient } from '../../services/api';
import { AccessDeniedBanner } from './AccessDeniedBanner';

interface ReviewVpViewProps {
  currentRole: UserRole;
  onSwitchRole?: (role: UserRole) => void;
  onLogout?: (roleToSelect?: UserRole) => void;
  risks: PusriRisk[];
  onRiskUpdated: (updatedRisk: PusriRisk) => void;
  onSelectRisk: (risk: PusriRisk) => void;
  onNavigateNext?: (nextTab: string, roleToSwitch?: UserRole) => void;
  onOpenUpdateRiskModal?: (risk: PusriRisk) => void;
}

export const ReviewVpView: React.FC<ReviewVpViewProps> = ({
  currentRole,
  onLogout,
  risks,
  onRiskUpdated,
  onSelectRisk,
  onNavigateNext,
  onOpenUpdateRiskModal
}) => {
  // Enforce RBAC
  if (currentRole === 'Unit Kerja') {
    return (
      <AccessDeniedBanner
        moduleName="Review Atasan / VP"
        requiredRole="Atasan / VP"
        currentRole={currentRole}
        onBackToDashboard={() => onNavigateNext?.('dashboard')}
        onGoToIdentifikasi={() => onNavigateNext?.('identifikasi')}
      />
    );
  }

  const pendingRisks = risks.filter((r) => r.statusWorkflow === 'Menunggu_Approval_VP');
  const [selectedRisk, setSelectedRisk] = useState<PusriRisk | null>(pendingRisks[0] || null);
  const [notes, setNotes] = useState('');
  
  // PIC Assignment per risk by VP
  const [picPelaksana, setPicPelaksana] = useState('');
  const [picPengendali, setPicPengendali] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Sync state whenever selectedRisk changes
  useEffect(() => {
    if (selectedRisk) {
      setPicPelaksana(selectedRisk.picPelaksana || 'Superintendent Operasi Pabrik 1B');
      setPicPengendali(selectedRisk.picPengendali || 'VP Departemen Operasi Pabrik 1B');
      setNotes(selectedRisk.reviewNotesVp || '');
    }
  }, [selectedRisk]);

  // Suggested PIC suggestions removed from VP Review since PIC is designated by Admin
  // VP Approve & forward to Admin Approval
  const handleApprove = async () => {
    if (!selectedRisk) return;
    setIsProcessing(true);
    try {
      const updated = await PusriApiClient.submitVpDecision(
        selectedRisk.id,
        'approve',
        notes.trim() || 'Telah direview dan disetujui oleh VP untuk eskalasi ke tahap Approval Korporat Admin.',
        selectedRisk.picPelaksana || 'Ditetapkan oleh Admin',
        selectedRisk.picPengendali || 'VP Departemen',
        currentRole === 'Admin' ? 'Risk Admin' : 'VP Departemen',
        currentRole
      );
      if (updated) {
        onRiskUpdated(updated);
        setActionNotice(`Risiko [${updated.kodeRisiko}] berhasil disetujui oleh VP dan dialihkan ke antrean Approval Korporat Admin.`);
        
        const nextPending = risks.filter((r) => r.id !== updated.id && r.statusWorkflow === 'Menunggu_Approval_VP');
        setSelectedRisk(nextPending[0] || null);
        setNotes('');

        if (currentRole === 'Admin' && onNavigateNext) {
          setTimeout(() => {
            onNavigateNext('approval-admin');
          }, 1200);
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // VP Request Revision back to Unit Kerja (Status: Revisi)
  const handleRequestRevision = async () => {
    if (!selectedRisk) return;
    setIsProcessing(true);
    const revisionNote = notes.trim() || 'Mohon perbaiki uraian identifikasi risiko, akar penyebab, atau rencana penanganan mitigasi sesuai arahan SOP Pusri sebelum diajukan kembali.';
    try {
      const updated = await PusriApiClient.submitVpDecision(
        selectedRisk.id,
        'revisi',
        revisionNote,
        selectedRisk.picPelaksana || '',
        selectedRisk.picPengendali || '',
        currentRole === 'Admin' ? 'Risk Admin' : 'VP Departemen',
        currentRole
      );
      if (updated) {
        onRiskUpdated(updated);
        setActionNotice(`Risiko [${updated.kodeRisiko}] berhasil dikembalikan ke Unit Kerja dengan status (Revisi). Catatan revisi telah terlampir.`);
        const nextPending = risks.filter((r) => r.id !== updated.id && r.statusWorkflow === 'Menunggu_Approval_VP');
        setSelectedRisk(nextPending[0] || null);
        setNotes('');
      }
    } catch (err: any) {
      console.error('Revision submission failed:', err);
      setActionNotice(`Gagal mengembalikan risiko: ${err.message || 'Terjadi kesalahan sistem.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto py-2">
      {/* Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-200 font-mono">
              Tahap 8 SOP Enterprise Risk Management
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold">
              Pembagian PIC Per Risiko Aktif
            </span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight mt-0.5">
            Modul Review & Pembagian PIC oleh Atasan / Vice President (VP)
          </h2>
          <p className="text-xs text-amber-100 mt-1 max-w-2xl">
            Atasan / VP bertugas memvalidasi kelayakan usulan risiko, membagikan PIC Pelaksana & PIC Pengendali untuk tiap risiko secara individual, serta meneruskan usulan ke tahap <strong>Approval Admin Korporat</strong>.
          </p>
        </div>

        <div className="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 text-xs font-mono text-amber-200 shrink-0">
          Antrean Review VP: <strong className="text-white font-bold">{pendingRisks.length} Usulan</strong>
        </div>
      </div>

      {actionNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-xs font-bold hover:underline cursor-pointer">
            Tutup
          </button>
        </div>
      )}

      {/* Main Review Workspace */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Left Column: Queue of Pending Risks */}
        <div className="md:col-span-1 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
            <span>Daftar Usulan Menunggu Review ({pendingRisks.length})</span>
            <span className="text-[10px] font-mono text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
              Antrean VP
            </span>
          </div>

          <div className="space-y-2">
            {pendingRisks.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Semua Usulan Sudah Direview & Diberikan PIC
                </p>
                <p className="text-[11px] text-slate-500">
                  Tidak ada risiko pending dalam antrean review VP saat ini.
                </p>
              </div>
            ) : (
              pendingRisks.map((risk) => {
                const isSelected = selectedRisk?.id === risk.id;
                return (
                  <div
                    key={risk.id}
                    onClick={() => {
                      setSelectedRisk(risk);
                      setActionNotice(null);
                    }}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 shadow-xs ring-1 ring-amber-400'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-amber-800 dark:text-amber-400">
                        {risk.kodeRisiko}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                        Skor: {risk.inherentScore}
                      </span>
                    </div>

                    <p className="font-medium text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed">
                      {risk.pernyataanRisiko}
                    </p>

                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                      <span>{risk.namaOrganisasi}</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                        PIC: {risk.picPelaksana ? 'Sudah Ada' : 'Belum Ada'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Dossier, Individual PIC Assignment, & Review Action */}
        <div className="md:col-span-2 space-y-4">
          {selectedRisk ? (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-xs">
              
              {/* Header Dossier */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-base text-slate-900 dark:text-slate-100">
                      {selectedRisk.kodeRisiko}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                      Menunggu Approval VP
                    </span>
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    Unit Pengusul: <strong>{selectedRisk.namaOrganisasi}</strong> • Tahun: <strong>{selectedRisk.tahun}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onOpenUpdateRiskModal && (
                    <button
                      type="button"
                      onClick={() => onOpenUpdateRiskModal(selectedRisk)}
                      className="px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      title="Perbarui Data Risiko Sebelum Approval VP"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                      <span>Update Data Risiko</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onSelectRisk(selectedRisk)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    Lihat Berkas Lengkap
                  </button>
                </div>
              </div>

              {/* Statement */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="font-bold text-slate-500 text-[10px] uppercase block">
                  Pernyataan Risiko yang Diajukan:
                </span>
                <p className="text-slate-900 dark:text-slate-100 font-bold text-xs leading-relaxed">
                  {selectedRisk.pernyataanRisiko}
                </p>
              </div>

              {/* Causes & Impacts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">Akar Masalah:</span>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{selectedRisk.penyebabRisiko}</p>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">Dampak:</span>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{selectedRisk.dampakRisiko}</p>
                </div>
              </div>

              {/* Assessment Score */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block font-bold">Kemungkinan</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-mono text-sm">{selectedRisk.kemungkinanAwal} / 5</strong>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block font-bold">Dampak</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-mono text-sm">{selectedRisk.dampakAwal} / 5</strong>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block font-bold">Skor Inherent</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-mono text-sm">{selectedRisk.inherentScore}</strong>
                </div>
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800">
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 block font-bold">Tingkat</span>
                  <strong className="text-amber-800 dark:text-amber-300 font-mono text-sm">{selectedRisk.currentTingkatRisiko}</strong>
                </div>
              </div>

              {/* Mitigation Plan */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 bg-emerald-50/40 dark:bg-emerald-950/20">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Rencana Mitigasi yang Diusulkan:
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-600 text-white">
                    {selectedRisk.jenisPenanganan}
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 font-medium">
                  {selectedRisk.rencanaPenanganan}
                </p>
                <div className="flex gap-4 text-[11px] text-slate-500 pt-1 flex-wrap">
                  <span>Target: <strong>{selectedRisk.targetWaktuMitigasi}</strong></span>
                  <span>Estimasi Biaya: <strong>Rp {selectedRisk.biayaRencanaPengendalian.toLocaleString('id-ID')}</strong></span>
                </div>
              </div>

              {/* INFORMASI PENETAPAN PIC OLEH ADMIN */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                <Users className="w-4 h-4 text-[#005a54] dark:text-emerald-400 shrink-0" />
                <span className="text-[11px] leading-relaxed">
                  <strong>Penetapan PIC Resmi:</strong> Penugasan PIC Pelaksana & PIC Pengendali akan ditentukan dan disahkan secara langsung oleh <strong>Admin Manajemen Risiko</strong> pada tahap Approval Korporat.
                </span>
              </div>

              {/* VP Review Feedback Notes & Actions */}
              <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20 space-y-3">
                <label className="block text-xs font-bold text-amber-900 dark:text-amber-200">
                  Catatan Verifikasi & Arahan Vice President (VP):
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder=""
                  className="w-full p-3 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 outline-none transition-all shadow-2xs resize-none"
                />

                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Setelah disetujui, usulan risiko resmi lanjut ke <strong>Approval Admin</strong>.
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleRequestRevision}
                      className="px-3.5 py-2 rounded-xl border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Kembalikan ke Unit (Revisi)</span>
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleApprove}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Memproses...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Setujui Usulan & Teruskan ke Admin</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Pilih usulan risiko dari antrean di samping kiri untuk memulai proses review substansi risiko.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

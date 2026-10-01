import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ShieldCheck, 
  UserCheck, 
  User, 
  Calendar, 
  DollarSign, 
  Trash2, 
  Send,
  AlertTriangle,
  Lock,
  RotateCcw,
  Layers,
  ArrowRight,
  Filter,
  Users,
  Check,
  Building2,
  FileCheck2,
  Sliders,
  ExternalLink,
  ChevronRight,
  FileText
} from 'lucide-react';
import { PusriRisk, UserRole, OrganizationMaster } from '../../types/pusri';
import { PusriApiClient } from '../../services/api';
import { AccessDeniedBanner } from './AccessDeniedBanner';

interface ApprovalAdminViewProps {
  currentRole: UserRole;
  onSwitchRole?: (role: UserRole) => void;
  onLogout?: (roleToSelect?: UserRole) => void;
  risks: PusriRisk[];
  departments?: OrganizationMaster[];
  onRiskUpdated: (updatedRisk: PusriRisk) => void;
  onRiskDeleted: (riskId: string) => void;
  onNavigateNext?: (nextTab: string, roleToSwitch?: UserRole) => void;
  onOpenUpdateRiskModal?: (risk: PusriRisk) => void;
}

export const ApprovalAdminView: React.FC<ApprovalAdminViewProps> = ({
  currentRole,
  onLogout,
  risks,
  departments = [],
  onRiskUpdated,
  onRiskDeleted,
  onNavigateNext,
  onOpenUpdateRiskModal
}) => {
  // Enforce RBAC (Admin only)
  if (currentRole !== 'Admin') {
    return (
      <AccessDeniedBanner
        moduleName="Approval Admin"
        requiredRole="Admin"
        currentRole={currentRole}
        onBackToDashboard={() => onNavigateNext?.('dashboard')}
        onGoToIdentifikasi={() => onNavigateNext?.('identifikasi')}
      />
    );
  }

  // Sub-tabs: 
  // 1. 'penerimaan' (Penerimaan Data Identifikasi & Pemisahan Otomatis)
  // 2. 'approval' (Approval per Risiko secara Individual)
  // 3. 'penentuan-pic' (Penentuan PIC / Pengendalian Kerja)
  const [activeSubTab, setActiveSubTab] = useState<'penerimaan' | 'approval' | 'penentuan-pic'>('approval');

  // Filter queues
  const pendingApprovalRisks = risks.filter((r) => r.statusWorkflow === 'Menunggu_Approval_Admin');
  const allVpReviewedRisks = risks.filter((r) => r.statusWorkflow === 'Menunggu_Approval_Admin' || r.statusWorkflow === 'Disetujui_Dalam_Pengendalian');
  const activeControlledRisks = risks.filter((r) => r.statusWorkflow === 'Disetujui_Dalam_Pengendalian');

  // State for Approval per Risiko
  const [selectedRisk, setSelectedRisk] = useState<PusriRisk | null>(pendingApprovalRisks[0] || null);
  const [picPelaksana, setPicPelaksana] = useState('');
  const [picPengendali, setPicPengendali] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // State for Tab 1: Penerimaan & Pemisahan Otomatis
  const [selectedIntakeIds, setSelectedIntakeIds] = useState<string[]>([]);
  const [isSplitting, setIsSplitting] = useState(false);
  const [splitResultSummary, setSplitResultSummary] = useState<string | null>(null);

  // State for Tab 3: Penentuan PIC
  const [picTargetRisk, setPicTargetRisk] = useState<PusriRisk | null>(allVpReviewedRisks[0] || null);
  const [assignPicPelaksana, setAssignPicPelaksana] = useState('');
  const [assignPicPengendali, setAssignPicPengendali] = useState('');
  const [picFilterMode, setPicFilterMode] = useState<'all' | 'need-pic' | 'has-pic'>('need-pic');

  const handleSelectRisk = (risk: PusriRisk) => {
    setSelectedRisk(risk);
    setPicPelaksana(risk.picPelaksana || '');
    setPicPengendali(risk.picPengendali || '');
    setApprovalNotes('');
    setNotice(null);
  };

  const handleSelectPicTarget = (risk: PusriRisk) => {
    setPicTargetRisk(risk);
    setAssignPicPelaksana(risk.picPelaksana || '');
    setAssignPicPengendali(risk.picPengendali || '');
    setNotice(null);
  };

  // ---------------------------------------------------------------
  // FEATURE 1: PENERIMAAN DATA IDENTIFIKASI & PEMISAHAN OTOMATIS
  // ---------------------------------------------------------------
  const handleToggleSelectIntake = (id: string) => {
    setSelectedIntakeIds((prev) => 
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllIntake = () => {
    if (selectedIntakeIds.length === pendingApprovalRisks.length) {
      setSelectedIntakeIds([]);
    } else {
      setSelectedIntakeIds(pendingApprovalRisks.map((r) => r.id));
    }
  };

  const handleTerimaIdentifikasi = async () => {
    const idsToAccept = selectedIntakeIds.length > 0 ? selectedIntakeIds : pendingApprovalRisks.map((r) => r.id);
    if (idsToAccept.length === 0) {
      setNotice({ type: 'error', text: 'Tidak ada data usulan identifikasi risiko untuk diterima.' });
      return;
    }

    setIsProcessing(true);
    try {
      const res = await PusriApiClient.terimaIdentifikasiRisiko(
        idsToAccept,
        'Usulan identifikasi risiko resmi diterima oleh Admin Korporat dan siap diproses persetujuan per risiko.',
        'Risk Admin Korporat',
        'Admin'
      );
      if (res.success) {
        setNotice({
          type: 'success',
          text: `Penerimaan Berhasil: ${res.totalAccepted} data usulan identifikasi risiko telah diterima oleh Admin dan siap diproses approval secara individual.`
        });
        setSelectedIntakeIds([]);
      } else {
        setNotice({ type: 'error', text: res.message });
      }
    } catch (e: any) {
      setNotice({ type: 'error', text: e?.message || 'Gagal memproses penerimaan data identifikasi.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePemisahanOtomatis = async () => {
    setIsSplitting(true);
    try {
      const itemsToSplit = pendingApprovalRisks.map((r) => ({
        ...r,
        kodeRisiko: r.kodeRisiko
      }));

      const res = await PusriApiClient.splitBatchRisks(itemsToSplit, 'Risk Admin Korporat', 'Admin');
      if (res.success) {
        setSplitResultSummary(`Sistem telah memisahkan ${res.count} risiko identifikasi secara otomatis menjadi register risiko individual. Setiap butir risiko kini dapat diproses dan disetujui satu per satu.`);
        setNotice({
          type: 'success',
          text: `Pemisahan identifikasi risiko secara otomatis berhasil! Setiap risiko kini dapat diproses approval secara individual.`
        });
        setActiveSubTab('approval');
      } else {
        setNotice({ type: 'error', text: res.message });
      }
    } catch (e: any) {
      setNotice({ type: 'error', text: e?.message || 'Gagal memproses pemisahan otomatis.' });
    } finally {
      setIsSplitting(false);
    }
  };

  // ---------------------------------------------------------------
  // FEATURE 2: APPROVAL PER RISIKO SECARA INDIVIDUAL
  // ---------------------------------------------------------------
  const handleApproveIndividual = async () => {
    if (!selectedRisk) return;

    // Ketentuan validasi sistem: Memastikan risiko memiliki PIC sebelum masuk ke tahap pengendalian
    const effectivePicPelaksana = (picPelaksana || selectedRisk.picPelaksana || '').trim();
    const effectivePicPengendali = (picPengendali || selectedRisk.picPengendali || '').trim();

    if (!effectivePicPelaksana || !effectivePicPengendali) {
      setNotice({
        type: 'error',
        text: `Approval Dicegah: Risiko ${selectedRisk.kodeRisiko} belum memiliki PIC Pelaksana atau PIC Pengendali. Silakan tentukan PIC terlebih dahulu sebelum menyetujui risiko ke tahap pengendalian triwulanan.`
      });
      return;
    }

    if (selectedRisk.inherentScore >= 10 && selectedRisk.jenisPenanganan !== 'Mitigasi') {
      setNotice({
        type: 'error',
        text: `Approval Dicegah: Risiko memiliki skor inherent ${selectedRisk.inherentScore} (${selectedRisk.currentTingkatRisiko}). Sesuai SOP Pusri, wajib memilih strategi 'Mitigasi' sebelum disetujui.`
      });
      return;
    }

    setIsProcessing(true);
    try {
      const res = await PusriApiClient.approveRiskIndividual(
        selectedRisk.id,
        'approve',
        approvalNotes.trim() || 'Telah disetujui resmi per butir risiko oleh Risk Admin Korporat.',
        effectivePicPelaksana,
        effectivePicPengendali,
        'Risk Admin Korporat',
        'Admin'
      );

      if (res.success && res.data) {
        onRiskUpdated(res.data);
        setNotice({
          type: 'success',
          text: `Approval Berhasil: Risiko ${res.data.kodeRisiko} telah disetujui secara individual dan resmi masuk ke tahap Pengendalian Triwulan (TW 1-4). PIC: ${res.data.picPelaksana} / ${res.data.picPengendali}.`
        });

        const nextPending = pendingApprovalRisks.filter((r) => r.id !== selectedRisk.id);
        setSelectedRisk(nextPending[0] || null);

        // Jika antrean selesai, navigasi otomatis opsional
        if (nextPending.length === 0) {
          setTimeout(() => {
            onNavigateNext?.('pengendalian-tw');
          }, 1500);
        }
      } else {
        setNotice({ type: 'error', text: res.message || 'Gagal memproses approval risiko.' });
      }
    } catch (e: any) {
      setNotice({ type: 'error', text: e?.message || 'Terjadi kesalahan sistem saat approval.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReturnForRevisionIndividual = async () => {
    if (!selectedRisk) return;
    if (!approvalNotes.trim()) {
      alert('Mohon cantumkan catatan arahan revisi untuk Unit Kerja.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await PusriApiClient.approveRiskIndividual(
        selectedRisk.id,
        'revisi',
        approvalNotes.trim(),
        picPelaksana || selectedRisk.picPelaksana,
        picPengendali || selectedRisk.picPengendali,
        'Risk Admin Korporat',
        'Admin'
      );

      if (res.success && res.data) {
        onRiskUpdated(res.data);
        setNotice({
          type: 'success',
          text: `Risiko ${res.data.kodeRisiko} berhasil dikembalikan ke Unit Kerja dengan status (revisi). Catatan arahan perbaikan telah terkirim.`
        });
        const nextPending = pendingApprovalRisks.filter((r) => r.id !== selectedRisk.id);
        setSelectedRisk(nextPending[0] || null);
      } else {
        setNotice({ type: 'error', text: res.message || 'Gagal mengembalikan usulan risiko.' });
      }
    } catch (e: any) {
      setNotice({ type: 'error', text: e?.message || 'Terjadi kesalahan sistem.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectIndividual = async () => {
    if (!selectedRisk) return;
    if (window.confirm(`Yakin ingin menolak usulan risiko individual ${selectedRisk.kodeRisiko}?`)) {
      setIsProcessing(true);
      try {
        const res = await PusriApiClient.approveRiskIndividual(
          selectedRisk.id,
          'reject',
          approvalNotes.trim() || 'Usulan risiko ditolak oleh Admin.',
          undefined,
          undefined,
          'Risk Admin Korporat',
          'Admin'
        );
        if (res.success && res.data) {
          onRiskUpdated(res.data);
          setNotice({
            type: 'success',
            text: `Usulan risiko ${res.data.kodeRisiko} telah ditolak.`
          });
          const nextPending = pendingApprovalRisks.filter((r) => r.id !== selectedRisk.id);
          setSelectedRisk(nextPending[0] || null);
        }
      } catch (e: any) {
        setNotice({ type: 'error', text: e?.message || 'Gagal memproses penolakan.' });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // ---------------------------------------------------------------
  // FEATURE 3: PENENTUAN PIC / PENGENDALIAN KERJA
  // ---------------------------------------------------------------
  const filteredPicRisks = allVpReviewedRisks.filter((r) => {
    const hasPic = Boolean(r.picPelaksana && r.picPengendali && r.picPelaksana.trim() !== '' && r.picPengendali.trim() !== '');
    if (picFilterMode === 'need-pic') return !hasPic;
    if (picFilterMode === 'has-pic') return hasPic;
    return true;
  });

  const handleSavePicAssignment = async () => {
    if (!picTargetRisk) return;

    if (!assignPicPelaksana.trim()) {
      setNotice({ type: 'error', text: 'Pilih PIC Pelaksana (Departemen / Operator Lapangan).' });
      return;
    }
    if (!assignPicPengendali.trim()) {
      setNotice({ type: 'error', text: 'Pilih PIC Pengendali (Vice President / Manager Terkait).' });
      return;
    }

    setIsProcessing(true);
    try {
      const res = await PusriApiClient.assignRiskPic(
        picTargetRisk.id,
        assignPicPelaksana.trim(),
        assignPicPengendali.trim(),
        'Risk Admin Korporat',
        'Admin'
      );

      if (res.success && res.data) {
        onRiskUpdated(res.data);
        setNotice({
          type: 'success',
          text: `Penugasan PIC untuk ${res.data.kodeRisiko} berhasil disimpan: Pelaksana (${res.data.picPelaksana}) & Pengendali (${res.data.picPengendali}).`
        });
        setPicTargetRisk(res.data);
      } else {
        setNotice({ type: 'error', text: res.message || 'Gagal menyimpan penugasan PIC.' });
      }
    } catch (e: any) {
      setNotice({ type: 'error', text: e?.message || 'Terjadi kesalahan sistem saat menyimpan PIC.' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto py-2">
      {/* Top Banner Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-900 via-[#005a54] to-cyan-900 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 font-mono">
              Tahap 9 SOP Enterprise Risk Management
            </span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-200 text-[10px] font-bold border border-cyan-400/30">
              Admin Workspace
            </span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight mt-0.5">
            Penerimaan, Pemisahan Otomatis & Approval per Risiko
          </h2>
          <p className="text-xs text-cyan-100 mt-1 max-w-2xl">
            Terima berkas identifikasi risiko, pisahkan secara otomatis menjadi risiko individual, lakukan persetujuan (approval) per butir risiko, dan tetapkan PIC Pengendalian Kerja sebelum masuk tahap pemantauan triwulan (TW 1-4).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 text-xs font-mono text-cyan-200">
            Menunggu Approval: <strong className="text-white font-bold">{pendingApprovalRisks.length} Risiko</strong>
          </div>
        </div>
      </div>

      {/* Main 3 Sub-Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex gap-2 text-xs font-bold flex-wrap">
          {/* Subtab 1: Penerimaan & Pemisahan */}
          <button
            onClick={() => { setActiveSubTab('penerimaan'); setNotice(null); }}
            className={`pb-2 px-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'penerimaan'
                ? 'border-[#005a54] text-[#005a54] dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>1. Penerimaan & Pemisahan Usulan</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
              {pendingApprovalRisks.length}
            </span>
          </button>

          {/* Subtab 2: Approval per Risiko */}
          <button
            onClick={() => { setActiveSubTab('approval'); setNotice(null); }}
            className={`pb-2 px-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'approval'
                ? 'border-[#005a54] text-[#005a54] dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>2. Approval per Risiko (Individual)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 font-mono font-bold">
              {pendingApprovalRisks.length}
            </span>
          </button>

          {/* Subtab 3: Penentuan PIC */}
          <button
            onClick={() => { setActiveSubTab('penentuan-pic'); setNotice(null); }}
            className={`pb-2 px-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'penentuan-pic'
                ? 'border-[#005a54] text-[#005a54] dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>3. Penentuan PIC Pengendalian Kerja</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono">
              {allVpReviewedRisks.length}
            </span>
          </button>
        </div>
      </div>

      {/* Global Notice Alert Banner */}
      {notice && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
          notice.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{notice.text}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-xs font-bold hover:underline cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* SUBTAB 1: PENERIMAAN DATA IDENTIFIKASI & PEMISAHAN OTOMATIS */}
      {/* ============================================================ */}
      {activeSubTab === 'penerimaan' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-[#005a54] dark:text-emerald-400" />
                  <span>Penerimaan Berkas Usulan Identifikasi Risiko Unit</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Daftar paket risiko yang telah disetujui Atasan/VP. Admin menerima berkas dan sistem dapat memisahkan paket risiko menjadi item risiko individual.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTerimaIdentifikasi}
                  disabled={isProcessing || pendingApprovalRisks.length === 0}
                  className="px-4 py-2 bg-[#005a54] hover:bg-[#004742] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Terima Berkas Terpilih ({selectedIntakeIds.length || pendingApprovalRisks.length})</span>
                </button>

                <button
                  type="button"
                  onClick={handlePemisahanOtomatis}
                  disabled={isSplitting || pendingApprovalRisks.length === 0}
                  className="px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  title="Pisahkan paket identifikasi risiko menjadi butir risiko individual"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{isSplitting ? 'Memisahkan...' : 'Pisahkan Risiko Secara Otomatis'}</span>
                </button>
              </div>
            </div>

            {splitResultSummary && (
              <div className="p-3 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 rounded-xl text-xs text-cyan-900 dark:text-cyan-200">
                <strong>Status Pemisahan:</strong> {splitResultSummary}
              </div>
            )}
          </div>

          {/* Table Intake */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedIntakeIds.length === pendingApprovalRisks.length && pendingApprovalRisks.length > 0}
                  onChange={handleSelectAllIntake}
                  className="rounded text-[#005a54] focus:ring-[#005a54]"
                />
                <span>Pilih Semua Usulan Masuk ({pendingApprovalRisks.length})</span>
              </div>
              <span className="text-[11px] text-slate-500 font-normal">
                Status Alur: <strong className="text-amber-600 dark:text-amber-400">Verifikasi VP Selesai</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/60 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                    <th className="py-2.5 px-3.5 w-10">Pilih</th>
                    <th className="py-2.5 px-3.5">Kode & Unit Kerja</th>
                    <th className="py-2.5 px-3.5">Pernyataan Risiko & Rencana Mitigasi</th>
                    <th className="py-2.5 px-3.5">Skor Inherent</th>
                    <th className="py-2.5 px-3.5">Verifikasi VP</th>
                    <th className="py-2.5 px-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pendingApprovalRisks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400">
                        Tidak ada usulan identifikasi risiko baru yang menunggu penerimaan Admin saat ini.
                      </td>
                    </tr>
                  ) : (
                    pendingApprovalRisks.map((risk) => {
                      const isChecked = selectedIntakeIds.includes(risk.id);
                      return (
                        <tr key={risk.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors">
                          <td className="py-3 px-3.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleSelectIntake(risk.id)}
                              className="rounded text-[#005a54] focus:ring-[#005a54]"
                            />
                          </td>
                          <td className="py-3 px-3.5 font-mono">
                            <div className="font-bold text-slate-900 dark:text-slate-100">{risk.kodeRisiko}</div>
                            <div className="text-[11px] text-slate-500 font-sans">{risk.namaOrganisasi}</div>
                          </td>
                          <td className="py-3 px-3.5 max-w-[320px]">
                            <p className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">{risk.pernyataanRisiko}</p>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              <strong>Mitigasi:</strong> {risk.rencanaPenanganan || '-'}
                            </p>
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span className="font-bold font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                              L{risk.kemungkinanAwal}×D{risk.dampakAwal} = {risk.inherentScore}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300 italic text-[11px]">
                            "{risk.reviewNotesVp || 'Disetujui VP'}"
                          </td>
                          <td className="py-3 px-3.5 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRisk(risk);
                                setActiveSubTab('approval');
                              }}
                              className="px-3 py-1 bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              Approval Individual →
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SUBTAB 2: APPROVAL PER RISIKO SECARA INDIVIDUAL */}
      {/* ============================================================ */}
      {activeSubTab === 'approval' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Left Column: Antrean Risiko Individual */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
              <span>Risiko Individual Siap Approval ({pendingApprovalRisks.length})</span>
              <span className="text-[10px] font-mono text-cyan-600 bg-cyan-50 dark:bg-cyan-950 px-2 py-0.5 rounded">
                Individual Queue
              </span>
            </div>

            <div className="space-y-2">
              {pendingApprovalRisks.length === 0 ? (
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                  <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                  <span>Tidak ada risiko individual yang menunggu persetujuan Admin saat ini. Seluruh risiko telah disetujui atau berada dalam siklus pengendalian.</span>
                </div>
              ) : (
                pendingApprovalRisks.map((risk) => {
                  const isSelected = selectedRisk?.id === risk.id;
                  const hasPic = Boolean(risk.picPelaksana && risk.picPengendali);
                  return (
                    <div
                      key={risk.id}
                      onClick={() => handleSelectRisk(risk)}
                      className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'border-cyan-600 bg-cyan-50/70 dark:bg-cyan-950/40 ring-2 ring-cyan-300 dark:ring-cyan-800'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono font-bold text-slate-900 dark:text-slate-100 mb-1">
                        <span>{risk.kodeRisiko}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200">
                            {risk.kategoriRisiko}
                          </span>
                          {!hasPic && (
                            <span className="text-[9px] px-1 rounded bg-amber-500 text-white font-bold" title="Belum Ditugaskan PIC Resmi">
                              No PIC
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="font-semibold text-slate-700 dark:text-slate-300 line-clamp-1">
                        {risk.namaOrganisasi}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                        {risk.pernyataanRisiko}
                      </p>
                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-mono">
                        <span>Inherent: {risk.inherentScore}</span>
                        <span className="text-cyan-700 dark:text-cyan-400 font-bold">{risk.currentTingkatRisiko}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Detail Dossier & Formulir Approval Individual */}
          <div className="md:col-span-2 space-y-4">
            {selectedRisk ? (
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-xs">
                
                {/* Header Detail Risiko */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base text-slate-900 dark:text-slate-100">
                        {selectedRisk.kodeRisiko}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 font-bold font-mono">
                        Pemeriksaan Individual
                      </span>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      Departemen: <strong>{selectedRisk.namaOrganisasi} ({selectedRisk.kodeOrganisasi})</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {onOpenUpdateRiskModal && (
                      <button
                        type="button"
                        onClick={() => onOpenUpdateRiskModal(selectedRisk)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                        title="Perbarui Data Risiko Sebelum Approval"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#005a54]" />
                        <span>Update Data Risiko</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Catatan Verifikasi VP */}
                {selectedRisk.reviewNotesVp && (
                  <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-amber-800 dark:text-amber-300 block">
                      Catatan Verifikasi dari Atasan / VP Departemen:
                    </span>
                    <p className="text-slate-800 dark:text-slate-200 font-medium italic">
                      "{selectedRisk.reviewNotesVp}"
                    </p>
                  </div>
                )}

                {/* Pernyataan Risiko & Akar Masalah */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div>
                    <span className="font-bold text-slate-500 text-[10px] uppercase block">
                      Pernyataan Risiko:
                    </span>
                    <p className="text-slate-900 dark:text-slate-100 font-bold text-xs leading-relaxed mt-0.5">
                      {selectedRisk.pernyataanRisiko}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Akar Penyebab:</span>
                      <p className="text-slate-700 dark:text-slate-300">{selectedRisk.penyebabRisiko || '-'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Dampak:</span>
                      <p className="text-slate-700 dark:text-slate-300">{selectedRisk.dampakRisiko || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Skor Inherent & Rencana Mitigasi */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block">Skor Inherent 5×5:</span>
                    <div className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
                      Kemungkinan {selectedRisk.kemungkinanAwal} × Dampak {selectedRisk.dampakAwal} = {selectedRisk.inherentScore} ({selectedRisk.currentTingkatRisiko})
                    </div>
                    <span className="text-[10px] text-slate-500 block">{selectedRisk.alasanKebutuhanMitigasi}</span>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Rencana Mitigasi:</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-600 text-white font-bold">
                        {selectedRisk.jenisPenanganan}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 line-clamp-2">{selectedRisk.rencanaPenanganan || '-'}</p>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Target: <strong>{selectedRisk.targetWaktuMitigasi}</strong> • Anggaran: <strong>Rp {selectedRisk.biayaRencanaPengendalian.toLocaleString('id-ID')}</strong>
                    </div>
                  </div>
                </div>

                {/* Formulir Penugasan PIC & Keputusan Approval Individual */}
                <div className="p-4 rounded-xl border border-cyan-300 dark:border-cyan-800 bg-cyan-50/40 dark:bg-cyan-950/20 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-cyan-900 dark:text-cyan-200 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-cyan-700 dark:text-cyan-400" />
                      <span>Penugasan PIC & Keputusan Approval Individual:</span>
                    </span>
                    <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded">
                      PIC Wajib Ditugaskan Sebelum Approval
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        PIC Pelaksana (Operator / Unit Teknis Lapangan) *
                      </label>
                      <input
                        type="text"
                        list="pic-pelaksana-datalist"
                        value={picPelaksana}
                        onChange={(e) => setPicPelaksana(e.target.value)}
                        placeholder="Pilih atau ketik PIC Pelaksana..."
                        className="w-full h-10 px-3.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-semibold focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/15 outline-none transition-all shadow-2xs"
                      />
                      <datalist id="pic-pelaksana-datalist">
                        {departments.map((d) => (
                          <option key={d.kode} value={d.nama} />
                        ))}
                        <option value="Superintendent Shift Operasi Pabrik" />
                        <option value="Superintendent Pemeliharaan Mekanikal" />
                        <option value="Superintendent Pemeliharaan Listrik & Instrumen" />
                        <option value="Supervisor K3 Lapangan" />
                        <option value="Staff Senior Pengadaan" />
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        PIC Pengendali (Vice President / Manager Terkait) *
                      </label>
                      <input
                        type="text"
                        list="pic-pengendali-datalist"
                        value={picPengendali}
                        onChange={(e) => setPicPengendali(e.target.value)}
                        placeholder="Pilih atau ketik PIC Pengendali..."
                        className="w-full h-10 px-3.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-semibold focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/15 outline-none transition-all shadow-2xs"
                      />
                      <datalist id="pic-pengendali-datalist">
                        {departments.map((d) => (
                          <option key={d.kode} value={d.kepalaUnit || `Vice President ${d.nama}`} />
                        ))}
                        <option value="Vice President Operasi Pabrik 1B" />
                        <option value="Vice President Operasi Pabrik 2B" />
                        <option value="Vice President Pemeliharaan" />
                        <option value="Vice President Manajemen Risiko Korporat" />
                      </datalist>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Catatan Resmi Approval Admin Korporat:
                    </label>
                    <textarea
                      rows={2}
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      placeholder="Masukkan catatan instruksi persetujuan, penugasan PIC, atau catatan pengembalian revisi..."
                      className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/15 outline-none transition-all shadow-2xs resize-none"
                    />
                  </div>

                  {/* Action Decision Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleReturnForRevisionIndividual}
                        disabled={isProcessing}
                        className="px-3.5 py-2 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Kembalikan usulan risiko individual ke Unit Kerja dengan status revisi"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Kembalikan untuk Revisi</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleRejectIndividual}
                        disabled={isProcessing}
                        className="px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Tolak</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleApproveIndividual}
                      disabled={isProcessing}
                      className="w-full sm:w-auto px-6 py-2.5 bg-[#005a54] hover:bg-[#004742] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>{isProcessing ? 'Menyimpan Approval...' : 'Setujui Risiko Ini Secara Individual'}</span>
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                Pilih risiko dari antrean di sebelah kiri untuk melihat detail data risiko lengkap sebelum memberikan approval individual.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SUBTAB 3: PENENTUAN PIC / PENGENDALIAN KERJA */}
      {/* ============================================================ */}
      {activeSubTab === 'penentuan-pic' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Left Column: Daftar Risiko untuk Penugasan PIC */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
              <span>Daftar Risiko ({filteredPicRisks.length})</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPicFilterMode('need-pic')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                    picFilterMode === 'need-pic' ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Belum Ada PIC
                </button>
                <button
                  type="button"
                  onClick={() => setPicFilterMode('all')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                    picFilterMode === 'all' ? 'bg-[#005a54] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Semua
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredPicRisks.length === 0 ? (
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                  Semua risiko telah memiliki penugasan PIC resmi.
                </div>
              ) : (
                filteredPicRisks.map((risk) => {
                  const isSelected = picTargetRisk?.id === risk.id;
                  const hasPic = Boolean(risk.picPelaksana && risk.picPengendali && risk.picPelaksana.trim() !== '' && risk.picPengendali.trim() !== '');
                  return (
                    <div
                      key={risk.id}
                      onClick={() => handleSelectPicTarget(risk)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-300 dark:ring-emerald-800'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono font-bold mb-1">
                        <span>{risk.kodeRisiko}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                          hasPic ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                        }`}>
                          {hasPic ? 'PIC Ditugaskan' : 'Perlu PIC'}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-700 dark:text-slate-300 line-clamp-1">
                        {risk.namaOrganisasi}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {risk.pernyataanRisiko}
                      </p>
                      <div className="text-[10px] text-slate-400 font-mono mt-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                        Pelaksana: <strong>{risk.picPelaksana || '-'}</strong>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Form Penentuan PIC & Detail Risiko */}
          <div className="md:col-span-2 space-y-4">
            {picTargetRisk ? (
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="font-mono font-bold text-base text-slate-900 dark:text-slate-100">
                      {picTargetRisk.kodeRisiko}
                    </span>
                    <div className="text-slate-500 font-medium">
                      {picTargetRisk.namaOrganisasi} ({picTargetRisk.kodeOrganisasi})
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold font-mono text-xs">
                    Status: {picTargetRisk.statusWorkflow}
                  </span>
                </div>

                {/* Detail Ringkas Risiko */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Pernyataan Risiko:</span>
                  <p className="font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                    {picTargetRisk.pernyataanRisiko}
                  </p>
                  <div className="flex gap-4 text-[11px] text-slate-500 font-mono pt-1">
                    <span>Inherent Score: <strong>{picTargetRisk.inherentScore} ({picTargetRisk.currentTingkatRisiko})</strong></span>
                    <span>Target TW: <strong>{picTargetRisk.targetWaktuMitigasi}</strong></span>
                    <span>Biaya: <strong>Rp {picTargetRisk.biayaRencanaPengendalian.toLocaleString('id-ID')}</strong></span>
                  </div>
                </div>

                {/* Form Penentuan PIC */}
                <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-4">
                  <span className="font-bold text-xs text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    <span>Formulir Penetapan Resmi PIC Pelaksana & PIC Pengendali:</span>
                  </span>

                  <div className="space-y-3.5">
                    {/* PIC Pelaksana */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        PIC Pelaksana (Operator / Unit Teknis Lapangan) *
                      </label>
                      <select
                        value={assignPicPelaksana}
                        onChange={(e) => setAssignPicPelaksana(e.target.value)}
                        className="w-full h-10 px-3.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-semibold focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 outline-none transition-all shadow-2xs cursor-pointer"
                      >
                        <option value="">-- Pilih Departemen / Unit Pelaksana Terdaftar --</option>
                        {departments.map((d) => (
                          <option key={d.kode} value={d.nama}>
                            {d.kode} - {d.nama}
                          </option>
                        ))}
                        <option value="Superintendent Shift Operasi Pabrik">Superintendent Shift Operasi Pabrik</option>
                        <option value="Superintendent Pemeliharaan Mekanikal">Superintendent Pemeliharaan Mekanikal</option>
                        <option value="Superintendent Pemeliharaan Listrik & Instrumen">Superintendent Pemeliharaan Listrik & Instrumen</option>
                        <option value="Supervisor K3 Lapangan">Supervisor K3 Lapangan</option>
                        <option value="Staff Senior Pengadaan & SCM">Staff Senior Pengadaan & SCM</option>
                        <option value="Risk Officer Unit Kerja">Risk Officer Unit Kerja</option>
                      </select>
                    </div>

                    {/* PIC Pengendali */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        PIC Pengendali (Vice President / Manager Terkait) *
                      </label>
                      <select
                        value={assignPicPengendali}
                        onChange={(e) => setAssignPicPengendali(e.target.value)}
                        className="w-full h-10 px-3.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-semibold focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 outline-none transition-all shadow-2xs cursor-pointer"
                      >
                        <option value="">-- Pilih Pejabat Pengendali Terdaftar --</option>
                        {departments.map((d) => (
                          <option key={d.kode} value={d.kepalaUnit || `Vice President ${d.nama}`}>
                            {d.kepalaUnit || `Vice President ${d.nama}`} ({d.direktorat})
                          </option>
                        ))}
                        <option value="Vice President Operasi Pabrik 1B">Vice President Operasi Pabrik 1B</option>
                        <option value="Vice President Operasi Pabrik 2B">Vice President Operasi Pabrik 2B</option>
                        <option value="Vice President Pemeliharaan">Vice President Pemeliharaan</option>
                        <option value="Vice President Manajemen Risiko Korporat">Vice President Manajemen Risiko Korporat</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      Penetapan PIC terhubung langsung dengan basis data dan tampil di laporan triwulanan.
                    </span>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleSavePicAssignment}
                      className="px-6 py-2.5 bg-[#005a54] hover:bg-[#004742] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isProcessing ? 'Menyimpan...' : 'Simpan Penugasan PIC Resmi'}</span>
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                Pilih risiko dari antrean di sebelah kiri untuk melihat detail dan menetapkan penugasan PIC resmi.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { 
  PlusCircle, 
  Trash2, 
  Edit2,
  Copy, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  ShieldAlert, 
  Shield,
  Calculator, 
  Save, 
  FileCheck, 
  ArrowRight, 
  Sliders, 
  Search,
  Layers,
  ChevronDown,
  ChevronUp,
  Database,
  Users,
  RotateCcw,
  LogOut,
  Send,
  DollarSign,
  Clock,
  X
} from 'lucide-react';
import { PusriRisk, OrganizationMaster, MasterChecklistItem, RiskCategory, RiskHandlingStrategy, UserRole } from '../../types/pusri';
import { PusriApiClient } from '../../services/api';

interface IdentifikasiViewProps {
  currentRole: UserRole;
  risks: PusriRisk[];
  departments: OrganizationMaster[];
  checklist?: MasterChecklistItem[];
  onRiskCreated: (newRisk: PusriRisk) => void;
  onRisksCreated?: (newRisks: PusriRisk[]) => void;
  onSelectRisk: (risk: PusriRisk) => void;
  onNavigateNext?: (nextTab: string, roleToSwitch?: UserRole) => void;
  onLogout?: (roleToSelect?: UserRole) => void;
  onOpenUpdateRiskModal?: (risk: PusriRisk) => void;
  onRiskUpdated?: (updatedRisk: PusriRisk) => void;
}

export interface RiskDraftItem {
  tempId: string;
  kategoriRisiko: RiskCategory;
  sumberRisiko: string;
  pernyataanRisiko: string;
  penyebabRisiko: string;
  dampakRisiko: string;
  pengendalianExisting: string;
  kemungkinanAwal: number;
  dampakAwal: number;
  jenisPenanganan: RiskHandlingStrategy;
  rencanaPenanganan: string;
  targetWaktuMitigasi: string;
  biayaRencanaPengendalian: number;
  picPelaksana: string;
  picPengendali: string;
}

export const DEFAULT_PIC_PELAKSANA_OPTIONS = [
  'DEP. MITRA BISNIS & LOGISTIK',
  'DEP. OPERASI PABRIK 1B',
  'DEP. OPERASI PABRIK 2B',
  'DEP. PEMELIHARAAN MEKANIKAL',
  'DEP. PEMELIHARAAN LISTRIK & INSTRUMEN',
  'DEP. K3 & LINGKUNGAN HIDUP (K3LH)',
  'DEP. PENGADAAN & SCM',
  'DEP. TEKNOLOGI INFORMASI',
  'DEP. KEUANGAN & ANGGARAN',
  'DEP. RISET, INOVASI & TEKNOLOGI',
  'DEP. MANAJEMEN RISIKO & KEPATUHAN',
  'DEP. SUMBER DAYA MANUSIA (SDM)',
  'Superintendent Shift Operasi Pabrik',
  'Superintendent Pemeliharaan Mesin & Turbin',
  'Supervisor K3 Lapangan & Keselamatan Kerja',
  'Lead Engineer Instrumen & Otomasi',
  'Staff Senior Pengadaan & SCM',
  'Risk Officer Unit Kerja'
];

export const IdentifikasiView: React.FC<IdentifikasiViewProps> = ({
  currentRole,
  onLogout,
  risks,
  departments,
  onRiskCreated,
  onRisksCreated,
  onSelectRisk,
  onNavigateNext,
  onOpenUpdateRiskModal,
  onRiskUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'list' | 'revisi'>('form');

  // Shared Context across the batch
  const [kodeOrganisasi, setKodeOrganisasi] = useState(departments[0]?.kode || 'PRD-1B');
  const [tahun, setTahun] = useState(2026);
  const [sasaranRKAP, setSasaranRKAP] = useState('');
  const [sasaranUnitKerja, setSasaranUnitKerja] = useState('');
  const [konteksEksternal, setKonteksEksternal] = useState('');
  const [konteksInternal, setKonteksInternal] = useState('');

  // State for Revisi / Resubmit Action
  const [resubmittingId, setResubmittingId] = useState<string | null>(null);
  const [revisiNotice, setRevisiNotice] = useState<string | null>(null);

  const handleQuickResubmit = async (risk: PusriRisk) => {
    setResubmittingId(risk.id);
    setRevisiNotice(null);
    try {
      const res = await PusriApiClient.updateRiskData(
        risk.id,
        {
          pernyataanRisiko: risk.pernyataanRisiko,
          penyebabRisiko: risk.penyebabRisiko,
          dampakRisiko: risk.dampakRisiko,
          pengendalianExisting: risk.pengendalianExisting,
          kategoriRisiko: risk.kategoriRisiko,
          kemungkinanAwal: risk.kemungkinanAwal,
          dampakAwal: risk.dampakAwal,
          jenisPenanganan: risk.jenisPenanganan,
          rencanaPenanganan: risk.rencanaPenanganan,
          targetWaktuMitigasi: risk.targetWaktuMitigasi,
          biayaRencanaPengendalian: risk.biayaRencanaPengendalian,
          picPelaksana: risk.picPelaksana,
          picPengendali: risk.picPengendali,
          catatanPerbaikan: 'Telah diperbaiki oleh Unit Kerja sesuai arahan evaluasi.',
          resubmit: true
        },
        currentRole,
        'Risk Officer Unit Kerja'
      );
      if (res.success && res.data) {
        onRiskUpdated?.(res.data);
        setRevisiNotice(`Risiko [${risk.kodeRisiko}] berhasil diajukan ulang ke Atasan / VP untuk proses review lanjutan!`);
      } else {
        alert(res.message || 'Gagal mengajukan ulang risiko.');
      }
    } catch (err: any) {
      alert('Terjadi kesalahan saat mengajukan ulang risiko: ' + (err.message || 'Error'));
    } finally {
      setResubmittingId(null);
    }
  };

  // Multi-Risk Drafts List initialized empty with completely blank fields
  const createNewDraftItem = (index?: number): RiskDraftItem => ({
    tempId: `draft-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    kategoriRisiko: 'Operasional',
    sumberRisiko: '',
    pernyataanRisiko: '',
    penyebabRisiko: '',
    dampakRisiko: '',
    pengendalianExisting: '',
    kemungkinanAwal: 3,
    dampakAwal: 3,
    jenisPenanganan: 'Mitigasi',
    rencanaPenanganan: '',
    targetWaktuMitigasi: 'TW 2',
    biayaRencanaPengendalian: 0,
    picPelaksana: '',
    picPengendali: ''
  });

  const [riskDrafts, setRiskDrafts] = useState<RiskDraftItem[]>([]);

  // Modal State for Adding or Editing Risk Details
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [editingDraftIndex, setEditingDraftIndex] = useState<number | null>(null);
  const [draftForm, setDraftForm] = useState<RiskDraftItem>(createNewDraftItem(1));
  const [isCustomPic, setIsCustomPic] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorList, setErrorList] = useState<string[]>([]);

  // Compact result summary of last saved batch (space-saving, non-wasteful)
  const [lastSavedBatch, setLastSavedBatch] = useState<{
    sasaran: string;
    sasaranRKAP: string;
    deptName: string;
    count: number;
    risks: PusriRisk[];
    timestamp: string;
  } | null>(null);

  // Helpers to calculate risk level and SOP rules
  const getRiskLevel = (k: number, d: number) => {
    const score = k * d;
    if (score >= 16) return { level: 'High Risk', color: 'bg-red-500 text-white font-bold' };
    if (score >= 12) return { level: 'Mod to High Risk', color: 'bg-orange-500 text-white font-bold' };
    if (score >= 8) return { level: 'Moderate Risk', color: 'bg-amber-500 text-white font-bold' };
    if (score >= 4) return { level: 'Low to Mod Risk', color: 'bg-emerald-600 text-white font-bold' };
    return { level: 'Low Risk', color: 'bg-emerald-500 text-white font-bold' };
  };

  const handleOpenAddDraft = () => {
    setEditingDraftIndex(null);
    setDraftForm(createNewDraftItem());
    setIsCustomPic(false);
    setIsDraftModalOpen(true);
  };

  const handleResetDraftForm = () => {
    setDraftForm(createNewDraftItem());
    setIsCustomPic(false);
  };

  const handleOpenEditDraft = (index: number) => {
    setEditingDraftIndex(index);
    setDraftForm({ ...riskDrafts[index] });
    const isStandard = DEFAULT_PIC_PELAKSANA_OPTIONS.includes(riskDrafts[index].picPelaksana);
    setIsCustomPic(!isStandard && Boolean(riskDrafts[index].picPelaksana));
    setIsDraftModalOpen(true);
  };

  const handleSaveDraftModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftForm.pernyataanRisiko.trim()) {
      alert('Pernyataan risiko wajib diisi.');
      return;
    }

    if (editingDraftIndex !== null) {
      setRiskDrafts((prev) => {
        const copy = [...prev];
        copy[editingDraftIndex] = { ...draftForm };
        return copy;
      });
    } else {
      setRiskDrafts((prev) => [...prev, { ...draftForm, tempId: `draft-${Date.now()}` }]);
    }

    setIsDraftModalOpen(false);
  };

  const handleRemoveRiskRow = (index: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus butir risiko ini dari draft?')) {
      setRiskDrafts((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // Option to add more risk(s) keeping the exact same strategic & unit objective
  const handleContinueWithSameObjective = () => {
    setRiskDrafts([]);
    setErrorList([]);
    setLastSavedBatch(null);
    handleOpenAddDraft();
  };

  // Bulk Submit Handler
  const handleSubmitBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorList([]);
    setSuccessMessage(null);

    if (riskDrafts.length === 0) {
      setErrorList(['Belum ada butir risiko dalam draft. Silakan klik "+ Tambah Data Risiko (+)".']);
      return;
    }

    const errors: string[] = [];
    riskDrafts.forEach((draft, idx) => {
      const num = idx + 1;
      if (!draft.pernyataanRisiko.trim()) {
        errors.push(`Risiko #${num}: Pernyataan risiko wajib diisi.`);
      }
      if (!draft.penyebabRisiko.trim()) {
        errors.push(`Risiko #${num}: Akar masalah / penyebab risiko wajib diisi.`);
      }
      if (!draft.dampakRisiko.trim()) {
        errors.push(`Risiko #${num}: Uraian dampak risiko wajib diisi.`);
      }

      const score = draft.kemungkinanAwal * draft.dampakAwal;
      const isMitigationMandatory = score >= 10;
      if (isMitigationMandatory && draft.jenisPenanganan !== 'Mitigasi') {
        errors.push(`Risiko #${num}: Skor Inherent adalah ${score} (≥10). Berdasarkan SOP Pusri, risiko tingkat High/Mod-to-High WAJIB memilih strategi 'Mitigasi'.`);
      }
      if (draft.jenisPenanganan === 'Mitigasi' && !draft.rencanaPenanganan.trim()) {
        errors.push(`Risiko #${num}: Rencana tindakan mitigasi wajib diisi.`);
      }
    });

    if (errors.length > 0) {
      setErrorList(errors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    const selectedDept = departments.find((d) => d.kode === kodeOrganisasi);
    const startIndex = risks.length + 1;

    const payloadList: Partial<PusriRisk>[] = riskDrafts.map((draft, idx) => {
      const code = `RSK-2026-${String(startIndex + idx).padStart(3, '0')}`;
      const inherentScore = draft.kemungkinanAwal * draft.dampakAwal;
      const levelInfo = getRiskLevel(draft.kemungkinanAwal, draft.dampakAwal);
      const isMandatory = inherentScore >= 10;

      const mitigationStatus = inherentScore >= 16
        ? 'Wajib Mitigasi Segera (High Risk)'
        : inherentScore >= 12
          ? 'Wajib Mitigasi Aktif (Mod to High)'
          : inherentScore >= 8
            ? 'Mitigasi Direkomendasikan (Moderate)'
            : 'Toleransi Terpenuhi (Dapat Diterima)';

      return {
        id: code,
        kodeRisiko: code,
        kodeOrganisasi,
        namaOrganisasi: selectedDept ? selectedDept.nama : 'Departemen Operasi Pabrik 1B',
        tahun,
        sasaranRKAP,
        sasaranUnitKerja,
        konteksEksternal,
        konteksInternal,
        sumberRisiko: draft.sumberRisiko,
        pernyataanRisiko: draft.pernyataanRisiko,
        penyebabRisiko: draft.penyebabRisiko,
        dampakRisiko: draft.dampakRisiko,
        pengendalianExisting: draft.pengendalianExisting,
        kategoriRisiko: draft.kategoriRisiko,
        kemungkinanAwal: draft.kemungkinanAwal,
        dampakAwal: draft.dampakAwal,
        tingkatRisikoAwal: levelInfo.level as any,
        currentTingkatRisiko: levelInfo.level as any,
        inherentScore,
        jenisPenanganan: draft.jenisPenanganan,
        butuhMitigasi: isMandatory || draft.jenisPenanganan === 'Mitigasi',
        statusKebutuhanMitigasi: mitigationStatus,
        alasanKebutuhanMitigasi: isMandatory
          ? `Skor inherent ${inherentScore} (≥10) melebihi batas toleransi selera risiko Pusri. Wajib mitigasi.`
          : `Skor inherent ${inherentScore} (<10) dalam toleransi wajar.`,
        rencanaPenanganan: draft.rencanaPenanganan,
        targetWaktuMitigasi: draft.targetWaktuMitigasi,
        biayaRencanaPengendalian: Number(draft.biayaRencanaPengendalian) || 0,
        picPelaksana: draft.picPelaksana || 'DEP. MITRA BISNIS & LOGISTIK',
        picPengendali: draft.picPengendali || 'Vice President Departemen',
        jenisAnggaran: 'Investasi Rutin / OPEX',
        statusWorkflow: 'Menunggu_Approval_VP',
        createdBy: `${currentRole} - Officer Unit`
      };
    });

    try {
      const createdRisks = await PusriApiClient.submitIdentifikasiForApproval({
        kodeOrganisasi,
        namaOrganisasi: selectedDept?.nama || 'Departemen Operasi Pabrik Pusri IIB',
        tahun,
        sasaranRKAP,
        sasaranUnitKerja,
        konteksEksternal,
        konteksInternal,
        createdBy: `${currentRole} - Officer Unit`,
        risks: payloadList
      });

      if (createdRisks && createdRisks.length > 0) {
        if (onRisksCreated) {
          onRisksCreated(createdRisks);
        } else {
          createdRisks.forEach((r) => onRiskCreated(r));
        }

        const deptTitle = selectedDept ? selectedDept.nama : kodeOrganisasi;

        setLastSavedBatch({
          sasaran: sasaranUnitKerja,
          sasaranRKAP: sasaranRKAP,
          deptName: deptTitle,
          count: createdRisks.length,
          risks: createdRisks,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        });

        // Clear drafts after successful submission
        setRiskDrafts([]);
        setSuccessMessage(null);

        // Smooth scroll to top of form to see the sleek compact result banner
        const el = document.getElementById('result-summary-banner');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    } catch (err: any) {
      setErrorList([err?.message || 'Gagal menyimpan usulan risiko ke database MySQL.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto py-2">
      {/* Header Banner (Pusri White, Soft Yellow & Light Blue) */}
      <div className="p-5 md:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-sky-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-yellow-100/50 via-sky-50/60 to-transparent pointer-events-none dark:opacity-20" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-[#009fe3] text-[10px] font-bold uppercase tracking-wider border border-sky-200">
              Tahap 1-7 SOP Pusri
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-yellow-100 text-amber-900 text-[10px] font-bold uppercase tracking-wider border border-yellow-200">
              Unit Kerja
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Formulir Identifikasi Risiko
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
            Input data sasaran dan susun butir risiko dalam formulir. Tentukan PIC Pelaksana per risiko secara fleksibel, lalu simpan langsung ke database.
          </p>
        </div>
      </div>

      {/* Tabs Switcher: Formulir Input Risiko vs Daftar Register Risiko Unit vs Risiko Perlu Perbaikan */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex gap-3 text-xs font-bold flex-wrap">
          <button
            onClick={() => setActiveTab('form')}
            className={`pb-2 px-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'form'
                ? 'border-[#009fe3] text-[#009fe3] dark:text-sky-300 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Formulir Input Risiko</span>
          </button>

          <button
            onClick={() => setActiveTab('list')}
            className={`pb-2 px-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'list'
                ? 'border-[#009fe3] text-[#009fe3] dark:text-sky-300 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Daftar Register Risiko Unit</span>
          </button>

          <button
            onClick={() => setActiveTab('revisi')}
            className={`pb-2 px-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'revisi'
                ? 'border-amber-500 text-amber-800 dark:text-yellow-300 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Risiko Perlu Perbaikan (Revisi)</span>
            {risks.filter((r) => r.statusWorkflow === 'Revisi' || (r.statusWorkflow as string) === 'revisi').length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-yellow-400 text-slate-900 font-mono font-bold">
                {risks.filter((r) => r.statusWorkflow === 'Revisi' || (r.statusWorkflow as string) === 'revisi').length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Validation Errors Alert */}
      {errorList.length > 0 && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 text-xs space-y-1">
          <div className="font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>Validasi Data Risiko Belum Lengkap:</span>
          </div>
          <ul className="list-disc pl-5 space-y-0.5">
            {errorList.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Sleek Space-Saving Result Banner: "tanpa membuat boros tempat untuk hasil" */}
      {lastSavedBatch && (
        <div
          id="result-summary-banner"
          className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/95 via-teal-950/95 to-slate-900 border border-emerald-500/50 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in duration-200"
        >
          {/* Left info: Compact */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{lastSavedBatch.count} Risiko Berhasil Terdata Langsung di Database MySQL (Tidak Ada Duplikasi)</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                  Status: Menunggu Review VP
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {lastSavedBatch.timestamp} WIB
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-300 mt-0.5 truncate">
                <span className="text-zinc-400">Sasaran Terkunci:</span>
                <strong className="text-emerald-300 font-semibold truncate">"{lastSavedBatch.sasaran}"</strong>
                <span className="text-zinc-500">•</span>
                <span className="text-zinc-400 truncate">{lastSavedBatch.deptName}</span>
                <span className="text-zinc-500">|</span>
                <div className="flex items-center gap-1 shrink-0 overflow-x-auto">
                  {lastSavedBatch.risks.map((r) => (
                    <span
                      key={r.id}
                      className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-zinc-900/90 border border-emerald-500/30 text-emerald-300"
                    >
                      {r.kodeRisiko}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right action buttons: Direct option to add another risk for same objective or move forward */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={handleContinueWithSameObjective}
              className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/50 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Tambah Risiko Lagi (Sasaran Sama)</span>
            </button>

            {currentRole === 'Unit Kerja' ? (
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="py-1.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 transition-all cursor-pointer"
              >
                <span>Lihat Register Risiko Unit</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (onNavigateNext) {
                    onNavigateNext('review-vp');
                  }
                }}
                className="py-1.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 transition-all cursor-pointer"
              >
                <span>Lanjut Review VP</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setLastSavedBatch(null)}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800/80 cursor-pointer"
              title="Tutup Ringkasan"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Info status if continuing with same objective */}
      {successMessage && !lastSavedBatch && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-xs text-emerald-600 hover:underline cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* TAB CONTENT: FORMULIR MULTI-INPUT */}
      {activeTab === 'form' && (
        <form onSubmit={handleSubmitBatch} className="space-y-5">
          {/* Section 1: Konteks & Sasaran RKAP / Unit Kerja */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#005a54] dark:text-emerald-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Parameter Konteks & Sasaran Kerja
                </h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                Shared Objective
              </span>
            </div>

            {/* Structured 6-Column Precision Grid */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 text-xs">
              {/* Unit Kerja / Departemen (4 cols) */}
              <div className="md:col-span-4">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Unit Kerja / Departemen Pemilik Risiko *
                </label>
                <select
                  value={kodeOrganisasi}
                  onChange={(e) => setKodeOrganisasi(e.target.value)}
                  className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-semibold focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 outline-none transition-all cursor-pointer shadow-2xs"
                >
                  {departments.map((dept) => (
                    <option key={dept.kode} value={dept.kode}>
                      {dept.kode} - {dept.nama}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tahun Anggaran RKAP (2 cols) */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tahun Anggaran RKAP *
                </label>
                <input
                  type="number"
                  value={tahun}
                  onChange={(e) => setTahun(Number(e.target.value))}
                  className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 outline-none transition-all shadow-2xs"
                />
              </div>

              {/* Sasaran Strategis RKAP (3 cols / 50%) */}
              <div className="md:col-span-3">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Sasaran Strategis RKAP Korporat *
                </label>
                <input
                  type="text"
                  value={sasaranRKAP}
                  onChange={(e) => setSasaranRKAP(e.target.value)}
                  className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 outline-none transition-all shadow-2xs"
                />
              </div>

              {/* Sasaran Unit Kerja (3 cols / 50%) */}
              <div className="md:col-span-3">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Sasaran Unit Kerja Pemilik Risiko
                </label>
                <input
                  type="text"
                  value={sasaranUnitKerja}
                  onChange={(e) => setSasaranUnitKerja(e.target.value)}
                  className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 outline-none transition-all shadow-2xs"
                />
              </div>

              {/* Konteks Eksternal (3 cols / 50%) */}
              <div className="md:col-span-3">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Konteks Eksternal (Pasar, Vendor, Regulasi)
                </label>
                <input
                  type="text"
                  value={konteksEksternal}
                  onChange={(e) => setKonteksEksternal(e.target.value)}
                  className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 outline-none transition-all shadow-2xs"
                />
              </div>

              {/* Konteks Internal (3 cols / 50%) */}
              <div className="md:col-span-3">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Konteks Internal (SOP, Shift, Keandalan Mesin)
                </label>
                <input
                  type="text"
                  value={konteksInternal}
                  onChange={(e) => setKonteksInternal(e.target.value)}
                  className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 outline-none transition-all shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Section 2: DATA RISIKO TABLE (Exact match to requested UI layout) */}
          <div id="risk-drafts-table-section" className="space-y-3">
            {/* Header: DATA RISIKO * (X butir risiko dalam draft) + button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    DATA RISIKO
                  </h3>
                  <span className="text-red-500 font-bold">*</span>
                  <span className="text-slate-500 dark:text-slate-400 font-normal text-xs">
                    ({riskDrafts.length} butir risiko dalam draft)
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenAddDraft}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-teal-600 dark:border-teal-500 text-teal-700 dark:text-teal-300 bg-white dark:bg-slate-900 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-xs font-bold transition-all shadow-2xs cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Tambah Data Risiko</span>
              </button>
            </div>

            {/* The Draft Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold text-slate-700 dark:text-slate-300 bg-slate-50/70 dark:bg-slate-800/40">
                    <th className="py-3 px-3 text-center w-12 font-bold">NO</th>
                    <th className="py-3 px-3 min-w-[210px] font-bold">RISIKO</th>
                    <th className="py-3 px-3 min-w-[150px] font-bold">PENYEBAB</th>
                    <th className="py-3 px-3 min-w-[250px] font-bold">DESKRIPSI & MITIGASI</th>
                    <th className="py-3 px-3 min-w-[180px] font-bold">STATUS MITIGASI</th>
                    <th className="py-3 px-3 text-center w-20 font-bold">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {riskDrafts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 dark:text-slate-400">
                        <div className="max-w-xs mx-auto space-y-2">
                          <p className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                            Belum ada butir risiko dalam draft
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Klik tombol <strong>"+ Tambah Data Risiko (+)"</strong> di atas untuk menambahkan risiko pertama.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    riskDrafts.map((draft, idx) => {
                      const score = draft.kemungkinanAwal * draft.dampakAwal;
                      const levelInfo = getRiskLevel(draft.kemungkinanAwal, draft.dampakAwal);

                      return (
                        <tr key={draft.tempId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          {/* 1. NO */}
                          <td className="py-3 px-3 text-center font-bold text-slate-700 dark:text-slate-300 align-top pt-3.5">
                            {idx + 1}
                          </td>

                          {/* 2. RISIKO */}
                          <td className="py-3 px-3 align-top space-y-1.5">
                            <div className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                              {draft.pernyataanRisiko || '(Belum Diisi - Klik Edit untuk Mengisi)'}
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] ${levelInfo.color}`}>
                                {levelInfo.level} (L{draft.kemungkinanAwal} × D{draft.dampakAwal} = {score})
                              </span>
                              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-medium border border-slate-200/60 dark:border-slate-700">
                                {draft.kategoriRisiko}
                              </span>
                            </div>
                          </td>

                          {/* 3. PENYEBAB */}
                          <td className="py-3 px-3 text-slate-700 dark:text-slate-300 align-top leading-relaxed text-xs">
                            {draft.penyebabRisiko || '-'}
                          </td>

                          {/* 4. DESKRIPSI & MITIGASI */}
                          <td className="py-3 px-3 align-top space-y-1.5">
                            <div className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
                              {draft.dampakRisiko || '-'}
                            </div>
                            <div className="p-1.5 rounded-lg border border-teal-300/80 dark:border-teal-800 bg-teal-50/60 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 text-[11px] leading-snug">
                              <strong className="font-bold text-[#005a54] dark:text-teal-300">Mitigasi:</strong> {draft.rencanaPenanganan || '(Belum ada rencana penanganan)'}
                            </div>
                          </td>

                          {/* 5. STATUS MITIGASI */}
                          <td className="py-3 px-3 align-top space-y-1">
                            <div>
                              <span className="px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-700 text-[10px] font-bold inline-block">
                                {draft.jenisPenanganan || 'Mitigasi'}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                              PIC: <span className="font-semibold text-emerald-700 dark:text-emerald-400">Ditetapkan oleh Admin</span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              Target: {draft.targetWaktuMitigasi || 'TW 2'}
                            </div>
                          </td>

                          {/* 6. AKSI */}
                          <td className="py-3 px-3 text-center align-top pt-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditDraft(idx)}
                                className="p-1.5 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-lg transition-colors cursor-pointer"
                                title="Ubah Data Risiko Ini"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveRiskRow(idx)}
                                className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Data Risiko Ini"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Bar & Multi-Risk Submission */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                  Total Draf: <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">{riskDrafts.length} Risiko</strong>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Semua butir risiko yang ada di tabel draf akan diteruskan ke tahap Review Atasan / VP.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="submit"
                disabled={isSubmitting || riskDrafts.length === 0}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-[#005a54] hover:from-emerald-500 hover:to-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/40 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-emerald-200" />
                    <span>Simpan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB CONTENT: DAFTAR REGISTER RISIKO */}
      {activeTab === 'list' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#005a54]" />
                <span>Daftar Register Risiko Organisasi yang Tersimpan</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Total {risks.length} data risiko tercatat di sistem terpusat PT Pupuk Sriwidjaja Palembang
              </p>
            </div>
            <button
              onClick={() => setActiveTab('form')}
              className="px-3 py-1.5 bg-[#005a54] text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Input Risiko Baru</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                  <th className="py-2.5 px-3">Kode & Unit</th>
                  <th className="py-2.5 px-3">Pernyataan Risiko</th>
                  <th className="py-2.5 px-3 text-center">Inherent Score</th>
                  <th className="py-2.5 px-3">PIC Pelaksana</th>
                  <th className="py-2.5 px-3 text-center">Status Mitigasi</th>
                  <th className="py-2.5 px-3 text-center">Alur Workflow</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {risks.map((risk) => (
                  <tr key={risk.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                        {risk.kodeRisiko}
                      </div>
                      <div className="text-[10px] text-slate-500">{risk.kodeOrganisasi}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 max-w-sm truncate">
                        {risk.pernyataanRisiko}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {risk.kategoriRisiko} • Sasaran: {risk.sasaranUnitKerja}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                        (risk.inherentScore || risk.kemungkinanAwal * risk.dampakAwal) >= 16
                          ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                          : (risk.inherentScore || risk.kemungkinanAwal * risk.dampakAwal) >= 10
                            ? 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300'
                            : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      }`}>
                        {risk.inherentScore || risk.kemungkinanAwal * risk.dampakAwal} ({risk.currentTingkatRisiko || risk.tingkatRisikoAwal})
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                        {risk.picPelaksana || '-'}
                      </div>
                      <div className="text-[10px] text-slate-400">Target: {risk.targetWaktuMitigasi}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        risk.butuhMitigasi
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                      }`}>
                        {risk.statusKebutuhanMitigasi || (risk.butuhMitigasi ? 'Wajib Mitigasi' : 'Toleransi Wajar')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold text-[11px]">
                      {risk.statusWorkflow === 'Revisi' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                          (revisi)
                        </span>
                      ) : (
                        <span className="text-slate-600 dark:text-slate-400">
                          {risk.statusWorkflow.replace(/_/g, ' ')}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onSelectRisk(risk)}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#005a54] dark:text-emerald-400 font-bold rounded-lg transition-colors cursor-pointer"
                          title="Lihat Detail Risiko"
                        >
                          Detail
                        </button>
                        <button
                          onClick={() => {
                            if (onOpenUpdateRiskModal) {
                              onOpenUpdateRiskModal(risk);
                            } else {
                              onSelectRisk(risk);
                            }
                          }}
                          className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-[#005a54] dark:text-emerald-300 font-bold rounded-lg transition-colors cursor-pointer border border-emerald-200 dark:border-emerald-800"
                          title="Ubah / Edit Data Risiko"
                        >
                          Update
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: RISIKO PERLU PERBAIKAN (REVISI) */}
      {activeTab === 'revisi' && (
        <div className="space-y-4">
          {/* Notification Toast */}
          {revisiNotice && (
            <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 text-[#009fe3] text-xs font-semibold flex items-center justify-between shadow-2xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{revisiNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setRevisiNotice(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Header Info Banner */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-800 shadow-xs space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-600" />
                <span>Daftar Risiko Perlu Perbaikan (Revisi)</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold border border-amber-200">
                {risks.filter((r) => r.statusWorkflow === 'Revisi' || (r.statusWorkflow as string) === 'revisi' || r.statusWorkflow === 'Draft_Unit').length} Data Memerlukan Tindak Lanjut
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Risiko berikut dikembalikan oleh Atasan/VP atau Admin dengan catatan evaluasi. Silakan periksa detail arahan perbaikan, sesuaikan parameter jika diperlukan, lalu klik tombol <strong>"Ajukan Ulang"</strong> untuk mengirimkannya kembali ke antrean review Atasan / VP.
            </p>
          </div>

          <div className="space-y-4">
            {risks.filter((r) => r.statusWorkflow === 'Revisi' || (r.statusWorkflow as string) === 'revisi' || r.statusWorkflow === 'Draft_Unit').length === 0 ? (
              <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 space-y-2">
                <CheckCircle2 className="w-9 h-9 text-emerald-500 mx-auto opacity-70" />
                <p className="font-bold text-slate-700 dark:text-slate-300">Tidak ada risiko yang membutuhkan perbaikan saat ini.</p>
                <p className="text-[11px] text-slate-500">Semua usulan risiko unit kerja telah diproses sesuai alur tata kelola Pusri.</p>
              </div>
            ) : (
              risks
                .filter((r) => r.statusWorkflow === 'Revisi' || (r.statusWorkflow as string) === 'revisi' || r.statusWorkflow === 'Draft_Unit')
                .map((risk) => {
                  const score = risk.inherentScore || ((risk.kemungkinanAwal || 1) * (risk.dampakAwal || 1));
                  const isProcessingThis = resubmittingId === risk.id;

                  return (
                    <div
                      key={risk.id}
                      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 shadow-xs space-y-4 text-xs hover:border-amber-300 transition-colors"
                    >
                      {/* Card Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-black text-sm text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                            {risk.kodeRisiko}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] border border-amber-200 flex items-center gap-1">
                            <RotateCcw className="w-3 h-3 text-amber-600" />
                            <span>Perlu Perbaikan (Revisi)</span>
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-sky-50 text-[#009fe3] font-semibold border border-sky-100">
                            {risk.namaOrganisasi}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                            Kategori: {risk.kategoriRisiko}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 font-bold border border-orange-200">
                            Inherent: {score} ({risk.tingkatRisikoAwal || 'Mod to High'})
                          </span>
                        </div>

                        {/* Direct Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Button "Ajukan Ulang" */}
                          <button
                            type="button"
                            disabled={isProcessingThis}
                            onClick={() => handleQuickResubmit(risk)}
                            className="px-4 py-2 bg-[#009fe3] hover:bg-[#0087c2] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            title="Ajukan Kembali ke Atasan / VP"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{isProcessingThis ? 'Mengajukan...' : 'Ajukan Ulang'}</span>
                          </button>

                          {/* Button "Perbaiki Data" */}
                          {onOpenUpdateRiskModal && (
                            <button
                              type="button"
                              onClick={() => onOpenUpdateRiskModal(risk)}
                              className="px-3.5 py-2 bg-yellow-50 hover:bg-yellow-100 text-amber-900 border border-yellow-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                              title="Buka Formulir untuk Mengubah Isian Data Risiko"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-amber-700" />
                              <span>Perbaiki Data</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onSelectRisk(risk)}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Detail
                          </button>
                        </div>
                      </div>

                      {/* Catatan Arahan Revisi dari Reviewer / Approver */}
                      {(risk.reviewNotesVp || risk.approvalNotesAdmin) && (
                        <div className="p-3.5 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl space-y-1">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Catatan Arahan Perbaikan dari Reviewer / Approver:</span>
                          </div>
                          <p className="text-slate-800 dark:text-slate-200 italic font-medium leading-relaxed pl-5 text-xs">
                            "{risk.reviewNotesVp || risk.approvalNotesAdmin}"
                          </p>
                        </div>
                      )}

                      {/* Rincian Lengkap Data yang Perlu Direvisi */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">1. Pernyataan Risiko:</span>
                            <p className="font-bold text-slate-900 dark:text-slate-100 leading-snug mt-0.5">{risk.pernyataanRisiko}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">2. Akar Masalah / Penyebab:</span>
                            <p className="text-slate-700 dark:text-slate-300 mt-0.5">{risk.penyebabRisiko || '-'}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">3. Uraian Dampak Risiko:</span>
                            <p className="text-slate-700 dark:text-slate-300 mt-0.5">{risk.dampakRisiko || '-'}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">4. Pengendalian Existing:</span>
                            <p className="text-slate-700 dark:text-slate-300 mt-0.5">{risk.pengendalianExisting || '-'}</p>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">5. Rencana Tindakan Mitigasi:</span>
                            <p className="text-slate-800 dark:text-slate-200 font-medium mt-0.5">{risk.rencanaPenanganan || '-'}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 dark:border-slate-800 text-[11px]">
                            <div>
                              <span className="text-[10px] text-slate-500 block">Matriks:</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                K: {risk.kemungkinanAwal} × D: {risk.dampakAwal} = {score}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 block">Target Waktu:</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{risk.targetWaktuMitigasi || 'TW 2'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 block">Estimasi Biaya:</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                Rp {Number(risk.biayaRencanaPengendalian || 0).toLocaleString('id-ID')}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 block">PIC Pelaksana:</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block" title={risk.picPelaksana}>
                                {risk.picPelaksana || '-'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Status & Action */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex-wrap gap-2">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Terakhir diperbarui: {new Date(risk.updatedDate || risk.createdDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-amber-700 dark:text-yellow-400 font-semibold">
                            Siap diajukan kembali ke VP?
                          </span>
                          <button
                            type="button"
                            disabled={isProcessingThis}
                            onClick={() => handleQuickResubmit(risk)}
                            className="px-3 py-1 bg-[#009fe3] hover:bg-[#0087c2] text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <Send className="w-3 h-3" />
                            <span>Ajukan Ulang</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH / UBAH DATA RISIKO (WITH RICH PIC PELAKSANA SELECTION) */}
      {isDraftModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full p-5 sm:p-6 space-y-4 shadow-2xl my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    {editingDraftIndex !== null ? `Ubah Data Risiko (Baris #${editingDraftIndex + 1})` : 'Tambah Butir Data Risiko Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Lengkapi parameter risiko, matriks kemungkinan & dampak, mitigasi, serta tentukan PIC Pelaksana.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDraftModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveDraftModal} className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
              {/* Pernyataan Risiko */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Peristiwa / Pernyataan Risiko *
                </label>
                <input
                  type="text"
                  required
                  placeholder=""
                  value={draftForm.pernyataanRisiko}
                  onChange={(e) => setDraftForm({ ...draftForm, pernyataanRisiko: e.target.value })}
                  className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-semibold focus:border-teal-600 focus:ring-2 focus:ring-teal-500/15 outline-none transition-all shadow-2xs"
                />
              </div>

              {/* Kategori, Sumber & Target Waktu */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Kategori Risiko *
                  </label>
                  <select
                    value={draftForm.kategoriRisiko}
                    onChange={(e) => setDraftForm({ ...draftForm, kategoriRisiko: e.target.value as RiskCategory })}
                    className="w-full h-10 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-semibold focus:border-teal-600 focus:ring-2 focus:ring-teal-500/15 outline-none transition-all shadow-2xs cursor-pointer"
                  >
                    <option value="Operasional">Operasional</option>
                    <option value="Keuangan">Keuangan</option>
                    <option value="Strategis">Strategis</option>
                    <option value="Hukum & Kepatuhan">Hukum & Kepatuhan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Sumber / Area Risiko
                  </label>
                  <input
                    type="text"
                    value={draftForm.sumberRisiko}
                    onChange={(e) => setDraftForm({ ...draftForm, sumberRisiko: e.target.value })}
                    placeholder=""
                    className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/15 outline-none transition-all shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Target Waktu Mitigasi *
                  </label>
                  <select
                    value={draftForm.targetWaktuMitigasi}
                    onChange={(e) => setDraftForm({ ...draftForm, targetWaktuMitigasi: e.target.value })}
                    className="w-full h-10 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-semibold focus:border-teal-600 focus:ring-2 focus:ring-teal-500/15 outline-none transition-all shadow-2xs cursor-pointer"
                  >
                    <option value="TW 1">TW 1 (Januari - Maret)</option>
                    <option value="TW 2">TW 2 (April - Juni)</option>
                    <option value="TW 3">TW 3 (Juli - September)</option>
                    <option value="TW 4">TW 4 (Oktober - Desember)</option>
                  </select>
                </div>
              </div>

              {/* Matriks Skor: Kemungkinan & Dampak (HANYA ADMIN YANG BERHAK MENENTUKAN TINGKAT RISIKO) */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                      Penilaian Inherent Risk (Matriks 5×5 Pusri)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${getRiskLevel(draftForm.kemungkinanAwal, draftForm.dampakAwal).color}`}>
                      {getRiskLevel(draftForm.kemungkinanAwal, draftForm.dampakAwal).level} (L{draftForm.kemungkinanAwal} × D{draftForm.dampakAwal} = {draftForm.kemungkinanAwal * draftForm.dampakAwal})
                    </span>
                  </div>
                </div>

                {/* Role-based Authorization Notice with Re-login Guidance */}
                {currentRole !== 'Admin' ? (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 text-[11px] text-amber-900 dark:text-amber-200 space-y-2">
                    <div className="flex items-center gap-2 font-bold">
                      <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>Peringatan Posisi Unit Kerja: Slider Level Risiko Terkunci</span>
                    </div>
                    <p className="text-amber-800 dark:text-amber-300 leading-relaxed text-[11px]">
                      Penentuan & kalibrasi tingkat risiko (Kemungkinan & Dampak) hanya dapat diubah oleh <strong>Admin Manajemen Risiko</strong>. Jika Anda bertindak sebagai Admin atau Atasan / VP, silakan login ulang sebagai akun tersebut.
                    </p>
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <span className="text-[10px] font-semibold text-amber-800 dark:text-amber-300">Arahan Akses:</span>
                      <button
                        type="button"
                        onClick={() => onLogout?.('Admin')}
                        className="px-2.5 py-1 bg-[#005a54] hover:bg-[#004742] text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <LogOut className="w-3 h-3" />
                        <span>Login Ulang sbg Admin</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onLogout?.('Atasan / VP')}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <LogOut className="w-3 h-3" />
                        <span>Login Ulang sbg VP</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      <strong>Wewenang Admin:</strong> Anda memiliki hak penuh untuk menentukan, menggeser slider, dan mengkalibrasi tingkat risiko.
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1.5 font-medium">
                      Level Kemungkinan (Likelihood: 1–5): <strong className="text-slate-900 dark:text-slate-100 font-mono text-xs">{draftForm.kemungkinanAwal}</strong>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      disabled={currentRole !== 'Admin'}
                      value={draftForm.kemungkinanAwal}
                      onChange={(e) => setDraftForm({ ...draftForm, kemungkinanAwal: Number(e.target.value) })}
                      className={`w-full ${currentRole === 'Admin' ? 'accent-emerald-600 cursor-pointer' : 'opacity-60 cursor-not-allowed accent-slate-400'}`}
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                      <span>1 (Sangat Jarang)</span>
                      <span>3 (Sedang)</span>
                      <span>5 (Hampir Pasti)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1.5 font-medium">
                      Level Dampak (Impact: 1–5): <strong className="text-slate-900 dark:text-slate-100 font-mono text-xs">{draftForm.dampakAwal}</strong>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      disabled={currentRole !== 'Admin'}
                      value={draftForm.dampakAwal}
                      onChange={(e) => setDraftForm({ ...draftForm, dampakAwal: Number(e.target.value) })}
                      className={`w-full ${currentRole === 'Admin' ? 'accent-emerald-600 cursor-pointer' : 'opacity-60 cursor-not-allowed accent-slate-400'}`}
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                      <span>1 (Tidak Signifikan)</span>
                      <span>3 (Moderat)</span>
                      <span>5 (Bencana/Kritis)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Penyebab & Deskripsi Dampak */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Akar Masalah / Penyebab Risiko *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder=""
                    value={draftForm.penyebabRisiko}
                    onChange={(e) => setDraftForm({ ...draftForm, penyebabRisiko: e.target.value })}
                    className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/15 outline-none transition-all shadow-2xs resize-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Deskripsi / Uraian Dampak Risiko *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder=""
                    value={draftForm.dampakRisiko}
                    onChange={(e) => setDraftForm({ ...draftForm, dampakRisiko: e.target.value })}
                    className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/15 outline-none transition-all shadow-2xs resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Rencana Penanganan (Mitigasi) & Jenis Penanganan */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Rencana Penanganan (Mitigasi) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder=""
                    value={draftForm.rencanaPenanganan}
                    onChange={(e) => setDraftForm({ ...draftForm, rencanaPenanganan: e.target.value })}
                    className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/15 outline-none transition-all shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Jenis Strategi Penanganan
                  </label>
                  <select
                    value={draftForm.jenisPenanganan}
                    onChange={(e) => setDraftForm({ ...draftForm, jenisPenanganan: e.target.value as RiskHandlingStrategy })}
                    className="w-full h-10 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-semibold focus:border-teal-600 focus:ring-2 focus:ring-teal-500/15 outline-none transition-all shadow-2xs cursor-pointer"
                  >
                    <option value="Mitigasi">Mitigasi</option>
                    <option value="Diterima">Diterima (Accept)</option>
                    <option value="Dihindari">Dihindari (Avoid)</option>
                    <option value="Ditransfer">Ditransfer (Transfer)</option>
                  </select>
                </div>
              </div>

              {/* INFORMASI PENETAPAN PIC OLEH ADMIN */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                <Users className="w-4 h-4 text-[#005a54] dark:text-emerald-400 shrink-0" />
                <span className="text-[11px] leading-relaxed">
                  <strong>Penetapan PIC Pelaksana & PIC Pengendali:</strong> Ditentukan dan ditugaskan secara resmi oleh <strong>Admin Manajemen Risiko</strong> pada tahap persetujuan final korporat (bukan oleh Unit Kerja / VP).
                </span>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={handleResetDraftForm}
                  className="px-3.5 py-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Bersihkan Form</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDraftModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Data Risiko ke Tabel Draf</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

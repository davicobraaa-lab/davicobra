import React, { useState, useEffect } from 'react';
import { 
  X, 
  Shield, 
  RotateCcw, 
  Save, 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  Clock, 
  DollarSign, 
  FileText,
  Calculator,
  Info
} from 'lucide-react';
import { PusriRisk, UserRole, RiskCategory, RiskHandlingStrategy, RiskLevel } from '../types/pusri';
import { PusriApiClient } from '../services/api';

interface UpdateRiskModalProps {
  isOpen: boolean;
  onClose: () => void;
  risk: PusriRisk | null;
  currentRole: UserRole;
  currentUser?: { nama?: string; role?: UserRole; unitKerja?: string } | null;
  onRiskUpdated: (updatedRisk: PusriRisk) => void;
}

export const UpdateRiskModal: React.FC<UpdateRiskModalProps> = ({
  isOpen,
  onClose,
  risk,
  currentRole,
  currentUser,
  onRiskUpdated
}) => {
  // Form State
  const [pernyataanRisiko, setPernyataanRisiko] = useState('');
  const [penyebabRisiko, setPenyebabRisiko] = useState('');
  const [dampakRisiko, setDampakRisiko] = useState('');
  const [pengendalianExisting, setPengendalianExisting] = useState('');
  const [kategoriRisiko, setKategoriRisiko] = useState<RiskCategory>('Operasional');
  const [kemungkinanAwal, setKemungkinanAwal] = useState<number>(3);
  const [dampakAwal, setDampakAwal] = useState<number>(3);
  const [jenisPenanganan, setJenisPenanganan] = useState<RiskHandlingStrategy>('Mitigasi');
  const [rencanaPenanganan, setRencanaPenanganan] = useState('');
  const [targetWaktuMitigasi, setTargetWaktuMitigasi] = useState('TW 2');
  const [biayaRencanaPengendalian, setBiayaRencanaPengendalian] = useState<number>(0);
  const [catatanPerbaikan, setCatatanPerbaikan] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Synchronize form values whenever `risk` changes
  useEffect(() => {
    if (risk) {
      setPernyataanRisiko(risk.pernyataanRisiko || '');
      setPenyebabRisiko(risk.penyebabRisiko || '');
      setDampakRisiko(risk.dampakRisiko || '');
      setPengendalianExisting(risk.pengendalianExisting || '');
      setKategoriRisiko(risk.kategoriRisiko || 'Operasional');
      setKemungkinanAwal(risk.kemungkinanAwal || 3);
      setDampakAwal(risk.dampakAwal || 3);
      setJenisPenanganan(risk.jenisPenanganan || 'Mitigasi');
      setRencanaPenanganan(risk.rencanaPenanganan || '');
      setTargetWaktuMitigasi(risk.targetWaktuMitigasi || 'TW 2');
      setBiayaRencanaPengendalian(risk.biayaRencanaPengendalian || 0);
      setCatatanPerbaikan('');
      setSuccessMessage(null);
      setErrorMessage(null);
      setValidationErrors([]);
    }
  }, [risk, isOpen]);

  if (!isOpen || !risk) return null;

  // Real-time matrix calculation
  const inherentScore = kemungkinanAwal * dampakAwal;
  const calculateLevel = (score: number): RiskLevel => {
    if (score >= 16) return 'High';
    if (score >= 12) return 'Mod to High';
    if (score >= 8) return 'Moderate';
    if (score >= 4) return 'Low to Mod';
    return 'Low';
  };
  const currentLevel = calculateLevel(inherentScore);
  const isMitigationRequired = inherentScore >= 10;

  // Authorization check
  const isApproved = risk.statusWorkflow === 'Disetujui_Dalam_Pengendalian';
  const isUnitKerja = currentRole === 'Unit Kerja';
  const isVp = currentRole === 'Atasan / VP';
  const isAdmin = currentRole === 'Admin';

  // Unit kerja can edit if not approved (especially if Revisi or Draft)
  // VP can edit during review phase (before approved)
  // Admin can edit anytime
  const canEdit = isAdmin || (!isApproved && (isVp || isUnitKerja));

  const validateForm = (): boolean => {
    const errs: string[] = [];

    if (!pernyataanRisiko.trim() || pernyataanRisiko.trim().length < 5) {
      errs.push('Pernyataan risiko wajib diisi dengan jelas (minimal 5 karakter).');
    }
    if (!penyebabRisiko.trim() || penyebabRisiko.trim().length < 3) {
      errs.push('Akar masalah / penyebab risiko wajib diisi.');
    }
    if (!dampakRisiko.trim() || dampakRisiko.trim().length < 3) {
      errs.push('Uraian dampak risiko wajib diisi.');
    }
    if (kemungkinanAwal < 1 || kemungkinanAwal > 5 || dampakAwal < 1 || dampakAwal > 5) {
      errs.push('Skala kemungkinan dan dampak harus dalam rentang 1 - 5.');
    }
    if (isMitigationRequired && jenisPenanganan !== 'Mitigasi') {
      errs.push(`Skor risiko inherent adalah ${inherentScore} (${currentLevel}). Sesuai SOP Pusri, risiko tingkat High / Mod-to-High wajib memilih strategi 'Mitigasi'.`);
    }
    if (jenisPenanganan === 'Mitigasi' && (!rencanaPenanganan.trim() || rencanaPenanganan.trim().length < 5)) {
      errs.push('Rencana tindakan mitigasi wajib dirumuskan jika strategi penanganan adalah Mitigasi.');
    }

    setValidationErrors(errs);
    return errs.length === 0;
  };

  const handleSaveUpdate = async (resubmitToVp = false) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const actorName = currentUser?.nama || (isVp ? 'Vice President Departemen' : isUnitKerja ? 'Risk Officer Unit' : 'Risk Admin Korporat');
      
      const res = await PusriApiClient.updateRiskData(
        risk.id,
        {
          pernyataanRisiko: pernyataanRisiko.trim(),
          penyebabRisiko: penyebabRisiko.trim(),
          dampakRisiko: dampakRisiko.trim(),
          pengendalianExisting: pengendalianExisting.trim(),
          kategoriRisiko,
          kemungkinanAwal,
          dampakAwal,
          inherentScore,
          tingkatRisikoAwal: currentLevel,
          currentTingkatRisiko: currentLevel,
          jenisPenanganan,
          rencanaPenanganan: rencanaPenanganan.trim(),
          targetWaktuMitigasi,
          biayaRencanaPengendalian: Number(biayaRencanaPengendalian) || 0,
          catatanPerbaikan: catatanPerbaikan.trim() || undefined,
          resubmit: resubmitToVp
        },
        currentRole,
        actorName
      );

      if (res.success && res.data) {
        onRiskUpdated(res.data);
        setSuccessMessage(res.message || 'Data risiko berhasil diperbarui!');
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMessage(res.message || 'Gagal memperbarui data risiko.');
        if (res.errors) {
          setValidationErrors(res.errors);
        }
      }
    } catch (e: any) {
      setErrorMessage(e?.message || 'Terjadi kesalahan sistem saat menyimpan perbaikan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 dark:border-slate-800 my-6 text-slate-800 dark:text-slate-100 transition-colors">
        
        {/* Modal Header (Pusri Sky Blue) */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#009fe3] to-[#0284c7] text-white flex items-center justify-between border-b border-sky-300 dark:border-sky-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
              <Shield className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-base tracking-tight">{risk.kodeRisiko}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-100 text-amber-900 border border-yellow-200 font-bold">
                  Formulir Update Data Risiko
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/20 text-white font-mono font-semibold">
                  Tahun {risk.tahun}
                </span>
                {risk.statusWorkflow === 'Revisi' && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500 text-white font-bold font-mono">
                    (perlu revisi)
                  </span>
                )}
                {risk.statusWorkflow === 'Menunggu_Approval_VP' && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/90 text-white font-bold font-mono">
                    Review VP
                  </span>
                )}
                {risk.statusWorkflow === 'Menunggu_Approval_Admin' && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-600 text-white font-bold font-mono">
                    Approval Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-100 mt-0.5 font-medium">
                Departemen: <strong>{risk.namaOrganisasi} ({risk.kodeOrganisasi})</strong> • Akses Pengguna: <strong className="text-white underline">{currentRole}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Revisi Notification if rejected by VP / Admin */}
        {risk.statusWorkflow === 'Revisi' && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-xs text-rose-800 dark:text-rose-200">
              <RotateCcw className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>Catatan Arahan Perbaikan dari Atasan / VP / Admin:</span>
            </div>
            <p className="italic bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 font-medium text-slate-800 dark:text-slate-200">
              "{risk.reviewNotesVp || risk.approvalNotesAdmin || 'Harap perbaiki dan lengkapi deskripsi risiko, penilaian matriks, atau langkah mitigasi sebelum diajukan kembali.'}"
            </p>
            <div className="text-[11px] text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-1.5">
              <span>👉 Sebagai <strong>User Unit Kerja</strong>, Anda dapat memperbaiki form di bawah ini dan klik tombol <strong>"Kirim Ulang ke VP (Resubmit)"</strong> untuk memajukan kembali risiko ke tahap review Atasan / VP.</span>
            </div>
          </div>
        )}

        {/* Feedback Banners */}
        {successMessage && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border-b border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {validationErrors.length > 0 && (
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Periksa Data Masukan Anda:</span>
            </div>
            <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Form Content */}
        <div className="p-6 space-y-5 text-xs max-h-[72vh] overflow-y-auto">
          {!canEdit && (
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-500 shrink-0" />
              <span>
                Risiko ini telah berstatus <strong>Approved</strong>. Data hanya dapat dilihat atau diubah oleh Administrator.
              </span>
            </div>
          )}

          {/* Section 1: Karakteristik & Pernyataan Risiko */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#005a54] dark:text-emerald-400" />
                <span>1. Uraian Identifikasi & Peristiwa Risiko</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Kode: {risk.kodeRisiko}</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Pernyataan Risiko (Risk Event) *
              </label>
              <textarea
                rows={2}
                disabled={!canEdit}
                value={pernyataanRisiko}
                onChange={(e) => setPernyataanRisiko(e.target.value)}
                placeholder="Deskripsikan peristiwa risiko secara spesifik dan terukur..."
                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 outline-none transition-all shadow-2xs resize-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Akar Penyebab Risiko (Root Cause) *
                </label>
                <textarea
                  rows={2}
                  disabled={!canEdit}
                  value={penyebabRisiko}
                  onChange={(e) => setPenyebabRisiko(e.target.value)}
                  placeholder="Faktor penyebab langsung maupun tidak langsung..."
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 outline-none transition-all shadow-2xs resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Uraian Dampak Risiko (Consequence) *
                </label>
                <textarea
                  rows={2}
                  disabled={!canEdit}
                  value={dampakRisiko}
                  onChange={(e) => setDampakRisiko(e.target.value)}
                  placeholder="Dampak terhadap operasional, keselamatan, finansial, reputasi..."
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 outline-none transition-all shadow-2xs resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Pengendalian yang Sudah Berjalan (Existing Control)
                </label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={pengendalianExisting}
                  onChange={(e) => setPengendalianExisting(e.target.value)}
                  placeholder="Contoh: SOP Rutin, Inspeksi Berkala, Kalibrasi..."
                  className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 outline-none transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Kategori Taksonomi Risiko Pusri *
                </label>
                <select
                  disabled={!canEdit}
                  value={kategoriRisiko}
                  onChange={(e) => setKategoriRisiko(e.target.value as RiskCategory)}
                  className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-semibold focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 outline-none transition-all shadow-2xs cursor-pointer"
                >
                  <option value="Operasional">Operasional</option>
                  <option value="Keuangan">Keuangan</option>
                  <option value="Strategis">Strategis</option>
                  <option value="Hukum & Kepatuhan">Hukum & Kepatuhan</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Penilaian Inherent Risk & Matriks 5x5 */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>2. Penilaian Inherent Risk (Matriks 5×5 Standar Pusri & ISO 31000)</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                Kalkulator Otomatis
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-end">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Kemungkinan / Likelihood (1–5) *
                </label>
                <select
                  disabled={!canEdit}
                  value={kemungkinanAwal}
                  onChange={(e) => setKemungkinanAwal(Number(e.target.value))}
                  className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-bold focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 outline-none transition-all shadow-2xs cursor-pointer"
                >
                  <option value={1}>1 - Sangat Jarang (&lt; 1x per 3 tahun)</option>
                  <option value={2}>2 - Jarang (1x per 1-3 tahun)</option>
                  <option value={3}>3 - Sedang (1x per tahun)</option>
                  <option value={4}>4 - Sering (1-6x per tahun)</option>
                  <option value={5}>5 - Hampir Pasti (&gt; 6x per tahun)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Dampak / Impact (1–5) *
                </label>
                <select
                  disabled={!canEdit}
                  value={dampakAwal}
                  onChange={(e) => setDampakAwal(Number(e.target.value))}
                  className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-bold focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 outline-none transition-all shadow-2xs cursor-pointer"
                >
                  <option value={1}>1 - Tidak Signifikan (&lt; Rp 50 Juta)</option>
                  <option value={2}>2 - Minor (Rp 50 Juta - 250 Juta)</option>
                  <option value={3}>3 - Moderat (Rp 250 Juta - 1 Miliar)</option>
                  <option value={4}>4 - Signifikan (Rp 1 Miliar - 5 Miliar)</option>
                  <option value={5}>5 - Bencana / Kritis (&gt; Rp 5 Miliar)</option>
                </select>
              </div>

              {/* Live Calculated Inherent Badge */}
              <div className="flex flex-col justify-center p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 h-10 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Skor Inherent:</span>
                  <span className="text-xs font-mono font-extrabold text-[#005a54] dark:text-emerald-400">
                    L{kemungkinanAwal} × D{dampakAwal} = {inherentScore}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[10px] text-slate-500 font-medium">Tingkat Risiko:</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    currentLevel === 'High' ? 'bg-red-500 text-white' :
                    currentLevel === 'Mod to High' ? 'bg-orange-500 text-white' :
                    currentLevel === 'Moderate' ? 'bg-amber-500 text-white' :
                    currentLevel === 'Low to Mod' ? 'bg-lime-600 text-white' :
                    'bg-emerald-600 text-white'
                  }`}>
                    {currentLevel}
                  </span>
                </div>
              </div>
            </div>

            {/* Inherent Mitigation Rule Notice */}
            <div className={`p-2.5 rounded-xl border text-[11px] leading-relaxed flex items-center gap-2 ${
              isMitigationRequired 
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200' 
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
            }`}>
              <AlertTriangle className={`w-4 h-4 shrink-0 ${isMitigationRequired ? 'text-amber-600' : 'text-emerald-600'}`} />
              <span>
                {isMitigationRequired 
                  ? `Skor inherent ${inherentScore} (≥10) melebihi batas toleransi Pusri. Wajib menyusun rencana mitigasi dan memilih strategi 'Mitigasi'.`
                  : `Skor inherent ${inherentScore} (<10) berada dalam batas selera risiko korporat.`}
              </span>
            </div>
          </div>

          {/* Section 3: Rencana Tindakan Mitigasi & Anggaran */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>3. Rencana Tindakan Mitigasi & Jadwal Triwulanan</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Mitigasi Terstruktur</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Strategi Penanganan Risiko *
                </label>
                <select
                  disabled={!canEdit}
                  value={jenisPenanganan}
                  onChange={(e) => setJenisPenanganan(e.target.value as RiskHandlingStrategy)}
                  className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-semibold focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 outline-none transition-all shadow-2xs cursor-pointer"
                >
                  <option value="Mitigasi">Mitigasi (Menurunkan Risiko)</option>
                  <option value="Diterima">Diterima (Accept Risk)</option>
                  <option value="Dihindari">Dihindari (Avoid Risk)</option>
                  <option value="Transfer">Transfer (Alihkan / Asuransi)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Triwulan Penyelesaian *
                </label>
                <select
                  disabled={!canEdit}
                  value={targetWaktuMitigasi}
                  onChange={(e) => setTargetWaktuMitigasi(e.target.value)}
                  className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-semibold focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 outline-none transition-all shadow-2xs cursor-pointer"
                >
                  <option value="TW 1">Triwulan I (TW 1: Jan - Mar)</option>
                  <option value="TW 2">Triwulan II (TW 2: Apr - Jun)</option>
                  <option value="TW 3">Triwulan III (TW 3: Jul - Sep)</option>
                  <option value="TW 4">Triwulan IV (TW 4: Okt - Des)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Estimasi Biaya Mitigasi (Rp) *
                </label>
                <input
                  type="number"
                  min={0}
                  disabled={!canEdit}
                  value={biayaRencanaPengendalian}
                  onChange={(e) => setBiayaRencanaPengendalian(Number(e.target.value))}
                  placeholder="0"
                  className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 outline-none transition-all shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Rencana Langkah Mitigasi / Penanganan Rinci *
              </label>
              <textarea
                rows={2}
                disabled={!canEdit}
                value={rencanaPenanganan}
                onChange={(e) => setRencanaPenanganan(e.target.value)}
                placeholder="Langkah nyata penanganan risiko, pengadaan suku cadang, SOP modifikasi, dll..."
                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 outline-none transition-all shadow-2xs resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Section 4: Catatan Pengajuan Kembali (Resubmit Note for Unit Kerja) */}
          {isUnitKerja && (
            <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 space-y-2.5">
              <label className="block text-[11px] font-bold text-amber-950 dark:text-amber-200">
                Catatan Perbaikan / Penjelasan Pengajuan Kembali ke Atasan / VP:
              </label>
              <textarea
                rows={2}
                value={catatanPerbaikan}
                onChange={(e) => setCatatanPerbaikan(e.target.value)}
                placeholder="Jelaskan ringkasan perbaikan yang telah dilakukan untuk bahan pertimbangan Atasan/VP..."
                className="w-full p-3 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 outline-none transition-all shadow-2xs resize-none"
              />
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            <span>Perubahan data akan tersimpan langsung ke basis data terpusat PT Pupuk Sriwidjaja.</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Tutup / Batal
            </button>

            {canEdit && (
              <>
                {/* Save Draft / Changes Without Status Transition */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSaveUpdate(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Simpan Perubahan Data Risiko"
                >
                  <Save className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>

                {/* Resubmit to VP for Unit Kerja */}
                {isUnitKerja && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSaveUpdate(true)}
                    className="px-5 py-2 bg-[#009fe3] hover:bg-[#0087c2] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="Simpan & Ajukan Kembali ke Atasan / VP untuk Review"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Mengirim Ulang...' : 'Ajukan Ulang'}</span>
                  </button>
                )}

                {/* Atasan / VP Direct Save Button */}
                {isVp && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSaveUpdate(false)}
                    className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="Simpan Pembaruan Data Risiko oleh VP"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Update Data (VP)'}</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

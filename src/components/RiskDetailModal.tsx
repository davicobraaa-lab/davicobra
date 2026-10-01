import React, { useState, useEffect } from 'react';
import { 
  X, 
  Shield, 
  DollarSign, 
  User, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  RotateCcw,
  Edit2,
  Trash2,
  Save,
  Check
} from 'lucide-react';
import { PusriRisk, UserRole, RiskCategory, RiskHandlingStrategy, RiskLevel } from '../types/pusri';
import { PusriApiClient } from '../services/api';

interface RiskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  risk: PusriRisk | null;
  currentRole: UserRole;
  onRiskUpdated: (updatedRisk: PusriRisk) => void;
  onRiskDeleted: (id: string) => void;
  onOpenUpdateModal?: (risk: PusriRisk) => void;
}

export const RiskDetailModal: React.FC<RiskDetailModalProps> = ({
  isOpen,
  onClose,
  risk,
  currentRole,
  onRiskUpdated,
  onRiskDeleted,
  onOpenUpdateModal
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Editable fields state
  const [pernyataanRisiko, setPernyataanRisiko] = useState('');
  const [penyebabRisiko, setPenyebabRisiko] = useState('');
  const [dampakRisiko, setDampakRisiko] = useState('');
  const [pengendalianExisting, setPengendalianExisting] = useState('');
  const [kemungkinanAwal, setKemungkinanAwal] = useState(3);
  const [dampakAwal, setDampakAwal] = useState(3);
  const [jenisPenanganan, setJenisPenanganan] = useState<RiskHandlingStrategy>('Mitigasi');
  const [rencanaPenanganan, setRencanaPenanganan] = useState('');
  const [targetWaktuMitigasi, setTargetWaktuMitigasi] = useState('TW 2');
  const [biayaRencanaPengendalian, setBiayaRencanaPengendalian] = useState(0);
  const [picPelaksana, setPicPelaksana] = useState('');
  const [picPengendali, setPicPengendali] = useState('');

  // Sync state with risk prop
  useEffect(() => {
    if (risk) {
      setPernyataanRisiko(risk.pernyataanRisiko || '');
      setPenyebabRisiko(risk.penyebabRisiko || '');
      setDampakRisiko(risk.dampakRisiko || '');
      setPengendalianExisting(risk.pengendalianExisting || '');
      setKemungkinanAwal(risk.kemungkinanAwal || 3);
      setDampakAwal(risk.dampakAwal || 3);
      setJenisPenanganan(risk.jenisPenanganan || 'Mitigasi');
      setRencanaPenanganan(risk.rencanaPenanganan || '');
      setTargetWaktuMitigasi(risk.targetWaktuMitigasi || 'TW 2');
      setBiayaRencanaPengendalian(risk.biayaRencanaPengendalian || 0);
      setPicPelaksana(risk.picPelaksana || '');
      setPicPengendali(risk.picPengendali || '');
      setIsEditing(false);
      setSaveSuccess(false);
    }
  }, [risk]);

  if (!isOpen || !risk) return null;

  const inherentScore = kemungkinanAwal * dampakAwal;
  const calculateLevel = (score: number): RiskLevel => {
    if (score >= 16) return 'High';
    if (score >= 12) return 'Mod to High';
    if (score >= 8) return 'Moderate';
    if (score >= 4) return 'Low to Mod';
    return 'Low';
  };
  const currentLevel = calculateLevel(inherentScore);

  const handleDelete = async () => {
    if (window.confirm(`Yakin ingin menghapus risiko ${risk.kodeRisiko}?`)) {
      setIsDeleting(true);
      try {
        await PusriApiClient.deleteRisk(risk.id, currentRole);
        onRiskDeleted(risk.id);
        onClose();
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      const updated = await PusriApiClient.updateRisk(
        risk.id,
        {
          pernyataanRisiko: pernyataanRisiko.trim(),
          penyebabRisiko: penyebabRisiko.trim(),
          dampakRisiko: dampakRisiko.trim(),
          pengendalianExisting: pengendalianExisting.trim(),
          kemungkinanAwal,
          dampakAwal,
          inherentScore,
          tingkatRisikoAwal: currentLevel,
          currentTingkatRisiko: currentLevel,
          jenisPenanganan,
          rencanaPenanganan: rencanaPenanganan.trim(),
          targetWaktuMitigasi,
          biayaRencanaPengendalian: Number(biayaRencanaPengendalian) || 0,
          picPelaksana: picPelaksana.trim(),
          picPengendali: picPengendali.trim()
        },
        `${currentRole} - Risk Editor`,
        currentRole
      );

      if (updated) {
        onRiskUpdated(updated);
        setSaveSuccess(true);
        setIsEditing(false);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (err: any) {
      alert(err?.message || 'Gagal menyimpan perubahan risiko.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResubmitToVp = async () => {
    setIsSaving(true);
    try {
      const updated = await PusriApiClient.updateRisk(
        risk.id,
        {
          pernyataanRisiko: pernyataanRisiko.trim(),
          penyebabRisiko: penyebabRisiko.trim(),
          dampakRisiko: dampakRisiko.trim(),
          pengendalianExisting: pengendalianExisting.trim(),
          kemungkinanAwal,
          dampakAwal,
          inherentScore,
          tingkatRisikoAwal: currentLevel,
          currentTingkatRisiko: currentLevel,
          jenisPenanganan,
          rencanaPenanganan: rencanaPenanganan.trim(),
          targetWaktuMitigasi,
          biayaRencanaPengendalian: Number(biayaRencanaPengendalian) || 0,
          picPelaksana: picPelaksana.trim(),
          picPengendali: picPengendali.trim(),
          statusWorkflow: 'Menunggu_Approval_VP'
        },
        `${currentRole} - Resubmit Revisi ke VP`,
        currentRole
      );

      if (updated) {
        onRiskUpdated(updated);
        setSaveSuccess(true);
        setIsEditing(false);
        alert(`Risiko [${risk.kodeRisiko}] berhasil diperbaiki dan dikirim ulang ke antrean Review Atasan / VP!`);
        onClose();
      }
    } catch (err: any) {
      alert(err?.message || 'Gagal mengirim ulang usulan revisi ke VP.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 dark:border-slate-800 my-8 text-slate-800 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="px-5 py-4 bg-[#005a54] dark:bg-emerald-950 text-white flex items-center justify-between border-b border-emerald-800 dark:border-emerald-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-base tracking-tight">{risk.kodeRisiko}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 font-semibold">
                  {risk.kategoriRisiko}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/20 text-white font-mono">
                  Tahun {risk.tahun}
                </span>
                {risk.statusWorkflow === 'Revisi' && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500 text-white font-bold font-mono">
                    (revisi)
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-100 mt-0.5 font-medium">
                {risk.namaOrganisasi} ({risk.kodeOrganisasi})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenUpdateModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenUpdateModal(risk);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-400/20 hover:bg-emerald-400/30 text-white text-xs font-bold transition-colors cursor-pointer border border-emerald-400/30 shadow-2xs"
                title="Buka Formulir Update Data Risiko"
              >
                <Edit2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>Update Data Risiko</span>
              </button>
            )}
            {!isEditing && !onOpenUpdateModal && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors cursor-pointer"
                title="Ubah Data Risiko Ini"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Save success banner */}
        {saveSuccess && (
          <div className="bg-emerald-50 dark:bg-emerald-950/80 border-b border-emerald-200 dark:border-emerald-800 px-5 py-2.5 text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Perubahan risiko berhasil disimpan dan disinkronkan ke basis data.</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 space-y-5 text-xs max-h-[76vh] overflow-y-auto">
          {/* Status Revisi Alert Banner */}
          {risk.statusWorkflow === 'Revisi' && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <RotateCcw className="w-4 h-4 text-rose-600" />
                  <span>Perlu Perbaikan / Revisi Berdasarkan Catatan Atasan (VP):</span>
                </div>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Mulai Perbaiki</span>
                  </button>
                )}
              </div>
              <p className="text-xs italic bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900 text-slate-800 dark:text-slate-200 font-medium">
                "{risk.reviewNotesVp || risk.approvalNotesAdmin || 'Harap lengkapi dan perbaiki data risiko sesuai arahan SOP sebelum diajukan kembali.'}"
              </p>
              <div className="text-[11px] text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-1.5">
                <span>👉 Setelah memperbaiki form, klik tombol <strong>"Kirim Ulang ke VP / Atasan (Resubmit)"</strong> di bagian bawah modal.</span>
              </div>
            </div>
          )}

          {isEditing ? (
            /* ================= EDIT MODE ================= */
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs flex items-center justify-between">
                <span className="font-semibold">Mode Edit Data Risiko: Ubah informasi dan klik Simpan Perubahan / Kirim Ulang.</span>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-amber-800 dark:text-amber-400 underline font-bold cursor-pointer"
                >
                  Batal Edit
                </button>
              </div>

              {/* Pernyataan Risiko */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Pernyataan Risiko (Risk Event) *
                </label>
                <textarea
                  value={pernyataanRisiko}
                  onChange={(e) => setPernyataanRisiko(e.target.value)}
                  placeholder=""
                  rows={2}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 outline-none transition-all shadow-2xs resize-none leading-relaxed text-xs"
                />
              </div>

              {/* Akar Penyebab & Dampak */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Akar Masalah / Penyebab *
                  </label>
                  <textarea
                    value={penyebabRisiko}
                    onChange={(e) => setPenyebabRisiko(e.target.value)}
                    placeholder=""
                    rows={2}
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 outline-none transition-all shadow-2xs resize-none leading-relaxed text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Dampak (Konsekuensi) *
                  </label>
                  <textarea
                    value={dampakRisiko}
                    onChange={(e) => setDampakRisiko(e.target.value)}
                    placeholder=""
                    rows={2}
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 outline-none transition-all shadow-2xs resize-none leading-relaxed text-xs"
                  />
                </div>
              </div>

              {/* Pengendalian Existing */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Pengendalian yang Sudah Ada (Existing Control)
                </label>
                <input
                  type="text"
                  value={pengendalianExisting}
                  onChange={(e) => setPengendalianExisting(e.target.value)}
                  placeholder=""
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 outline-none transition-all shadow-2xs text-xs"
                />
              </div>

              {/* Kemungkinan & Dampak Matriks (Locked for non-admin) */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                    Penilaian Inherent Risk (Matriks 5×5 Pusri)
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {currentRole === 'Admin' ? '🔓 Akses Admin (Bebas Ubah)' : '🔒 Ditetapkan oleh Admin'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-end">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Kemungkinan (1-5):
                    </label>
                    <select
                      disabled={currentRole !== 'Admin'}
                      value={kemungkinanAwal}
                      onChange={(e) => setKemungkinanAwal(Number(e.target.value))}
                      className={`w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 outline-none transition-all shadow-2xs text-xs ${
                        currentRole !== 'Admin' ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800/80' : 'cursor-pointer'
                      }`}
                    >
                      {[1, 2, 3, 4, 5].map((k) => (
                        <option key={k} value={k}>Skala {k}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Dampak (1-5):
                    </label>
                    <select
                      disabled={currentRole !== 'Admin'}
                      value={dampakAwal}
                      onChange={(e) => setDampakAwal(Number(e.target.value))}
                      className={`w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 outline-none transition-all shadow-2xs text-xs ${
                        currentRole !== 'Admin' ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800/80' : 'cursor-pointer'
                      }`}
                    >
                      {[1, 2, 3, 4, 5].map((d) => (
                        <option key={d} value={d}>Skala {d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col justify-center text-center p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 h-10 shadow-2xs">
                    <span className="text-[9px] text-slate-400 uppercase font-bold leading-none">Skor & Level</span>
                    <span className="text-xs font-extrabold text-[#005a54] dark:text-emerald-400 font-mono leading-tight mt-0.5">
                      L{kemungkinanAwal}×D{dampakAwal} = {inherentScore} ({currentLevel})
                    </span>
                  </div>
                </div>
              </div>

              {/* Rencana Penanganan / Mitigasi */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Rencana Langkah Mitigasi / Penanganan *
                </label>
                <textarea
                  value={rencanaPenanganan}
                  onChange={(e) => setRencanaPenanganan(e.target.value)}
                  placeholder=""
                  rows={2}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 outline-none transition-all shadow-2xs resize-none leading-relaxed text-xs"
                />
              </div>

              {/* Target & Anggaran */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Strategi Penanganan
                  </label>
                  <select
                    value={jenisPenanganan}
                    onChange={(e) => setJenisPenanganan(e.target.value as any)}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 outline-none transition-all shadow-2xs cursor-pointer text-xs"
                  >
                    <option value="Mitigasi">Mitigasi</option>
                    <option value="Diterima">Diterima</option>
                    <option value="Dihindari">Dihindari</option>
                    <option value="Transfer">Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Target Waktu Mitigasi
                  </label>
                  <select
                    value={targetWaktuMitigasi}
                    onChange={(e) => setTargetWaktuMitigasi(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 outline-none transition-all shadow-2xs cursor-pointer text-xs"
                  >
                    <option value="TW 1">TW 1 (Jan - Mar)</option>
                    <option value="TW 2">TW 2 (Apr - Jun)</option>
                    <option value="TW 3">TW 3 (Jul - Sep)</option>
                    <option value="TW 4">TW 4 (Okt - Des)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Biaya Rencana (Rp)
                  </label>
                  <input
                    type="number"
                    value={biayaRencanaPengendalian}
                    onChange={(e) => setBiayaRencanaPengendalian(Number(e.target.value))}
                    placeholder=""
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 outline-none transition-all shadow-2xs text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* ================= VIEW MODE ================= */
            <>
              {/* Main Risk Statement Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Pernyataan Risiko (Risk Event)
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  {risk.pernyataanRisiko}
                </p>
              </div>

              {/* Causes & Impacts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800/40 space-y-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">Akar Masalah / Penyebab:</span>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{risk.penyebabRisiko}</p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800/40 space-y-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">Dampak (Konsekuensi):</span>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{risk.dampakRisiko}</p>
                </div>
              </div>

              {/* Existing Controls */}
              {risk.pengendalianExisting && (
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">Pengendalian yang Sudah Ada (Existing Control):</span>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{risk.pengendalianExisting}</p>
                </div>
              )}

              {/* Review Notes (if in Revisi or reviewed) */}
              {risk.reviewNotesVp && (
                <div className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/40 space-y-1">
                  <span className="font-bold text-amber-900 dark:text-amber-300 block flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Catatan Review Atasan / VP:</span>
                  </span>
                  <p className="text-amber-800 dark:text-amber-400 leading-relaxed">{risk.reviewNotesVp}</p>
                </div>
              )}

              {/* Inherent Score & Matrix Positioning */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">Kemungkinan (K)</span>
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">{risk.kemungkinanAwal} / 5</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">Dampak (D)</span>
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">{risk.dampakAwal} / 5</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">Inherent Score</span>
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">{risk.inherentScore}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">Tingkat Risiko</span>
                  <span className={`text-sm font-extrabold block mt-1 ${
                    risk.currentTingkatRisiko === 'High' ? 'text-red-600 dark:text-red-400' :
                    risk.currentTingkatRisiko === 'Mod to High' ? 'text-orange-600 dark:text-orange-400' :
                    risk.currentTingkatRisiko === 'Moderate' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {risk.currentTingkatRisiko}
                  </span>
                </div>
              </div>

              {/* Mitigation Details */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 bg-emerald-50/40 dark:bg-emerald-950/30">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    Rencana Tindakan Penanganan & Mitigasi (SOP Pusri):
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#005a54] dark:bg-emerald-600 text-white">
                    {risk.jenisPenanganan}
                  </span>
                </div>

                <p className="text-slate-800 dark:text-slate-200 text-xs font-medium leading-relaxed bg-white dark:bg-slate-800 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  {risk.rencanaPenanganan || 'Belum ada uraian penanganan terinci.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] text-slate-700 dark:text-slate-300">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Target Waktu:</span>
                    <strong className="text-slate-900 dark:text-slate-100">{risk.targetWaktuMitigasi || 'TW 2'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Estimasi Anggaran:</span>
                    <strong className="text-slate-900 dark:text-slate-100">Rp {risk.biayaRencanaPengendalian?.toLocaleString('id-ID')}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Jenis Anggaran:</span>
                    <strong className="text-slate-900 dark:text-slate-100">{risk.jenisAnggaran || 'OPEX'}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-emerald-200/70 dark:border-emerald-800/70 text-[11px]">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">PIC Pelaksana (Operator/Manajer):</span>
                    <strong className="text-slate-900 dark:text-slate-100">{risk.picPelaksana || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">PIC Pengendali (VP / Atasan):</span>
                    <strong className="text-slate-900 dark:text-slate-100">{risk.picPengendali || '-'}</strong>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Quarterly Monitoring Logs */}
          {risk.pengendalianTriwulan && risk.pengendalianTriwulan.length > 0 && (
            <div className="space-y-2">
              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">
                Histori Pengendalian Triwulan (TW 1 - TW 4):
              </span>
              <div className="space-y-2">
                {risk.pengendalianTriwulan.map((tw, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                        {tw.triwulan}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300">Progress: {tw.progressPersen}% ({tw.statusPengendalian})</span>
                      <span className="text-slate-700 dark:text-slate-300">Residual: L{tw.kemungkinanResidual}×D{tw.dampakResidual} ({tw.tingkatResidual})</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 text-[11px]">{tw.realisasiKegiatan}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            {currentRole === 'Admin' && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Menghapus...' : 'Hapus Risiko'}</span>
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto flex-wrap">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                    className="px-4 py-2 text-xs font-bold text-white bg-slate-700 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Menyimpan...' : 'Simpan Draf'}</span>
                  </button>

                  {/* Dedicated Button to Send back to VP */}
                  {risk.statusWorkflow === 'Revisi' && (
                    <button
                      type="button"
                      onClick={handleResubmitToVp}
                      disabled={isSaving}
                      className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Kirim Ulang ke VP / Atasan (Resubmit)</span>
                    </button>
                  )}
                </>
              ) : (
                <>
                  {risk.statusWorkflow === 'Revisi' && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Perbaiki & Kirim Ulang ke VP</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-3.5 py-2 text-xs font-bold text-[#005a54] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Data</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
                  >
                    Tutup
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, ShieldCheck, Sparkles, Building2 } from 'lucide-react';
import { PusriRisk, OrganizationMaster, MasterChecklistItem, RiskCategory, RiskHandlingStrategy } from '../types/pusri';
import { PusriApiClient } from '../services/api';

interface IdentifikasiRisikoModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: OrganizationMaster[];
  checklist: MasterChecklistItem[];
  onRiskCreated: (risk: PusriRisk) => void;
}

export const IdentifikasiRisikoModal: React.FC<IdentifikasiRisikoModalProps> = ({
  isOpen,
  onClose,
  departments,
  checklist,
  onRiskCreated
}) => {
  const [kodeOrg, setKodeOrg] = useState(departments[0]?.kode || 'PRD-1B');
  const [sasaranRKAP, setSasaranRKAP] = useState('');
  const [sasaranUnitKerja, setSasaranUnitKerja] = useState('');
  const [kategori, setKategori] = useState<RiskCategory>('Operasional');
  const [pernyataanRisiko, setPernyataanRisiko] = useState('');
  const [penyebabRisiko, setPenyebabRisiko] = useState('');
  const [dampakRisiko, setDampakRisiko] = useState('');
  const [pengendalianExisting, setPengendalianExisting] = useState('');
  
  const [kemungkinan, setKemungkinan] = useState<number>(3);
  const [dampak, setDampak] = useState<number>(4);
  const [jenisPenanganan, setJenisPenanganan] = useState<RiskHandlingStrategy>('Mitigasi');
  const [rencanaPenanganan, setRencanaPenanganan] = useState('');
  const [targetWaktu, setTargetWaktu] = useState('TW 2');
  const [biaya, setBiaya] = useState<number>(0);
  const [picPelaksana, setPicPelaksana] = useState('');
  const [jenisAnggaran, setJenisAnggaran] = useState('Operasional / OPEX');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const inherentScore = kemungkinan * dampak;
  const isHighOrExtreme = inherentScore >= 10;

  // Auto adjust strategy if high
  useEffect(() => {
    if (isHighOrExtreme && jenisPenanganan !== 'Mitigasi') {
      setJenisPenanganan('Mitigasi');
    }
  }, [inherentScore]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!pernyataanRisiko.trim()) {
      setValidationError('Pernyataan risiko wajib diisi.');
      return;
    }
    if (!penyebabRisiko.trim()) {
      setValidationError('Akar penyebab risiko wajib diisi.');
      return;
    }
    if (!dampakRisiko.trim()) {
      setValidationError('Uraian dampak risiko wajib diisi.');
      return;
    }
    if (isHighOrExtreme && !rencanaPenanganan.trim()) {
      setValidationError('Risiko tingkat Tinggi / Mod to High wajib memiliki Rencana Penanganan Mitigasi.');
      return;
    }

    setIsSubmitting(true);
    const selectedDept = departments.find((d) => d.kode === kodeOrg);

    const newRiskPayload: Partial<PusriRisk> = {
      kodeOrganisasi: kodeOrg,
      namaOrganisasi: selectedDept?.nama || 'Departemen Operasi Pabrik',
      tahun: 2026,
      sasaranRKAP,
      sasaranUnitKerja,
      konteksEksternal: 'Kondisi pasar pupuk dan rantai pasok industri 2026',
      konteksInternal: 'Kesiapan sarana utilitas dan keandalan pabrik',
      sumberRisiko: kategori,
      pernyataanRisiko,
      penyebabRisiko,
      dampakRisiko,
      pengendalianExisting,
      kategoriRisiko: kategori,
      kemungkinanAwal: kemungkinan,
      dampakAwal: dampak,
      inherentScore,
      jenisPenanganan,
      butuhMitigasi: isHighOrExtreme || jenisPenanganan === 'Mitigasi',
      rencanaPenanganan,
      targetWaktuMitigasi: targetWaktu,
      biayaRencanaPengendalian: Number(biaya),
      picPelaksana: 'Ditetapkan oleh Admin',
      picPengendali: selectedDept?.kepalaUnit || 'VP Departemen',
      jenisAnggaran,
      statusWorkflow: 'Menunggu_Approval_VP',
      createdBy: 'Risk Officer Unit Kerja'
    };

    try {
      const created = await PusriApiClient.createRisk(newRiskPayload);
      onRiskCreated(created);
      onClose();
    } catch (err: any) {
      setValidationError(err.message || 'Gagal menyimpan risiko ke database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 my-8">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#005a54] text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
              <h3 className="font-bold text-base tracking-tight">
                Formulir Identifikasi Risiko Unit Kerja (SOP Pusri 2026)
              </h3>
            </div>
            <p className="text-xs text-emerald-100/90 mt-0.5">
              Pendaftaran risiko baru dan integrasi API ke MySQL Database
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[78vh] overflow-y-auto text-xs">
          {validationError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Unit Kerja & Kategori */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                Unit Kerja / Departemen Pemilik Risiko
              </label>
              <select
                value={kodeOrg}
                onChange={(e) => setKodeOrg(e.target.value)}
                className="w-full h-10 px-3.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#005a54] focus:ring-2 focus:ring-[#005a54]/15 shadow-2xs transition-all cursor-pointer"
              >
                {departments.map((dept) => (
                  <option key={dept.kode} value={dept.kode}>
                    {dept.nama} ({dept.kode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                Kategori Risiko (Enterprise Taxonomy)
              </label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value as RiskCategory)}
                className="w-full h-10 px-3.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#005a54] focus:ring-2 focus:ring-[#005a54]/15 shadow-2xs transition-all cursor-pointer"
              >
                <option value="Operasional">Operasional (Pabrik & Distribusi)</option>
                <option value="Keuangan">Keuangan (Arus Kas, Valas & Kredit)</option>
                <option value="Strategis">Strategis (Pasar, Kebijakan & Portofolio)</option>
                <option value="Hukum & Kepatuhan">Hukum & Kepatuhan (Regulasi & Audit)</option>
              </select>
            </div>
          </div>

          {/* Pernyataan Risiko */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
              Pernyataan Risiko (Risk Event) *
            </label>
            <textarea
              rows={2}
              required
              value={pernyataanRisiko}
              onChange={(e) => setPernyataanRisiko(e.target.value)}
              placeholder=""
              className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#005a54] focus:ring-2 focus:ring-[#005a54]/15 shadow-2xs transition-all resize-none leading-relaxed"
            />
          </div>

          {/* Penyebab & Dampak */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                Akar Masalah / Penyebab (Root Cause) *
              </label>
              <textarea
                rows={2}
                required
                value={penyebabRisiko}
                onChange={(e) => setPenyebabRisiko(e.target.value)}
                placeholder=""
                className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#005a54] focus:ring-2 focus:ring-[#005a54]/15 shadow-2xs transition-all resize-none leading-relaxed"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                Dampak Risiko (Consequence) *
              </label>
              <textarea
                rows={2}
                required
                value={dampakRisiko}
                onChange={(e) => setDampakRisiko(e.target.value)}
                placeholder=""
                className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#005a54] focus:ring-2 focus:ring-[#005a54]/15 shadow-2xs transition-all resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Matriks Skor: Kemungkinan & Dampak */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs">
                Penilaian Matriks Risiko Awal (Inherent Score)
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-mono">Skor: {kemungkinan} × {dampak} = </span>
                <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                  inherentScore >= 16 ? 'bg-red-500 text-white' :
                  inherentScore >= 12 ? 'bg-orange-500 text-white' :
                  inherentScore >= 8 ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                }`}>
                  {inherentScore} ({inherentScore >= 16 ? 'High' : inherentScore >= 12 ? 'Mod to High' : inherentScore >= 8 ? 'Moderate' : 'Low to Mod'})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Tingkat Kemungkinan (1: Sangat Jarang s/d 5: Hampir Pasti): <strong className="text-slate-900">{kemungkinan}</strong>
                </label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={kemungkinan}
                  onChange={(e) => setKemungkinan(Number(e.target.value))}
                  className="w-full accent-[#005a54] cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Tingkat Dampak (1: Ringan s/d 5: Bencana): <strong className="text-slate-900">{dampak}</strong>
                </label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={dampak}
                  onChange={(e) => setDampak(Number(e.target.value))}
                  className="w-full accent-[#005a54] cursor-pointer"
                />
              </div>
            </div>

            {isHighOrExtreme && (
              <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>
                  <strong>Ketentuan SOP Pusri:</strong> Risiko skor &ge; 10 wajib memilih strategi penanganan <strong>Mitigasi</strong> dan menyusun rencana tindakan penanganan.
                </span>
              </div>
            )}
          </div>

          {/* Rencana Penanganan / Mitigasi */}
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Strategi Penanganan
                </label>
                <select
                  value={jenisPenanganan}
                  onChange={(e) => setJenisPenanganan(e.target.value as RiskHandlingStrategy)}
                  className="w-full h-10 px-3.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#005a54] focus:ring-2 focus:ring-[#005a54]/15 shadow-2xs transition-all cursor-pointer"
                >
                  <option value="Mitigasi">Mitigasi (Mitigate)</option>
                  <option value="Diterima" disabled={isHighOrExtreme}>Diterima (Accept)</option>
                  <option value="Dihindari" disabled={isHighOrExtreme}>Dihindari (Avoid)</option>
                  <option value="Transfer" disabled={isHighOrExtreme}>Transfer (Transfer)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                  Target Waktu Penyelesaian
                </label>
                <select
                  value={targetWaktu}
                  onChange={(e) => setTargetWaktu(e.target.value)}
                  className="w-full h-10 px-3.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#005a54] focus:ring-2 focus:ring-[#005a54]/15 shadow-2xs transition-all cursor-pointer"
                >
                  <option value="TW 1">Triwulan I (TW 1)</option>
                  <option value="TW 2">Triwulan II (TW 2)</option>
                  <option value="TW 3">Triwulan III (TW 3)</option>
                  <option value="TW 4">Triwulan IV (TW 4)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                  Estimasi Biaya Mitigasi (Rp)
                </label>
                <input
                  type="number"
                  value={biaya}
                  onChange={(e) => setBiaya(Number(e.target.value))}
                  placeholder=""
                  className="w-full h-10 px-3.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-[#005a54] focus:ring-2 focus:ring-[#005a54]/15 shadow-2xs transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                Rencana Langkah Penanganan / Mitigasi *
              </label>
              <textarea
                rows={2}
                value={rencanaPenanganan}
                onChange={(e) => setRencanaPenanganan(e.target.value)}
                placeholder=""
                className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#005a54] focus:ring-2 focus:ring-[#005a54]/15 shadow-2xs transition-all resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-500">
              Data langsung tersimpan di MySQL pusri_risk_db & siap direview oleh Atasan / VP
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#005a54] hover:bg-[#004d47] rounded-lg transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? 'Menyimpan & Sinkronisasi...' : 'Daftarkan Risiko ke Sistem'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

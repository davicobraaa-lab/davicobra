import React, { useState } from 'react';
import { 
  Grid3X3, 
  Layers, 
  HelpCircle, 
  Sliders, 
  CheckCircle2, 
  Filter,
  Eye
} from 'lucide-react';
import { PusriRisk, UserRole } from '../../types/pusri';
import { RiskMatrix5x5 } from '../RiskMatrix5x5';

interface PetaMatriksViewProps {
  currentRole: UserRole;
  risks: PusriRisk[];
  onSelectRisk: (risk: PusriRisk) => void;
}

export const PetaMatriksView: React.FC<PetaMatriksViewProps> = ({
  currentRole,
  risks,
  onSelectRisk
}) => {
  const [selectedCellKey, setSelectedCellKey] = useState<string | null>(null);

  // 5x5 Matrix Cell mapping
  const matrixCounts: Record<string, number> = {};
  risks.forEach((r) => {
    const key = `L${r.kemungkinanAwal}xD${r.dampakAwal}`;
    matrixCounts[key] = (matrixCounts[key] || 0) + 1;
  });

  const selectedRisks = selectedCellKey
    ? risks.filter((r) => `L${r.kemungkinanAwal}xD${r.dampakAwal}` === selectedCellKey)
    : [];

  return (
    <div className="space-y-5 max-w-6xl mx-auto py-2">
      {/* Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#005a54] to-emerald-950 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 font-mono">
            Peta Sebaran & Profil Risiko Korporat
          </span>
          <h2 className="text-xl font-extrabold tracking-tight mt-0.5">
            Peta Matriks Risiko 5×5 Interaktif Pusri
          </h2>
          <p className="text-xs text-emerald-100 mt-1 max-w-2xl">
            Visualisasi pemetaan risiko berdasarkan kombinasi tingkat kemungkinan (1-5) dan dampak (1-5). Klik pada sel kisi matriks untuk meninjau rincian risiko pada kuadran tersebut.
          </p>
        </div>

        <div className="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 text-xs font-mono text-emerald-200">
          Total Terpetakan: <strong className="text-white font-bold">{risks.length} Risiko</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Left Column: 5x5 Heatmap Matrix */}
        <div className="md:col-span-7 xl:col-span-8">
          <RiskMatrix5x5
            matrixCounts={matrixCounts}
            selectedCell={selectedCellKey}
            onSelectCell={setSelectedCellKey}
          />
        </div>

        {/* Right Column: Selected Quadrant Drilldown */}
        <div className="md:col-span-5 xl:col-span-4 space-y-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                Rincian Sel Kuadran
              </span>
              {selectedCellKey ? (
                <span className="font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px]">
                  {selectedCellKey} ({selectedRisks.length} Risiko)
                </span>
              ) : (
                <span className="text-[10px] text-slate-400">Pilih salah satu sel</span>
              )}
            </div>

            {selectedCellKey ? (
              <div className="space-y-3">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Ditemukan <strong>{selectedRisks.length} risiko</strong></span>
                  <button
                    onClick={() => setSelectedCellKey(null)}
                    className="text-[#005a54] dark:text-emerald-400 font-semibold hover:underline"
                  >
                    Reset Pilihan
                  </button>
                </div>

                {selectedRisks.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    Tidak ada risiko pada sel ini.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                    {selectedRisks.map((risk) => (
                      <div
                        key={risk.id}
                        onClick={() => onSelectRisk(risk)}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:border-emerald-500 cursor-pointer transition-all space-y-1"
                      >
                        <div className="flex items-center justify-between font-mono font-bold text-slate-900 dark:text-slate-100">
                          <span>{risk.kodeRisiko}</span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                            {risk.currentTingkatRisiko}
                          </span>
                        </div>
                        <div className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                          {risk.namaOrganisasi}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                          {risk.pernyataanRisiko}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-10 text-center text-slate-400 text-xs leading-relaxed">
                Silakan klik angka atau sel mana pun pada Peta Matriks 5×5 di sebelah kiri untuk melihat daftar risiko terkait di sini.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

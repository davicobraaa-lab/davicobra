import React from 'react';

interface StrategyAndCategoryCardsProps {
  strategies: {
    Mitigasi: number;
    Diterima: number;
    Dihindari: number;
    Transfer: number;
    persentaseMitigasi: number;
    persentaseDiterima: number;
    persentaseDihindari: number;
    persentaseTransfer: number;
  };
  categories: {
    Operasional: number;
    Keuangan: number;
    Strategis: number;
    'Hukum & Kepatuhan': number;
  };
  onFilterCategory?: (category: string) => void;
  onFilterStrategy?: (strategy: string) => void;
}

export const StrategyAndCategoryCards: React.FC<StrategyAndCategoryCardsProps> = ({
  strategies,
  categories,
  onFilterCategory,
  onFilterStrategy
}) => {
  return (
    <div className="space-y-4">
      {/* 1. Strategi Penanganan Risiko Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 md:p-5 shadow-2xs transition-colors">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Strategi Penanganan Risiko
          </h2>
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
            SOP Pusri
          </span>
        </div>

        <div className="space-y-3.5">
          {/* Mitigasi */}
          <div 
            onClick={() => onFilterStrategy?.('Mitigasi')}
            className="cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-[#005a54] dark:group-hover:text-emerald-400 transition-colors">
                Mitigasi (Mitigate)
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                {strategies.Mitigasi} ({strategies.persentaseMitigasi}%)
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#007b70] rounded-full transition-all duration-500"
                style={{ width: `${strategies.persentaseMitigasi}%` }}
              />
            </div>
          </div>

          {/* Diterima */}
          <div 
            onClick={() => onFilterStrategy?.('Diterima')}
            className="cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-[#005a54] dark:group-hover:text-emerald-400 transition-colors">
                Diterima (Accept)
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                {strategies.Diterima} ({strategies.persentaseDiterima}%)
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${strategies.persentaseDiterima}%` }}
              />
            </div>
          </div>

          {/* Dihindari */}
          <div 
            onClick={() => onFilterStrategy?.('Dihindari')}
            className="cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-slate-600 dark:text-slate-400">
                Dihindari (Avoid)
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                {strategies.Dihindari} ({strategies.persentaseDihindari}%)
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-slate-300 dark:bg-slate-700 rounded-full transition-all duration-500"
                style={{ width: `${strategies.persentaseDihindari}%` }}
              />
            </div>
          </div>

          {/* Transfer */}
          <div 
            onClick={() => onFilterStrategy?.('Transfer')}
            className="cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-slate-600 dark:text-slate-400">
                Transfer (Transfer)
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                {strategies.Transfer} ({strategies.persentaseTransfer}%)
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-slate-300 dark:bg-slate-700 rounded-full transition-all duration-500"
                style={{ width: `${strategies.persentaseTransfer}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Distribusi Kategori Risiko Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 md:p-5 shadow-2xs transition-colors">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-3">
          Distribusi Kategori Risiko
        </h2>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Operasional */}
          <div 
            onClick={() => onFilterCategory?.('Operasional')}
            className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 cursor-pointer transition-colors"
          >
            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              Operasional
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100 font-mono my-0.5">
              {categories.Operasional}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              Pabrik & Distribusi
            </div>
          </div>

          {/* Keuangan */}
          <div 
            onClick={() => onFilterCategory?.('Keuangan')}
            className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 cursor-pointer transition-colors"
          >
            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              Keuangan
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100 font-mono my-0.5">
              {categories.Keuangan}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              Arus Kas & Valas
            </div>
          </div>

          {/* Strategis */}
          <div 
            onClick={() => onFilterCategory?.('Strategis')}
            className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 cursor-pointer transition-colors"
          >
            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              Strategis
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100 font-mono my-0.5">
              {categories.Strategis}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              Pasar & Kebijakan
            </div>
          </div>

          {/* Hukum & Kepatuhan */}
          <div 
            onClick={() => onFilterCategory?.('Hukum & Kepatuhan')}
            className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 cursor-pointer transition-colors"
          >
            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              Hukum & Kepatuhan
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100 font-mono my-0.5">
              {categories['Hukum & Kepatuhan']}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              Regulasi & Audit
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';

interface KpiCardsProps {
  stats: {
    totalRisks: number;
    highRisk: number;
    modToHigh: number;
    moderate: number;
    lowToMod: number;
    lowRisk: number;
    approvalCount: number;
    carryOverCount: number;
  };
  activeFilter: string | null;
  onSelectFilter: (filterKey: string | null) => void;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  stats,
  activeFilter,
  onSelectFilter
}) => {
  const cards = [
    {
      key: 'ALL',
      title: 'TOTAL RISIKO',
      value: stats.totalRisks,
      subtitle: 'Seluruh Unit Kerja',
      textColor: 'text-slate-900',
      bgColor: 'bg-white',
      borderColor: 'border-slate-200',
      ringColor: 'ring-slate-400'
    },
    {
      key: 'High',
      title: 'HIGH RISK',
      value: stats.highRisk,
      subtitle: 'Prioritas Utama',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50/30',
      borderColor: 'border-red-200',
      ringColor: 'ring-red-400'
    },
    {
      key: 'Mod to High',
      title: 'MOD TO HIGH',
      value: stats.modToHigh,
      subtitle: 'Mitigasi Aktif',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50/30',
      borderColor: 'border-orange-200',
      ringColor: 'ring-orange-400'
    },
    {
      key: 'Moderate',
      title: 'MODERATE',
      value: stats.moderate,
      subtitle: 'Pemantauan TW',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50/30',
      borderColor: 'border-amber-200',
      ringColor: 'ring-amber-400'
    },
    {
      key: 'Low to Mod',
      title: 'LOW TO MOD',
      value: stats.lowToMod,
      subtitle: 'Terkendali Baik',
      textColor: 'text-lime-600',
      bgColor: 'bg-lime-50/30',
      borderColor: 'border-lime-200',
      ringColor: 'ring-lime-400'
    },
    {
      key: 'Low',
      title: 'LOW RISK',
      value: stats.lowRisk,
      subtitle: 'Mitigasi Selesai',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50/30',
      borderColor: 'border-emerald-200',
      ringColor: 'ring-emerald-400'
    },
    {
      key: 'APPROVAL',
      title: 'APPROVAL',
      value: stats.approvalCount,
      subtitle: 'VP / Admin Review',
      textColor: 'text-teal-700',
      bgColor: 'bg-teal-50/30',
      borderColor: 'border-teal-200',
      ringColor: 'ring-teal-400'
    },
    {
      key: 'CARRY_OVER',
      title: 'CARRY OVER',
      value: stats.carryOverCount,
      subtitle: 'Tahun 2027',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50/30',
      borderColor: 'border-purple-200',
      ringColor: 'ring-purple-400'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
      {cards.map((card) => {
        const isSelected = activeFilter === card.key;
        return (
          <button
            key={card.key}
            onClick={() => onSelectFilter(isSelected ? null : card.key)}
            className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
              card.bgColor
            } ${card.borderColor} ${
              isSelected ? `ring-2 ${card.ringColor} shadow-md` : 'hover:shadow-xs hover:border-slate-300'
            }`}
          >
            {/* Title */}
            <div className="text-[10px] font-bold text-slate-500 tracking-wider truncate mb-1 uppercase">
              {card.title}
            </div>

            {/* Value */}
            <div className={`text-2xl font-extrabold ${card.textColor} font-mono tabular-nums leading-none tracking-tight`}>
              {card.value}
            </div>

            {/* Subtitle */}
            <div className="text-[11px] text-slate-500 font-medium truncate mt-1.5 leading-tight">
              {card.subtitle}
            </div>

            {/* Selection indicator pill */}
            {isSelected && (
              <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-slate-900" />
            )}
          </button>
        );
      })}
    </div>
  );
};

import React, { useState } from 'react';
import { X, GitBranch, CheckCircle2, ArrowRight, Play, Users, FileCheck } from 'lucide-react';
import { PUSRI_SOP_STAGES } from '../data/initialData';

interface SopWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SopWorkflowModal: React.FC<SopWorkflowModalProps> = ({ isOpen, onClose }) => {
  const [activeStep, setActiveStep] = useState(1);
  const currentStage = PUSRI_SOP_STAGES.find((s) => s.step === activeStep) || PUSRI_SOP_STAGES[0];

  if (!isOpen) return null;

  const categories = ['Perencanaan', 'Identifikasi & Analisis', 'Evaluasi & Respon', 'Monitoring & Review'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full overflow-hidden border border-slate-200 my-8">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#005a54] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-emerald-300" />
            <div>
              <h3 className="font-bold text-base tracking-tight">
                Simulasi Alur Proses Bisnis & SOP 16 Tahapan Manajemen Risiko Pusri
              </h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Pedoman Terpadu Enterprise Risk Management (ERM) PT Pupuk Sriwidjaja Palembang
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
        <div className="p-5 space-y-5 text-xs">
          {/* Active Step Feature Box */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border border-emerald-200 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-[#005a54] text-white font-bold text-xs flex items-center justify-center">
                  {currentStage.step}
                </span>
                <span className="text-sm font-bold text-slate-900">{currentStage.title}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {currentStage.kategoriSOP}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                <Users className="w-3.5 h-3.5 text-[#005a54]" />
                <span>Pelaksana: <strong>{currentStage.pic}</strong></span>
              </div>
            </div>

            <p className="text-slate-700 text-xs leading-relaxed mb-3">
              {currentStage.description}
            </p>

            <div className="flex items-center gap-2 pt-2 border-t border-emerald-200/60 text-slate-700">
              <FileCheck className="w-4 h-4 text-[#005a54]" />
              <span>Deliverable / Output Resmi: <strong className="text-slate-900">{currentStage.output}</strong></span>
            </div>
          </div>

          {/* 16 Steps Interactive Timeline Grid */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-800 text-xs">
              Siklus 16 Tahapan Manajemen Risiko (Klik tahapan untuk melihat detail):
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              {PUSRI_SOP_STAGES.map((stage) => {
                const isActive = stage.step === activeStep;
                return (
                  <button
                    key={stage.step}
                    onClick={() => setActiveStep(stage.step)}
                    className={`p-3 rounded-lg border text-left transition-all relative cursor-pointer ${
                      isActive
                        ? 'border-[#005a54] bg-[#005a54] text-white shadow-md'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        Tahap {stage.step}
                      </span>
                      <span className={`text-[9px] truncate max-w-[80px] ${
                        isActive ? 'text-emerald-200' : 'text-slate-400'
                      }`}>
                        {stage.kategoriSOP}
                      </span>
                    </div>
                    <div className="font-bold text-xs line-clamp-2 leading-tight">
                      {stage.title}
                    </div>
                    <div className={`text-[10px] mt-1 truncate ${
                      isActive ? 'text-emerald-100' : 'text-slate-500'
                    }`}>
                      PIC: {stage.pic}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Controls */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={() => setActiveStep((prev) => (prev > 1 ? prev - 1 : 16))}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
            >
              ← Tahap Sebelumnya
            </button>
            <span className="text-slate-500 font-mono text-xs">
              Tahap {activeStep} dari 16 Tahapan Pusri
            </span>
            <button
              onClick={() => setActiveStep((prev) => (prev < 16 ? prev + 1 : 1))}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-[#005a54] hover:bg-[#004d47] rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>Tahap Selanjutnya</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

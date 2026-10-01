import React, { useState, useEffect, useCallback } from 'react';
import { PusriApiClient } from './services/api';
import { PusriRisk, UserRole, ThemeMode, OrganizationMaster, MasterChecklistItem, ApiSyncEvent, UserAccount } from './types/pusri';
import { INITIAL_RISKS, MASTER_DEPARTMENTS, MASTER_CHECKLIST } from './data/initialData';

// Visual components
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { HeroBanner } from './components/HeroBanner';
import { KpiCards } from './components/KpiCards';
import { StrategyAndCategoryCards } from './components/StrategyAndCategoryCards';
import { RiskTable } from './components/RiskTable';
import { LoginPage } from './components/LoginPage';

// Dedicated Workspace Views for each menu
import { IdentifikasiView } from './components/views/IdentifikasiView';
import { ReviewVpView } from './components/views/ReviewVpView';
import { ApprovalAdminView } from './components/views/ApprovalAdminView';
import { PengendalianTwView } from './components/views/PengendalianTwView';
import { EvaluasiCarryOverView } from './components/views/EvaluasiCarryOverView';
import { MasterOrganisasiView } from './components/views/MasterOrganisasiView';
import { PetaMatriksView } from './components/views/PetaMatriksView';
import { SettingsView } from './components/views/SettingsView';

// Modals
import { IdentifikasiRisikoModal } from './components/IdentifikasiRisikoModal';
import { ReviewVpModal } from './components/ReviewVpModal';
import { ApprovalAdminModal } from './components/ApprovalAdminModal';
import { PengendalianTwModal } from './components/PengendalianTwModal';
import { EvaluasiCarryOverModal } from './components/EvaluasiCarryOverModal';
import { SopWorkflowModal } from './components/SopWorkflowModal';
import { GolangMysqlSyncModal } from './components/GolangMysqlSyncModal';
import { RiskDetailModal } from './components/RiskDetailModal';
import { MasterOrganisasiModal } from './components/MasterOrganisasiModal';
import { DownloadDatabasePasswordModal } from './components/DownloadDatabasePasswordModal';
import { UpdateRiskModal } from './components/UpdateRiskModal';

import { ChevronRight, Home, Sparkles, Database } from 'lucide-react';

export function App() {
  // Core states
  const [risks, setRisks] = useState<PusriRisk[]>(INITIAL_RISKS);
  const [departments, setDepartments] = useState<OrganizationMaster[]>(MASTER_DEPARTMENTS);
  const [checklist, setChecklist] = useState<MasterChecklistItem[]>(MASTER_CHECKLIST);
  const [syncEvents, setSyncEvents] = useState<ApiSyncEvent[]>([]);

  // Simulation, Theme & View States
  const [currentRole, setCurrentRole] = useState<UserRole>('Admin');
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('pusri_theme') as ThemeMode) || 'light';
  });
  const [viewMode, setViewMode] = useState<'laptop' | 'mobile'>('laptop');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [syncPulse, setSyncPulse] = useState(false);

  // Authentication State (Always start at Login Page on entry)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  const [preselectedLoginRole, setPreselectedLoginRole] = useState<UserRole | undefined>(undefined);

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    setPreselectedLoginRole(undefined);
    try {
      localStorage.setItem('pusri_logged_user', JSON.stringify(user));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
    setCurrentRole(user.role);
    if (user.role === 'Unit Kerja') {
      setActiveTab('identifikasi');
    } else if (user.role === 'Atasan / VP') {
      setActiveTab('review-vp');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleUpdateUserProfile = (updatedFields: Partial<UserAccount>) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updatedFields };
      setCurrentUser(updatedUser);
      try {
        localStorage.setItem('pusri_logged_user', JSON.stringify(updatedUser));
      } catch (e) {
        console.warn('LocalStorage update failed', e);
      }
    }
  };

  const handleLogout = (roleToSelect?: UserRole) => {
    setCurrentUser(null);
    localStorage.removeItem('pusri_logged_user');
    setPreselectedLoginRole(roleToSelect);
    setActiveTab('dashboard');
  };

  const handleNavigateNext = (nextTab: string) => {
    setActiveTab(nextTab);
  };

  const handleRisksCreated = (newRisks: PusriRisk[]) => {
    setRisks((prev) => {
      const existingIds = new Set(prev.map((r) => r.id));
      const fresh = newRisks.filter((r) => !existingIds.has(r.id));
      return [...fresh, ...prev];
    });
  };

  const handleRiskCreated = (newRisk: PusriRisk) => {
    setRisks((prev) => {
      if (prev.some((r) => r.id === newRisk.id)) return prev;
      return [newRisk, ...prev];
    });
  };

  // Filters for Table
  const [selectedMatrixCell, setSelectedMatrixCell] = useState<string | null>(null);
  const [selectedKpiFilter, setSelectedKpiFilter] = useState<string | null>(null);

  // Modal Dialogs (for quick actions)
  const [isNewRiskOpen, setIsNewRiskOpen] = useState(false);
  const [isReviewVpOpen, setIsReviewVpOpen] = useState(false);
  const [isApprovalAdminOpen, setIsApprovalAdminOpen] = useState(false);
  const [isPengendalianTwOpen, setIsPengendalianTwOpen] = useState(false);
  const [isEvaluasiCarryOverOpen, setIsEvaluasiCarryOverOpen] = useState(false);
  const [isSopWorkflowOpen, setIsSopWorkflowOpen] = useState(false);
  const [isSyncConsoleOpen, setIsSyncConsoleOpen] = useState(false);
  const [selectedRiskDetail, setSelectedRiskDetail] = useState<PusriRisk | null>(null);
  const [masterModalMode, setMasterModalMode] = useState<'organisasi' | 'checklist' | null>(null);
  const [isDownloadPasswordOpen, setIsDownloadPasswordOpen] = useState(false);
  const [riskToUpdate, setRiskToUpdate] = useState<PusriRisk | null>(null);

  // Apply Theme to Document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('pusri_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Load initial data from REST API
  useEffect(() => {
    const initData = async () => {
      try {
        const [fetchedRisks, fetchedDepts, fetchedChecklist, fetchedSyncs] = await Promise.all([
          PusriApiClient.getRisks(),
          PusriApiClient.getDepartments(),
          PusriApiClient.getMasterChecklist(),
          PusriApiClient.getSyncEvents()
        ]);
        if (fetchedRisks && fetchedRisks.length > 0) setRisks(fetchedRisks);
        if (fetchedDepts && fetchedDepts.length > 0) setDepartments(fetchedDepts);
        if (fetchedChecklist && fetchedChecklist.length > 0) setChecklist(fetchedChecklist);
        if (fetchedSyncs) setSyncEvents(fetchedSyncs);
      } catch (err) {
        console.warn('API fetch warning, using client fallback', err);
      }
    };
    initData();
  }, []);

  // Subscribe to real-time cross-module API sync events
  useEffect(() => {
    const unsubscribe = PusriApiClient.subscribeSync((event, updatedRisks) => {
      const seen = new Set<string>();
      const unique = updatedRisks.filter((r) => {
        if (!r.id || seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      });
      setRisks(unique);
      setSyncEvents((prev) => [event, ...prev.slice(0, 49)]);
      setSyncPulse(true);
      setTimeout(() => setSyncPulse(false), 2000);
    });
    return unsubscribe;
  }, []);

  // Compute counts
  const totalRisks = risks.length;
  const highRisk = risks.filter((r) => r.currentTingkatRisiko === 'High').length;
  const modToHigh = risks.filter((r) => r.currentTingkatRisiko === 'Mod to High').length;
  const moderate = risks.filter((r) => r.currentTingkatRisiko === 'Moderate').length;
  const lowToMod = risks.filter((r) => r.currentTingkatRisiko === 'Low to Mod').length;
  const lowRisk = risks.filter((r) => r.currentTingkatRisiko === 'Low').length;
  const vpReviewCount = risks.filter((r) => r.statusWorkflow === 'Menunggu_Approval_VP').length;
  const adminApprovalCount = risks.filter((r) => r.statusWorkflow === 'Menunggu_Approval_Admin').length;
  const approvalCount = vpReviewCount + adminApprovalCount;
  const carryOverCount = risks.filter((r) => r.statusWorkflow === 'Carry_Over').length;

  // 5x5 Matrix Cell mapping
  const matrixCounts: Record<string, number> = {};
  risks.forEach((r) => {
    const key = `L${r.kemungkinanAwal}xD${r.dampakAwal}`;
    matrixCounts[key] = (matrixCounts[key] || 0) + 1;
  });

  // Strategy breakdown
  const mitigasiCount = risks.filter((r) => r.jenisPenanganan === 'Mitigasi').length;
  const diterimaCount = risks.filter((r) => r.jenisPenanganan === 'Diterima').length;
  const dihindariCount = risks.filter((r) => r.jenisPenanganan === 'Dihindari').length;
  const transferCount = risks.filter((r) => r.jenisPenanganan === 'Transfer').length;
  const safeTotal = totalRisks || 1;

  const strategiesData = {
    Mitigasi: mitigasiCount,
    Diterima: diterimaCount,
    Dihindari: dihindariCount,
    Transfer: transferCount,
    persentaseMitigasi: Math.round((mitigasiCount / safeTotal) * 100),
    persentaseDiterima: Math.round((diterimaCount / safeTotal) * 100),
    persentaseDihindari: Math.round((dihindariCount / safeTotal) * 100),
    persentaseTransfer: Math.round((transferCount / safeTotal) * 100)
  };

  // Category breakdown
  const categoriesData = {
    Operasional: risks.filter((r) => r.kategoriRisiko === 'Operasional').length,
    Keuangan: risks.filter((r) => r.kategoriRisiko === 'Keuangan').length,
    Strategis: risks.filter((r) => r.kategoriRisiko === 'Strategis').length,
    'Hukum & Kepatuhan': risks.filter((r) => r.kategoriRisiko === 'Hukum & Kepatuhan').length
  };

  // Download SQL Database File (Password Protected: portal123, Khusus Admin)
  const handleDownloadSql = () => {
    setIsDownloadPasswordOpen(true);
  };

  // Download user manual markdown
  const handleDownloadManual = () => {
    const content = `# PANDUAN PENGGUNA PORTAL RISIKO PT PUPUK SRIWIDJAJA PALEMBANG (2026)
## Arsitektur: Backend Golang 1.22 REST + MySQL 8.0 InnoDB Database Engine

### 1. Peran Pengguna & Batasan Akses (RBAC)
- **Unit Kerja**:
  * Hak: Input Identifikasi Risiko (SOP 1-7), memilih checklist standar, dan melaporkan realisasi fisik & biaya TW 1-4.
  * Batasan: Tidak memiliki hak approval review atasan / VP maupun penetapan PIC Risk Admin.
- **Atasan / VP**:
  * Hak: Meninjau (review), mengoreksi usulan ke draft, dan menyetujui usulan unit kerja untuk diteruskan ke Risk Admin.
  * Batasan: Tidak berwenang menetapkan approval korporat atau menghapus database.
- **Risk Admin Korporat**:
  * Hak: Persetujuan akhir korporat, penetapan PIC Pelaksana & PIC Pengendali resmi, master data organisasi, dan manajemen basis data MySQL.

### 2. Matriks 5x5 dan Skala Dampak
- Sumbu Y: Tingkat Kemungkinan (1 s/d 5)
- Sumbu X: Tingkat Dampak / Konsekuensi (1 s/d 5)
- Skor Inherent = Kemungkinan x Dampak
- Kriteria Wajib Mitigasi: Skor >= 10 WAJIB memilih strategi 'Mitigasi' dan menyusun rencana penanganan terinci.

### 3. Pemantauan Triwulanan (TW 1-4) & Carry Over
- TW 1 - TW 4: Pemantauan realisasi fisik, residual risk score, kendala lapangan, dan tindak lanjut pemulihan.
- Carry Over: Pengalihan program penanganan multi-tahun ke RKAP 2027.
`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Panduan_Manajemen_Risiko_Pusri_2026.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Manual Trigger Sync
  const handleTriggerSync = async () => {
    await PusriApiClient.triggerCrossModuleSync('Dashboard User Action', 'MySQL & All Modules', 'Manual API Sync triggered by User');
  };

  // Handlers for data updates from views
  const handleRiskUpdated = (updated: PusriRisk) => {
    setRisks((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const handleRiskDeleted = (riskId: string) => {
    setRisks((prev) => prev.filter((r) => r.id !== riskId));
  };

  // Filtered risks for table based on KPI / Matrix
  let displayedRisks = [...risks];
  if (selectedKpiFilter) {
    if (selectedKpiFilter === 'APPROVAL') {
      displayedRisks = displayedRisks.filter(
        (r) => r.statusWorkflow === 'Menunggu_Approval_VP' || r.statusWorkflow === 'Menunggu_Approval_Admin'
      );
    } else if (selectedKpiFilter === 'CARRY_OVER') {
      displayedRisks = displayedRisks.filter((r) => r.statusWorkflow === 'Carry_Over');
    } else if (selectedKpiFilter !== 'ALL') {
      displayedRisks = displayedRisks.filter(
        (r) => r.currentTingkatRisiko === selectedKpiFilter || r.tingkatRisikoAwal === selectedKpiFilter
      );
    }
  }

  // Active view title mapping for breadcrumbs
  const getMenuTitle = (menu: string) => {
    switch (menu) {
      case 'dashboard': return 'Dashboard Utama';
      case 'identifikasi': return 'Identifikasi Risiko';
      case 'review-vp': return 'Review Atasan / VP';
      case 'approval-admin': return 'Approval Admin & Penugasan PIC';
      case 'pengendalian-tw': return 'Pengendalian Triwulan (TW 1-4)';
      case 'evaluasi-carryover': return 'Evaluasi Risiko & Carry Over';
      case 'master-organisasi': return 'Daftar Master Organisasi';
      case 'peta-matriks': return 'Peta Matriks 5×5 Interaktif';
      case 'settings': return 'Pengaturan & Profil Pengguna';
      default: return 'Portal Risiko';
    }
  };

  // If user is not logged in, render the dedicated LoginPage
  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        departments={departments}
        initialRole={preselectedLoginRole}
      />
    );
  }

  return (
    <div className={`min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors ${
      viewMode === 'mobile' ? 'p-2 sm:p-4 bg-slate-900' : ''
    }`}>
      {/* Mobile Simulation Frame */}
      <div className={viewMode === 'mobile' ? 'max-w-[420px] mx-auto bg-[#f8fafc] dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border-4 border-slate-700' : 'w-full'}>
        {/* Header */}
        <Header
          currentRole={currentRole}
          currentUser={currentUser}
          onLogout={handleLogout}
          onRoleChange={setCurrentRole}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onOpenSop={() => setIsSopWorkflowOpen(true)}
          onOpenSyncConsole={() => setIsSyncConsoleOpen(true)}
          syncPulse={syncPulse}
          theme={theme}
          onToggleTheme={toggleTheme}
          onDownloadSql={handleDownloadSql}
          onNavigateSettings={() => setActiveTab('settings')}
        />

        {/* Main Body */}
        <div className="flex">
          {/* Sidebar */}
          {viewMode === 'laptop' && (
            <Sidebar
              currentRole={currentRole}
              activeTab={activeTab}
              onSelectMenu={setActiveTab}
              counts={{
                total: totalRisks,
                vpReview: vpReviewCount,
                adminApproval: adminApprovalCount,
                carryOver: carryOverCount
              }}
              onDownloadManual={handleDownloadManual}
              onDownloadSql={handleDownloadSql}
              onOpenSop={() => setIsSopWorkflowOpen(true)}
              onLogout={handleLogout}
            />
          )}

          {/* Main Content Workspace */}
          <main className="flex-1 p-4 md:p-6 space-y-4 max-w-7xl mx-auto overflow-hidden">
            {/* Breadcrumb Navigation when not on Dashboard */}
            {activeTab !== 'dashboard' && (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pb-1">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="flex items-center gap-1 hover:text-[#005a54] dark:hover:text-emerald-400 font-semibold transition-colors cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {getMenuTitle(activeTab)}
                </span>
              </div>
            )}

            {/* ROUTE 1: DASHBOARD VIEW */}
            {activeTab === 'dashboard' && (
              <div className="space-y-4">
                {/* Hero Banner */}
                <HeroBanner onOpenSop={() => setIsSopWorkflowOpen(true)} />

                {/* KPI Cards (Row of 8 Cards) */}
                <KpiCards
                  stats={{
                    totalRisks,
                    highRisk,
                    modToHigh,
                    moderate,
                    lowToMod,
                    lowRisk,
                    approvalCount,
                    carryOverCount
                  }}
                  activeFilter={selectedKpiFilter}
                  onSelectFilter={setSelectedKpiFilter}
                />

                {/* Visual Overview: Strategy Breakdown & Category Distribution (Peta Matriks 5x5 ditampilkan khusus di menu Peta Matriks sebelah kiri) */}
                <div className="w-full">
                  <StrategyAndCategoryCards
                    strategies={strategiesData}
                    categories={categoriesData}
                    onFilterCategory={(cat) => {
                      // Quick filter
                    }}
                    onFilterStrategy={(strat) => {
                      // Quick filter
                    }}
                  />
                </div>

                {/* Risk Register Table */}
                <RiskTable
                  risks={displayedRisks}
                  currentRole={currentRole}
                  onOpenNewRisk={() => setActiveTab('identifikasi')}
                  onSelectRisk={(risk) => setSelectedRiskDetail(risk)}
                  onOpenUpdateRiskModal={(risk) => setRiskToUpdate(risk)}
                  selectedMatrixCell={selectedMatrixCell}
                  onClearMatrixCell={() => setSelectedMatrixCell(null)}
                  onTriggerSync={handleTriggerSync}
                />
              </div>
            )}

            {/* ROUTE 2: IDENTIFIKASI RISIKO VIEW (MULTI-RISK READY) */}
            {activeTab === 'identifikasi' && (
              <IdentifikasiView
                currentRole={currentRole}
                risks={risks}
                departments={departments}
                checklist={checklist}
                onRiskCreated={handleRiskCreated}
                onRisksCreated={handleRisksCreated}
                onRiskUpdated={handleRiskUpdated}
                onSelectRisk={(r) => setSelectedRiskDetail(r)}
                onOpenUpdateRiskModal={(r) => setRiskToUpdate(r)}
                onNavigateNext={handleNavigateNext}
                onLogout={handleLogout}
              />
            )}

            {/* ROUTE 3: REVIEW ATASAN / VP VIEW (WITH PIC ASSIGNMENT PER RISK) */}
            {activeTab === 'review-vp' && (
              <ReviewVpView
                currentRole={currentRole}
                onSwitchRole={setCurrentRole}
                risks={risks}
                onRiskUpdated={handleRiskUpdated}
                onSelectRisk={(r) => setSelectedRiskDetail(r)}
                onOpenUpdateRiskModal={(r) => setRiskToUpdate(r)}
                onNavigateNext={handleNavigateNext}
                onLogout={handleLogout}
              />
            )}

            {/* ROUTE 4: APPROVAL ADMIN & PIC VIEW (WITH RBAC CHECK) */}
            {activeTab === 'approval-admin' && (
              <ApprovalAdminView
                currentRole={currentRole}
                onSwitchRole={setCurrentRole}
                risks={risks}
                departments={departments}
                onRiskUpdated={handleRiskUpdated}
                onRiskDeleted={handleRiskDeleted}
                onOpenUpdateRiskModal={(r) => setRiskToUpdate(r)}
                onNavigateNext={handleNavigateNext}
                onLogout={handleLogout}
              />
            )}

            {/* ROUTE 5: PENGENDALIAN TRIWULAN (TW 1-4) VIEW */}
            {activeTab === 'pengendalian-tw' && (
              <PengendalianTwView
                currentRole={currentRole}
                risks={risks}
                onRiskUpdated={handleRiskUpdated}
                onSelectRisk={(r) => setSelectedRiskDetail(r)}
                onLogout={handleLogout}
              />
            )}

            {/* ROUTE 6: EVALUASI RISIKO & CARRY OVER VIEW */}
            {activeTab === 'evaluasi-carryover' && (
              <EvaluasiCarryOverView
                currentRole={currentRole}
                risks={risks}
                onRiskUpdated={handleRiskUpdated}
                onSelectRisk={(r) => setSelectedRiskDetail(r)}
              />
            )}

            {/* ROUTE 7: MASTER ORGANISASI VIEW */}
            {activeTab === 'master-organisasi' && (
              <MasterOrganisasiView
                currentRole={currentRole}
                departments={departments}
                risks={risks}
                onDownloadSql={handleDownloadSql}
              />
            )}

            {/* ROUTE 8: PETA MATRIKS 5X5 FULL VIEW */}
            {activeTab === 'peta-matriks' && (
              <PetaMatriksView
                currentRole={currentRole}
                risks={risks}
                onSelectRisk={(r) => setSelectedRiskDetail(r)}
              />
            )}

            {/* ROUTE 10: PENGATURAN & PROFIL VIEW (WITH EDIT PROFIL, GANTI PASSWORD, GANTI ROLE, THEME & SQL) */}
            {activeTab === 'settings' && (
              <SettingsView
                currentRole={currentRole}
                currentUser={currentUser}
                onLogout={handleLogout}
                onUpdateUserProfile={handleUpdateUserProfile}
                theme={theme}
                onThemeChange={setTheme}
                onDownloadSql={handleDownloadSql}
              />
            )}
          </main>
        </div>
      </div>

      {/* Modals for Quick Action Buttons */}
      <IdentifikasiRisikoModal
        isOpen={isNewRiskOpen}
        onClose={() => setIsNewRiskOpen(false)}
        departments={departments}
        checklist={checklist}
        onRiskCreated={handleRiskCreated}
      />

      <ReviewVpModal
        isOpen={isReviewVpOpen}
        onClose={() => setIsReviewVpOpen(false)}
        risks={risks}
        onRiskUpdated={handleRiskUpdated}
      />

      <ApprovalAdminModal
        isOpen={isApprovalAdminOpen}
        onClose={() => setIsApprovalAdminOpen(false)}
        risks={risks}
        onRiskUpdated={handleRiskUpdated}
      />

      <PengendalianTwModal
        isOpen={isPengendalianTwOpen}
        onClose={() => setIsPengendalianTwOpen(false)}
        risks={risks}
        onRiskUpdated={handleRiskUpdated}
      />

      <EvaluasiCarryOverModal
        isOpen={isEvaluasiCarryOverOpen}
        onClose={() => setIsEvaluasiCarryOverOpen(false)}
        risks={risks}
        onRiskUpdated={handleRiskUpdated}
      />

      <SopWorkflowModal
        isOpen={isSopWorkflowOpen}
        onClose={() => setIsSopWorkflowOpen(false)}
      />

      <GolangMysqlSyncModal
        isOpen={isSyncConsoleOpen}
        onClose={() => setIsSyncConsoleOpen(false)}
        syncEvents={syncEvents}
        onTriggerSync={handleTriggerSync}
      />

      <RiskDetailModal
        isOpen={!!selectedRiskDetail}
        onClose={() => setSelectedRiskDetail(null)}
        risk={selectedRiskDetail}
        currentRole={currentRole}
        onRiskUpdated={(updated) => {
          handleRiskUpdated(updated);
          setSelectedRiskDetail(updated);
        }}
        onRiskDeleted={(id) => {
          handleRiskDeleted(id);
          setSelectedRiskDetail(null);
        }}
        onOpenUpdateModal={(r) => setRiskToUpdate(r)}
      />

      {/* Modal: Update Data Risiko (Pembaruan & Resubmit Risiko sebelum Approval) */}
      <UpdateRiskModal
        isOpen={!!riskToUpdate}
        onClose={() => setRiskToUpdate(null)}
        risk={riskToUpdate}
        currentRole={currentRole}
        currentUser={currentUser}
        onRiskUpdated={(updated) => {
          handleRiskUpdated(updated);
          if (selectedRiskDetail && selectedRiskDetail.id === updated.id) {
            setSelectedRiskDetail(updated);
          }
          setRiskToUpdate(null);
        }}
      />

      {masterModalMode && (
        <MasterOrganisasiModal
          isOpen={!!masterModalMode}
          onClose={() => setMasterModalMode(null)}
          departments={departments}
          checklist={checklist}
          mode={masterModalMode}
        />
      )}

      {/* Password-protected SQL Database Download Modal (Password: portal123) */}
      <DownloadDatabasePasswordModal
        isOpen={isDownloadPasswordOpen}
        onClose={() => setIsDownloadPasswordOpen(false)}
      />
    </div>
  );
}

export default App;

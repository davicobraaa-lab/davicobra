import React, { useState, useEffect } from 'react';
import { 
  User, 
  Moon, 
  Sun, 
  Database, 
  ShieldCheck, 
  CheckCircle2, 
  Download, 
  Copy, 
  Check, 
  Cpu, 
  Key, 
  Lock, 
  RefreshCw, 
  Table, 
  AlertCircle, 
  Server, 
  HardDrive, 
  Terminal, 
  Save, 
  Users, 
  UserCheck, 
  Shield, 
  Eye, 
  EyeOff,
  UserCog,
  LogOut,
  Sparkles
} from 'lucide-react';
import { UserRole, ThemeMode, UserProfile, UserAccount } from '../../types/pusri';
import { PusriApiClient } from '../../services/api';

interface SettingsViewProps {
  currentRole: UserRole;
  currentUser?: UserAccount | null;
  onLogout?: (roleToSelect?: UserRole) => void;
  onUpdateUserProfile?: (updated: Partial<UserAccount>) => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  onDownloadSql: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentRole,
  currentUser,
  onLogout,
  onUpdateUserProfile,
  theme,
  onThemeChange,
  onDownloadSql
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Active sub-section within Akun & Profil
  const [accountSubTab, setAccountSubTab] = useState<'profile' | 'password' | 'role'>('profile');

  // Edit Profil Form State
  const [namaAkun, setNamaAkun] = useState('');
  const [nikAkun, setNikAkun] = useState('');
  const [emailAkun, setEmailAkun] = useState('');
  const [jabatanAkun, setJabatanAkun] = useState('');
  const [unitKerjaAkun, setUnitKerjaAkun] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  // Ganti Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Role Change Success State
  const [roleChangeMsg, setRoleChangeMsg] = useState<string | null>(null);

  // MySQL State (Admin)
  const [mysqlStatus, setMysqlStatus] = useState<any>({
    isConnected: false,
    host: 'localhost',
    port: 3306,
    user: 'root',
    database: 'pusri_risk_db',
    lastError: null,
    configLocation: {
      tsBackend: 'server/mysql.ts',
      envFile: '.env',
      goBackend: 'server/backend_go/main.go (baris 43)',
      schemaSql: 'server/backend_go/schema.sql'
    }
  });
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [connMessage, setConnMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const [activeTable, setActiveTable] = useState<'pusri_risks' | 'master_organizations' | 'portal_users' | 'quarterly_controls' | 'risk_audit_logs'>('pusri_risks');
  const [tableData, setTableData] = useState<{ columns: string[]; rows: any[]; total: number; isLiveMySql?: boolean } | null>(null);
  const [loadingTable, setLoadingTable] = useState(false);

  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncResultMsg, setSyncResultMsg] = useState<string | null>(null);

  // Load profile & sync form
  useEffect(() => {
    const fetchProfile = async () => {
      const data = await PusriApiClient.getUserProfile(currentRole);
      if (data) {
        setProfile(data);
        setNamaAkun(currentUser?.nama || data.nama);
        setNikAkun(currentUser?.badge || currentUser?.nik || data.badge || data.nik);
        setEmailAkun(currentUser?.email || data.email);
        setJabatanAkun(currentUser?.jabatan || data.jabatan);
        setUnitKerjaAkun(currentUser?.unitKerja || data.unitKerja);
      } else {
        const defaultNama = currentRole === 'Admin' ? 'DAFFA ARI PRASETYA' : currentRole === 'Atasan / VP' ? 'M DAVI RAMADHAN' : 'FAUZAN AL GHANIYYU';
        const defaultNik = currentRole === 'Admin' ? '0952' : currentRole === 'Atasan / VP' ? '0951' : '0953';
        const defaultEmail = currentRole === 'Admin' ? 'daffa.ari@pusri.co.id' : currentRole === 'Atasan / VP' ? 'm.davi@pusri.co.id' : 'fauzan.al@pusri.co.id';
        const defaultJabatan = currentRole === 'Admin' ? 'Super Admin Enterprise Risk Management Korporat' : currentRole === 'Atasan / VP' ? 'Vice President Operasi Pabrik Pusri IIB' : 'Risk Officer Unit Kerja Pabrik';
        const defaultUnit = currentRole === 'Admin' ? 'Departemen Manajemen Risiko Korporat' : 'Departemen Operasi Pabrik Pusri IIB';
        
        const fbProfile: UserProfile = {
          nik: defaultNik,
          badge: defaultNik,
          nama: defaultNama,
          email: defaultEmail,
          jabatan: defaultJabatan,
          unitKerja: defaultUnit,
          kodeUnitKerja: currentRole === 'Admin' ? 'RISK-CORP' : 'OP-IIB',
          role: currentRole,
          avatarInitials: currentRole === 'Admin' ? 'DA' : currentRole === 'Atasan / VP' ? 'MD' : 'FA',
          terakhirLogin: '24 September 2026, 11:15:00 WIB',
          hakAkses: []
        };
        setProfile(fbProfile);
        setNamaAkun(currentUser?.nama || defaultNama);
        setNikAkun(currentUser?.badge || currentUser?.nik || defaultNik);
        setEmailAkun(currentUser?.email || defaultEmail);
        setJabatanAkun(currentUser?.jabatan || defaultJabatan);
        setUnitKerjaAkun(currentUser?.unitKerja || defaultUnit);
      }
    };
    fetchProfile();
  }, [currentRole, currentUser]);

  useEffect(() => {
    if (currentRole === 'Admin') {
      loadMysqlStatus();
      loadTableData('pusri_risks');
    }
  }, [currentRole]);

  const loadMysqlStatus = async () => {
    const status = await PusriApiClient.getMySqlConnectionStatus();
    if (status) setMysqlStatus(status);
  };

  const loadTableData = async (tbl: any) => {
    setLoadingTable(true);
    try {
      const res = await PusriApiClient.getTableData(tbl);
      if (res && res.success) {
        setTableData(res);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTable(false);
    }
  };

  const handleTestConnect = async () => {
    setIsTestingConn(true);
    setConnMessage(null);
    try {
      const res = await PusriApiClient.testMySqlConnection({
        host: mysqlStatus.host || 'localhost',
        port: mysqlStatus.port || 3306,
        user: mysqlStatus.user || 'root',
        database: mysqlStatus.database || 'pusri_risk_db'
      });
      if (res.data) setMysqlStatus(res.data);
      setConnMessage({
        text: res.message,
        isError: !res.success
      });
    } catch (e: any) {
      setConnMessage({
        text: e.message || 'Gagal menghubungi server.',
        isError: true
      });
    } finally {
      setIsTestingConn(false);
    }
  };

  const handleSyncAllToMysql = async () => {
    setIsSyncingAll(true);
    setSyncResultMsg(null);
    try {
      const res = await PusriApiClient.syncAllToMySql();
      if (res && res.success) {
        setSyncResultMsg(res.message);
        loadTableData(activeTable);
        loadMysqlStatus();
      } else {
        setSyncResultMsg(res?.message || 'Gagal sinkronisasi data ke MySQL.');
      }
    } catch (e: any) {
      setSyncResultMsg(e.message || 'Gagal mengeksekusi sinkronisasi.');
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await onDownloadSql();
    } finally {
      setTimeout(() => setDownloading(false), 800);
    }
  };

  const copyConnectionSnippet = () => {
    const snippet = `-- Cara Import Database ke MySQL Server Lokal:
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS pusri_risk_db;"
mysql -u root -p pusri_risk_db < pusri_risk_db_2026.sql`;
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 1. Handle Simpan Perubahan Profil
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccessMsg(null);

    setTimeout(() => {
      const updatedData: Partial<UserAccount> = {
        nama: namaAkun.trim() || profile?.nama,
        nik: nikAkun.trim() || profile?.nik,
        email: emailAkun.trim() || profile?.email,
        jabatan: jabatanAkun.trim() || profile?.jabatan,
        unitKerja: unitKerjaAkun.trim() || profile?.unitKerja
      };

      if (onUpdateUserProfile) {
        onUpdateUserProfile(updatedData);
      }

      if (profile) {
        setProfile({
          ...profile,
          ...updatedData,
          avatarInitials: (updatedData.nama || profile.nama)
            .split(' ')
            .map(n => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()
        } as UserProfile);
      }

      setIsSavingProfile(false);
      setProfileSuccessMsg('Profil akun dinas berhasil disimpan dan diperbarui.');
      setTimeout(() => setProfileSuccessMsg(null), 4000);
    }, 400);
  };

  // 2. Handle Ganti Password
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!currentPassword) {
      setPasswordMsg({ text: 'Mohon masukkan kata sandi lama/saat ini.', isError: true });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ text: 'Kata sandi baru minimal harus 6 karakter.', isError: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'Konfirmasi kata sandi baru tidak sesuai / tidak cocok.', isError: true });
      return;
    }

    setIsSavingPassword(true);
    setTimeout(() => {
      setIsSavingPassword(false);
      setPasswordMsg({ text: 'Kata sandi berhasil diperbarui dengan aman!', isError: false });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMsg(null), 4000);
    }, 500);
  };

  // 3. Handle Ganti Role (HARUS LOGIN ULANG)
  const handleSelectRole = (newRole: UserRole) => {
    if (newRole === currentRole) return;
    if (onLogout) {
      onLogout(newRole);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#005a54] to-teal-800 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 font-mono">
            Sistem Manajemen Akun & Konfigurasi ERM
          </span>
          <h2 className="text-xl font-extrabold tracking-tight mt-0.5">
            Pengaturan Akun, Profil Pengguna & Sistem
          </h2>
          <p className="text-xs text-emerald-100 mt-1 max-w-2xl">
            Kelola profil dinas, ganti password, edit nama akun, sesuaikan peran akses (Role), dan preferensi tema aplikasi.
          </p>
        </div>

        {/* Download MySQL: HANYA tampil jika Admin */}
        {currentRole === 'Admin' && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title="Download Skema Database MySQL (Khusus Admin)"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Mengunduh...' : 'Unduh File MySQL'}</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: User Summary Card & Theme Preferences */}
        <div className="md:col-span-1 space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Ringkasan Pengguna
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                Online
              </span>
            </div>

            {profile && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#005a54] to-emerald-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md shrink-0">
                    {profile.avatarInitials}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug">
                      {profile.nama}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      NIK: {profile.nik}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/70 text-[#005a54] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {profile.role}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-semibold">Jabatan Struktural</span>
                    <strong className="text-slate-800 dark:text-slate-200">{profile.jabatan}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-semibold">Unit Kerja / Departemen</span>
                    <strong className="text-slate-800 dark:text-slate-200">{profile.unitKerja} ({profile.kodeUnitKerja})</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-semibold">Email Dinas Pusri</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-mono">{profile.email}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Theme Settings Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 transition-colors">
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Tema Tampilan Aplikasi
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pilih mode tampilan terang atau gelap untuk kenyamanan visual saat bekerja.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => onThemeChange('light')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'border-[#005a54] bg-emerald-50/70 text-[#005a54] ring-2 ring-[#005a54]/30'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Sun className="w-5 h-5 text-amber-500" />
                  {theme === 'light' && <CheckCircle2 className="w-4 h-4 text-[#005a54]" />}
                </div>
                <div className="font-bold text-xs">Tema Terang</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Mode standar terang</div>
              </button>

              <button
                onClick={() => onThemeChange('dark')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'border-emerald-500 bg-slate-800 text-emerald-400 ring-2 ring-emerald-500/40'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Moon className="w-5 h-5 text-indigo-400" />
                  {theme === 'dark' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <div className="font-bold text-xs">Tema Gelap</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Mode redup gelap</div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Akun & Profil Interactive Hub (Edit Profil, Ganti Password, Ganti Role) */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Main Account Management Card with Subtabs */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5 transition-colors">
            
            {/* Header with Sub-navigation tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <UserCog className="w-5 h-5 text-[#005a54] dark:text-emerald-400" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Menu Akun & Manajemen Pengguna
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Ubah data identitas profil, perbarui kata sandi akun, atau beralih peran kerja (Role).
                </p>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setAccountSubTab('profile')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    accountSubTab === 'profile'
                      ? 'bg-[#005a54] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  Edit Profil
                </button>
                <button
                  type="button"
                  onClick={() => setAccountSubTab('password')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    accountSubTab === 'password'
                      ? 'bg-[#005a54] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  Ganti Password
                </button>
                <button
                  type="button"
                  onClick={() => setAccountSubTab('role')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    accountSubTab === 'role'
                      ? 'bg-[#005a54] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  Ganti Role
                </button>
              </div>
            </div>

            {/* TAB 1: EDIT PROFIL / GANTI NAMA AKUN */}
            {accountSubTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                {profileSuccessMsg && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold">{profileSuccessMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Lengkap Pengguna (Akun) *
                    </label>
                    <input
                      type="text"
                      required
                      value={namaAkun}
                      onChange={(e) => setNamaAkun(e.target.value)}
                      placeholder=""
                      className="w-full h-10 px-3.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 outline-none transition-all shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nomor Induk Karyawan (NIK) *
                    </label>
                    <input
                      type="text"
                      required
                      value={nikAkun}
                      onChange={(e) => setNikAkun(e.target.value)}
                      placeholder=""
                      className="w-full h-10 px-3.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-100 focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 outline-none transition-all shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Email Dinas Pusri *
                    </label>
                    <input
                      type="email"
                      required
                      value={emailAkun}
                      onChange={(e) => setEmailAkun(e.target.value)}
                      placeholder=""
                      className="w-full h-10 px-3.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-100 focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 outline-none transition-all shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Jabatan Struktural
                    </label>
                    <input
                      type="text"
                      value={jabatanAkun}
                      onChange={(e) => setJabatanAkun(e.target.value)}
                      placeholder=""
                      className="w-full h-10 px-3.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 outline-none transition-all shadow-2xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Unit Kerja / Departemen
                    </label>
                    <input
                      type="text"
                      value={unitKerjaAkun}
                      onChange={(e) => setUnitKerjaAkun(e.target.value)}
                      placeholder=""
                      className="w-full h-10 px-3.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 outline-none transition-all shadow-2xs"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Perubahan profil langsung berlaku pada sesi aktif dan identitas laporan.
                  </span>

                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-5 py-2.5 bg-[#005a54] hover:bg-[#004d47] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingProfile ? 'Menyimpan...' : 'Simpan Perubahan Profil'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: GANTI PASSWORD */}
            {accountSubTab === 'password' && (
              <form onSubmit={handleSavePassword} className="space-y-4">
                {passwordMsg && (
                  <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
                    passwordMsg.isError 
                      ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-800 dark:text-red-300' 
                      : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  }`}>
                    {passwordMsg.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                    <span className="font-semibold">{passwordMsg.text}</span>
                  </div>
                )}

                <div className="space-y-3 max-w-md">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Kata Sandi Saat Ini / Lama *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder=""
                        className="w-full h-10 px-3.5 pr-10 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-100 focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 outline-none transition-all shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Kata Sandi Baru *
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder=""
                      className="w-full h-10 px-3.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-100 focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 outline-none transition-all shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Konfirmasi Kata Sandi Baru *
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder=""
                      className="w-full h-10 px-3.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-100 focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 outline-none transition-all shadow-2xs"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Gunakan kombinasi huruf dan angka untuk keamanan optimal.
                  </span>

                  <button
                    type="submit"
                    disabled={isSavingPassword}
                    className="px-5 py-2.5 bg-[#005a54] hover:bg-[#004d47] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Key className="w-4 h-4" />
                    <span>{isSavingPassword ? 'Memperbarui...' : 'Perbarui Kata Sandi'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: GANTI ROLE / PERAN PENGGUNA (HARUS LOGIN ULANG) */}
            {accountSubTab === 'role' && (
              <div className="space-y-4">
                {/* Security Policy Notice Banner */}
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-start gap-3">
                  <Lock className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-amber-950 dark:text-amber-100">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>Ketentuan Otoritas: Pergantian Role HARUS LOGIN ULANG!</span>
                    </div>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                      Sesuai standar kepatuhan tata kelola risiko Pusri, pengguna <strong>wajib melakukan login ulang</strong> untuk mengautentikasi kredensial peran baru yang dipilih. Silakan klik tombol <strong>Beralih Peran (Login Ulang)</strong> pada peran yang dituju di bawah.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
                  
                  {/* Role 1: Unit Kerja */}
                  <div
                    className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                      currentRole === 'Unit Kerja'
                        ? 'border-[#005a54] bg-emerald-50/80 dark:bg-emerald-950/60 ring-2 ring-[#005a54]/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-9 h-9 rounded-lg bg-teal-100 dark:bg-teal-900/60 text-[#005a54] dark:text-teal-300 flex items-center justify-center font-bold">
                          <Users className="w-5 h-5" />
                        </div>
                        {currentRole === 'Unit Kerja' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#005a54] text-white">
                            ✓ Sedang Aktif
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-semibold text-slate-400">
                            P-108842
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        Unit Kerja
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        Penginput usulan identifikasi risiko, checklist standar, dan realisasi pengendalian triwulanan.
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                      {currentRole === 'Unit Kerja' ? (
                        <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 text-center py-1">
                          ✓ Peran Aktif Anda Saat Ini
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSelectRole('Unit Kerja')}
                          className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Login Ulang Unit Kerja</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Role 2: Atasan / VP */}
                  <div
                    className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                      currentRole === 'Atasan / VP'
                        ? 'border-amber-600 bg-amber-50/80 dark:bg-amber-950/60 ring-2 ring-amber-500/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold">
                          <UserCheck className="w-5 h-5" />
                        </div>
                        {currentRole === 'Atasan / VP' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-700 text-white">
                            ✓ Sedang Aktif
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-semibold text-slate-400">
                            P-102315
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        Atasan / Vice President (VP)
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        Review validasi usulan risiko, penetapan resmi PIC Pelaksana & Pengendali, serta arahan revisi usulan.
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                      {currentRole === 'Atasan / VP' ? (
                        <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 text-center py-1">
                          ✓ Peran Aktif Anda Saat Ini
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSelectRole('Atasan / VP')}
                          className="w-full py-2 px-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Login Ulang Atasan/VP</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Role 3: Risk Admin */}
                  <div
                    className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                      currentRole === 'Admin'
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 ring-2 ring-indigo-500/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 flex items-center justify-center font-bold">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        {currentRole === 'Admin' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-700 text-white">
                            ✓ Sedang Aktif
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-semibold text-slate-400">
                            P-104928
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        Risk Admin Korporat
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        Persetujuan akhir korporat, kelola master organisasi & taksonomi, serta manajemen basis data MySQL.
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                      {currentRole === 'Admin' ? (
                        <div className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 text-center py-1">
                          ✓ Peran Aktif Anda Saat Ini
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSelectRole('Admin')}
                          className="w-full py-2 px-3 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Login Ulang Risk Admin</span>
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>

          {/* MySQL Database Manual Export Box - KHUSUS ADMIN */}
          {currentRole === 'Admin' && (
            <>
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-[#005a54] dark:text-emerald-400" />
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      File Database MySQL Manual (schema.sql)
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      MySQL 8.0 Ready
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-bold">
                      InnoDB
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Anda dapat mengunduh seluruh file DDL & DML skema database MySQL lengkap (tabel departemen, master checklist standar risiko, 8 register risiko Pusri, kontrol TW 1-4, carry over, jejak audit, dan log sinkronisasi REST API) untuk diimpor secara manual ke server database lokal Anda.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block font-bold">Nama Database</span>
                    <span className="font-bold font-mono text-slate-800 dark:text-slate-200">pusri_risk_db</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block font-bold">Total Tabel</span>
                    <span className="font-bold font-mono text-slate-800 dark:text-slate-200">7 Tabel InnoDB</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block font-bold">Relasi Data</span>
                    <span className="font-bold font-mono text-slate-800 dark:text-slate-200">Foreign Keys (FK)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block font-bold">Collation</span>
                    <span className="font-bold font-mono text-slate-800 dark:text-slate-200">utf8mb4_unicode_ci</span>
                  </div>
                </div>

                {/* Quick Command Snippet */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Perintah Import ke MySQL Lokal:</span>
                    <button
                      onClick={copyConnectionSnippet}
                      className="inline-flex items-center gap-1 text-[#005a54] dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Tersalin' : 'Salin Perintah'}</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-950 text-cyan-400 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed border border-slate-800">
{`mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS pusri_risk_db;"
mysql -u root -p pusri_risk_db < pusri_risk_db_2026.sql`}
                  </pre>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    File tersimpan di: <code className="font-mono text-slate-700 dark:text-slate-300">server/backend_go/schema.sql</code>
                  </span>

                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="w-full sm:w-auto px-5 py-2.5 bg-[#005a54] hover:bg-[#004d47] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-4 h-4 text-emerald-300" />
                    <span>{downloading ? 'Menyiapkan File...' : 'Unduh Sekarang: pusri_risk_db_2026.sql'}</span>
                  </button>
                </div>
              </div>

              {/* Posisi & Konfigurasi Koneksi MySQL di Localhost */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Server className="w-5 h-5 text-[#005a54] dark:text-emerald-400" />
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      Posisi & Konfigurasi Koneksi MySQL di Localhost
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Otomatis Simpan Perubahan ke MySQL
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Auto-Save ke Database Aktif Secara Real-Time:</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed pl-5.5">
                    Setiap data risiko yang Anda tambah, edit, review oleh VP, setujui oleh Admin, maupun input pemantauan triwulan (TW 1-4) langsung mengeksekusi perintah SQL <code className="font-mono font-bold bg-emerald-200/50 dark:bg-emerald-900/50 px-1 py-0.5 rounded">INSERT ... ON DUPLICATE KEY UPDATE</code> ke tabel <code className="font-mono font-bold bg-emerald-200/50 dark:bg-emerald-900/50 px-1 py-0.5 rounded">pusri_risks</code> di database MySQL Anda.
                  </p>
                </div>

                {/* Lokasi File Konfigurasi */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                        <Terminal className="w-3.5 h-3.5 text-[#005a54] dark:text-emerald-400" />
                        <span>1. File .env</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Root Directory</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Variabel environment host, port, user, password, dan nama database.
                    </p>
                    <pre className="p-2 rounded bg-slate-900 text-cyan-300 font-mono text-[10px] overflow-x-auto">
{`MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=pusri_risk_db`}
                    </pre>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                        <HardDrive className="w-3.5 h-3.5 text-[#005a54] dark:text-emerald-400" />
                        <span>2. server/mysql.ts</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Node Backend</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Pool koneksi <code className="font-mono">mysql2/promise</code> dan query SQL otomatis.
                    </p>
                    <div className="text-[10px] font-mono text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                      defaultMySqlConfig: <br/>
                      host: &quot;localhost&quot;, port: 3306 <br/>
                      database: &quot;pusri_risk_db&quot;
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                        <Cpu className="w-3.5 h-3.5 text-[#005a54] dark:text-emerald-400" />
                        <span>3. main.go (Baris 43)</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">server/backend_go</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Posisi koneksi DSN jika Anda menjalankan backend service Golang.
                    </p>
                    <pre className="p-2 rounded bg-slate-900 text-emerald-300 font-mono text-[10px] overflow-x-auto">
{`DatabaseDSN: 
"root:@tcp(127.0.0.1:3306)
/pusri_risk_db?parseTime=True"`}
                    </pre>
                  </div>
                </div>

                {/* Test Connection and Sync Buttons */}
                <div className="pt-1 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleTestConnect}
                      disabled={isTestingConn}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTestingConn ? 'animate-spin' : ''}`} />
                      <span>{isTestingConn ? 'Mengetes Koneksi...' : 'Tes Koneksi ke MySQL Localhost'}</span>
                    </button>

                    <button
                      onClick={handleSyncAllToMysql}
                      disabled={isSyncingAll}
                      className="px-3.5 py-2 bg-[#005a54] hover:bg-[#004d47] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                    >
                      <Database className="w-3.5 h-3.5 text-emerald-300" />
                      <span>{isSyncingAll ? 'Menyinkronkan...' : 'Sinkronkan Semua Data ke MySQL Sekarang'}</span>
                    </button>
                  </div>

                  {connMessage && (
                    <span className={`text-xs px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 ${
                      connMessage.isError 
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300' 
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                    }`}>
                      {connMessage.isError ? <AlertCircle className="w-3.5 h-3.5 shrink-0" /> : <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                      <span>{connMessage.text}</span>
                    </span>
                  )}

                  {syncResultMsg && (
                    <span className="text-xs px-2.5 py-1 rounded-lg font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{syncResultMsg}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Pengecekan Database yang Sudah Ada (Live Database Explorer) */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Table className="w-5 h-5 text-[#005a54] dark:text-emerald-400" />
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        Pengecekan Data yang Ada di Database (Live Table Explorer)
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Periksa isi tabel dan data yang tersimpan di dalam database secara langsung.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => loadTableData(activeTable)}
                      disabled={loadingTable}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingTable ? 'animate-spin' : ''}`} />
                      <span>Segarkan Tabel</span>
                    </button>
                  </div>
                </div>

                {/* Pilihan Tabel */}
                <div className="flex flex-wrap gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
                  {[
                    { id: 'pusri_risks', label: 'pusri_risks (Register Risiko)' },
                    { id: 'master_organizations', label: 'master_organizations (Departemen)' },
                    { id: 'portal_users', label: 'portal_users (Akun Pengguna)' },
                    { id: 'quarterly_controls', label: 'quarterly_controls (Kontrol TW)' },
                    { id: 'risk_audit_logs', label: 'risk_audit_logs (Jejak Audit)' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setActiveTable(t.id as any);
                        loadTableData(t.id);
                      }}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        activeTable === t.id
                          ? 'bg-[#005a54] text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Tabel Tampilan Data */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-950/50">
                  <div className="p-2.5 bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      Tabel: <span className="text-[#005a54] dark:text-emerald-400">{activeTable}</span>
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Total Data: <strong className="text-slate-900 dark:text-slate-100">{tableData?.rows?.length || 0} baris</strong>
                    </span>
                  </div>

                  {loadingTable ? (
                    <div className="p-8 text-center text-xs text-slate-500">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#005a54]" />
                      <span>Memuat data tabel dari database...</span>
                    </div>
                  ) : tableData && tableData.rows && tableData.rows.length > 0 ? (
                    <div className="overflow-x-auto max-h-80">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold sticky top-0 border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            {tableData.columns.slice(0, 7).map((col) => (
                              <th key={col} className="py-2 px-3 font-mono text-[11px] whitespace-nowrap">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800 font-sans">
                          {tableData.rows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-100/60 dark:hover:bg-slate-800/50">
                              {tableData.columns.slice(0, 7).map((col) => (
                                <td key={col} className="py-2 px-3 text-slate-800 dark:text-slate-200 text-[11px] max-w-xs truncate">
                                  {row[col] !== undefined && row[col] !== null 
                                    ? typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col])
                                    : '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-500">
                      <span>Tidak ada baris data pada tabel ini.</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

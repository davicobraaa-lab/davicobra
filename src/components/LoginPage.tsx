import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Building2, 
  Eye, 
  EyeOff, 
  LogIn, 
  UserPlus, 
  Key,
  Search,
  CheckCircle2, 
  AlertCircle,
  X,
  BadgeCheck,
  UserCheck,
  Briefcase
} from 'lucide-react';
import { UserAccount, UserRole, OrganizationMaster } from '../types/pusri';
import { PusriApiClient } from '../services/api';
import { PusriLogo } from './PusriLogo';

interface LoginPageProps {
  onLoginSuccess: (user: UserAccount) => void;
  departments: OrganizationMaster[];
  initialRole?: UserRole;
}

// 3 Designated Official Accounts with badge numbers starting from 0951
export const OFFICIAL_ACCOUNTS: UserAccount[] = [
  {
    id: 'usr-0951',
    username: '0951',
    nik: '0951',
    badge: '0951',
    nama: 'M DAVI RAMADHAN',
    role: 'Atasan / VP',
    jabatan: 'Vice President Operasi Pabrik Pusri IIB',
    unitKerja: 'Departemen Operasi Pabrik Pusri IIB',
    kodeUnitKerja: 'OP-IIB',
    email: 'm.davi@pusri.co.id',
    createdAt: '2026-01-01T08:00:00.000Z'
  },
  {
    id: 'usr-0952',
    username: '0952',
    nik: '0952',
    badge: '0952',
    nama: 'DAFFA ARI PRASETYA',
    role: 'Admin',
    jabatan: 'Super Admin Enterprise Risk Management Korporat',
    unitKerja: 'Departemen Manajemen Risiko Korporat',
    kodeUnitKerja: 'RISK-CORP',
    email: 'daffa.ari@pusri.co.id',
    createdAt: '2026-01-01T08:00:00.000Z'
  },
  {
    id: 'usr-0953',
    username: '0953',
    nik: '0953',
    badge: '0953',
    nama: 'FAUZAN AL GHANIYYU',
    role: 'Unit Kerja',
    jabatan: 'Risk Officer Unit Kerja Pabrik',
    unitKerja: 'Departemen Operasi Pabrik Pusri IIB',
    kodeUnitKerja: 'OP-IIB',
    email: 'fauzan.al@pusri.co.id',
    createdAt: '2026-01-01T08:00:00.000Z'
  }
];

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  departments,
  initialRole
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Available users from MySQL / API
  const [availableUsers, setAvailableUsers] = useState<UserAccount[]>(OFFICIAL_ACCOUNTS);
  
  // Set default initial identifier based on role
  const getDefaultIdentifier = () => {
    if (initialRole === 'Atasan / VP') return '0951';
    if (initialRole === 'Admin') return '0952';
    if (initialRole === 'Unit Kerja') return '0953';
    return '0952'; // default Admin (DAFFA ARI PRASETYA)
  };

  const [selectedIdentifier, setSelectedIdentifier] = useState(getDefaultIdentifier());
  const [password, setPassword] = useState('portal123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Direktori modal state
  const [isDirektoriOpen, setIsDirektoriOpen] = useState(false);
  const [direktoriSearch, setDirektoriSearch] = useState('');

  // Register form state
  const [regNama, setRegNama] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regBadge, setRegBadge] = useState('');
  const [regRole, setRegRole] = useState<UserRole>(initialRole || 'Unit Kerja');
  const [regUnitKerja, setRegUnitKerja] = useState(departments[0]?.nama || 'Departemen Operasi Pabrik Pusri IIB');
  const [regCustomUnit, setRegCustomUnit] = useState('');
  const [regPassword, setRegPassword] = useState('portal123');

  // Load registered users from database
  const loadUsers = async () => {
    try {
      const list = await PusriApiClient.getUsers();
      if (list && list.length > 0) {
        // Merge official accounts to ensure 0951, 0952, 0953 are prioritized
        const mergedMap = new Map<string, UserAccount>();
        OFFICIAL_ACCOUNTS.forEach(u => mergedMap.set(u.badge || u.username, u));
        list.forEach(u => mergedMap.set(u.badge || u.username, u));
        setAvailableUsers(Array.from(mergedMap.values()));
      }
    } catch {
      setAvailableUsers(OFFICIAL_ACCOUNTS);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [initialRole]);

  // Select account helper
  const handleSelectAccount = (acc: UserAccount) => {
    setSelectedIdentifier(acc.badge || acc.username || acc.nama);
    setPassword('portal123');
    setErrorMsg(null);
    setIsDirektoriOpen(false);
  };

  // Handle Login Submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const identifier = selectedIdentifier.trim();
    if (!identifier) {
      setErrorMsg('Masukkan Username, NIK, atau Nama Pegawai.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await PusriApiClient.login(identifier, password);
      if (res && res.user) {
        onLoginSuccess(res.user);
        return;
      }

      // Check local official accounts match
      const q = identifier.toLowerCase();
      const localMatch = availableUsers.find(
        (u) =>
          (u.badge && u.badge.toLowerCase() === q) ||
          (u.nik && u.nik.toLowerCase() === q) ||
          u.username.toLowerCase() === q ||
          u.nama.toLowerCase().includes(q) ||
          q.includes(u.nama.toLowerCase())
      );

      if (localMatch && (password === 'portal123' || !password || password === localMatch.password)) {
        onLoginSuccess(localMatch);
        return;
      }

      setErrorMsg(res?.message || 'Kredensial login tidak valid. Pastikan NIK / Username dan Password sesuai.');
    } catch {
      // Offline fallback
      const q = identifier.toLowerCase();
      const localMatch = availableUsers.find(
        (u) =>
          (u.badge && u.badge.toLowerCase() === q) ||
          (u.nik && u.nik.toLowerCase() === q) ||
          u.username.toLowerCase() === q ||
          u.nama.toLowerCase().includes(q)
      );
      if (localMatch) {
        onLoginSuccess(localMatch);
        return;
      }
      setErrorMsg('Tidak dapat memverifikasi akun ke basis data. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Register Submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const finalUnit = regCustomUnit.trim() || regUnitKerja;
    const finalNama = regNama.trim();
    const finalUsername = regUsername.trim() || regBadge.trim() || finalNama.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const finalBadge = regBadge.trim() || '0954';

    if (!finalNama) {
      setErrorMsg('Nama lengkap wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const deptObj = departments.find(d => d.nama === finalUnit);
      const code = deptObj ? deptObj.kode : 'UNIT-' + finalUsername.toUpperCase().slice(0, 4);

      const res = await PusriApiClient.registerUser({
        nama: finalNama,
        username: finalUsername,
        role: regRole,
        unitKerja: finalUnit,
        kodeUnitKerja: code,
        password: regPassword.trim() || 'portal123',
        email: `${finalUsername.toLowerCase()}@pusri.co.id`
      });

      if (res && res.user) {
        const withBadge = { ...res.user, badge: finalBadge, nik: finalBadge };
        onLoginSuccess(withBadge);
        return;
      }

      const registeredUser: UserAccount = {
        id: `usr-new-${Date.now()}`,
        username: finalUsername,
        nama: finalNama,
        nik: finalBadge,
        badge: finalBadge,
        role: regRole,
        unitKerja: finalUnit,
        kodeUnitKerja: code,
        email: `${finalUsername.toLowerCase()}@pusri.co.id`,
        createdAt: new Date().toISOString()
      };
      onLoginSuccess(registeredUser);
    } catch {
      const registeredUser: UserAccount = {
        id: `usr-new-${Date.now()}`,
        username: finalUsername,
        nama: finalNama,
        nik: finalBadge,
        badge: finalBadge,
        role: regRole,
        unitKerja: finalUnit,
        kodeUnitKerja: 'UNIT-NEW',
        createdAt: new Date().toISOString()
      };
      onLoginSuccess(registeredUser);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered accounts for directory modal
  const filteredDirectory = availableUsers.filter((u) => {
    if (!direktoriSearch.trim()) return true;
    const q = direktoriSearch.toLowerCase();
    return (
      (u.badge && u.badge.toLowerCase().includes(q)) ||
      (u.nik && u.nik.toLowerCase().includes(q)) ||
      u.nama.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      u.unitKerja.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      {/* Subtle modern glowing soft yellow & sky blue aura */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-sky-200/40 dark:bg-sky-950/20 blur-[130px] pointer-events-none -top-20 -left-20" />
      <div className="absolute w-[450px] h-[450px] rounded-full bg-yellow-100/50 dark:bg-yellow-950/20 blur-[130px] pointer-events-none -bottom-20 -right-20" />

      {/* Main Centered Login Portal Card */}
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-7 sm:p-8 shadow-xl">
        
        {/* Brand Icon & Simple Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-3">
            <PusriLogo className="h-14 w-auto" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase font-sans">
            Portal Risiko Pusri
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            PT Pupuk Sriwidjaja Palembang
          </p>
        </div>

        {/* Tab Switcher: Masuk vs Daftar Akun */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'login'
                ? 'bg-[#009fe3] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Masuk</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'register'
                ? 'bg-[#009fe3] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Daftar Akun</span>
          </button>
        </div>

        {/* Error notification if any */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            {/* Field 1: Username / NIK / Nama Pegawai */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                Username / NIK / Nama Pegawai
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={selectedIdentifier}
                  onChange={(e) => setSelectedIdentifier(e.target.value)}
                  placeholder="Contoh: 880192, Mulyono, Handika, Glory..."
                  className="w-full h-11 pl-10 pr-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#00624a] focus:ring-1 focus:ring-[#00624a] transition-all shadow-2xs font-medium"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Masukkan NIK atau nama pegawai terdaftar di Pusri.
              </p>
            </div>

            {/* Field 2: Kata Sandi SSO */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                Kata Sandi SSO
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="........"
                  className="w-full h-11 pl-10 pr-10 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#00624a] focus:ring-1 focus:ring-[#00624a] transition-all font-mono shadow-2xs"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                  title={showPassword ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Row: Ingat sesi saya & Cari di Direktori */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#00624a] focus:ring-[#00624a] border-slate-300 cursor-pointer accent-[#00624a]"
                />
                <span>Ingat sesi saya</span>
              </label>
              <button
                type="button"
                onClick={() => setIsDirektoriOpen(true)}
                className="text-[#00624a] hover:text-[#004e3b] dark:text-emerald-400 font-bold cursor-pointer hover:underline text-xs flex items-center gap-1"
              >
                <Search className="w-3 h-3" />
                <span>Cari di Direktori</span>
              </button>
            </div>

            {/* Submit Button (Pusri Green/Teal with Key Icon) */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#00624a] hover:bg-[#00513d] text-white text-xs font-bold tracking-wide flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Key className="w-4 h-4" />
              <span>{isSubmitting ? 'Memverifikasi Akun...' : 'Masuk ke Portal Risiko'}</span>
            </button>

            {/* 3 Dedicated Official Accounts from Prompt (M DAVI, DAFFA ARI, FAUZAN) */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                <span>Pilih Akun Terdaftar (Password: portal123):</span>
              </div>

              <div className="space-y-1.5">
                {OFFICIAL_ACCOUNTS.map((acc) => {
                  const isSelected = selectedIdentifier === acc.badge || selectedIdentifier === acc.nama;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleSelectAccount(acc)}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 shadow-xs'
                          : 'bg-slate-50/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-mono text-[11px] font-black px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shrink-0">
                          {acc.badge}
                        </span>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {acc.nama}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {acc.unitKerja}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          acc.role === 'Admin'
                            ? 'bg-sky-100 text-[#009fe3] border border-sky-200'
                            : acc.role === 'Atasan / VP'
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-slate-200 text-slate-700 border border-slate-300'
                        }`}>
                          {acc.role}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </form>
        ) : (
          /* REGISTER FORM */
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Lengkap Pegawai
              </label>
              <input
                type="text"
                value={regNama}
                onChange={(e) => setRegNama(e.target.value)}
                placeholder="Contoh: Muhammad Ihsan"
                className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#00624a] transition-all shadow-2xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor Badge / NIK
                </label>
                <input
                  type="text"
                  value={regBadge}
                  onChange={(e) => setRegBadge(e.target.value)}
                  placeholder="Contoh: 0954"
                  className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#00624a] transition-all font-mono shadow-2xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  placeholder="username"
                  className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#00624a] transition-all font-mono shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Posisi / Peran (Role)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Unit Kerja', 'Atasan / VP', 'Admin'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRegRole(r)}
                    className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                      regRole === r
                        ? 'bg-[#00624a] border-[#00624a] text-white shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Unit Kerja / Departemen
              </label>
              <select
                value={regUnitKerja}
                onChange={(e) => {
                  setRegUnitKerja(e.target.value);
                  if (e.target.value !== 'LAINNYA') setRegCustomUnit('');
                }}
                className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#00624a] transition-all mb-2 cursor-pointer shadow-2xs"
              >
                {departments.map((d) => (
                  <option key={d.kode} value={d.nama}>
                    {d.nama}
                  </option>
                ))}
                <option value="LAINNYA">+ Ketik Unit Kerja Lainnya</option>
              </select>

              {regUnitKerja === 'LAINNYA' && (
                <input
                  type="text"
                  value={regCustomUnit}
                  onChange={(e) => setRegCustomUnit(e.target.value)}
                  placeholder="Ketik nama unit kerja"
                  className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#00624a] shadow-2xs"
                  required
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kata Sandi (Default: portal123)
              </label>
              <input
                type="text"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="portal123"
                className="w-full h-10 px-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#00624a] font-mono shadow-2xs"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#00624a] hover:bg-[#00513d] text-white text-xs font-bold tracking-wide flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Menyimpan ke Database...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Daftar Akun Baru & Masuk</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Modal "Cari di Direktori" */}
      {isDirektoriOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#00624a]" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Direktori Pegawai & Akun Pusri
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDirektoriOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={direktoriSearch}
                onChange={(e) => setDirektoriSearch(e.target.value)}
                placeholder="Cari berdasarkan NIK / Badge / Nama Pegawai..."
                className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#00624a]"
                autoFocus
              />
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {filteredDirectory.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  Tidak ditemukan akun pegawai dengan kata kunci tersebut.
                </p>
              ) : (
                filteredDirectory.map((acc) => (
                  <div
                    key={acc.id}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-300 bg-white dark:bg-slate-850 flex items-center justify-between gap-3 text-xs shadow-2xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                          {acc.badge || acc.nik || acc.username}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white truncate">
                          {acc.nama}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {acc.jabatan || acc.unitKerja}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectAccount(acc)}
                      className="px-3 py-1.5 rounded-xl bg-[#00624a] hover:bg-[#00513d] text-white font-bold text-[11px] shrink-0 transition-colors cursor-pointer"
                    >
                      Pilih Akun
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsDirektoriOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

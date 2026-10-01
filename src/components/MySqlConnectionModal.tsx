import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  X, 
  Server, 
  ExternalLink, 
  Copy, 
  Check, 
  HardDrive, 
  Zap,
  Activity,
  Layers,
  ArrowRight
} from 'lucide-react';
import { PusriApiClient } from '../services/api';

interface MySqlConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadSql?: () => void;
}

export const MySqlConnectionModal: React.FC<MySqlConnectionModalProps> = ({
  isOpen,
  onClose,
  onDownloadSql
}) => {
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const data = await PusriApiClient.getMySqlConnectionStatus();
      setStatus(data);
    } catch (e) {
      console.error('Failed to fetch MySQL status', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setTestResult(null);
    }
  }, [isOpen]);

  const handleTestConnect = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await PusriApiClient.testMySqlConnection();
      const isSuccess = Boolean(res.success);
      let message = res.message || '';
      
      if (!isSuccess && (message.includes('ECONNREFUSED') || message.includes('connect'))) {
        message = 'MySQL belum aktif di localhost:3306. Jika Anda membuka di Cloud Preview (Web), server cloud tidak bisa menjangkau MySQL di laptop Anda. Silakan jalankan aplikasi secara lokal (npm run dev) atau nyalakan MySQL di XAMPP/Laragon.';
      } else if (isSuccess) {
        message = '🟢 Berhasil terhubung ke MySQL! Database siap digunakan secara realtime.';
      }

      setTestResult({
        success: isSuccess,
        message
      });
      if (res.data) {
        setStatus(res.data);
      } else {
        await fetchStatus();
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        message: e.message || 'Gagal mengetes koneksi MySQL.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      const res = await PusriApiClient.syncAllToMySql();
      if (res && res.success) {
        setTestResult({
          success: true,
          message: `Berhasil sinkronisasi ${res.savedCount || 0} data risiko ke tabel pusri_risks di MySQL!`
        });
        await fetchStatus();
      } else {
        setTestResult({
          success: false,
          message: res?.message || 'Sinkronisasi gagal. Pastikan MySQL & phpMyAdmin aktif.'
        });
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        message: e.message || 'Gagal sinkronisasi data.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  if (!isOpen) return null;

  const isConnected = status?.isConnected ?? false;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-5 sm:p-6 space-y-5 shadow-2xl my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isConnected ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'}`}>
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                  Status Koneksi MySQL Realtime
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                  isConnected 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  {isConnected ? 'Terhubung (Active)' : 'Standby Mode'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Integrasi basis data MySQL & phpMyAdmin PT Pupuk Sriwidjaja Palembang
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Status Card */}
        <div className={`p-4 rounded-xl border ${
          isConnected
            ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                {isConnected ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Activity className="w-4 h-4 text-amber-500" />
                )}
                <span>
                  {isConnected 
                    ? `Terhubung ke MySQL di ${status?.host || '127.0.0.1'}:${status?.port || 3306}`
                    : 'Koneksi MySQL Lokal Sedang Standby'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                {isConnected
                  ? `Database: ${status?.database || 'pusri_risk_db'} • Latensi: ${status?.lastPingLatencyMs || 1}ms • Data Terdata: ${status?.totalMySqlRows || 0} baris.`
                  : 'Aplikasi saat ini menggunakan In-Memory Data Store berkecepatan tinggi. Jika Anda menyalakan MySQL di XAMPP/Laragon/Server, aplikasi akan terhubung secara realtime.'}
              </p>
            </div>

            <button
              onClick={handleTestConnect}
              disabled={isTesting}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Mengecek...' : 'Tes / Hubungkan Ulang'}</span>
            </button>
          </div>

          {/* Test feedback banner */}
          {testResult && (
            <div className={`mt-3 p-2.5 rounded-lg text-xs flex items-start gap-2 border ${
              testResult.success
                ? 'bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
                : 'bg-amber-100/80 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800'
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Configuration Parameter Grid */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Parameter Koneksi phpMyAdmin / MySQL</span>
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            {/* Host */}
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-500 block">Host Server</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                {status?.host || '127.0.0.1'}
              </span>
            </div>

            {/* Port */}
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-500 block">Port</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                {status?.port || 3306}
              </span>
            </div>

            {/* Database Name */}
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 relative group">
              <span className="text-[10px] text-slate-500 block">Database Name</span>
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs truncate">
                  {status?.database || 'pusri_risk_db'}
                </span>
                <button
                  onClick={() => copyToClipboard(status?.database || 'pusri_risk_db', 'db')}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                  title="Salin nama database"
                >
                  {copiedText === 'db' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* Username */}
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-500 block">User Account</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                {status?.user || 'root'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Guide for phpMyAdmin */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-teal-600" />
            <span>Petunjuk Sinkronisasi phpMyAdmin:</span>
          </span>
          <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            <li>Buka <strong>phpMyAdmin</strong> di browser (<code className="font-mono text-teal-700 dark:text-teal-400 bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">http://localhost/phpmyadmin</code>).</li>
            <li>Buat database baru bernama <strong className="text-slate-900 dark:text-slate-100">pusri_risk_db</strong> dengan collation <code className="font-mono">utf8mb4_unicode_ci</code>.</li>
            <li>Klik menu <strong>Import</strong> dan masukkan file skrip SQL skema dari tombol di bawah.</li>
            <li>Klik tombol <strong>"Tes / Hubungkan Ulang"</strong> untuk memvalidasi koneksi realtime.</li>
          </ol>
        </div>

        {/* Action Buttons Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {onDownloadSql && (
              <button
                onClick={onDownloadSql}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <HardDrive className="w-3.5 h-3.5 text-teal-600" />
                <span>Unduh Skema SQL (.sql)</span>
              </button>
            )}
            <button
              onClick={handleSyncAll}
              disabled={isSyncing}
              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Zap className={`w-3.5 h-3.5 ${isSyncing ? 'animate-pulse' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Data ke MySQL'}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold cursor-pointer transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  ShieldAlert, 
  Database, 
  Download, 
  Search, 
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { OrganizationMaster, PusriRisk, UserRole } from '../../types/pusri';

interface MasterOrganisasiViewProps {
  currentRole: UserRole;
  departments: OrganizationMaster[];
  risks: PusriRisk[];
  onDownloadSql: () => void;
  onFilterDept?: (kode: string) => void;
}

export const MasterOrganisasiView: React.FC<MasterOrganisasiViewProps> = ({
  currentRole,
  departments,
  risks,
  onDownloadSql,
  onFilterDept
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (currentRole !== 'Admin') {
    return (
      <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center max-w-xl mx-auto my-12 space-y-4 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
          Akses Terbatas: Hanya Khusus Administrator
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Seluruh akses konfigurasi basis data, master departemen, dan unduh skema SQL dilindungi secara ketat dan hanya dapat diakses oleh akun dengan peran <strong>Admin</strong>.
        </p>
      </div>
    );
  }

  const filteredDepts = departments.filter((d) =>
    d.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.direktorat.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-5 max-w-6xl mx-auto py-2">
      {/* Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#005a54] to-teal-900 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 font-mono">
            Master Data Korporat PT Pupuk Sriwidjaja Palembang
          </span>
          <h2 className="text-xl font-extrabold tracking-tight mt-0.5">
            Daftar Departemen Pemilik Risiko
          </h2>
          <p className="text-xs text-emerald-100 mt-1 max-w-2xl">
            Struktur 21 Departemen di lingkungan PT Pupuk Sriwidjaja Palembang sebagai pemilik dan pengelola risiko organisasi sesuai basis data terpusat.
          </p>
        </div>

        {currentRole === 'Admin' && (
          <button
            onClick={onDownloadSql}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer shrink-0"
            title="Khusus Otoritas Admin (Password: portal123)"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Skema MySQL</span>
          </button>
        )}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] text-slate-400 block font-bold">Total Departemen</span>
          <span className="text-xl font-extrabold font-mono text-slate-800 dark:text-slate-200">
            {departments.length} Unit
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] text-slate-400 block font-bold">Total Risiko Teregistrasi</span>
          <span className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
            {risks.length} Risiko
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] text-slate-400 block font-bold">Tabel Database</span>
          <span className="text-sm font-extrabold font-mono text-slate-800 dark:text-slate-200">
            master_organisasi
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] text-slate-400 block font-bold">Engine MySQL</span>
          <span className="text-sm font-extrabold font-mono text-teal-600 dark:text-teal-400">
            InnoDB (ACID)
          </span>
        </div>
      </div>

      {/* Table of Departments */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            Daftar Unit Kerja & Kepemilikan Risiko
          </h3>

          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder=""
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#005a54] dark:focus:border-emerald-500 focus:ring-2 focus:ring-[#005a54]/15 shadow-2xs transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-3">Kode Unit</th>
                <th className="py-2.5 px-3">Nama Departemen</th>
                <th className="py-2.5 px-3">Direktorat Induk</th>
                <th className="py-2.5 px-3 text-center">Jumlah Risiko Terkait</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredDepts.map((dept) => {
                const count = risks.filter((r) => r.kodeOrganisasi === dept.kode).length;
                return (
                  <tr key={dept.kode} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-mono font-bold text-[#005a54] dark:text-emerald-400">
                      {dept.kode}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      {dept.nama}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                      {dept.direktorat}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-900 dark:text-slate-100">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {count} Risiko
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                        Aktif
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

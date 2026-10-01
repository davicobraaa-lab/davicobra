/**
 * Types definition for PT Pupuk Sriwidjaja Palembang - Enterprise Risk Management System
 * Based on Pusri SOP 16 Tahapan Manajemen Risiko & ISO 31000
 */

export type RiskLevel = 'High' | 'Mod to High' | 'Moderate' | 'Low to Mod' | 'Low';

export type RiskCategory = 'Operasional' | 'Keuangan' | 'Strategis' | 'Hukum & Kepatuhan';

export type RiskHandlingStrategy = 'Mitigasi' | 'Diterima' | 'Dihindari' | 'Transfer';

export type WorkflowStatus = 
  | 'Draft_Unit' 
  | 'Menunggu_Approval_VP' 
  | 'Menunggu_Approval_Admin' 
  | 'Disetujui_Dalam_Pengendalian' 
  | 'Selesai' 
  | 'Carry_Over'
  | 'Revisi';

export type UserRole = 'Unit Kerja' | 'Atasan / VP' | 'Admin';

export interface QuarterlyControl {
  triwulan: 'TW 1' | 'TW 2' | 'TW 3' | 'TW 4';
  realisasiKegiatan: string;
  realisasiBiaya: number;
  progressPersen: number;
  kemungkinanResidual: number;
  dampakResidual: number;
  tingkatResidual: RiskLevel;
  statusPengendalian: 'On Track' | 'Delayed' | 'Completed' | 'Pending';
  kendalaDanTindakLanjut: string;
  updatedAt: string;
}

export interface CarryOverDetails {
  targetTahun: number;
  alasanCarryOver: string;
  rekomendasiKomite: string;
  approvalCarryOverBy?: string;
  tanggalCarryOver?: string;
}

export interface PusriRisk {
  id: string;
  kodeRisiko: string; // e.g. RSK-2026-001
  kodeOrganisasi: string; // e.g. PRD-1B
  namaOrganisasi: string;
  tahun: number; // e.g. 2026
  sasaranRKAP: string;
  sasaranUnitKerja: string;
  konteksEksternal: string;
  konteksInternal: string;
  sumberRisiko: string;
  pernyataanRisiko: string;
  penyebabRisiko: string;
  dampakRisiko: string;
  pengendalianExisting: string;
  kategoriRisiko: RiskCategory;
  kemungkinanAwal: number; // 1 - 5
  dampakAwal: number; // 1 - 5
  inherentScore: number; // kemungkinan * dampak (1 - 25)
  tingkatRisikoAwal: RiskLevel;
  currentTingkatRisiko: RiskLevel;
  jenisPenanganan: RiskHandlingStrategy;
  butuhMitigasi: boolean;
  statusKebutuhanMitigasi?: string;
  alasanKebutuhanMitigasi?: string;
  rencanaPenanganan: string;
  targetWaktuMitigasi: string; // e.g. 'TW 2'
  biayaRencanaPengendalian: number;
  picPelaksana: string;
  picPengendali: string;
  jenisAnggaran: string;
  statusWorkflow: WorkflowStatus;
  reviewNotesVp?: string;
  approvalNotesAdmin?: string;
  pengendalianTriwulan: QuarterlyControl[];
  carryOverInfo?: CarryOverDetails;
  createdDate: string;
  updatedDate: string;
  createdBy: string;
}

export type ThemeMode = 'light' | 'dark';

export interface UserAccount {
  id: string;
  username: string;
  nama: string;
  nik?: string;
  badge?: string;
  jabatan?: string;
  password?: string;
  role: UserRole;
  unitKerja: string;
  kodeUnitKerja: string;
  email?: string;
  createdAt: string;
}

export interface UserProfile {
  nik: string;
  badge?: string;
  nama: string;
  email: string;
  jabatan: string;
  unitKerja: string;
  kodeUnitKerja: string;
  role: UserRole;
  avatarInitials: string;
  terakhirLogin: string;
  hakAkses: string[];
}

export interface OrganizationMaster {
  kode: string;
  nama: string;
  direktorat: string;
  kepalaUnit: string;
  totalRisiko: number;
}

export interface MasterChecklistItem {
  id: string;
  kategori: RiskCategory;
  jenisRisiko: string;
  deskripsiStandar: string;
  faktorPemicuUmum: string;
  rekomendasiPengendalian: string;
}

export interface AuditLog {
  id: string;
  riskId: string;
  kodeRisiko: string;
  timestamp: string;
  userRole: UserRole;
  actorName: string;
  action: string;
  previousStatus?: string;
  newStatus?: string;
  notes: string;
  latencyMs: number; // Simulated API sync latency
}

export interface ApiSyncEvent {
  id: string;
  timestamp: string;
  moduleSource: string;
  moduleTarget: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  status: 'SUCCESS' | 'SYNCED';
  durationMs: number;
  payloadSummary: string;
}

export interface SopStage {
  step: number;
  title: string;
  pic: string;
  description: string;
  output: string;
  kategoriSOP: 'Perencanaan' | 'Identifikasi & Analisis' | 'Evaluasi & Respon' | 'Monitoring & Review';
}

-- =====================================================================
-- DATABASE SCHEMA: PORTAL RISIKO PT PUPUK SRIWIDJAJA PALEMBANG (PUSRI)
-- Dialect: MySQL 8.0 / Percona Server (InnoDB, utf8mb4_unicode_ci)
-- Arsitektur: Backend Golang 1.22 + MySQL 8.0 InnoDB Storage Engine
-- Fitur: Relational Integrity, Foreign Keys, Audit Trail, & Rapid Sync
-- Periode Data: Tahun Anggaran & Rencana Kerja 2026
-- =====================================================================

DROP DATABASE IF EXISTS `pusri_risk_db`;
CREATE DATABASE `pusri_risk_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `pusri_risk_db`;

-- ---------------------------------------------------------------------
-- 1. TABEL: master_organizations
-- Relasi: Data Departemen / Unit Kerja Pemilik Risiko
-- ---------------------------------------------------------------------
CREATE TABLE `master_organizations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `kode` VARCHAR(32) NOT NULL UNIQUE,
    `nama` VARCHAR(255) NOT NULL,
    `direktorat` VARCHAR(255) NOT NULL,
    `kepala_unit` VARCHAR(255) NOT NULL,
    `jabatan_kepala` VARCHAR(128) NOT NULL DEFAULT 'Vice President (VP)',
    `email_unit` VARCHAR(128) NOT NULL,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_org_kode` (`kode`),
    INDEX `idx_org_direktorat` (`direktorat`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. TABEL: master_risk_checklist
-- Relasi: Taksonomi Jenis & Kategori Risiko Standar Korporat Pusri
-- ---------------------------------------------------------------------
CREATE TABLE `master_risk_checklist` (
    `id` VARCHAR(32) PRIMARY KEY,
    `kategori` ENUM('Operasional', 'Keuangan', 'Strategis', 'Hukum & Kepatuhan') NOT NULL,
    `jenis_risiko` VARCHAR(255) NOT NULL,
    `deskripsi_standar` TEXT NOT NULL,
    `faktor_pemicu_umum` TEXT NOT NULL,
    `rekomendasi_pengendalian` TEXT NOT NULL,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_checklist_kategori` (`kategori`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2B. TABEL: portal_users
-- Relasi: Autentikasi Pengguna & Akun Unit Kerja / VP / Admin
-- Password Default: 'portal123'
-- ---------------------------------------------------------------------
CREATE TABLE `portal_users` (
    `id` VARCHAR(64) PRIMARY KEY,
    `username` VARCHAR(100) NOT NULL UNIQUE,
    `nama` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL DEFAULT 'portal123',
    `role` ENUM('Unit Kerja', 'Atasan / VP', 'Admin') NOT NULL,
    `unit_kerja` VARCHAR(255) NOT NULL,
    `kode_unit` VARCHAR(64) NOT NULL,
    `email` VARCHAR(128) NOT NULL,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_users_role` (`role`),
    INDEX `idx_users_username` (`username`),
    INDEX `idx_users_unit` (`unit_kerja`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. TABEL: pusri_risks
-- Relasi: Core Enterprise Risk Register PT Pupuk Sriwidjaja Palembang
-- ---------------------------------------------------------------------
CREATE TABLE `pusri_risks` (
    `id` VARCHAR(64) PRIMARY KEY,
    `kode_risiko` VARCHAR(64) NOT NULL UNIQUE,
    `kode_organisasi` VARCHAR(32) NOT NULL,
    `nama_organisasi` VARCHAR(255) NOT NULL,
    `tahun` INT NOT NULL DEFAULT 2026,
    `sasaran_rkap` TEXT NOT NULL,
    `sasaran_unit_kerja` TEXT NOT NULL,
    `konteks_eksternal` TEXT,
    `konteks_internal` TEXT,
    `sumber_risiko` VARCHAR(255) NOT NULL,
    `pernyataan_risiko` TEXT NOT NULL,
    `penyebab_risiko` TEXT NOT NULL,
    `dampak_risiko` TEXT NOT NULL,
    `pengendalian_existing` TEXT,
    `kategori_risiko` ENUM('Operasional', 'Keuangan', 'Strategis', 'Hukum & Kepatuhan') NOT NULL DEFAULT 'Operasional',
    `kemungkinan_awal` TINYINT NOT NULL DEFAULT 1 CHECK (`kemungkinan_awal` BETWEEN 1 AND 5),
    `dampak_awal` TINYINT NOT NULL DEFAULT 1 CHECK (`dampak_awal` BETWEEN 1 AND 5),
    `inherent_score` INT GENERATED ALWAYS AS (`kemungkinan_awal` * `dampak_awal`) STORED,
    `tingkat_risiko_awal` ENUM('High', 'Mod to High', 'Moderate', 'Low to Mod', 'Low') NOT NULL,
    `current_tingkat_risiko` ENUM('High', 'Mod to High', 'Moderate', 'Low to Mod', 'Low') NOT NULL,
    `jenis_penanganan` ENUM('Mitigasi', 'Diterima', 'Dihindari', 'Transfer') NOT NULL DEFAULT 'Mitigasi',
    `butuh_mitigasi` BOOLEAN NOT NULL DEFAULT TRUE,
    `status_kebutuhan_mitigasi` VARCHAR(128) NOT NULL DEFAULT 'Wajib Mitigasi',
    `alasan_kebutuhan_mitigasi` TEXT,
    `rencana_penanganan` TEXT,
    `target_waktu_mitigasi` VARCHAR(32) DEFAULT 'TW 2',
    `biaya_rencana_pengendalian` DECIMAL(15, 2) DEFAULT 0.00,
    `pic_pelaksana` VARCHAR(255) NOT NULL DEFAULT 'Risk Officer Unit',
    `pic_pengendali` VARCHAR(255) NOT NULL DEFAULT 'VP Departemen',
    `jenis_anggaran` VARCHAR(64) DEFAULT 'Investasi Rutin / OPEX',
    `status_workflow` ENUM(
        'Draft_Unit', 
        'Menunggu_Approval_VP', 
        'Menunggu_Approval_Admin', 
        'Disetujui_Dalam_Pengendalian', 
        'Selesai', 
        'Carry_Over'
    ) NOT NULL DEFAULT 'Menunggu_Approval_VP',
    `review_notes_vp` TEXT,
    `approval_notes_admin` TEXT,
    `created_by` VARCHAR(128) NOT NULL DEFAULT 'Risk Officer',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_pusri_risk_org` FOREIGN KEY (`kode_organisasi`) REFERENCES `master_organizations`(`kode`) ON UPDATE CASCADE,
    INDEX `idx_risk_tahun` (`tahun`),
    INDEX `idx_risk_status` (`status_workflow`),
    INDEX `idx_risk_kategori` (`kategori_risiko`),
    INDEX `idx_risk_tingkat` (`current_tingkat_risiko`),
    INDEX `idx_risk_inherent` (`inherent_score`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. TABEL: quarterly_controls
-- Relasi: Pemantauan Pengendalian Triwulan (TW 1 s/d TW 4)
-- ---------------------------------------------------------------------
CREATE TABLE `quarterly_controls` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `risk_id` VARCHAR(64) NOT NULL,
    `triwulan` ENUM('TW 1', 'TW 2', 'TW 3', 'TW 4') NOT NULL,
    `realisasi_kegiatan` TEXT NOT NULL,
    `realisasi_biaya` DECIMAL(15, 2) DEFAULT 0.00,
    `progress_persen` INT DEFAULT 0 CHECK (`progress_persen` BETWEEN 0 AND 100),
    `kemungkinan_residual` TINYINT DEFAULT 1 CHECK (`kemungkinan_residual` BETWEEN 1 AND 5),
    `dampak_residual` TINYINT DEFAULT 1 CHECK (`dampak_residual` BETWEEN 1 AND 5),
    `residual_score` INT GENERATED ALWAYS AS (`kemungkinan_residual` * `dampak_residual`) STORED,
    `tingkat_residual` ENUM('High', 'Mod to High', 'Moderate', 'Low to Mod', 'Low') NOT NULL,
    `status_pengendalian` ENUM('On Track', 'Delayed', 'Completed', 'Pending') NOT NULL DEFAULT 'On Track',
    `kendala_dan_tindak_lanjut` TEXT,
    `reported_by` VARCHAR(128) NOT NULL DEFAULT 'PIC Pelaksana',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_quarterly_pusri_risk` FOREIGN KEY (`risk_id`) REFERENCES `pusri_risks`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_risk_triwulan` (`risk_id`, `triwulan`),
    INDEX `idx_quarterly_status` (`status_pengendalian`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. TABEL: risk_carry_overs
-- Relasi: Registrasi Evaluasi Risiko Multi-Tahun (Carry Over ke 2027)
-- ---------------------------------------------------------------------
CREATE TABLE `risk_carry_overs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `risk_id` VARCHAR(64) NOT NULL UNIQUE,
    `target_tahun` INT NOT NULL DEFAULT 2027,
    `alasan_carry_over` TEXT NOT NULL,
    `rekomendasi_komite` TEXT NOT NULL,
    `approval_carry_over_by` VARCHAR(255) NOT NULL,
    `tanggal_carry_over` DATE NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_carryover_pusri_risk` FOREIGN KEY (`risk_id`) REFERENCES `pusri_risks`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 6. TABEL: risk_audit_logs
-- Relasi: Jejak Audit SOP 16 Tahapan Pusri & RBAC Action Logging
-- ---------------------------------------------------------------------
CREATE TABLE `risk_audit_logs` (
    `id` VARCHAR(64) PRIMARY KEY,
    `risk_id` VARCHAR(64) NOT NULL,
    `kode_risiko` VARCHAR(64) NOT NULL,
    `user_role` ENUM('Unit Kerja', 'Atasan / VP', 'Admin') NOT NULL,
    `actor_name` VARCHAR(255) NOT NULL,
    `action` VARCHAR(128) NOT NULL,
    `previous_status` VARCHAR(64),
    `new_status` VARCHAR(64),
    `notes` TEXT,
    `ip_address` VARCHAR(64) DEFAULT '127.0.0.1',
    `latency_ms` DECIMAL(6, 2) DEFAULT 4.2,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_audit_risk_id` (`risk_id`),
    INDEX `idx_audit_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 7. TABEL: module_sync_events
-- Relasi: Log Sinkronisasi Real-Time REST API Golang Antar Modul
-- ---------------------------------------------------------------------
CREATE TABLE `module_sync_events` (
    `id` VARCHAR(64) PRIMARY KEY,
    `module_source` VARCHAR(128) NOT NULL,
    `module_target` VARCHAR(128) NOT NULL,
    `endpoint` VARCHAR(255) NOT NULL,
    `method` VARCHAR(16) NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'SYNCED',
    `duration_ms` DECIMAL(6, 2) NOT NULL DEFAULT 4.5,
    `payload_summary` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_sync_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- DATA SEED: MASTER ORGANISASI & DEPARTEMEN PT PUPUK SRIWIDJAJA
-- ---------------------------------------------------------------------
INSERT INTO `master_organizations` (`kode`, `nama`, `direktorat`, `kepala_unit`, `jabatan_kepala`, `email_unit`) VALUES
('OP-IIB', 'Departemen Operasi Pabrik Pusri IIB', 'Direktorat Operasi & Produksi', 'Bambang Irawan, S.T. (VP)', 'VP Operasi Pabrik Pusri IIB', 'bambang.irawan@pusri.co.id'),
('OP-III', 'Departemen Operasi Pabrik Pusri III', 'Direktorat Operasi & Produksi', 'Ir. Ahmad Subari (VP)', 'VP Operasi Pabrik Pusri III', 'ahmad.subari@pusri.co.id'),
('OP-IV', 'Departemen Operasi Pabrik Pusri IV', 'Direktorat Operasi & Produksi', 'Kurniawan Pratama, S.T. (VP)', 'VP Operasi Pabrik Pusri IV', 'kurniawan.p@pusri.co.id'),
('OP-V', 'Departemen Operasi Pabrik Pusri V', 'Direktorat Operasi & Produksi', 'M. Rizky Ramadhan, S.T. (VP)', 'VP Operasi Pabrik Pusri V', 'rizky.ramadhan@pusri.co.id'),
('RP-PROD', 'Departemen Rencana & Pengendalian Produksi', 'Direktorat Operasi & Produksi', 'Faisal Akbar, M.T. (VP)', 'VP Rencana & Pengendalian Produksi', 'faisal.akbar@pusri.co.id'),
('HAR-MEK', 'Departemen Pemeliharaan Mekanikal', 'Direktorat Operasi & Produksi', 'Ir. Hendra Kusuma (VP)', 'VP Pemeliharaan Mekanikal', 'hendra.kusuma@pusri.co.id'),
('HAR-ELINS', 'Departemen Pemeliharaan Listrik & Instrumen', 'Direktorat Operasi & Produksi', 'Agung Wicaksono, S.T. (VP)', 'VP Pemeliharaan Listrik & Instrumen', 'agung.w@pusri.co.id'),
('INSP-TEK', 'Departemen Inspeksi Teknik', 'Direktorat Operasi & Produksi', 'Ir. Wahyu Hidayat (VP)', 'VP Inspeksi Teknik', 'wahyu.hidayat@pusri.co.id'),
('K3', 'Departemen Keselamatan & Kesehatan Kerja (K3)', 'Direktorat Operasi & Produksi', 'Agus Setiawan, S.T., M.Env. (VP)', 'VP Keselamatan & Kesehatan Kerja (K3)', 'agus.setiawan@pusri.co.id'),
('LH', 'Departemen Lingkungan Hidup', 'Direktorat Operasi & Produksi', 'Dr. Ir. Ratna Sari (VP)', 'VP Lingkungan Hidup', 'ratna.sari@pusri.co.id'),
('SDM-ORG', 'Departemen Pengembangan SDM & Organisasi', 'Direktorat SDM & Umum', 'Nurul Hidayati, S.Psi., M.M. (VP)', 'VP Pengembangan SDM & Organisasi', 'nurul.hidayati@pusri.co.id'),
('DIKLAT', 'Departemen Pendidikan & Pelatihan (Diklat)', 'Direktorat SDM & Umum', 'Budi Santoso, S.Pd., M.M. (VP)', 'VP Pendidikan & Pelatihan (Diklat)', 'budi.santoso@pusri.co.id'),
('REM-HI', 'Departemen Remunerasi & Hubungan Industrial', 'Direktorat SDM & Umum', 'Indra Gunawan, S.H. (VP)', 'VP Remunerasi & Hubungan Industrial', 'indra.gunawan@pusri.co.id'),
('SAR-UMUM', 'Departemen Sarana & Umum', 'Direktorat SDM & Umum', 'Drs. Heru Prasetyo (VP)', 'VP Sarana & Umum', 'heru.prasetyo@pusri.co.id'),
('SEKURITI', 'Departemen Keamanan / Sekuriti', 'Direktorat SDM & Umum', 'Mayor (Purn) Darmawan (VP)', 'VP Keamanan / Sekuriti', 'darmawan.sec@pusri.co.id'),
('TJSL', 'Departemen Tanggung Jawab Sosial & Lingkungan (TJSL)', 'Direktorat Keuangan & Umum', 'Dra. Sri Wahyuni, M.M. (VP)', 'VP TJSL', 'sri.wahyuni@pusri.co.id'),
('PENGADAAN', 'Departemen Pengadaan Barang & Jasa', 'Direktorat Keuangan & Umum', 'Arief Budiman, S.T. (VP)', 'VP Pengadaan Barang & Jasa', 'arief.budiman@pusri.co.id'),
('HUMAS', 'Departemen Hubungan Masyarakat (Humas)', 'Sekretariat Perusahaan', 'Rustam Effendi, S.Sos. (VP)', 'VP Hubungan Masyarakat (Humas)', 'rustam.effendi@pusri.co.id'),
('HUKUM', 'Departemen Hukum (Corporate Legal)', 'Sekretariat Perusahaan', 'Maya Lestari, S.H., M.Kn. (VP)', 'VP Hukum (Corporate Legal)', 'maya.lestari@pusri.co.id'),
('KEU-AKUN', 'Departemen Keuangan & Akuntansi', 'Direktorat Keuangan & Umum', 'Ahmad Fauzi, S.E., Ak. (VP)', 'VP Keuangan & Akuntansi', 'ahmad.fauzi@pusri.co.id'),
('TI', 'Departemen Teknologi Informasi', 'Direktorat Transformasi Bisnis', 'Ir. Dedi Kurniawan, M.Kom. (VP)', 'VP Teknologi Informasi', 'dedi.kurniawan@pusri.co.id');

-- ---------------------------------------------------------------------
-- DATA SEED: MASTER CHECKLIST STANDAR JENIS RISIKO PUSRI
-- ---------------------------------------------------------------------
INSERT INTO `master_risk_checklist` (`id`, `kategori`, `jenis_risiko`, `deskripsi_standar`, `faktor_pemicu_umum`, `rekomendasi_pengendalian`) VALUES
('CHK-OPR-01', 'Operasional', 'Kegagalan Pasokan Gas Alam Feedstock & Fuel Pabrik', 'Penurunan tekanan atau gangguan pasokan gas alam dari kontraktor KKS yang menyebabkan trip pabrik amonia/urea.', 'Pipa bocor, gangguan kompresor di sumur gas, force majeure transmisi.', 'Dual sourcing pasokan gas, optimalisasi buffer tank, kontrak jaminan SLA pasokan.'),
('CHK-OPR-02', 'Operasional', 'Kerusakan Unscheduled Mesin Kritis (Turbin/Reaktor)', 'Kerusakan fatal pada boiler, reaktor sintesis, atau turbin generator di luar jadwal Turn Around (TA).', 'Fatigue material, pelumasan substandard, overheating komponen internal.', 'Predictive vibration analysis, online oil condition monitoring, suku cadang OEM siap di gudang.'),
('CHK-OPR-03', 'Operasional', 'Keterlambatan Distribusi Pupuk Musim Tanam', 'Keterlambatan armada kapal/truk dalam memasok pupuk subsidi ke gudang Lini III saat puncak musim tanam.', 'Cuaca ekstrem di perairan Selat Bangka, kelangkaan armada truk, hambatan dermaga.', 'Buffer stock 2 minggu di gudang Lini III, kontrak payung ekspedisi logistik multi-armada.'),
('CHK-KEU-01', 'Keuangan', 'Volatilitas Nilai Tukar USD/IDR Terhadap Beban Pembelian Bahan Baku', 'Fluktuasi kurs mata uang asing yang menaikkan biaya pengadaan sparepart impor dan bahan baku penolong.', 'Ketidakpastian ekonomi global, kenaikan suku bunga The Fed.', 'Hedging valas (forward contract), negosiasi termin pembayaran mata uang lokal, natural hedging ekspor.'),
('CHK-KEU-02', 'Keuangan', 'Peningkatan Piutang Tak Tertagih Distributor Non-Subsidi', 'Keterlambatan pembayaran dari distributor ritel pupuk nonsubsidi komersial melewati jatuh tempo.', 'Kelesuan likuiditas sektor perkebunan, kelalaian penagihan kredit.', 'Pemberlakuan Bank Garansi (BG), skema plafon kredit ketat, monitoring cash conversion cycle mingguan.'),
('CHK-STR-01', 'Strategis', 'Disrupsi Pasokan & Harga Bahan Baku Fosfat / Kalium Global', 'Kenaikan drastis harga bahan baku NPK impor (Rock Phosphate / MOP) akibat restriksi geopolitik ekspor.', 'Konflik perang regional, kuota pembatasan ekspor dari negara produsen.', 'Diversifikasi negara pemasok alternatif (Moroko/Yordania/Kanada), kontrak jangka panjang fixed price.'),
('CHK-STR-02', 'Strategis', 'Perubahan Regulasi Kebijakan Pupuk Bersubsidi Nasional', 'Perubahan alokasi jenis pupuk bersubsidi, penetapan HET, atau kriteria petani penerima oleh Kementerian.', 'Penyesuaian APBN pemerintah, pergeseran fokus program kedaulatan pangan.', 'Fokus ekspansi pasar retail komersial komoditas sawit/padi, pendampingan program Makmur Pupuk Indonesia.'),
('CHK-HKM-01', 'Hukum & Kepatuhan', 'Keterlambatan Perpanjangan Izin Lingkungan & Dokumen AMDAL', 'Pelanggaran regulasi lingkungan akibat telatnya perpanjangan izin operasional IPAL dan emisi cerobong pabrik.', 'Perubahan regulasi KLHK (SIMPEL), keterlambatan verifikasi pihak ketiga.', 'Penyusunan timeline audit kepatuhan semesteran, digital dashboard perizinan otomatis.'),
('CHK-HKM-02', 'Hukum & Kepatuhan', 'Risiko Audit Kepatuhan Pengadaan Barang & Jasa (PBJ)', 'Temuan ketidaksesuaian prosedur tender pengadaan dengan pedoman GCG dan regulasi BUMN.', 'Dokumen HPS tidak lengkap, potensi konflik kepentingan vendor.', 'Digital e-procurement tertutup, audit pre-award oleh Satuan Pengawasan Intern (SPI).');

-- ---------------------------------------------------------------------
-- DATA SEED: USER ACCOUNTS (PASSWORD DEFAULT: portal123)
-- ---------------------------------------------------------------------
INSERT INTO `portal_users` (`id`, `username`, `nama`, `password`, `role`, `unit_kerja`, `kode_unit`, `email`) VALUES
('usr-001', 'admin', 'Hendra Pratama, S.T., M.M.', 'portal123', 'Admin', 'Departemen Manajemen Risiko Korporat', 'RISK-CORP', 'risk.admin@pusri.co.id'),
('usr-002', 'vp.operasi', 'Ir. Faisal Anwar, M.T. (VP Operasi)', 'portal123', 'Atasan / VP', 'Departemen Operasi Pabrik 1B', 'PRD-1B', 'faisal.anwar@pusri.co.id'),
('usr-003', 'atasan', 'Vice President Penilai (Atasan / VP)', 'portal123', 'Atasan / VP', 'Departemen Operasi Pabrik 1B', 'PRD-1B', 'vp.penilai@pusri.co.id'),
('usr-004', 'unit.ops1b', 'Bambang S., S.T. - Unit Kerja Pabrik 1B', 'portal123', 'Unit Kerja', 'Departemen Operasi Pabrik 1B', 'PRD-1B', 'bambang.ops@pusri.co.id'),
('usr-005', 'unitkerja', 'Staff Pelaksana Unit Kerja', 'portal123', 'Unit Kerja', 'Departemen Pemeliharaan Mekanikal', 'MTC-MEK', 'staff.unit@pusri.co.id'),
('usr-006', 'unit.mekanikal', 'Arief Wibowo - Officer Pemeliharaan', 'portal123', 'Unit Kerja', 'Departemen Pemeliharaan Mekanikal', 'MTC-MEK', 'arief.mekanikal@pusri.co.id'),
('usr-007', 'vp.keuangan', 'Dr. Suryadi, S.E., Ak. (VP Keuangan)', 'portal123', 'Atasan / VP', 'Departemen Keuangan & Pendanaan', 'FIN-ACC', 'suryadi.fin@pusri.co.id');

-- ---------------------------------------------------------------------
-- DATA SEED: 8 REGISTER RISIKO KORPORAT PUSRI TAHUN 2026
-- Sesuai Tampilan Gambar Dashboard Matriks 5x5:
-- L4xD5=1, L4xD4=1, L3xD4=3, L3xD3=2, L2xD2=1. Total = 8 Risiko.
-- ---------------------------------------------------------------------
INSERT INTO `pusri_risks` (
    `id`, `kode_risiko`, `kode_organisasi`, `nama_organisasi`, `tahun`,
    `sasaran_rkap`, `sasaran_unit_kerja`, `konteks_eksternal`, `konteks_internal`,
    `sumber_risiko`, `pernyataan_risiko`, `penyebab_risiko`, `dampak_risiko`,
    `pengendalian_existing`, `kategori_risiko`, `kemungkinan_awal`, `dampak_awal`,
    `tingkat_risiko_awal`, `current_tingkat_risiko`, `jenis_penanganan`,
    `butuh_mitigasi`, `status_kebutuhan_mitigasi`, `alasan_kebutuhan_mitigasi`,
    `rencana_penanganan`, `target_waktu_mitigasi`, `biaya_rencana_pengendalian`,
    `pic_pelaksana`, `pic_pengendali`, `jenis_anggaran`, `status_workflow`, `created_by`
) VALUES
(
    'RSK-2026-001', 'RSK-2026-001', 'PRD-1B', 'Departemen Operasi Pabrik 1B', 2026,
    'Pencapaian Target Produksi Amonia 660.000 Ton/Tahun', 'Keandalan Operasi Pabrik Tanpa Unplanned Shutdown',
    'Penurunan tekanan sumur gas pemasok Sumatera Bagian Selatan', 'Kondisi burner reformer pabrik 1B yang beroperasi kontinu',
    'Operasional Pabrik', 'Penurunan Tekanan Pasokan Gas Alam Feedstock Pabrik 1B',
    'Penurunan pasokan dari pipa transmisi gas utama dan fluktuasi kompresor upstream',
    'Penurunan laju produksi urea hingga 300 ton/hari dan potensi tripping kompresor sintesis',
    'Pemantauan telemetri tekanan gas real-time 24 jam dan SOP penyesuaian rasio udara-gas',
    'Operasional', 4, 5, 'High', 'High', 'Mitigasi',
    TRUE, 'Wajib Mitigasi Segera (High Risk)', 'Skor inherent 20 (>=10) melebihi batas selera risiko korporat Pusri.',
    'Pemasangan booster kompresor gas mandiri dan optimalisasi kontrak SLA tekanan gas dengan PGN/Medco',
    'TW 2', 12500000000.00, 'Manajer Operasi Pabrik 1B', 'VP Operasi Pabrik 1B', 'Investasi / CAPEX',
    'Disetujui_Dalam_Pengendalian', 'Risk Officer PRD'
),
(
    'RSK-2026-002', 'RSK-2026-002', 'HAR-PUS', 'Departemen Pemeliharaan & Pabrikasi', 2026,
    'Kesiapan Peralatan Pabrik (Availability Factor > 98%)', 'Penyelesaian Turn Around (TA) Tepat Waktu & Zero Accident',
    'Keterlambatan logistik perkapalan impor rotor turbin', 'Kelelahan material rotor HP casing setelah 8 tahun siklus kerja',
    'Pemeliharaan Mesin Kritis', 'Kerusakan Kritikal Rotor Turbin Kompresor Gas Sintesis K-401',
    'Vibrasi berlebih akibat erosi bilah turbin mikro yang tidak terdeteksi inspeksi berkala',
    'Trip mendadak pabrik pupuk selama minimal 14 hari dengan estimasi kerugian Rp 18 Miliar',
    'Pengujian analisa spektrum vibrasi bulanan dan pelumasan sistem sentral',
    'Operasional', 4, 4, 'Mod to High', 'Mod to High', 'Mitigasi',
    TRUE, 'Wajib Mitigasi Aktif (Mod to High)', 'Skor inherent 16 (>=10) mewajibkan mitigasi terstruktur.',
    'Pengadaan rotor cadangan OEM siap pakai (spare rotor assembly) dan balancing dinamik di workshop',
    'TW 3', 8500000000.00, 'Superintendent Pemeliharaan Mesin Berputar', 'VP Pemeliharaan Pabrik', 'Capex Rutin',
    'Disetujui_Dalam_Pengendalian', 'Risk Officer HAR'
),
(
    'RSK-2026-003', 'RSK-2026-003', 'LOG-DIST', 'Departemen Distribusi & Logistik', 2026,
    'Penyaluran Pupuk Subsidi Lini I s/d Lini IV 100% Tepat Waktu', 'Ketersediaan Stok Buffer Minimum 2 Minggu di Gudang Penyangga',
    'Cuaca ekstrem gelombang tinggi di perairan Selat Bangka', 'Keterbatasan dermaga muat curah dermaga Pusri Palembang',
    'Rantai Pasok & Distribusi', 'Kongesti Dermaga dan Keterlambatan Armada Kapal Curah Pupuk',
    'Antrean kapal tongkang dan keterbatasan kapasitas unloader pelabuhan tujuan Jawa & Lampung',
    'Penumpukan pupuk di bagging plant pabrik, potensi sak pupuk mengeras (caking)',
    'Jadwal pengapalan dinamis berbasis sistem tracking AIS maritim kapal',
    'Operasional', 3, 4, 'Mod to High', 'Mod to High', 'Mitigasi',
    TRUE, 'Wajib Mitigasi Aktif (Mod to High)', 'Skor inherent 12 (>=10) wajib menyusun mitigasi penanganan.',
    'Penyewaan gudang buffer Lini II tambahan di pelabuhan Boom Baru Palembang dan ekspedisi cadangan',
    'TW 2', 4200000000.00, 'Manajer Perencanaan Angkutan & Logistik', 'VP Distribusi & Logistik', 'OPEX Distribusi',
    'Menunggu_Approval_VP', 'Risk Officer LOG'
),
(
    'RSK-2026-004', 'RSK-2026-004', 'KEU-TREAS', 'Departemen Keuangan & Treasury', 2026,
    'Manajemen Arus Kas & Efisiensi Biaya Finansial Perusahaan', 'Pengendalian Biaya Selisih Kurs Valas Pembelian Spareparts',
    'Volatilitas kurs US Dollar global dan kebijakan suku bunga bank sentral', 'Kebutuhan devisa impor katalis pabrik',
    'Keuangan Korporat', 'Kerugian Selisih Kurs Akibat Fluktuasi Pembelian Katalis Valas USD',
    'Pelemahan nilai tukar Rupiah terhadap USD pada saat jatuh tempo letter of credit (L/C)',
    'Beban operasional keuangan membengkak melebihi asumsi kurs dalam RKAP 2026',
    'Penerapan natural hedging dengan pendapatan ekspor urea komersial',
    'Keuangan', 3, 4, 'Mod to High', 'Mod to High', 'Mitigasi',
    TRUE, 'Wajib Mitigasi Aktif (Mod to High)', 'Skor inherent 12 (>=10) wajib mitigasi lindung nilai.',
    'Penerapan transaksi FX Forward Hedging dengan bank BUMN rekanan untuk transaksi > $500K',
    'TW 1', 1500000000.00, 'Manajer Treasury & Valas', 'VP Keuangan & Treasury', 'Biaya Keuangan',
    'Menunggu_Approval_Admin', 'Risk Officer KEU'
),
(
    'RSK-2026-005', 'RSK-2026-005', 'REN-STRAT', 'Departemen Perencanaan Strategis & Portofolio', 2026,
    'Ekspansi Pasar Komersial NPK Retail dan Korporasi Sawit', 'Pertumbuhan Pendapatan Segmen Non-Subsidi 15%',
    'Perang harga pupuk NPK impor murah dari Rusia dan Tiongkok', 'Daya beli pekebun rakyat kelapa sawit swadaya',
    'Persaingan Bisnis & Pasar', 'Penetrasi Pasar Pupuk NPK Formula Khusus Terhambat Produk Impor',
    'Harga pupuk NPK impor bersaing ketat dengan disparitas harga 8-12%',
    'Target volume penjualan retail 85.000 ton di wilayah Sumatera berpotensi tidak tercapai',
    'Brand image Pusri yang kuat dan keaslian jaminan mutu pupuk SNI',
    'Strategis', 3, 4, 'Mod to High', 'Mod to High', 'Mitigasi',
    TRUE, 'Wajib Mitigasi Aktif (Mod to High)', 'Skor inherent 12 (>=10) wajib mitigasi strategi komersial.',
    'Program Makmur terintegrasi (pendampingan budidaya, asuransi panen, dan jaminan off-taker)',
    'TW 3', 3800000000.00, 'Manajer Pemasaran NPK Khusus', 'VP Strategic Planning', 'Biaya Promosi & Makmur',
    'Disetujui_Dalam_Pengendalian', 'Risk Officer REN'
),
(
    'RSK-2026-006', 'RSK-2026-006', 'HKM-GOV', 'Departemen Hukum, Kepatuhan & GCG', 2026,
    'Pencapaian Skor GCG Sangat Baik (> 90.00) dan Zero Legal Default', 'Kepatuhan Regulasi Lingkungan Emisi Cerobong Industri Pupuk',
    'Pemberlakuan regulasi Baku Mutu Emisi Baru KLHK RI', 'Kinerja scrubber cerobong unit granulasi urea lama',
    'Hukum & Regulasi', 'Potensi Teguran Administratif Kualitas Emisi Cerobong Granulasi',
    'Ketidaksempurnaan penangkapan debu urea pada siklon saat pabrik dipaksa beban 105%',
    'Risiko sanksi pembatasan izin operasi dan kerusakan citra korporat di media massa',
    'Monitoring Continuous Emission Monitoring System (CEMS) online ke KLHK',
    'Hukum & Kepatuhan', 3, 3, 'Moderate', 'Moderate', 'Mitigasi',
    TRUE, 'Wajib Mitigasi Rekomendasi (Moderate)', 'Skor inherent 9 mendekati batas toleransi.',
    'Pemasangan high-efficiency wet scrubber dan penggantian nozzle spray filter',
    'TW 4', 2900000000.00, 'Manajer Kepatuhan Lingkungan & GCG', 'VP Legal & GCG', 'Capex Lingkungan',
    'Disetujui_Dalam_Pengendalian', 'Risk Officer HKM'
),
(
    'RSK-2026-007', 'RSK-2026-007', 'K3-ENV', 'Departemen K3 & Lingkungan Hidup', 2026,
    'Pencapaian Zero Fatality & Zero Lost Time Injury (LTI)', 'Penerapan Golden Rules K3 dan Budaya BBS di Seluruh Unit',
    'Kondisi iklim kemarau dan potensi panas tinggi di area pabrik', 'Kelalaian kontraktor pihak ketiga saat pekerjaan panas',
    'K3 & Lingkungan Kerja', 'Insiden Kecelakaan Kerja Bekerja di Ketinggian & Ruang Terbatas',
    'Kelemahan kepatuhan penggunaan full body harness dan gas detector portabel',
    'Cedera pekerja, penghentian izin kerja sementara, dan investigasi mendalam',
    'Surat Izin Kerja Aman (SIKA), Daily Tool Box Meeting, dan Safety Induction wajib',
    'Operasional', 2, 2, 'Low to Mod', 'Low', 'Diterima',
    FALSE, 'Toleransi Terpenuhi (Dapat Diterima)', 'Skor inherent 4 (<10). Risiko dalam batas toleransi wajar melalui SOP K3 existing.',
    'Pertahankan audit inspeksi K3 harian dan edukasi berkala kepada rekanan vendor',
    'TW 2', 450000000.00, 'Superintendent K3 Lapangan', 'VP K3 & Lingkungan', 'OPEX K3',
    'Selesai', 'Risk Officer K3'
),
(
    'RSK-2026-008', 'RSK-2026-008', 'TI-DIG', 'Departemen Teknologi Informasi & Digitalisasi', 2026,
    'Digitalisasi Terintegrasi Pabrik dan Smart Plant Management', 'Upgrade Sistem Kontrol Terdistribusi (DCS) Pabrik NPK Fusion',
    'Ketergantungan terhadap vendor principal otomatisasi internasional', 'Siklus shut down tahunan pabrik yang terbatas waktunya',
    'Teknologi Informasi & Kontrol', 'Migrasi DCS Pabrik NPK Melampaui Batas Waktu Turn Around 2026',
    'Kompleksitas kabel I/O loop dan ketersediaan engineering expert vendor luar negeri',
    'Waktu startup pabrik NPK mundur 10 hari, potensi kehilangan peluang produksi pupuk musim rendeng',
    'Uji coba simulasi Factory Acceptance Test (FAT) di laboratorium vendor',
    'Operasional', 3, 3, 'Moderate', 'Moderate', 'Mitigasi',
    TRUE, 'Wajib Mitigasi (Proyek Multi-Tahun)', 'Skor inherent 9. Proyek migrasi multi-tahun memerlukan eskalasi Carry Over.',
    'Eskalasi pekerjaan commissioning ke jadwal Turn Around terjadwal pada triwulan I RKAP 2027',
    'TW 4', 7500000000.00, 'Superintendent Instrumentasi & DCS', 'VP TI & Digitalisasi', 'Capex Multiyears',
    'Carry_Over', 'Risk Officer TI'
);

-- ---------------------------------------------------------------------
-- DATA SEED: KONTROL TRIWULAN (TW 1 - TW 4)
-- ---------------------------------------------------------------------
INSERT INTO `quarterly_controls` (
    `risk_id`, `triwulan`, `realisasi_kegiatan`, `realisasi_biaya`, `progress_persen`,
    `kemungkinan_residual`, `dampak_residual`, `tingkat_residual`, `status_pengendalian`,
    `kendala_dan_tindak_lanjut`, `reported_by`
) VALUES
(
    'RSK-2026-001', 'TW 1',
    'Selesai penyusunan kajian teknis booster kompresor gas dan negosiasi SLA tekanan gas dengan PGN.',
    1200000000.00, 35, 3, 4, 'Mod to High', 'On Track',
    'Pengiriman spesifikasi modul kompresor dari pabrikan tepat jadwal.', 'Risk Officer PRD'
),
(
    'RSK-2026-001', 'TW 2',
    'Penyelesaian pondasi sipil kompresor dan instalasi pipa tie-in gas utama.',
    4500000000.00, 75, 2, 4, 'Moderate', 'On Track',
    'Terkendali. Menunggu jadwal commisioning pada TW 3.', 'Risk Officer PRD'
),
(
    'RSK-2026-002', 'TW 1',
    'Penerbitan Purchase Order (PO) spare rotor turbin K-401 kepada OEM vendor di Jepang.',
    2800000000.00, 40, 3, 3, 'Moderate', 'On Track',
    'Progres fabrikasi bilah turbin mencapai 60% di fasilitas OEM.', 'Risk Officer HAR'
),
(
    'RSK-2026-007', 'TW 1',
    'Pelaksanaan 120 sesi Tool Box Meeting dan sertifikasi K3 untuk 85 personel kontraktor.',
    210000000.00, 100, 1, 2, 'Low', 'Completed',
    'Target Zero Accident tercapai penuh.', 'Risk Officer K3'
);

-- ---------------------------------------------------------------------
-- DATA SEED: RISK CARRY OVER EVALUATION
-- ---------------------------------------------------------------------
INSERT INTO `risk_carry_overs` (
    `risk_id`, `target_tahun`, `alasan_carry_over`, `rekomendasi_komite`,
    `approval_carry_over_by`, `tanggal_carry_over`
) VALUES
(
    'RSK-2026-008', 2027,
    'Penggantian sistem DCS memerlukan masa shutdown pabrik minimal 18 hari berturut-turut, sedangkan slot TA pabrik 2026 dipersingkat guna mengejar target produksi subsidi nasional.',
    'Komite Manajemen Risiko Pusri menyetujui carry over pekerjaan integrasi I/O dan start up DCS ke Triwulan I 2027 bersamaan dengan Major Turn Around Pabrik NPK.',
    'Komite Manajemen Risiko & Direktur Operasi & Produksi', '2026-09-15'
);

-- ---------------------------------------------------------------------
-- DATA SEED: AUDIT LOGS
-- ---------------------------------------------------------------------
INSERT INTO `risk_audit_logs` (
    `id`, `risk_id`, `kode_risiko`, `user_role`, `actor_name`, `action`,
    `previous_status`, `new_status`, `notes`, `latency_ms`
) VALUES
('LOG-001', 'RSK-2026-001', 'RSK-2026-001', 'Unit Kerja', 'Risk Officer PRD', 'IDENTIFIKASI_RISIKO', NULL, 'Menunggu_Approval_VP', 'Pendaftaran usulan risiko tekanan gas pabrik 1B', 3.5),
('LOG-002', 'RSK-2026-001', 'RSK-2026-001', 'Atasan / VP', 'Bambang Irawan (VP)', 'REVIEW_APPROVE', 'Menunggu_Approval_VP', 'Menunggu_Approval_Admin', 'Disetujui VP Operasi untuk eskalasi pengadaan booster kompresor', 4.1),
('LOG-003', 'RSK-2026-001', 'RSK-2026-001', 'Admin', 'Risk Admin Korporat', 'ADMIN_APPROVE_PIC', 'Menunggu_Approval_Admin', 'Disetujui_Dalam_Pengendalian', 'Approval korporat selesai. PIC Pelaksana dan PIC Pengendali ditugaskan resmi.', 3.9),
('LOG-004', 'RSK-2026-008', 'RSK-2026-008', 'Admin', 'Komite Risiko Pusri', 'CARRY_OVER_REGISTER', 'Disetujui_Dalam_Pengendalian', 'Carry_Over', 'Eskalasi carry over ke RKAP 2027 disetujui komite risiko', 5.2);

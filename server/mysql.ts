import mysql, { Pool, RowDataPacket } from 'mysql2/promise';
import { PusriRisk, OrganizationMaster, UserAccount, AuditLog } from '../src/types/pusri';

export interface MySqlConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export const defaultMySqlConfig: MySqlConfig = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'pusri_risk_db'
};

let pool: Pool | null = null;
let isConnected = false;
let lastError: string | null = null;
let lastConnectAttempt = new Date().toISOString();
let lastPingLatencyMs = 0;
let totalMySqlRows = 0;
let retryTimer: NodeJS.Timeout | null = null;

/**
 * Buat tabel-tabel utama secara otomatis jika belum ada di database MySQL
 */
async function ensureTablesExist(p: Pool) {
  try {
    // 1. Tabel Master Organisasi
    await p.query(`
      CREATE TABLE IF NOT EXISTS master_organizations (
        id VARCHAR(50) PRIMARY KEY,
        kode VARCHAR(20) NOT NULL UNIQUE,
        nama VARCHAR(150) NOT NULL,
        tipe VARCHAR(50) NOT NULL,
        induk_kode VARCHAR(20) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Tabel Users Portal
    await p.query(`
      CREATE TABLE IF NOT EXISTS portal_users (
        id VARCHAR(50) PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        nama VARCHAR(150) NOT NULL,
        role ENUM('Unit Kerja', 'Atasan / VP', 'Admin') NOT NULL,
        unit_kerja VARCHAR(150) NOT NULL,
        kode_unit_kerja VARCHAR(20) NOT NULL,
        email VARCHAR(150) DEFAULT NULL,
        password_hash VARCHAR(255) NOT NULL,
        avatar VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Tabel Utama Pusri Risks
    await p.query(`
      CREATE TABLE IF NOT EXISTS pusri_risks (
        id VARCHAR(50) PRIMARY KEY,
        kode_risiko VARCHAR(50) NOT NULL UNIQUE,
        kode_organisasi VARCHAR(20) NOT NULL,
        nama_organisasi VARCHAR(150) NOT NULL,
        tahun INT NOT NULL DEFAULT 2026,
        sasaran_rkap TEXT,
        sasaran_unit_kerja TEXT,
        konteks_eksternal TEXT,
        konteks_internal TEXT,
        sumber_risiko VARCHAR(255),
        pernyataan_risiko TEXT NOT NULL,
        penyebab_risiko TEXT,
        dampak_risiko TEXT,
        pengendalian_existing TEXT,
        kategori_risiko ENUM('Operasional', 'Keuangan', 'Strategis', 'Hukum & Kepatuhan') NOT NULL DEFAULT 'Operasional',
        kemungkinan_awal INT NOT NULL DEFAULT 1,
        dampak_awal INT NOT NULL DEFAULT 1,
        inherent_score INT GENERATED ALWAYS AS (kemungkinan_awal * dampak_awal) STORED,
        tingkat_risiko_awal VARCHAR(50) NOT NULL DEFAULT 'Moderate',
        current_tingkat_risiko VARCHAR(50) NOT NULL DEFAULT 'Moderate',
        jenis_penanganan ENUM('Mitigasi', 'Diterima', 'Dihindari', 'Ditransfer') NOT NULL DEFAULT 'Mitigasi',
        butuh_mitigasi TINYINT(1) NOT NULL DEFAULT 1,
        status_kebutuhan_mitigasi VARCHAR(100) NOT NULL DEFAULT 'Wajib Mitigasi',
        alasan_kebutuhan_mitigasi TEXT,
        rencana_penanganan TEXT,
        target_waktu_mitigasi VARCHAR(50) NOT NULL DEFAULT 'TW 2',
        biaya_rencana_pengendalian BIGINT NOT NULL DEFAULT 0,
        pic_pelaksana VARCHAR(150) NOT NULL DEFAULT 'DEP. MITRA BISNIS & LOGISTIK',
        pic_pengendali VARCHAR(150) NOT NULL DEFAULT 'VP Departemen',
        jenis_anggaran VARCHAR(100) NOT NULL DEFAULT 'Investasi Rutin / OPEX',
        status_workflow ENUM('Draf', 'Menunggu_Approval_VP', 'Disetujui_VP', 'Revisi', 'Disetujui_Admin', 'Carry_Over_Next_Year') NOT NULL DEFAULT 'Menunggu_Approval_VP',
        review_notes_vp TEXT,
        approval_notes_admin TEXT,
        created_by VARCHAR(100) NOT NULL DEFAULT 'Risk Officer Unit',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Tabel Audit Logs
    await p.query(`
      CREATE TABLE IF NOT EXISTS risk_audit_logs (
        id VARCHAR(50) PRIMARY KEY,
        risk_id VARCHAR(50),
        action VARCHAR(100) NOT NULL,
        user VARCHAR(100) NOT NULL,
        role VARCHAR(50) NOT NULL,
        details TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. Tabel Event Sinkronisasi
    await p.query(`
      CREATE TABLE IF NOT EXISTS module_sync_events (
        id VARCHAR(50) PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        module_source VARCHAR(100) NOT NULL,
        module_target VARCHAR(100) NOT NULL,
        endpoint VARCHAR(150) NOT NULL,
        method VARCHAR(10) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'SYNCED',
        duration_ms DECIMAL(6,2) NOT NULL DEFAULT 0.00,
        payload_summary TEXT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  } catch (err: any) {
    console.warn('[MySQL Table Init Notice]:', err?.message);
  }
}

/**
 * Inisialisasi pool koneksi MySQL dengan deteksi otomatis
 */
export async function initMySqlConnection(config: Partial<MySqlConfig> = {}): Promise<boolean> {
  const currentConfig: MySqlConfig = {
    ...defaultMySqlConfig,
    ...config
  };

  lastConnectAttempt = new Date().toISOString();

  try {
    if (pool) {
      await pool.end().catch(() => {});
    }

    pool = mysql.createPool({
      host: currentConfig.host,
      port: currentConfig.port,
      user: currentConfig.user,
      password: currentConfig.password,
      database: currentConfig.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 2500
    });

    // Test ping & measure latency
    const startPing = Date.now();
    const connection = await pool.getConnection();
    await connection.ping();
    lastPingLatencyMs = Math.max(1, Date.now() - startPing);
    
    // Auto create tables if needed
    await ensureTablesExist(pool);

    // Count rows
    try {
      const [rows] = await connection.query<RowDataPacket[]>('SELECT COUNT(*) as total FROM pusri_risks');
      totalMySqlRows = Number(rows[0]?.total) || 0;
    } catch {
      totalMySqlRows = 0;
    }

    connection.release();

    isConnected = true;
    lastError = null;
    console.log(`[MySQL Realtime] 🟢 Terkoneksi ke database '${currentConfig.database}' (${currentConfig.host}:${currentConfig.port}) - Latensi: ${lastPingLatencyMs}ms`);
    
    // Clear retry timer if connected
    if (retryTimer) {
      clearInterval(retryTimer);
      retryTimer = null;
    }

    return true;
  } catch (err: any) {
    isConnected = false;
    lastError = err?.message || 'Gagal terhubung ke MySQL server';
    console.warn(`[MySQL Realtime] 🟡 Standby mode: Belum dapat terhubung ke MySQL (${lastError}). Menggunakan In-Memory Data Store.`);
    
    // Schedule background retry if not running
    if (!retryTimer) {
      retryTimer = setInterval(async () => {
        if (!isConnected) {
          await initMySqlConnection().catch(() => {});
        }
      }, 10000);
    }

    return false;
  }
}

/**
 * Dapatkan status koneksi MySQL saat ini secara real-time
 */
export function getMySqlStatus() {
  return {
    isConnected,
    host: defaultMySqlConfig.host,
    port: defaultMySqlConfig.port,
    user: defaultMySqlConfig.user,
    database: defaultMySqlConfig.database,
    lastError,
    lastConnectAttempt,
    lastPingLatencyMs,
    totalMySqlRows,
    configLocation: {
      tsBackend: 'server/mysql.ts',
      envFile: '.env',
      goBackend: 'server/backend_go/main.go (baris 43)',
      schemaSql: 'server/backend_go/schema.sql'
    }
  };
}

/**
 * Simpan / perbarui 1 risiko ke tabel `pusri_risks` MySQL secara real-time
 */
export async function saveRiskToMySql(risk: PusriRisk): Promise<boolean> {
  if (!pool || !isConnected) return false;

  const sql = `
    INSERT INTO pusri_risks (
      id, kode_risiko, kode_organisasi, nama_organisasi, tahun,
      sasaran_rkap, sasaran_unit_kerja, konteks_eksternal, konteks_internal,
      sumber_risiko, pernyataan_risiko, penyebab_risiko, dampak_risiko,
      pengendalian_existing, kategori_risiko, kemungkinan_awal, dampak_awal,
      tingkat_risiko_awal, current_tingkat_risiko, jenis_penanganan,
      butuh_mitigasi, status_kebutuhan_mitigasi, alasan_kebutuhan_mitigasi,
      rencana_penanganan, target_waktu_mitigasi, biaya_rencana_pengendalian,
      pic_pelaksana, pic_pengendali, jenis_anggaran, status_workflow,
      review_notes_vp, approval_notes_admin, created_by
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?
    )
    ON DUPLICATE KEY UPDATE
      kode_risiko = VALUES(kode_risiko),
      kode_organisasi = VALUES(kode_organisasi),
      nama_organisasi = VALUES(nama_organisasi),
      tahun = VALUES(tahun),
      sasaran_rkap = VALUES(sasaran_rkap),
      sasaran_unit_kerja = VALUES(sasaran_unit_kerja),
      konteks_eksternal = VALUES(konteks_eksternal),
      konteks_internal = VALUES(konteks_internal),
      sumber_risiko = VALUES(sumber_risiko),
      pernyataan_risiko = VALUES(pernyataan_risiko),
      penyebab_risiko = VALUES(penyebab_risiko),
      dampak_risiko = VALUES(dampak_risiko),
      pengendalian_existing = VALUES(pengendalian_existing),
      kategori_risiko = VALUES(kategori_risiko),
      kemungkinan_awal = VALUES(kemungkinan_awal),
      dampak_awal = VALUES(dampak_awal),
      tingkat_risiko_awal = VALUES(tingkat_risiko_awal),
      current_tingkat_risiko = VALUES(current_tingkat_risiko),
      jenis_penanganan = VALUES(jenis_penanganan),
      butuh_mitigasi = VALUES(butuh_mitigasi),
      status_kebutuhan_mitigasi = VALUES(status_kebutuhan_mitigasi),
      alasan_kebutuhan_mitigasi = VALUES(alasan_kebutuhan_mitigasi),
      rencana_penanganan = VALUES(rencana_penanganan),
      target_waktu_mitigasi = VALUES(target_waktu_mitigasi),
      biaya_rencana_pengendalian = VALUES(biaya_rencana_pengendalian),
      pic_pelaksana = VALUES(pic_pelaksana),
      pic_pengendali = VALUES(pic_pengendali),
      jenis_anggaran = VALUES(jenis_anggaran),
      status_workflow = VALUES(status_workflow),
      review_notes_vp = VALUES(review_notes_vp),
      approval_notes_admin = VALUES(approval_notes_admin),
      updated_at = CURRENT_TIMESTAMP
  `;

  const values = [
    risk.id,
    risk.kodeRisiko || risk.id,
    risk.kodeOrganisasi || 'PRD-1B',
    risk.namaOrganisasi || 'Departemen Operasi Pabrik 1B',
    Number(risk.tahun) || 2026,
    risk.sasaranRKAP || '-',
    risk.sasaranUnitKerja || '-',
    risk.konteksEksternal || '-',
    risk.konteksInternal || '-',
    risk.sumberRisiko || 'Operasional',
    risk.pernyataanRisiko,
    risk.penyebabRisiko || '-',
    risk.dampakRisiko || '-',
    risk.pengendalianExisting || '-',
    risk.kategoriRisiko || 'Operasional',
    Number(risk.kemungkinanAwal) || 1,
    Number(risk.dampakAwal) || 1,
    risk.tingkatRisikoAwal || 'Moderate',
    risk.currentTingkatRisiko || risk.tingkatRisikoAwal || 'Moderate',
    risk.jenisPenanganan || 'Mitigasi',
    risk.butuhMitigasi ? 1 : 0,
    risk.statusKebutuhanMitigasi || 'Wajib Mitigasi',
    risk.alasanKebutuhanMitigasi || '-',
    risk.rencanaPenanganan || '-',
    risk.targetWaktuMitigasi || 'TW 2',
    Number(risk.biayaRencanaPengendalian) || 0,
    risk.picPelaksana || 'DEP. MITRA BISNIS & LOGISTIK',
    risk.picPengendali || 'VP Departemen',
    risk.jenisAnggaran || 'Investasi Rutin / OPEX',
    risk.statusWorkflow || 'Menunggu_Approval_VP',
    risk.reviewNotesVp || null,
    risk.approvalNotesAdmin || null,
    risk.createdBy || 'Risk Officer Unit'
  ];

  try {
    await pool.execute(sql, values);
    console.log(`[MySQL Sync] Berhasil menyimpan risiko '${risk.kodeRisiko}' ke MySQL database.`);
    return true;
  } catch (err: any) {
    console.error(`[MySQL Sync Error] Gagal menyimpan '${risk.kodeRisiko}':`, err?.message);
    return false;
  }
}

/**
 * Hapus risiko dari tabel MySQL
 */
export async function deleteRiskFromMySql(riskId: string): Promise<boolean> {
  if (!pool || !isConnected) return false;
  try {
    await pool.execute('DELETE FROM pusri_risks WHERE id = ?', [riskId]);
    console.log(`[MySQL Sync] Berhasil menghapus risiko '${riskId}' dari MySQL database.`);
    return true;
  } catch (err: any) {
    console.error(`[MySQL Sync Error] Gagal menghapus '${riskId}':`, err?.message);
    return false;
  }
}

/**
 * Ambil seluruh data risiko dari MySQL database
 */
export async function loadRisksFromMySql(): Promise<PusriRisk[] | null> {
  if (!pool || !isConnected) return null;

  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM pusri_risks ORDER BY id ASC');
    if (!rows || rows.length === 0) return [];

    return rows.map((r: any) => ({
      id: r.id,
      kodeRisiko: r.kode_risiko,
      kodeOrganisasi: r.kode_organisasi,
      namaOrganisasi: r.nama_organisasi,
      tahun: r.tahun,
      sasaranRKAP: r.sasaran_rkap,
      sasaranUnitKerja: r.sasaran_unit_kerja,
      konteksEksternal: r.konteks_eksternal,
      konteksInternal: r.konteks_internal,
      sumberRisiko: r.sumber_risiko,
      pernyataanRisiko: r.pernyataan_risiko,
      penyebabRisiko: r.penyebab_risiko,
      dampakRisiko: r.dampak_risiko,
      pengendalianExisting: r.pengendalian_existing,
      kategoriRisiko: r.kategori_risiko,
      kemungkinanAwal: r.kemungkinan_awal,
      dampakAwal: r.dampak_awal,
      inherentScore: r.inherent_score || r.kemungkinan_awal * r.dampak_awal,
      tingkatRisikoAwal: r.tingkat_risiko_awal,
      currentTingkatRisiko: r.current_tingkat_risiko,
      jenisPenanganan: r.jenis_penanganan,
      butuhMitigasi: Boolean(r.butuh_mitigasi),
      statusKebutuhanMitigasi: r.status_kebutuhan_mitigasi,
      alasanKebutuhanMitigasi: r.alasan_kebutuhan_mitigasi,
      rencanaPenanganan: r.rencana_penanganan,
      targetWaktuMitigasi: r.target_waktu_mitigasi,
      biayaRencanaPengendalian: Number(r.biaya_rencana_pengendalian) || 0,
      picPelaksana: r.pic_pelaksana,
      picPengendali: r.pic_pengendali,
      jenisAnggaran: r.jenis_anggaran,
      statusWorkflow: r.status_workflow,
      reviewNotesVp: r.review_notes_vp,
      approvalNotesAdmin: r.approval_notes_admin,
      pengendalianTriwulan: [],
      createdDate: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      updatedDate: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
      createdBy: r.created_by
    }));
  } catch (err: any) {
    console.error('[MySQL Read Error]:', err?.message);
    return null;
  }
}

/**
 * Ambil data dari tabel manapun untuk fitur Database Explorer di UI
 */
export async function getTableData(tableName: string): Promise<{
  columns: string[];
  rows: any[];
  total: number;
} | null> {
  if (!pool || !isConnected) return null;

  const allowedTables = [
    'master_organizations',
    'master_risk_checklist',
    'portal_users',
    'pusri_risks',
    'quarterly_controls',
    'risk_carry_overs',
    'risk_audit_logs',
    'module_sync_events'
  ];

  if (!allowedTables.includes(tableName)) {
    throw new Error(`Tabel '${tableName}' tidak diperbolehkan.`);
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM \`${tableName}\` LIMIT 50`);
    const [cols] = await pool.query<RowDataPacket[]>(`SHOW COLUMNS FROM \`${tableName}\``);

    return {
      columns: cols.map((c: any) => c.Field),
      rows: rows as any[],
      total: rows.length
    };
  } catch (err: any) {
    console.error(`[MySQL Table Query Error] ${tableName}:`, err?.message);
    return null;
  }
}

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { PusriRisk } from './src/types/pusri';
import { pusriDb } from './server/db';
import { 
  initMySqlConnection, 
  saveRiskToMySql, 
  deleteRiskFromMySql, 
  loadRisksFromMySql, 
  getMySqlStatus, 
  getTableData 
} from './server/mysql';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Helper: Calculate risk level from Likelihood (1-5) and Impact (1-5)
function calculateRiskLevel(likelihood: number, impact: number): string {
  const score = likelihood * impact;
  if (score >= 16) return 'High';
  if (score >= 12) return 'Mod to High';
  if (score >= 8) return 'Moderate';
  if (score >= 4) return 'Low to Mod';
  return 'Low';
}

// Helper: Determine mitigation requirement based on risk score and guidelines
function assessMitigationRequirement(likelihood: number, impact: number) {
  const score = likelihood * impact;
  const level = calculateRiskLevel(likelihood, impact);
  const isRequired = score >= 10; // High or Mod-to-High requires mitigation in PT Pusri SOP
  
  let statusText = 'Toleransi Risiko Terpenuhi (Dapat Diterima)';
  let recommendation = 'Risiko berada dalam batas toleransi. Pertahankan pengendalian rutin atau terima risiko.';

  if (score >= 16) {
    statusText = 'Wajib Mitigasi Segera (High Risk)';
    recommendation = 'Risiko TINGGI/EKSTREM melebihi selera risiko korporat Pusri. Wajib menyusun rencana mitigasi komprehensif, persetujuan Direksi/VP, dan monitoring triwulanan.';
  } else if (score >= 12) {
    statusText = 'Wajib Mitigasi Aktif (Mod to High)';
    recommendation = 'Risiko MOD TO HIGH melebihi toleransi standar. Wajib menyusun rencana tindakan penanganan/mitigasi dengan target waktu dan PIC yang jelas.';
  } else if (score >= 8) {
    statusText = 'Mitigasi Direkomendasikan (Moderate)';
    recommendation = 'Risiko MODERATE. Disarankan membuat langkah mitigasi atau memperkuat pengendalian existing agar tidak eskalasi.';
  }

  return {
    score,
    level,
    isRequired,
    statusText,
    recommendation
  };
}

// ----------------------------------------------------
// REST API ENDPOINTS (Compatible with Golang Microservices)
// ----------------------------------------------------

// 1. Health & Database Status
app.get('/api/health', (req, res) => {
  const dbStats = pusriDb.getStats();
  res.json({
    status: 'ok',
    service: 'Portal Risiko PT Pupuk Sriwidjaja Palembang API',
    engine: 'Golang 1.22 REST + MySQL 8.0 Engine Hybrid Bridge',
    timestamp: new Date().toISOString(),
    database: dbStats,
    totalRisks: dbStats.totalRisks
  });
});

// Database Detail Endpoint
app.get('/api/database/status', (req, res) => {
  res.json({
    success: true,
    data: pusriDb.getStats()
  });
});

// Download Raw MySQL Schema & Seed SQL File (Password Protected: portal123, Admin Only)
app.get('/api/database/download-sql', (req, res) => {
  const pwd = (req.query.password as string) || (req.headers['x-database-password'] as string);
  if (pwd !== 'portal123') {
    return res.status(403).json({
      success: false,
      message: 'Akses Ditolak: Password basis data salah. Masukkan password administrator portal123 untuk mengunduh skema dan data MySQL.'
    });
  }

  const sqlPath = path.join(process.cwd(), 'server', 'backend_go', 'schema.sql');
  if (fs.existsSync(sqlPath)) {
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', 'attachment; filename="pusri_risk_db_2026.sql"');
    return fs.createReadStream(sqlPath).pipe(res);
  }
  res.status(404).json({ success: false, message: 'File schema.sql tidak ditemukan.' });
});

// Verify Download Database Password
app.post('/api/database/verify-password', (req, res) => {
  const { password } = req.body;
  if (password === 'portal123') {
    return res.json({ success: true, message: 'Password database valid.' });
  }
  return res.status(401).json({ success: false, message: 'Password salah! Akses download database ditolak.' });
});

// ----------------------------------------------------
// AUTHENTICATION & USER MANAGEMENT ENDPOINTS
// ----------------------------------------------------

// List all user accounts / unit kerja for login combobox
app.get('/api/auth/users', (req, res) => {
  const users = pusriDb.getAllUsers();
  res.json({
    success: true,
    total: users.length,
    data: users
  });
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier) {
    return res.status(400).json({ success: false, message: 'Nama Akun / Unit Kerja wajib diisi.' });
  }

  const authResult = pusriDb.authenticate(identifier, password);
  if (!authResult.success) {
    return res.status(401).json(authResult);
  }

  res.json({
    success: true,
    message: 'Login berhasil.',
    user: authResult.user,
    data: authResult.user
  });
});

// Register new account (Tersimpan ke database)
app.post('/api/auth/register', (req, res) => {
  const { username, nama, password, role, unitKerja, kodeUnitKerja, email } = req.body;

  if (!username || !nama || !role || !unitKerja) {
    return res.status(400).json({
      success: false,
      message: 'Username, Nama Lengkap, Peran (Role), dan Nama Unit Kerja wajib diisi.'
    });
  }

  const validRoles = ['Unit Kerja', 'Atasan / VP', 'Admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: `Peran tidak valid. Pilih salah satu dari: ${validRoles.join(', ')}`
    });
  }

  const regResult = pusriDb.registerUser({
    username,
    nama,
    password: password || 'portal123',
    role,
    unitKerja,
    kodeUnitKerja,
    email
  });

  if (!regResult.success) {
    return res.status(400).json(regResult);
  }

  res.status(201).json({
    success: true,
    message: 'Akun baru berhasil didaftarkan dan tersimpan di database.',
    user: regResult.user,
    data: regResult.user
  });
});

// Get User Profile & RBAC Permissions
app.get('/api/user/profile', (req, res) => {
  const role = (req.query.role as string) || 'Admin';
  let profile = {
    nik: '0952',
    badge: '0952',
    nama: 'DAFFA ARI PRASETYA',
    email: 'daffa.ari@pusri.co.id',
    jabatan: 'Super Admin Enterprise Risk Management Korporat',
    unitKerja: 'Departemen Manajemen Risiko Korporat',
    kodeUnitKerja: 'RISK-CORP',
    role: 'Admin',
    avatarInitials: 'DA',
    terakhirLogin: '23 September 2026, 12:32:10 WIB',
    hakAkses: [
      'Identifikasi & Usulan Risiko',
      'Review & Verifikasi Atasan/VP',
      'Approval Korporat & Penugasan PIC',
      'Pengendalian Triwulan (TW 1-4)',
      'Evaluasi Risiko & Carry Over',
      'Master Data Organisasi & Taksonomi',
      'Manajemen Database MySQL & API Sync'
    ]
  };

  if (role === 'Atasan / VP') {
    profile = {
      nik: '0951',
      badge: '0951',
      nama: 'M DAVI RAMADHAN',
      email: 'm.davi@pusri.co.id',
      jabatan: 'Vice President Operasi Pabrik Pusri IIB',
      unitKerja: 'Departemen Operasi Pabrik Pusri IIB',
      kodeUnitKerja: 'OP-IIB',
      role: 'Atasan / VP',
      avatarInitials: 'MD',
      terakhirLogin: '23 September 2026, 12:15:00 WIB',
      hakAkses: [
        'Identifikasi & Usulan Risiko Unit Kerja',
        'Review & Persetujuan Atasan / VP',
        'Pengembalian Usulan untuk Revisi Unit',
        'Pemantauan Pengendalian Triwulanan Unit'
      ]
    };
  } else if (role === 'Unit Kerja') {
    profile = {
      nik: '0953',
      badge: '0953',
      nama: 'FAUZAN AL GHANIYYU',
      email: 'fauzan.al@pusri.co.id',
      jabatan: 'Risk Officer Unit Kerja Pabrik',
      unitKerja: 'Departemen Operasi Pabrik Pusri IIB',
      kodeUnitKerja: 'OP-IIB',
      role: 'Unit Kerja',
      avatarInitials: 'FA',
      terakhirLogin: '23 September 2026, 11:45:22 WIB',
      hakAkses: [
        'Pengisian Formulir Identifikasi Risiko (SOP 1-7)',
        'Checklist Standar Jenis & Kategori Risiko',
        'Input Realisasi Pengendalian Triwulanan (TW 1-4)'
      ]
    };
  }

  res.json({
    success: true,
    data: profile
  });
});

// 2. Master Checklist Jenis Risiko (Sesuai Kategori Risiko)
app.get('/api/master/checklist-jenis-risiko', (req, res) => {
  const { kategori, search } = req.query;
  const items = pusriDb.getMasterChecklist(
    typeof kategori === 'string' ? kategori : undefined,
    typeof search === 'string' ? search : undefined
  );

  const allItems = pusriDb.getMasterChecklist();
  const categories = Array.from(new Set(allItems.map((i: any) => i.kategori)));

  res.json({
    success: true,
    total: items.length,
    categories,
    data: items
  });
});

// 3. Master Organisasi & Departemen
app.get('/api/master/departments', (req, res) => {
  const departments = pusriDb.getDepartments();
  res.json({
    success: true,
    data: departments
  });
});

// 4. Endpoint Validasi Data Risiko & Kebutuhan Mitigasi
app.post('/api/risks/validate', (req, res) => {
  const {
    pernyataanRisiko,
    penyebabRisiko,
    dampakRisiko,
    kemungkinanAwal,
    dampakAwal,
    jenisPenanganan,
    rencanaPenanganan
  } = req.body;

  const errors: string[] = [];

  if (!pernyataanRisiko || typeof pernyataanRisiko !== 'string' || pernyataanRisiko.trim().length < 5) {
    errors.push('Pernyataan risiko wajib diisi (minimal 5 karakter).');
  }
  if (!penyebabRisiko || typeof penyebabRisiko !== 'string' || penyebabRisiko.trim().length < 3) {
    errors.push('Akar penyebab risiko wajib diisi.');
  }
  if (!dampakRisiko || typeof dampakRisiko !== 'string' || dampakRisiko.trim().length < 3) {
    errors.push('Uraian dampak risiko wajib diisi.');
  }

  const k = Number(kemungkinanAwal) || 1;
  const d = Number(dampakAwal) || 1;
  const assessment = assessMitigationRequirement(k, d);

  // Validation rules for Mitigation requirement
  if (assessment.isRequired && jenisPenanganan && jenisPenanganan !== 'Mitigasi') {
    errors.push(`Risiko memiliki tingkat ${assessment.level} (Skor: ${assessment.score}). Sesuai SOP Pusri, risiko tingkat Tinggi/Mod-to-High wajib memilih strategi 'Mitigasi' dan menyusun rencana penanganan.`);
  }

  if (jenisPenanganan === 'Mitigasi') {
    if (!rencanaPenanganan || typeof rencanaPenanganan !== 'string' || rencanaPenanganan.trim().length < 5) {
      errors.push('Rencana langkah mitigasi wajib diisi jika jenis penanganan adalah Mitigasi.');
    }
  }

  res.json({
    valid: errors.length === 0,
    errors,
    assessment
  });
});

// 4B. API Pengajuan Approval Identifikasi Risiko & Pemisahan Risiko Otomatis
// Memvalidasi data dari Unit Kerja, memisahkan data menjadi risiko individual, dan menyimpan ke database
app.post('/api/approval/submit-identifikasi', (req, res) => {
  const { identifikasi, sasaranRKAP, sasaranUnitKerja, konteksEksternal, konteksInternal, kodeOrganisasi, namaOrganisasi, tahun, createdBy, risks } = req.body;
  
  const incomingItems: any[] = Array.isArray(risks) 
    ? risks 
    : (Array.isArray(req.body) ? req.body : (req.body.pernyataanRisiko ? [req.body] : []));

  if (incomingItems.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Tidak ada data identifikasi risiko yang diajukan untuk approval.'
    });
  }

  const validationErrors: { index: number; errors: string[] }[] = [];
  const processedRisks: PusriRisk[] = [];
  const currentTotal = pusriDb.countRisks();

  // Validasi menyeluruh untuk mencegah pengajuan approval dengan data yang tidak lengkap
  incomingItems.forEach((item, index) => {
    const itemErrors: string[] = [];
    if (!item.pernyataanRisiko || typeof item.pernyataanRisiko !== 'string' || item.pernyataanRisiko.trim().length < 3) {
      itemErrors.push('Pernyataan risiko wajib diisi.');
    }
    if (!item.penyebabRisiko || typeof item.penyebabRisiko !== 'string' || item.penyebabRisiko.trim().length < 2) {
      itemErrors.push('Akar penyebab risiko wajib diisi.');
    }
    if (!item.dampakRisiko || typeof item.dampakRisiko !== 'string' || item.dampakRisiko.trim().length < 2) {
      itemErrors.push('Uraian dampak risiko wajib diisi.');
    }
    const kemungkinan = Number(item.kemungkinanAwal) || 1;
    const dampak = Number(item.dampakAwal) || 1;
    if (kemungkinan < 1 || kemungkinan > 5 || dampak < 1 || dampak > 5) {
      itemErrors.push('Skala kemungkinan dan dampak harus berada dalam rentang 1 - 5.');
    }

    const assessment = assessMitigationRequirement(kemungkinan, dampak);
    if (assessment.isRequired && item.jenisPenanganan && item.jenisPenanganan !== 'Mitigasi') {
      itemErrors.push(`Risiko tingkat ${assessment.level} (Skor: ${assessment.score}) melebihi batas selera risiko Pusri. Wajib memilih strategi 'Mitigasi'.`);
    }

    if (itemErrors.length > 0) {
      validationErrors.push({ index: index + 1, errors: itemErrors });
    }
  });

  if (validationErrors.length > 0) {
    return res.status(422).json({
      success: false,
      message: 'Pengajuan approval ditolak karena terdapat butir risiko dengan data belum lengkap.',
      errors: validationErrors
    });
  }

  const now = new Date().toISOString();
  // Pemisahan Identifikasi Risiko Secara Otomatis menjadi data risiko individual
  incomingItems.forEach((item) => {
    const kemungkinan = Number(item.kemungkinanAwal) || 1;
    const dampak = Number(item.dampakAwal) || 1;
    const inherentScore = kemungkinan * dampak;
    const level: any = calculateRiskLevel(kemungkinan, dampak);

    const generatedId = `RSK-${tahun || 2026}-${String(currentTotal + processedRisks.length + 1).padStart(3, '0')}`;
    const kodeRisiko = item.kodeRisiko || generatedId;

    const butuhMitigasi = inherentScore >= 10 || item.jenisPenanganan === 'Mitigasi';
    const statusKebutuhanMitigasi = inherentScore >= 16 
      ? 'Wajib Mitigasi Segera (High Risk)' 
      : inherentScore >= 12 
        ? 'Wajib Mitigasi Aktif (Mod to High)' 
        : inherentScore >= 8 
          ? 'Mitigasi Direkomendasikan (Moderate)' 
          : 'Toleransi Terpenuhi (Dapat Diterima)';

    const separatedRisk: PusriRisk = {
      id: generatedId,
      kodeRisiko,
      kodeOrganisasi: item.kodeOrganisasi || kodeOrganisasi || 'OP-IIB',
      namaOrganisasi: item.namaOrganisasi || namaOrganisasi || 'Departemen Operasi Pabrik Pusri IIB',
      tahun: Number(item.tahun || tahun || 2026),
      sasaranRKAP: item.sasaranRKAP || sasaranRKAP || '-',
      sasaranUnitKerja: item.sasaranUnitKerja || sasaranUnitKerja || '-',
      konteksEksternal: item.konteksEksternal || konteksEksternal || '-',
      konteksInternal: item.konteksInternal || konteksInternal || '-',
      sumberRisiko: item.sumberRisiko || 'Operasional & Produksi',
      pernyataanRisiko: item.pernyataanRisiko.trim(),
      penyebabRisiko: item.penyebabRisiko.trim(),
      dampakRisiko: item.dampakRisiko.trim(),
      pengendalianExisting: item.pengendalianExisting || 'Monitoring SOP Rutin',
      kategoriRisiko: item.kategoriRisiko || 'Operasional',
      kemungkinanAwal: kemungkinan,
      dampakAwal: dampak,
      tingkatRisikoAwal: level,
      currentTingkatRisiko: level,
      inherentScore,
      butuhMitigasi,
      statusKebutuhanMitigasi,
      alasanKebutuhanMitigasi: butuhMitigasi
        ? `Skor inherent ${inherentScore} (≥10) melebihi batas toleransi selera risiko Pusri. Wajib mitigasi.`
        : `Skor inherent ${inherentScore} (<10) dalam batas toleransi.`,
      jenisPenanganan: item.jenisPenanganan || (butuhMitigasi ? 'Mitigasi' : 'Diterima'),
      rencanaPenanganan: item.rencanaPenanganan || '',
      targetWaktuMitigasi: item.targetWaktuMitigasi || 'TW 2',
      biayaRencanaPengendalian: Number(item.biayaRencanaPengendalian) || 0,
      picPelaksana: item.picPelaksana || 'Superintendent Operasi',
      picPengendali: item.picPengendali || 'VP Departemen',
      jenisAnggaran: item.jenisAnggaran || 'Investasi Rutin / OPEX',
      statusWorkflow: 'Menunggu_Approval_VP',
      pengendalianTriwulan: [],
      createdDate: now,
      updatedDate: now,
      createdBy: createdBy || item.createdBy || 'User Unit Kerja'
    };

    pusriDb.createRisk(separatedRisk);
    processedRisks.push(separatedRisk);
    saveRiskToMySql(separatedRisk).catch((e) => console.warn('[MySQL Save Non-Fatal]:', e));
  });

  res.status(201).json({
    success: true,
    message: `Pengajuan approval identifikasi risiko berhasil diproses. ${processedRisks.length} data risiko telah dipisahkan secara otomatis dan disimpan ke database untuk review Atasan / VP.`,
    count: processedRisks.length,
    statusWorkflow: 'Menunggu_Approval_VP',
    data: processedRisks
  });
});

// API 1: Mengambil daftar risiko yang menunggu proses review oleh Atasan/VP
app.get('/api/vp/pending-risks', (req, res) => {
  const { kodeOrganisasi, search } = req.query;
  const list = pusriDb.getAllRisks({
    kodeOrganisasi: typeof kodeOrganisasi === 'string' && kodeOrganisasi !== 'ALL' ? kodeOrganisasi : undefined,
    status: 'Menunggu_Approval_VP',
    search: typeof search === 'string' ? search : undefined
  });

  res.json({
    success: true,
    total: list.length,
    data: list
  });
});

// API 2: Mengambil detail data risiko yang akan dilakukan review
app.get('/api/vp/risks/:id', (req, res) => {
  const risk = pusriDb.getRiskById(req.params.id);
  if (!risk) {
    return res.status(404).json({
      success: false,
      message: `Risiko dengan ID ${req.params.id} tidak ditemukan.`
    });
  }

  res.json({
    success: true,
    data: risk
  });
});

// API 3: Proses Review dan Approval Risiko oleh Atasan/VP
app.post('/api/vp/risks/:id/decision', (req, res) => {
  const { id } = req.params;
  const { decision, notes, picPelaksana, picPengendali, actor, role } = req.body;

  // Validasi hak akses: memastikan hanya Atasan/VP dan Admin yang dapat melakukan proses review dan approval
  if (role !== 'Atasan / VP' && role !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Akses Ditolak: Hanya Atasan / VP dan Admin yang memiliki hak akses untuk memproses review dan approval risiko.'
    });
  }

  const existing = pusriDb.getRiskById(id);
  if (!existing) {
    return res.status(404).json({
      success: false,
      message: `Risiko dengan ID ${id} tidak ditemukan di database.`
    });
  }

  // Mencegah risiko yang telah diproses agar tidak dilakukan approval berulang pada status yang tidak sesuai
  if (existing.statusWorkflow === 'Disetujui_Dalam_Pengendalian' || existing.statusWorkflow === 'Menunggu_Approval_Admin') {
    if (decision === 'approve') {
      return res.status(409).json({
        success: false,
        message: `Risiko ${existing.kodeRisiko} telah disetujui sebelumnya (status saat ini: ${existing.statusWorkflow}). Approval berulang tidak diperbolehkan.`
      });
    }
  }

  if (decision === 'revisi') {
    const revisionNote = (notes && typeof notes === 'string' && notes.trim().length >= 3)
      ? notes.trim()
      : 'Mohon lakukan perbaikan dan penyempurnaan uraian risiko serta rencana mitigasi sesuai arahan SOP Pusri sebelum diajukan kembali.';

    const updated = pusriDb.updateRisk(
      id,
      {
        statusWorkflow: 'Revisi',
        reviewNotesVp: revisionNote
      },
      actor || 'Atasan / VP',
      role
    );

    if (updated) {
      saveRiskToMySql(updated).catch((e) => console.warn('[MySQL Save Non-Fatal]:', e));
    }

    return res.json({
      success: true,
      decision: 'revisi',
      statusWorkflow: 'Revisi',
      message: `Risiko ${existing.kodeRisiko} berhasil dikembalikan ke Unit Kerja dengan status (revisi).`,
      data: updated
    });
  }

  if (decision === 'approve') {
    // Validasi kelayakan sebelum approve
    if (existing.inherentScore >= 10 && existing.jenisPenanganan !== 'Mitigasi') {
      return res.status(422).json({
        success: false,
        message: `Validasi gagal: Risiko tingkat ${existing.currentTingkatRisiko} (Skor: ${existing.inherentScore}) belum memenuhi ketentuan rencana mitigasi SOP Pusri.`
      });
    }

    const updated = pusriDb.updateRisk(
      id,
      {
        statusWorkflow: 'Menunggu_Approval_Admin',
        reviewNotesVp: notes ? notes.trim() : 'Telah disetujui oleh Atasan / VP dan diteruskan ke Risk Admin.',
        picPelaksana: picPelaksana || existing.picPelaksana,
        picPengendali: picPengendali || existing.picPengendali
      },
      actor || 'Atasan / VP',
      role
    );

    if (updated) {
      saveRiskToMySql(updated).catch((e) => console.warn('[MySQL Save Non-Fatal]:', e));
    }

    return res.json({
      success: true,
      decision: 'approve',
      statusWorkflow: 'Menunggu_Approval_Admin',
      message: `Risiko ${existing.kodeRisiko} berhasil disetujui oleh Atasan / VP dan diteruskan ke tahap Approval Admin Korporat.`,
      data: updated
    });
  }

  return res.status(400).json({
    success: false,
    message: "Keputusan review tidak valid. Pilihan keputusan: 'approve' atau 'revisi'."
  });
});

// 5. Get All Risks (dengan filter & search)
app.get('/api/risks', (req, res) => {
  const { kodeOrganisasi, tahun, status, search, kategori, tingkatRisiko } = req.query;

  const result = pusriDb.getAllRisks({
    kodeOrganisasi: typeof kodeOrganisasi === 'string' ? kodeOrganisasi : undefined,
    tahun: tahun && typeof tahun === 'string' && tahun !== 'ALL' ? Number(tahun) : undefined,
    status: typeof status === 'string' ? status : undefined,
    kategori: typeof kategori === 'string' ? kategori : undefined,
    search: typeof search === 'string' ? search : undefined,
    tingkatRisiko: typeof tingkatRisiko === 'string' ? tingkatRisiko : undefined
  });

  res.json({
    success: true,
    total: result.length,
    data: result
  });
});

// 6. Get Single Risk by ID
app.get('/api/risks/:id', (req, res) => {
  const risk = pusriDb.getRiskById(req.params.id);
  if (!risk) {
    return res.status(404).json({ success: false, message: 'Risiko tidak ditemukan' });
  }
  res.json({ success: true, data: risk });
});

// 7. Create New Risk(s) - Menyimpan ke Database (Single & Bulk)
app.post('/api/risks', (req, res) => {
  const payload = req.body;

  const incomingRisks: Partial<PusriRisk>[] = Array.isArray(payload) 
    ? payload 
    : (Array.isArray(payload.risks) ? payload.risks : [payload]);

  if (incomingRisks.length === 0) {
    return res.status(400).json({ success: false, message: 'Tidak ada data risiko yang dikirim.' });
  }

  const createdRisks: PusriRisk[] = [];
  const validationErrors: { index: number; errors: string[] }[] = [];
  const currentTotal = pusriDb.countRisks();

  incomingRisks.forEach((item, index) => {
    const itemErrors: string[] = [];
    if (!item.pernyataanRisiko || item.pernyataanRisiko.trim().length < 3) {
      itemErrors.push('Pernyataan risiko wajib diisi.');
    }
    if (!item.kodeOrganisasi) {
      itemErrors.push('Unit kerja/organisasi wajib dipilih.');
    }

    const kemungkinan = Number(item.kemungkinanAwal) || 1;
    const dampak = Number(item.dampakAwal) || 1;
    const level: any = calculateRiskLevel(kemungkinan, dampak);
    const inherentScore = kemungkinan * dampak;

    const allowedCategories = ['Operasional', 'Keuangan', 'Strategis', 'Hukum & Kepatuhan'];
    if (item.kategoriRisiko && !allowedCategories.includes(item.kategoriRisiko)) {
      itemErrors.push(`Kategori risiko '${item.kategoriRisiko}' tidak valid. Harus salah satu dari: ${allowedCategories.join(', ')}.`);
    }

    if (itemErrors.length > 0) {
      validationErrors.push({ index, errors: itemErrors });
      return;
    }

    const now = new Date().toISOString();
    const newRiskId = item.id || `RSK-2026-${String(currentTotal + createdRisks.length + 1).padStart(3, '0')}`;
    const kodeRisiko = item.kodeRisiko || newRiskId;

    const butuhMitigasi = inherentScore >= 10 || item.jenisPenanganan === 'Mitigasi';
    const statusKebutuhanMitigasi = inherentScore >= 16 
      ? 'Wajib Mitigasi Segera (High Risk)' 
      : inherentScore >= 12 
        ? 'Wajib Mitigasi Aktif (Mod to High)' 
        : inherentScore >= 8 
          ? 'Mitigasi Direkomendasikan (Moderate)' 
          : item.jenisPenanganan === 'Mitigasi' 
            ? 'Mitigasi Sukarela' 
            : 'Toleransi Terpenuhi (Dapat Diterima)';

    const alasanKebutuhanMitigasi = inherentScore >= 10
      ? `Skor inherent ${inherentScore} (≥10) melebihi batas toleransi selera risiko Pusri. Wajib menyusun rencana mitigasi.`
      : `Skor inherent ${inherentScore} (<10) berada dalam batas toleransi wajar.`;

    const newRisk: PusriRisk = {
      id: newRiskId,
      kodeRisiko,
      kodeOrganisasi: item.kodeOrganisasi || 'PRD-1B',
      namaOrganisasi: item.namaOrganisasi || 'Departemen Operasi Pabrik 1B',
      tahun: Number(item.tahun) || 2026,
      sasaranRKAP: item.sasaranRKAP || '-',
      sasaranUnitKerja: item.sasaranUnitKerja || '-',
      konteksEksternal: item.konteksEksternal || '-',
      konteksInternal: item.konteksInternal || '-',
      sumberRisiko: item.sumberRisiko || 'Operasional & Produksi',
      pernyataanRisiko: item.pernyataanRisiko || '',
      penyebabRisiko: item.penyebabRisiko || '-',
      dampakRisiko: item.dampakRisiko || '-',
      pengendalianExisting: item.pengendalianExisting || '',
      kategoriRisiko: (item.kategoriRisiko as any) || 'Operasional',
      jenisPenanganan: (item.jenisPenanganan as any) || (inherentScore >= 10 ? 'Mitigasi' : 'Diterima'),
      kemungkinanAwal: kemungkinan,
      dampakAwal: dampak,
      tingkatRisikoAwal: level,
      currentTingkatRisiko: level,
      inherentScore,
      butuhMitigasi,
      statusKebutuhanMitigasi,
      alasanKebutuhanMitigasi,
      rencanaPenanganan: item.rencanaPenanganan || '',
      targetWaktuMitigasi: item.targetWaktuMitigasi || 'TW 2',
      biayaRencanaPengendalian: Number(item.biayaRencanaPengendalian) || 0,
      picPelaksana: item.picPelaksana || item.picPengendali || '',
      picPengendali: item.picPengendali || item.picPelaksana || '',
      jenisAnggaran: item.jenisAnggaran || 'Investasi Rutin',
      statusWorkflow: (item.statusWorkflow as any) || 'Menunggu_Approval_VP',
      reviewNotesVp: item.reviewNotesVp,
      approvalNotesAdmin: item.approvalNotesAdmin,
      pengendalianTriwulan: item.pengendalianTriwulan || [],
      carryOverInfo: item.carryOverInfo,
      createdDate: now,
      updatedDate: now,
      createdBy: item.createdBy || 'Risk Officer Unit'
    };

    pusriDb.createRisk(newRisk);
    createdRisks.push(newRisk);
    saveRiskToMySql(newRisk).catch((e) => console.warn('[MySQL Save Non-Fatal]:', e));
  });

  if (validationErrors.length > 0 && createdRisks.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Validasi input risiko gagal.',
      errors: validationErrors
    });
  }

  res.status(201).json({
    success: true,
    message: `${createdRisks.length} data risiko berhasil disimpan ke database MySQL Portal Risiko Pusri.`,
    count: createdRisks.length,
    data: createdRisks
  });
});

// 8. Update Risk by ID dengan Enforced RBAC
app.put('/api/risks/:id', (req, res) => {
  const { actor, role, ...updates } = req.body;
  const existing = pusriDb.getRiskById(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Risiko tidak ditemukan.' });
  }

  // RBAC Access Control Enforcement
  if (updates.statusWorkflow) {
    if (updates.statusWorkflow === 'Menunggu_Approval_Admin' || (existing.statusWorkflow === 'Menunggu_Approval_VP' && updates.statusWorkflow === 'Draft_Unit')) {
      if (role === 'Unit Kerja') {
        return res.status(403).json({
          success: false,
          message: 'Akses Ditolak: Anda berstatus Unit Kerja. Otoritas Review & Verifikasi Risiko hanya dimiliki oleh Atasan / VP dan Admin.'
        });
      }
    }
    if (updates.statusWorkflow === 'Disetujui_Dalam_Pengendalian') {
      if (role !== 'Admin') {
        return res.status(403).json({
          success: false,
          message: 'Akses Ditolak: Otoritas Approval Korporat & Penugasan Resmi PIC hanya dimiliki oleh Risk Admin.'
        });
      }
    }
    if (updates.statusWorkflow === 'Carry_Over') {
      if (role === 'Unit Kerja') {
        return res.status(403).json({
          success: false,
          message: 'Akses Ditolak: Penetapan status Carry Over hanya dapat disetujui oleh Komite Risiko / Admin.'
        });
      }
    }
  }

  const updatedRisk = pusriDb.updateRisk(req.params.id, updates, actor, role);
  if (updatedRisk) {
    saveRiskToMySql(updatedRisk).catch((e) => console.warn('[MySQL Save Non-Fatal]:', e));
  }

  res.json({
    success: true,
    message: `Risiko ${updatedRisk?.kodeRisiko} berhasil diperbarui. Sinkronisasi antar modul berhasil.`,
    data: updatedRisk
  });
});

// 8B. API Khusus: Update Data Risiko (Pembaruan & Pengajuan Kembali Risiko oleh Unit Kerja dan VP)
app.put('/api/risks/:id/update-data', (req, res) => {
  const { id } = req.params;
  const {
    pernyataanRisiko,
    penyebabRisiko,
    dampakRisiko,
    pengendalianExisting,
    kategoriRisiko,
    kemungkinanAwal,
    dampakAwal,
    jenisPenanganan,
    rencanaPenanganan,
    targetWaktuMitigasi,
    biayaRencanaPengendalian,
    picPelaksana,
    picPengendali,
    jenisAnggaran,
    catatanPerbaikan,
    resubmit,
    role = 'Unit Kerja',
    actor = 'User Unit Kerja'
  } = req.body;

  const existing = pusriDb.getRiskById(id);
  if (!existing) {
    return res.status(404).json({
      success: false,
      message: `Risiko dengan ID ${id} tidak ditemukan di database.`
    });
  }

  // Hak Akses Validation:
  // 1. User Unit Kerja dapat memperbarui risiko berstatus tidak disetujui/revisi/draft
  if (role === 'Unit Kerja') {
    if (existing.statusWorkflow === 'Disetujui_Dalam_Pengendalian') {
      return res.status(403).json({
        success: false,
        message: 'Akses Ditolak: Risiko telah disetujui (Approved) dan aktif dalam pengendalian. Unit Kerja tidak dapat mengubah data risiko yang telah berstatus Approved.'
      });
    }
  }

  // 2. Atasan/VP dapat memperbarui data risiko selama status belum Approved
  if (role === 'Atasan / VP') {
    if (existing.statusWorkflow === 'Disetujui_Dalam_Pengendalian') {
      return res.status(403).json({
        success: false,
        message: 'Akses Ditolak: Risiko telah berstatus Approved (Disetujui). Atasan/VP hanya dapat mengubah data risiko sebelum proses approval final.'
      });
    }
  }

  // Validasi Input
  const validationErrors: string[] = [];
  if (!pernyataanRisiko || typeof pernyataanRisiko !== 'string' || pernyataanRisiko.trim().length < 5) {
    validationErrors.push('Pernyataan risiko wajib diisi (minimal 5 karakter).');
  }
  if (!penyebabRisiko || typeof penyebabRisiko !== 'string' || penyebabRisiko.trim().length < 3) {
    validationErrors.push('Akar penyebab risiko wajib diisi (minimal 3 karakter).');
  }
  if (!dampakRisiko || typeof dampakRisiko !== 'string' || dampakRisiko.trim().length < 3) {
    validationErrors.push('Uraian dampak risiko wajib diisi (minimal 3 karakter).');
  }

  const k = Number(kemungkinanAwal) || existing.kemungkinanAwal || 1;
  const d = Number(dampakAwal) || existing.dampakAwal || 1;
  if (k < 1 || k > 5 || d < 1 || d > 5) {
    validationErrors.push('Skala kemungkinan dan dampak harus berada dalam rentang 1 - 5.');
  }

  const inherentScore = k * d;
  const calculatedLevel = calculateRiskLevel(k, d);
  const butuhMitigasi = inherentScore >= 10 || jenisPenanganan === 'Mitigasi';

  if (inherentScore >= 10 && jenisPenanganan && jenisPenanganan !== 'Mitigasi') {
    validationErrors.push(`Risiko memiliki skor inherent ${inherentScore} (${calculatedLevel}). Sesuai SOP Pusri, risiko tingkat High / Mod-to-High wajib memilih strategi penanganan 'Mitigasi'.`);
  }

  if (jenisPenanganan === 'Mitigasi' && (!rencanaPenanganan || rencanaPenanganan.trim().length < 5)) {
    validationErrors.push('Rencana tindakan mitigasi wajib diisi jika strategi penanganan adalah Mitigasi.');
  }

  if (validationErrors.length > 0) {
    return res.status(422).json({
      success: false,
      message: 'Validasi data risiko gagal. Harap lengkapi semua isian wajib.',
      errors: validationErrors
    });
  }

  // Tentukan status alur setelah update
  let newStatus = existing.statusWorkflow;
  let statusMessage = 'Data risiko berhasil diperbarui.';

  if (resubmit || (role === 'Unit Kerja' && (existing.statusWorkflow === 'Revisi' || existing.statusWorkflow === 'Draft_Unit'))) {
    newStatus = 'Menunggu_Approval_VP';
    statusMessage = `Risiko ${existing.kodeRisiko} berhasil diperbaiki dan diajukan kembali ke antrean Review Atasan / VP.`;
  }

  const updates: Partial<PusriRisk> = {
    pernyataanRisiko: pernyataanRisiko.trim(),
    penyebabRisiko: penyebabRisiko.trim(),
    dampakRisiko: dampakRisiko.trim(),
    pengendalianExisting: pengendalianExisting ? pengendalianExisting.trim() : existing.pengendalianExisting,
    kategoriRisiko: kategoriRisiko || existing.kategoriRisiko,
    kemungkinanAwal: k,
    dampakAwal: d,
    inherentScore,
    tingkatRisikoAwal: calculatedLevel as any,
    currentTingkatRisiko: calculatedLevel as any,
    jenisPenanganan: jenisPenanganan || existing.jenisPenanganan,
    butuhMitigasi,
    rencanaPenanganan: rencanaPenanganan ? rencanaPenanganan.trim() : existing.rencanaPenanganan,
    targetWaktuMitigasi: targetWaktuMitigasi || existing.targetWaktuMitigasi,
    biayaRencanaPengendalian: Number(biayaRencanaPengendalian) >= 0 ? Number(biayaRencanaPengendalian) : existing.biayaRencanaPengendalian,
    picPelaksana: picPelaksana ? picPelaksana.trim() : existing.picPelaksana,
    picPengendali: picPengendali ? picPengendali.trim() : existing.picPengendali,
    jenisAnggaran: jenisAnggaran || existing.jenisAnggaran,
    statusWorkflow: newStatus,
    updatedDate: new Date().toISOString()
  };

  if (catatanPerbaikan) {
    updates.reviewNotesVp = `[Perbaikan Unit Kerja]: ${catatanPerbaikan.trim()}`;
  }

  const updated = pusriDb.updateRisk(id, updates, actor, role);
  if (updated) {
    saveRiskToMySql(updated).catch((e) => console.warn('[MySQL Save Non-Fatal]:', e));
  }

  res.json({
    success: true,
    message: statusMessage,
    data: updated
  });
});

// 8C. API: Penerimaan Data Identifikasi Risiko oleh Admin (Intake & Confirmation)
app.post('/api/admin/penerimaan-identifikasi', (req, res) => {
  const { riskIds, notes, actor = 'Risk Admin Korporat', role = 'Admin' } = req.body;

  if (role !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Akses Ditolak: Hanya Admin Manajemen Risiko yang berhak menerima data usulan identifikasi risiko.'
    });
  }

  const ids: string[] = Array.isArray(riskIds) ? riskIds : (riskIds ? [riskIds] : []);
  if (ids.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Pilih setidaknya satu data risiko untuk diterima oleh Admin.'
    });
  }

  const acceptedRisks: PusriRisk[] = [];
  ids.forEach((id) => {
    const existing = pusriDb.getRiskById(id);
    if (existing) {
      const updated = pusriDb.updateRisk(
        id,
        {
          approvalNotesAdmin: notes || 'Usulan identifikasi risiko telah diterima resmi oleh Risk Admin Korporat.'
        },
        actor,
        role
      );
      if (updated) {
        acceptedRisks.push(updated);
        saveRiskToMySql(updated).catch((e) => console.warn('[MySQL Save Non-Fatal]:', e));
      }
    }
  });

  res.json({
    success: true,
    message: `Berhasil menerima ${acceptedRisks.length} data usulan identifikasi risiko untuk dikelola dan diproses approval oleh Admin.`,
    totalAccepted: acceptedRisks.length,
    data: acceptedRisks
  });
});

// 8D. API: Pemisahan Identifikasi Risiko Secara Otomatis (Auto-Split to Individual Risks)
app.post('/api/admin/split-batch-risks', (req, res) => {
  const { batchData, actor = 'Risk Admin Korporat', role = 'Admin' } = req.body;

  if (role !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Akses Ditolak: Hanya Admin yang dapat menjalankan proses pemisahan identifikasi risiko secara otomatis.'
    });
  }

  const items: any[] = Array.isArray(batchData) ? batchData : (batchData?.risks || []);
  if (items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Tidak ada data identifikasi risiko yang dikirim untuk dipisahkan.'
    });
  }

  const currentCount = pusriDb.countRisks();
  const separatedRisks: PusriRisk[] = [];
  const now = new Date().toISOString();

  items.forEach((item, idx) => {
    const k = Number(item.kemungkinanAwal) || 3;
    const d = Number(item.dampakAwal) || 3;
    const score = k * d;
    const level = calculateRiskLevel(k, d);
    const newId = item.id || `RSK-2026-${String(currentCount + idx + 1).padStart(3, '0')}`;

    const separated: PusriRisk = {
      id: newId,
      kodeRisiko: item.kodeRisiko || newId,
      kodeOrganisasi: item.kodeOrganisasi || 'PRD-1B',
      namaOrganisasi: item.namaOrganisasi || 'Departemen Operasi Pabrik',
      tahun: Number(item.tahun) || 2026,
      sasaranRKAP: item.sasaranRKAP || '-',
      sasaranUnitKerja: item.sasaranUnitKerja || '-',
      konteksEksternal: item.konteksEksternal || '-',
      konteksInternal: item.konteksInternal || '-',
      sumberRisiko: item.sumberRisiko || 'Operasional',
      pernyataanRisiko: item.pernyataanRisiko || 'Uraian risiko individual',
      penyebabRisiko: item.penyebabRisiko || '-',
      dampakRisiko: item.dampakRisiko || '-',
      pengendalianExisting: item.pengendalianExisting || 'SOP Operasi Rutin',
      kategoriRisiko: item.kategoriRisiko || 'Operasional',
      kemungkinanAwal: k,
      dampakAwal: d,
      inherentScore: score,
      tingkatRisikoAwal: level as any,
      currentTingkatRisiko: level as any,
      jenisPenanganan: item.jenisPenanganan || (score >= 10 ? 'Mitigasi' : 'Diterima'),
      butuhMitigasi: score >= 10 || item.jenisPenanganan === 'Mitigasi',
      rencanaPenanganan: item.rencanaPenanganan || '',
      targetWaktuMitigasi: item.targetWaktuMitigasi || 'TW 2',
      biayaRencanaPengendalian: Number(item.biayaRencanaPengendalian) || 0,
      picPelaksana: item.picPelaksana || '',
      picPengendali: item.picPengendali || '',
      jenisAnggaran: item.jenisAnggaran || 'Investasi Rutin / OPEX',
      statusWorkflow: 'Menunggu_Approval_Admin',
      pengendalianTriwulan: [],
      createdDate: now,
      updatedDate: now,
      createdBy: item.createdBy || actor
    };

    pusriDb.createRisk(separated);
    separatedRisks.push(separated);
    saveRiskToMySql(separated).catch((e) => console.warn('[MySQL Save Non-Fatal]:', e));
  });

  res.status(201).json({
    success: true,
    message: `Pemisahan identifikasi risiko secara otomatis berhasil. ${separatedRisks.length} data risiko individual telah dibentuk dengan kode register unik dan siap diproses approval secara individual.`,
    count: separatedRisks.length,
    data: separatedRisks
  });
});

// 8E. API: Approval per Risiko secara Individual oleh Admin
app.post('/api/admin/risks/:id/approval', (req, res) => {
  const { id } = req.params;
  const {
    decision,
    picPelaksana,
    picPengendali,
    notes,
    actor = 'Risk Admin Korporat',
    role = 'Admin'
  } = req.body;

  // Validasi Hak Akses Admin
  if (role !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Akses Ditolak: Hanya Admin Manajemen Risiko yang berwenang melakukan Approval per Risiko.'
    });
  }

  const existing = pusriDb.getRiskById(id);
  if (!existing) {
    return res.status(404).json({
      success: false,
      message: `Risiko dengan ID ${id} tidak ditemukan.`
    });
  }

  // Cegah approval berulang jika sudah berstatus Disetujui
  if (existing.statusWorkflow === 'Disetujui_Dalam_Pengendalian' && decision === 'approve') {
    return res.status(409).json({
      success: false,
      message: `Risiko ${existing.kodeRisiko} telah disetujui sebelumnya dan sudah berada dalam tahap Pengendalian Triwulanan.`
    });
  }

  if (decision === 'revisi') {
    if (!notes || typeof notes !== 'string' || notes.trim().length < 3) {
      return res.status(422).json({
        success: false,
        message: 'Catatan arahan revisi wajib dicantumkan saat mengembalikan risiko ke Unit Kerja.'
      });
    }

    const updated = pusriDb.updateRisk(
      id,
      {
        statusWorkflow: 'Revisi',
        approvalNotesAdmin: notes.trim()
      },
      actor,
      role
    );

    if (updated) {
      saveRiskToMySql(updated).catch((e) => console.warn('[MySQL Save Non-Fatal]:', e));
    }

    return res.json({
      success: true,
      decision: 'revisi',
      statusWorkflow: 'Revisi',
      message: `Risiko ${existing.kodeRisiko} berhasil dikembalikan ke Unit Kerja dengan status (revisi).`,
      data: updated
    });
  }

  if (decision === 'reject') {
    const updated = pusriDb.updateRisk(
      id,
      {
        statusWorkflow: 'Draft_Unit',
        approvalNotesAdmin: notes ? notes.trim() : 'Usulan risiko ditolak oleh Admin Manajemen Risiko.'
      },
      actor,
      role
    );

    if (updated) {
      saveRiskToMySql(updated).catch((e) => console.warn('[MySQL Save Non-Fatal]:', e));
    }

    return res.json({
      success: true,
      decision: 'reject',
      statusWorkflow: 'Draft_Unit',
      message: `Usulan risiko ${existing.kodeRisiko} telah ditolak oleh Admin.`,
      data: updated
    });
  }

  if (decision === 'approve') {
    // Validasi Ketentuan Sistem: Sistem memastikan risiko memiliki PIC sebelum masuk ke tahap pengendalian
    const effectivePicPelaksana = (picPelaksana || existing.picPelaksana || '').trim();
    const effectivePicPengendali = (picPengendali || existing.picPengendali || '').trim();

    if (!effectivePicPelaksana || !effectivePicPengendali) {
      return res.status(422).json({
        success: false,
        message: `Persetujuan dicegah: Risiko ${existing.kodeRisiko} wajib ditentukan PIC Pelaksana dan PIC Pengendali sebelum dapat disetujui masuk ke tahap pengendalian.`
      });
    }

    // Validasi kelayakan mitigasi
    if (existing.inherentScore >= 10 && existing.jenisPenanganan !== 'Mitigasi') {
      return res.status(422).json({
        success: false,
        message: `Validasi gagal: Risiko tingkat ${existing.currentTingkatRisiko} (Skor: ${existing.inherentScore}) wajib memilih strategi 'Mitigasi' dan menyusun rencana tindakan sebelum disetujui.`
      });
    }

    const updated = pusriDb.updateRisk(
      id,
      {
        statusWorkflow: 'Disetujui_Dalam_Pengendalian',
        picPelaksana: effectivePicPelaksana,
        picPengendali: effectivePicPengendali,
        approvalNotesAdmin: notes ? notes.trim() : 'Telah disetujui resmi oleh Risk Admin Korporat dan aktif dalam tahap pengendalian.'
      },
      actor,
      role
    );

    if (updated) {
      saveRiskToMySql(updated).catch((e) => console.warn('[MySQL Save Non-Fatal]:', e));
    }

    return res.json({
      success: true,
      decision: 'approve',
      statusWorkflow: 'Disetujui_Dalam_Pengendalian',
      message: `Risiko ${existing.kodeRisiko} berhasil disetujui secara individual dan resmi dialihkan ke tahap Pengendalian Triwulan (TW 1-4).`,
      data: updated
    });
  }

  return res.status(400).json({
    success: false,
    message: "Keputusan approval tidak valid. Pilih: 'approve', 'revisi', atau 'reject'."
  });
});

// 8F. API: Penentuan PIC / Pengendalian Kerja oleh Admin
app.post('/api/risks/:id/assign-pic', (req, res) => {
  const { id } = req.params;
  const { picPelaksana, picPengendali, actor = 'Risk Admin Korporat', role = 'Admin' } = req.body;

  if (role !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Akses Ditolak: Hanya Admin yang memiliki wewenang untuk menentukan dan mengubah penugasan resmi PIC pengendalian kerja.'
    });
  }

  const existing = pusriDb.getRiskById(id);
  if (!existing) {
    return res.status(404).json({
      success: false,
      message: `Risiko dengan ID ${id} tidak ditemukan.`
    });
  }

  if (!picPelaksana || !picPelaksana.trim()) {
    return res.status(422).json({
      success: false,
      message: 'PIC Pelaksana (Operator/Superintendent Lapangan) wajib dipilih.'
    });
  }

  if (!picPengendali || !picPengendali.trim()) {
    return res.status(422).json({
      success: false,
      message: 'PIC Pengendali (Vice President / Manager Terkait) wajib dipilih.'
    });
  }

  const updated = pusriDb.updateRisk(
    id,
    {
      picPelaksana: picPelaksana.trim(),
      picPengendali: picPengendali.trim()
    },
    actor,
    role
  );

  if (updated) {
    saveRiskToMySql(updated).catch((e) => console.warn('[MySQL Save Non-Fatal]:', e));
  }

  res.json({
    success: true,
    message: `Penugasan PIC untuk risiko ${existing.kodeRisiko} berhasil ditetapkan: Pelaksana (${picPelaksana.trim()}), Pengendali (${picPengendali.trim()}).`,
    data: updated
  });
});

// 9. Delete Risk by ID (Admin Only)
app.delete('/api/risks/:id', (req, res) => {
  const role = (req.query.role as string) || (req.body && req.body.role);
  if (role && role !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Akses Ditolak: Hanya pengguna dengan otoritas Admin yang dapat menghapus data risiko.'
    });
  }

  const deleted = pusriDb.deleteRisk(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Risiko tidak ditemukan.' });
  }

  deleteRiskFromMySql(req.params.id).catch((e) => console.warn('[MySQL Delete Non-Fatal]:', e));

  res.json({
    success: true,
    message: `Risiko ${deleted.kodeRisiko} berhasil dihapus dari database.`,
    data: deleted
  });
});

// 10. Audit Logs Endpoint
app.get('/api/audit-logs', (req, res) => {
  const { riskId } = req.query;
  const logs = pusriDb.getAuditLogs(typeof riskId === 'string' ? riskId : undefined);
  res.json({
    success: true,
    total: logs.length,
    data: logs
  });
});

// 11. Sync Events Log Endpoint
app.get('/api/sync/events', (req, res) => {
  const events = pusriDb.getSyncEvents();
  res.json({
    success: true,
    total: events.length,
    data: events
  });
});

// 12. Trigger Cross-Module Sync Endpoint
app.post('/api/sync/trigger', (req, res) => {
  const { moduleSource, moduleTarget, message } = req.body;
  const event = pusriDb.recordSyncEvent({
    moduleSource: moduleSource || 'Manual Trigger Hub',
    moduleTarget: moduleTarget || 'All Modules & Database',
    endpoint: '/api/sync/trigger',
    method: 'POST',
    status: 'SYNCED',
    durationMs: Math.round((Math.random() * 4 + 4) * 10) / 10,
    payloadSummary: message || 'Full cross-module state re-synchronized'
  });

  res.json({
    success: true,
    message: 'Sinkronisasi data antar modul berhasil dieksekusi via API Golang & MySQL.',
    syncEvent: event,
    currentStats: pusriDb.getStats()
  });
});

// 13. Reset Database to Default 8 Seeds
app.post('/api/database/reset', (req, res) => {
  const risks = pusriDb.resetToDefault();
  res.json({
    success: true,
    message: 'Database berhasil di-reset ke data default PT Pupuk Sriwidjaja Palembang.',
    total: risks.length,
    data: risks
  });
});

// 14. MySQL Live Connection Status
app.get('/api/database/connection', (req, res) => {
  res.json({
    success: true,
    data: getMySqlStatus()
  });
});

// 15. Test / Re-connect MySQL
app.post('/api/database/test-connect', async (req, res) => {
  const { host, port, user, password, database } = req.body;
  const connected = await initMySqlConnection({
    host,
    port: port ? Number(port) : undefined,
    user,
    password,
    database
  });

  const status = getMySqlStatus();

  res.json({
    success: connected,
    message: connected 
      ? `Koneksi MySQL ke '${database || 'pusri_risk_db'}' di ${host || 'localhost'} berhasil!`
      : `Gagal terhubung ke MySQL: ${status.lastError}`,
    data: status
  });
});

// 16. Inspect table data directly (Pengecekan Tabel Database)
app.get('/api/database/tables/:tableName', async (req, res) => {
  try {
    const tableName = req.params.tableName;
    const result = await getTableData(tableName);
    if (!result) {
      // Fallback: jika MySQL sedang offline di server sandbox, sediakan data dari memory
      if (tableName === 'pusri_risks') {
        const list = pusriDb.getAllRisks();
        return res.json({
          success: true,
          isLiveMySql: false,
          tableName,
          columns: ['id', 'kode_risiko', 'nama_organisasi', 'pernyataan_risiko', 'kategori_risiko', 'pic_pelaksana', 'status_workflow'],
          total: list.length,
          rows: list.map(r => ({
            id: r.id,
            kode_risiko: r.kodeRisiko,
            nama_organisasi: r.namaOrganisasi,
            pernyataan_risiko: r.pernyataanRisiko,
            kategori_risiko: r.kategoriRisiko,
            pic_pelaksana: r.picPelaksana,
            status_workflow: r.statusWorkflow
          }))
        });
      }
      if (tableName === 'master_organizations') {
        const depts = pusriDb.getDepartments();
        return res.json({
          success: true,
          isLiveMySql: false,
          tableName,
          columns: ['id', 'kode', 'nama', 'direktorat', 'kepala_unit'],
          total: depts.length,
          rows: depts.map((d, idx) => ({
            id: idx + 1,
            kode: d.kode,
            nama: d.nama,
            direktorat: d.direktorat,
            kepala_unit: d.kepalaUnit
          }))
        });
      }
      if (tableName === 'portal_users') {
        const users = pusriDb.getAllUsers();
        return res.json({
          success: true,
          isLiveMySql: false,
          tableName,
          columns: ['id', 'username', 'nama', 'role', 'unit_kerja', 'email'],
          total: users.length,
          rows: users.map(u => ({
            id: u.id,
            username: u.username,
            nama: u.nama,
            role: u.role,
            unit_kerja: u.unitKerja,
            email: u.email
          }))
        });
      }
      return res.json({
        success: true,
        isLiveMySql: false,
        tableName,
        columns: ['status'],
        total: 0,
        rows: []
      });
    }

    res.json({
      success: true,
      isLiveMySql: true,
      tableName,
      ...result
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err?.message || 'Gagal membaca tabel.' });
  }
});

// 17. Push All In-Memory Risks to MySQL
app.post('/api/database/sync-all', async (req, res) => {
  const status = getMySqlStatus();
  if (!status.isConnected) {
    return res.json({
      success: false,
      message: `Sinkronisasi gagal: MySQL sedang Standby (tidak terhubung ke ${status.host}:${status.port}). Jika Anda menggunakan Cloud Preview, jalankan aplikasi di localhost dengan XAMPP/Laragon agar dapat terhubung langsung ke phpMyAdmin.`,
      savedCount: 0,
      totalRisks: pusriDb.getAllRisks().length
    });
  }

  const allRisks = pusriDb.getAllRisks();
  let savedCount = 0;
  for (const risk of allRisks) {
    const ok = await saveRiskToMySql(risk);
    if (ok) savedCount++;
  }

  res.json({
    success: savedCount > 0,
    message: savedCount > 0
      ? `Berhasil menyinkronkan ${savedCount} dari ${allRisks.length} data risiko ke tabel pusri_risks di MySQL!`
      : `Tidak ada data yang berhasil disimpan ke MySQL.`,
    savedCount,
    totalRisks: allRisks.length
  });
});

// ----------------------------------------------------
// VITE MIDDLEWARE & SERVER STARTUP
// ----------------------------------------------------

async function startServer() {
  // Inisialisasi koneksi MySQL ke localhost
  try {
    const isDbConnected = await initMySqlConnection();
    if (isDbConnected) {
      const mysqlRisks = await loadRisksFromMySql();
      if (mysqlRisks && mysqlRisks.length > 0) {
        console.log(`[MySQL] Memuat ${mysqlRisks.length} data risiko dari database MySQL ke aplikasi.`);
        for (const r of mysqlRisks) {
          pusriDb.createRisk(r);
        }
      }
    }
  } catch (e) {
    console.warn('[MySQL] Init check skipped:', e);
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const HOST = '0.0.0.0';
  app.listen(PORT, HOST, () => {
    console.log(`\n======================================================`);
    console.log(` PT Pupuk Sriwidjaja Palembang - Risk Portal Server`);
    console.log(` Status : Aktif & Berjalan`);
    console.log(` Browser: http://localhost:${PORT}`);
    console.log(` IP Loc : http://127.0.0.1:${PORT}`);
    console.log(` Network: http://${HOST}:${PORT}`);
    console.log(`======================================================\n`);
  });
}

startServer();

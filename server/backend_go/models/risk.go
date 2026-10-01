package models

import "time"

// RiskLevel defines Pusri 5x5 matrix risk grade
type RiskLevel string

const (
	RiskLevelHigh      RiskLevel = "High"
	RiskLevelModToHigh RiskLevel = "Mod to High"
	RiskLevelModerate  RiskLevel = "Moderate"
	RiskLevelLowToMod  RiskLevel = "Low to Mod"
	RiskLevelLow       RiskLevel = "Low"
)

// PusriRisk represents the core risk entity stored in MySQL
type PusriRisk struct {
	ID                       string              `gorm:"primaryKey;type:varchar(64)" json:"id"`
	KodeRisiko               string              `gorm:"uniqueIndex;type:varchar(64)" json:"kodeRisiko"`
	KodeOrganisasi           string              `gorm:"index;type:varchar(32)" json:"kodeOrganisasi"`
	NamaOrganisasi           string              `gorm:"type:varchar(255)" json:"namaOrganisasi"`
	Tahun                    int                 `gorm:"index" json:"tahun"`
	SasaranRKAP              string              `gorm:"type:text" json:"sasaranRKAP"`
	SasaranUnitKerja         string              `gorm:"type:text" json:"sasaranUnitKerja"`
	KonteksEksternal         string              `gorm:"type:text" json:"konteksEksternal"`
	KonteksInternal          string              `gorm:"type:text" json:"konteksInternal"`
	SumberRisiko             string              `gorm:"type:varchar(255)" json:"sumberRisiko"`
	PernyataanRisiko         string              `gorm:"type:text;not null" json:"pernyataanRisiko"`
	PenyebabRisiko           string              `gorm:"type:text;not null" json:"penyebabRisiko"`
	DampakRisiko             string              `gorm:"type:text;not null" json:"dampakRisiko"`
	PengendalianExisting     string              `gorm:"type:text" json:"pengendalianExisting"`
	KategoriRisiko           string              `gorm:"index;type:varchar(64)" json:"kategoriRisiko"`
	KemungkinanAwal          int                 `gorm:"type:tinyint" json:"kemungkinanAwal"`
	DampakAwal               int                 `gorm:"type:tinyint" json:"dampakAwal"`
	InherentScore            int                 `gorm:"index" json:"inherentScore"`
	TingkatRisikoAwal        RiskLevel           `gorm:"type:varchar(32)" json:"tingkatRisikoAwal"`
	CurrentTingkatRisiko     RiskLevel           `gorm:"index;type:varchar(32)" json:"currentTingkatRisiko"`
	JenisPenanganan          string              `gorm:"type:varchar(32)" json:"jenisPenanganan"`
	ButuhMitigasi            bool                `json:"butuhMitigasi"`
	RencanaPenanganan        string              `gorm:"type:text" json:"rencanaPenanganan"`
	TargetWaktuMitigasi      string              `gorm:"type:varchar(32)" json:"targetWaktuMitigasi"`
	BiayaRencanaPengendalian float64             `gorm:"type:decimal(15,2)" json:"biayaRencanaPengendalian"`
	PicPelaksana             string              `gorm:"type:varchar(255)" json:"picPelaksana"`
	PicPengendali            string              `gorm:"type:varchar(255)" json:"picPengendali"`
	JenisAnggaran            string              `gorm:"type:varchar(64)" json:"jenisAnggaran"`
	StatusWorkflow           string              `gorm:"index;type:varchar(64)" json:"statusWorkflow"`
	PengendalianTriwulan     []QuarterlyControl  `gorm:"foreignKey:RiskID" json:"pengendalianTriwulan"`
	CarryOverInfo            *CarryOverDetails   `gorm:"foreignKey:RiskID" json:"carryOverInfo,omitempty"`
	CreatedDate              time.Time           `json:"createdDate"`
	UpdatedDate              time.Time           `json:"updatedDate"`
	CreatedBy                string              `gorm:"type:varchar(128)" json:"createdBy"`
}

// QuarterlyControl stores TW 1-4 monitoring
type QuarterlyControl struct {
	ID                     uint      `gorm:"primaryKey" json:"id"`
	RiskID                 string    `gorm:"index;type:varchar(64)" json:"riskId"`
	Triwulan               string    `gorm:"type:varchar(16)" json:"triwulan"`
	RealisasiKegiatan      string    `gorm:"type:text" json:"realisasiKegiatan"`
	RealisasiBiaya         float64   `gorm:"type:decimal(15,2)" json:"realisasiBiaya"`
	ProgressPersen         int       `json:"progressPersen"`
	KemungkinanResidual    int       `json:"kemungkinanResidual"`
	DampakResidual         int       `json:"dampakResidual"`
	TingkatResidual        RiskLevel `gorm:"type:varchar(32)" json:"tingkatResidual"`
	StatusPengendalian     string    `gorm:"type:varchar(32)" json:"statusPengendalian"`
	KendalaDanTindakLanjut string    `gorm:"type:text" json:"kendalaDanTindakLanjut"`
	UpdatedAt              time.Time `json:"updatedAt"`
}

// CarryOverDetails stores carry over to next year
type CarryOverDetails struct {
	ID                  uint      `gorm:"primaryKey" json:"id"`
	RiskID              string    `gorm:"uniqueIndex;type:varchar(64)" json:"riskId"`
	TargetTahun         int       `json:"targetTahun"`
	AlasanCarryOver     string    `gorm:"type:text" json:"alasanCarryOver"`
	RekomendasiKomite   string    `gorm:"type:text" json:"rekomendasiKomite"`
	ApprovalCarryOverBy string    `gorm:"type:varchar(255)" json:"approvalCarryOverBy"`
	TanggalCarryOver    string    `json:"tanggalCarryOver"`
}

// SyncEvent represents cross-module API synchronization log
type SyncEvent struct {
	ID             string    `json:"id"`
	Timestamp      time.Time `json:"timestamp"`
	ModuleSource   string    `json:"moduleSource"`
	ModuleTarget   string    `json:"moduleTarget"`
	Endpoint       string    `json:"endpoint"`
	Method         string    `json:"method"`
	Status         string    `json:"status"`
	DurationMs     float64   `json:"durationMs"`
	PayloadSummary string    `json:"payloadSummary"`
}

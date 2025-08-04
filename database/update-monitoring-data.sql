-- Update database untuk menambahkan tabel monitoring data dan konfigurasi card
USE monitoring_db;

-- Create table untuk data monitoring per triwulan
CREATE TABLE IF NOT EXISTS monitoring_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    monitoring_id INT NOT NULL,
    year INT NOT NULL,
    quarter INT NOT NULL, -- 1, 2, 3, 4
    current_value DECIMAL(10,2) DEFAULT 0,
    target_value DECIMAL(10,2) DEFAULT 100,
    percentage DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_monitoring_period (monitoring_id, year, quarter)
);

-- Create table untuk konfigurasi monitoring cards
CREATE TABLE IF NOT EXISTS monitoring_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    monitoring_key VARCHAR(50) UNIQUE NOT NULL,
    monitoring_name VARCHAR(100) NOT NULL,
    monitoring_description TEXT,
    max_value DECIMAL(10,2) DEFAULT 100,
    unit VARCHAR(20) DEFAULT '%',
    icon VARCHAR(10) DEFAULT '📊',
    page_number INT DEFAULT 1, -- 1 untuk Sistem Utama, 2 untuk Sistem Pendukung
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_realtime BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert konfigurasi untuk semua monitoring cards (kecuali SIPP, Mediasi, Banding, Kasasi&PK)
INSERT INTO monitoring_configs (monitoring_key, monitoring_name, monitoring_description, max_value, unit, icon, page_number, display_order, is_realtime) VALUES 
-- Halaman 1 - Sistem Utama (skip SIPP id=1, Mediasi id=2, Banding id=5, Kasasi&PK id=6)
('e_court', 'E-Court', 'Implementasi Electronic Court System', 12, 'poin', '💻', 1, 3, TRUE),
('gugatan_mandiri', 'Gugatan Mandiri', 'Implementasi Gugatan Mandiri', 2, 'poin', '🛠️', 1, 4, TRUE),
('eksaminasi', 'Eksaminasi', 'Nilai Eksaminasi Berkas melalui e-Eksaminasi', 3, 'poin', '🔍', 1, 7, TRUE),
('keuangan_perkara', 'Keuangan Perkara', 'Nilai Validasi Keuangan Perkara', 4, 'poin', '💰', 1, 8, TRUE),
('pengelolaan_pnbp', 'Pengelolaan PNBP', 'Nilai Pengelolaan Negara Bukan Pajak', 3, 'poin', '🏛️', 1, 9, TRUE),
('zona_integritas', 'Zona Integritas', 'Monitoring Raihan Zona Integritas', 5, 'poin', '🛡️', 1, 10, FALSE),
('skm_ikm', 'SKM/IKM', 'Survey Kepuasan Masyarakat/Indeks Kepuasan Masyarakat', 4, 'poin', '📊', 1, 11, TRUE),
('inovasi', 'Inovasi', 'Capaian Nilai Inovasi Pengadilan', 3, 'poin', '💡', 1, 12, TRUE),

-- Halaman 2 - Sistem Pendukung
('pelaporan_kinsatker', 'Pelaporan Kinsatker', 'Pelaporan Perkara melalui Kinsatker', 3, 'poin', '📋', 2, 13, TRUE),
('layanan_ptsp', 'Layanan PTSP', 'Ketersediaan Layanan PTSP', 2, 'poin', '🏢', 2, 14, TRUE),
('ikpa', 'IKPA', 'Indeks Kinerja Pelaksanaan Anggaran', 6, 'poin', '✏️', 2, 15, TRUE),
('website', 'Website', 'Penilaian Kelengkapan Informasi Website Pengadilan', 3, 'poin', '🌐', 2, 16, TRUE),
('prestasi', 'Prestasi', 'Capaian Prestasi Lokal, Provinsi dan Nasional', 5, 'poin', '🏆', 2, 17, FALSE),
('validasi_data_simtepa', 'Validasi Data Simtepa', 'Validasi Kelengkapan Data Kepegawaian melalui Simtepa', 3, 'poin', '✅', 2, 18, TRUE),
('sikep', 'SIKEP', 'Monitoring Kelengkapan Data Kepegawaian melalui Aplikasi SIKEP', 3, 'poin', '👥', 2, 19, TRUE),
('skp', 'SKP', 'Monitoring Ketersediaan Data Sasaran Kinerja Pegawai', 3, 'poin', '🎯', 2, 20, TRUE),
('cctv', 'CCTV', 'Monitoring Ketersediaan CCTV Pengadilan', 3, 'poin', '📹', 2, 21, TRUE),
('sipintar', 'Sipintar', 'Monitoring Kekurangan Pegawai Teknis dalam Sipintar', 3, 'poin', '🎓', 2, 22, TRUE),
('etr', 'ETR', 'Monitoring Kekurangan dalam Melakukan Penilaian ETR', 3, 'poin', '⚡', 2, 23, TRUE),
('lhkpn_lhkasn', 'LHKPN & LHKASN', 'Monitoring Pelaporan Kekayaan', 5, 'poin', '💼', 2, 24, TRUE),
('kumdis', 'Kumdis', 'Monitoring Data Hukuman Disiplin', 5, 'poin', '⚠️', 2, 25, TRUE),
('lhp_hawasbid', 'LHP oleh Hawasbid', 'Monitoring Data Pengawasan oleh Hawasbid', 3, 'poin', '🔍', 2, 26, TRUE);

-- Insert sample data untuk tahun 2023-2024 (4 triwulan per tahun)
-- Data untuk E-Court (monitoring_id berdasarkan urutan insert dimulai dari 1)
INSERT INTO monitoring_data (monitoring_id, year, quarter, current_value, target_value, percentage) VALUES 
-- E-Court
(1, 2023, 1, 11.8, 12, 98.3),
(1, 2023, 2, 11.9, 12, 99.2),
(1, 2023, 3, 11.95, 12, 99.6),
(1, 2023, 4, 11.95, 12, 99.6),
(1, 2024, 1, 11.95, 12, 99.6),

-- Gugatan Mandiri
(2, 2023, 1, 0.5, 2, 25.0),
(2, 2023, 2, 0.8, 2, 40.0),
(2, 2023, 3, 1.0, 2, 50.0),
(2, 2023, 4, 1.0, 2, 50.0),
(2, 2024, 1, 1.0, 2, 50.0),

-- Eksaminasi
(3, 2023, 1, 2.8, 3, 93.3),
(3, 2023, 2, 2.9, 3, 96.7),
(3, 2023, 3, 2.95, 3, 98.3),
(3, 2023, 4, 2.95, 3, 98.3),
(3, 2024, 1, 2.95, 3, 98.3),

-- Keuangan Perkara
(4, 2023, 1, 3.5, 4, 87.5),
(4, 2023, 2, 3.7, 4, 92.5),
(4, 2023, 3, 3.78, 4, 94.5),
(4, 2023, 4, 3.78, 4, 94.5),
(4, 2024, 1, 3.78, 4, 94.5),

-- Pengelolaan PNBP
(5, 2023, 1, 3, 3, 100.0),
(5, 2023, 2, 3, 3, 100.0),
(5, 2023, 3, 3, 3, 100.0),
(5, 2023, 4, 3, 3, 100.0),
(5, 2024, 1, 3, 3, 100.0),

-- Zona Integritas
(6, 2023, 1, 3.5, 5, 70.0),
(6, 2023, 2, 3.8, 5, 76.0),
(6, 2023, 3, 4.0, 5, 80.0),
(6, 2023, 4, 4.0, 5, 80.0),
(6, 2024, 1, 4.0, 5, 80.0),

-- SKM/IKM
(7, 2023, 1, 4, 4, 100.0),
(7, 2023, 2, 4, 4, 100.0),
(7, 2023, 3, 4, 4, 100.0),
(7, 2023, 4, 4, 4, 100.0),
(7, 2024, 1, 4, 4, 100.0),

-- Inovasi
(8, 2023, 1, 2.8, 3, 93.3),
(8, 2023, 2, 3, 3, 100.0),
(8, 2023, 3, 3, 3, 100.0),
(8, 2023, 4, 3, 3, 100.0),
(8, 2024, 1, 3, 3, 100.0),

-- Pelaporan Kinsatker
(9, 2023, 1, 3, 3, 100.0),
(9, 2023, 2, 3, 3, 100.0),
(9, 2023, 3, 3, 3, 100.0),
(9, 2023, 4, 3, 3, 100.0),
(9, 2024, 1, 3, 3, 100.0),

-- Layanan PTSP
(10, 2023, 1, 2, 2, 100.0),
(10, 2023, 2, 2, 2, 100.0),
(10, 2023, 3, 2, 2, 100.0),
(10, 2023, 4, 2, 2, 100.0),
(10, 2024, 1, 2, 2, 100.0),

-- IKPA
(11, 2023, 1, 5.5, 6, 91.7),
(11, 2023, 2, 5.8, 6, 96.7),
(11, 2023, 3, 6, 6, 100.0),
(11, 2023, 4, 6, 6, 100.0),
(11, 2024, 1, 6, 6, 100.0),

-- Website
(12, 2023, 1, 2.5, 3, 83.3),
(12, 2023, 2, 2.8, 3, 93.3),
(12, 2023, 3, 3, 3, 100.0),
(12, 2023, 4, 3, 3, 100.0),
(12, 2024, 1, 3, 3, 100.0),

-- Prestasi
(13, 2023, 1, 3.2, 5, 64.0),
(13, 2023, 2, 3.5, 5, 70.0),
(13, 2023, 3, 3.75, 5, 75.0),
(13, 2023, 4, 3.75, 5, 75.0),
(13, 2024, 1, 3.75, 5, 75.0),

-- Validasi Data Simtepa
(14, 2023, 1, 2.8, 3, 93.3),
(14, 2023, 2, 3, 3, 100.0),
(14, 2023, 3, 3, 3, 100.0),
(14, 2023, 4, 3, 3, 100.0),
(14, 2024, 1, 3, 3, 100.0),

-- SIKEP
(15, 2023, 1, 2.8, 3, 93.3),
(15, 2023, 2, 3, 3, 100.0),
(15, 2023, 3, 3, 3, 100.0),
(15, 2023, 4, 3, 3, 100.0),
(15, 2024, 1, 3, 3, 100.0),

-- SKP
(16, 2023, 1, 2.7, 3, 90.0),
(16, 2023, 2, 3, 3, 100.0),
(16, 2023, 3, 3, 3, 100.0),
(16, 2023, 4, 3, 3, 100.0),
(16, 2024, 1, 3, 3, 100.0),

-- CCTV
(17, 2023, 1, 2.8, 3, 93.3),
(17, 2023, 2, 3, 3, 100.0),
(17, 2023, 3, 3, 3, 100.0),
(17, 2023, 4, 3, 3, 100.0),
(17, 2024, 1, 3, 3, 100.0),

-- Sipintar
(18, 2023, 1, 2.5, 3, 83.3),
(18, 2023, 2, 2.7, 3, 90.0),
(18, 2023, 3, 2.8, 3, 93.3),
(18, 2023, 4, 2.8, 3, 93.3),
(18, 2024, 1, 2.8, 3, 93.3),

-- ETR
(19, 2023, 1, 2.8, 3, 93.3),
(19, 2023, 2, 3, 3, 100.0),
(19, 2023, 3, 3, 3, 100.0),
(19, 2023, 4, 3, 3, 100.0),
(19, 2024, 1, 3, 3, 100.0),

-- LHKPN & LHKASN (nilai negatif karena tidak ada pelanggaran)
(20, 2023, 1, 0, 5, 100.0),
(20, 2023, 2, 0, 5, 100.0),
(20, 2023, 3, 0, 5, 100.0),
(20, 2023, 4, 0, 5, 100.0),
(20, 2024, 1, 0, 5, 100.0),

-- Kumdis (nilai negatif karena tidak ada hukuman disiplin)
(21, 2023, 1, 0, 5, 100.0),
(21, 2023, 2, 0, 5, 100.0),
(21, 2023, 3, 0, 5, 100.0),
(21, 2023, 4, 0, 5, 100.0),
(21, 2024, 1, 0, 5, 100.0),

-- LHP oleh Hawasbid
(22, 2023, 1, 2.8, 3, 93.3),
(22, 2023, 2, 3, 3, 100.0),
(22, 2023, 3, 3, 3, 100.0),
(22, 2023, 4, 3, 3, 100.0),
(22, 2024, 1, 3, 3, 100.0);

-- Verify the data
SELECT 'Monitoring Configs' as Table_Name, COUNT(*) as Count FROM monitoring_configs
UNION ALL
SELECT 'Monitoring Data' as Table_Name, COUNT(*) as Count FROM monitoring_data;
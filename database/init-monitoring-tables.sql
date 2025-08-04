-- Initialize monitoring tables only (without overriding existing admin and settings)
USE monitoring_db;

-- Create table untuk konfigurasi monitoring cards (if not exists)
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

-- Create table untuk data monitoring per triwulan (if not exists)
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
    UNIQUE KEY unique_monitoring_period (monitoring_id, year, quarter),
    FOREIGN KEY (monitoring_id) REFERENCES monitoring_configs(id) ON DELETE CASCADE
);

-- Insert konfigurasi untuk semua monitoring cards jika belum ada
INSERT IGNORE INTO monitoring_configs (monitoring_key, monitoring_name, monitoring_description, max_value, unit, icon, page_number, display_order, is_realtime) VALUES 
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

-- Show results
SELECT 'Tables created successfully' as status;
SELECT COUNT(*) as config_count FROM monitoring_configs;
SELECT COUNT(*) as data_count FROM monitoring_data;
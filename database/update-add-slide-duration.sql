-- Update untuk menambahkan setting slide_duration
USE monitoring_db;

-- Tambahkan setting slide_duration jika belum ada
INSERT IGNORE INTO app_settings (setting_key, setting_value, setting_type, description) VALUES 
('slide_duration', '5', 'number', 'Durasi slide halaman dalam detik');

-- Verify the update
SELECT * FROM app_settings WHERE setting_key = 'slide_duration';
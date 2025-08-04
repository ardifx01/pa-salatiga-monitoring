-- Create database
CREATE DATABASE IF NOT EXISTS monitoring_db;
USE monitoring_db;

-- Create admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default admin user (password: admin123)
INSERT INTO admin_users (username, password, email, full_name) VALUES 
('admin', '$2b$12$Q7xu.UCB0Md5ZNBJH9AJOOuO5FeLs4Ca6Drc4BYlkjhxMzM7/SapG', 'admin@monitoring.com', 'Administrator');

-- Create monitoring systems table
CREATE TABLE IF NOT EXISTS monitoring_systems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active',
    last_check TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample monitoring systems
INSERT INTO monitoring_systems (name, description, status) VALUES 
('Sistem Server', 'Monitoring status server utama', 'active'),
('Database MySQL', 'Monitoring koneksi database', 'active'),
('Aplikasi Web', 'Monitoring aplikasi web utama', 'warning'),
('Network Connection', 'Monitoring koneksi jaringan', 'critical');

-- Create application settings table
CREATE TABLE IF NOT EXISTS app_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean') DEFAULT 'string',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default application settings
INSERT INTO app_settings (setting_key, setting_value, setting_type, description) VALUES 
('app_name', 'Smartvinesa v.13', 'string', 'Nama aplikasi'),
('institution_name', 'PA Salatiga', 'string', 'Nama instansi'),
('app_description', 'Smart View Kinerja Satker PA Salatiga', 'string', 'Deskripsi aplikasi'),
('update_interval', '5', 'number', 'Interval update dalam menit'),
('slide_duration', '5', 'number', 'Durasi slide halaman dalam detik'),
('notification_email', 'admin@pa-salatiga.go.id', 'string', 'Email untuk notifikasi'),
('auto_update_enabled', 'true', 'boolean', 'Aktifkan update otomatis'),
('email_notifications_enabled', 'true', 'boolean', 'Kirim notifikasi email untuk status kritis'),
('auto_slide_enabled', 'true', 'boolean', 'Aktifkan slide otomatis antar halaman');
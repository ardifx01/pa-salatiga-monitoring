-- Update admin password with correct hash for 'admin123'
USE monitoring_db;

UPDATE admin_users 
SET password = '$2b$12$Q7xu.UCB0Md5ZNBJH9AJOOuO5FeLs4Ca6Drc4BYlkjhxMzM7/SapG' 
WHERE username = 'admin';

-- Verify the update
SELECT username, email, full_name FROM admin_users WHERE username = 'admin';
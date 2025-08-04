-- Check if tables exist
USE monitoring_db;

SHOW TABLES;

-- Check monitoring_configs table structure
DESCRIBE monitoring_configs;

-- Check monitoring_data table structure  
DESCRIBE monitoring_data;

-- Check if monitoring_configs has data
SELECT COUNT(*) as config_count FROM monitoring_configs;

-- Check if monitoring_data has data
SELECT COUNT(*) as data_count FROM monitoring_data;

-- Show sample data
SELECT * FROM monitoring_configs LIMIT 5;
SELECT * FROM monitoring_data LIMIT 5;
import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'monitoring_db',
  port: parseInt(process.env.DB_PORT || '3306'),
  connectTimeout: 60000,
};

export async function GET() {
  try {
    console.log('Testing database connection...');
    console.log('Config:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      port: dbConfig.port
    });
    
    const connection = await mysql.createConnection(dbConfig);
    
    // Test query
    const [result] = await connection.execute('SELECT 1 as test');
    
    // List tables
    const [tables] = await connection.execute('SHOW TABLES');
    
    // Count records in monitoring_configs
    const [configCount] = await connection.execute('SELECT COUNT(*) as count FROM monitoring_configs');
    
    await connection.end();
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      testQuery: result,
      tables: tables,
      configCount: configCount,
      config: {
        host: dbConfig.host,
        user: dbConfig.user,
        database: dbConfig.database,
        port: dbConfig.port
      }
    });
    
  } catch (error: any) {
    console.error('Database connection error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      sqlState: error.sqlState,
      errno: error.errno,
      config: {
        host: dbConfig.host,
        user: dbConfig.user,
        database: dbConfig.database,
        port: dbConfig.port
      }
    }, { status: 500 });
  }
}
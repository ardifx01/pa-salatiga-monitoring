import { NextRequest, NextResponse } from 'next/server';
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
    const connection = await mysql.createConnection(dbConfig);
    
    const [rows] = await connection.execute(
      'SELECT * FROM monitoring_configs WHERE is_active = TRUE ORDER BY page_number, display_order'
    );
    
    await connection.end();
    
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching monitoring configs:', error);
    return NextResponse.json({ error: 'Failed to fetch monitoring configs' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, monitoring_name, monitoring_description, max_value, unit, icon } = await request.json();
    
    const connection = await mysql.createConnection(dbConfig);
    
    await connection.execute(
      'UPDATE monitoring_configs SET monitoring_name = ?, monitoring_description = ?, max_value = ?, unit = ?, icon = ? WHERE id = ?',
      [monitoring_name, monitoring_description, max_value, unit, icon, id]
    );
    
    await connection.end();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating monitoring config:', error);
    return NextResponse.json({ error: 'Failed to update monitoring config' }, { status: 500 });
  }
}
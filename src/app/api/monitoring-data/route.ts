import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'monitoring_db',
  port: parseInt(process.env.DB_PORT || '3306'),
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000,
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const quarter = searchParams.get('quarter');
    const monitoringId = searchParams.get('monitoring_id');
    
    const connection = await mysql.createConnection(dbConfig);
    
    let query = `
      SELECT md.*, mc.monitoring_name, mc.monitoring_key, mc.max_value as config_max_value, mc.unit, mc.icon
      FROM monitoring_data md
      JOIN monitoring_configs mc ON md.monitoring_id = mc.id
      WHERE mc.is_active = TRUE
    `;
    
    const params: (string | number)[] = [];
    
    if (year) {
      query += ' AND md.year = ?';
      params.push(year);
    }
    
    if (quarter) {
      query += ' AND md.quarter = ?';
      params.push(quarter);
    }
    
    if (monitoringId) {
      query += ' AND md.monitoring_id = ?';
      params.push(monitoringId);
    }
    
    query += ' ORDER BY mc.page_number, mc.display_order';
    
    const [rows] = await connection.execute(query, params);
    
    await connection.end();
    
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching monitoring data:', error);
    return NextResponse.json({ error: 'Failed to fetch monitoring data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { monitoring_id, year, quarter, current_value, target_value } = await request.json();
    
    // Calculate percentage
    const percentage = target_value > 0 ? (current_value / target_value) * 100 : 0;
    
    const connection = await mysql.createConnection(dbConfig);
    
    // Use INSERT ... ON DUPLICATE KEY UPDATE to handle both insert and update
    await connection.execute(
      `INSERT INTO monitoring_data (monitoring_id, year, quarter, current_value, target_value, percentage) 
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       current_value = VALUES(current_value), 
       target_value = VALUES(target_value), 
       percentage = VALUES(percentage),
       updated_at = CURRENT_TIMESTAMP`,
      [monitoring_id, year, quarter, current_value, target_value, percentage]
    );
    
    await connection.end();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving monitoring data:', error);
    return NextResponse.json({ error: 'Failed to save monitoring data' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, current_value, target_value } = await request.json();
    
    // Calculate percentage
    const percentage = target_value > 0 ? (current_value / target_value) * 100 : 0;
    
    const connection = await mysql.createConnection(dbConfig);
    
    await connection.execute(
      'UPDATE monitoring_data SET current_value = ?, target_value = ?, percentage = ? WHERE id = ?',
      [current_value, target_value, percentage, id]
    );
    
    await connection.end();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating monitoring data:', error);
    return NextResponse.json({ error: 'Failed to update monitoring data' }, { status: 500 });
  }
}
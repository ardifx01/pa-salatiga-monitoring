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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const connection = await mysql.createConnection(dbConfig);
    
    await connection.execute(
      'DELETE FROM monitoring_data WHERE id = ?',
      [id]
    );
    
    await connection.end();
    
    return NextResponse.json({ success: true, message: 'Data deleted successfully' });
  } catch (error) {
    console.error('Error deleting monitoring data:', error);
    return NextResponse.json({ error: 'Failed to delete monitoring data' }, { status: 500 });
  }
}
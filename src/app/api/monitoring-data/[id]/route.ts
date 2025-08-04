import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'monitoring_db'
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
    
    const [result] = await connection.execute(
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
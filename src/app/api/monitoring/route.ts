import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connection from '@/lib/db';

export async function GET() {
  try {
    const db = await connection;
    const [rows] = await db.execute(
      'SELECT * FROM monitoring_systems ORDER BY id'
    );
    
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching monitoring data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monitoring data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, description, status } = await request.json();
    const db = await connection;
    
    const [result] = await db.execute(
      'INSERT INTO monitoring_systems (name, description, status) VALUES (?, ?, ?)',
      [name, description, status]
    );
    
    return NextResponse.json({ success: true, id: (result as { insertId: number }).insertId });
  } catch (error) {
    console.error('Error creating monitoring system:', error);
    return NextResponse.json(
      { error: 'Failed to create monitoring system' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id, name, description, status } = await request.json();
    const db = await connection;
    
    await db.execute(
      'UPDATE monitoring_systems SET name = ?, description = ?, status = ?, last_check = NOW() WHERE id = ?',
      [name, description, status, id]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating monitoring system:', error);
    return NextResponse.json(
      { error: 'Failed to update monitoring system' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const db = await connection;
    
    await db.execute(
      'DELETE FROM monitoring_systems WHERE id = ?',
      [id]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting monitoring system:', error);
    return NextResponse.json(
      { error: 'Failed to delete monitoring system' },
      { status: 500 }
    );
  }
}